
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { UserState, Archetype, Chapter, TierType, GlobalEvent, Rank, DuelLobby } from './types';
import { INITIAL_SYLLABUS, DECAY_THRESHOLD_MS, TIER_CONFIG } from './constants';
import { supabase, isSupabaseConfigured } from './supabaseClient';

interface StoreActions {
  // Profile
  updateProfile: (callsign: string, bio: string) => void;
  toggleManual: () => void;
  toggleProfile: () => void;
  
  // Gameplay
  setArchetype: (a: Archetype) => void;
  startMining: (mode?: 'STANDARD' | 'DUEL') => void;
  stopMining: (success: boolean, durationMinutes: number) => number;
  completeTier: (chapterId: string, tierId: TierType) => void;
  updateDecay: () => void;
  calculateCAGR: () => number;
  
  // Market Actions
  buyItem: (item: 'NEURAL' | 'CRYO' | 'GHOST', cost: number) => void;
  
  // Syndicate Actions
  createSyndicate: (name: string) => void;
  joinSyndicate: (code: string) => void;
  leaveSyndicate: () => void;
  promoteMember: (memberId: string) => void;

  // PvP Actions
  createDuelLobby: (wager: number) => void;
  joinDuelLobby: (lobbyId: string) => void;
  refreshLobbies: () => void;

  // Network Actions
  connectToNetwork: () => void;
  pushGlobalEvent: (msg: string, type: GlobalEvent['type']) => void;
  syncToCloud: () => void;
}

const getClientId = () => {
    let id = localStorage.getItem('sovereign_id');
    if (!id) {
        id = 'SOV-' + Math.floor(Math.random() * 9999);
        localStorage.setItem('sovereign_id', id);
    }
    return id;
};

export const useStore = create<UserState & StoreActions>()(
  persist(
    (set, get) => ({
      // Initial State
      id: getClientId(),
      callsign: getClientId(),
      bio: 'Operative active. No additional data.',
      netWorth: 0,
      efficiency: 1.0,
      willpower: 50,
      archetype: null,
      startDate: Date.now(),
      streak: 0,
      lastActive: Date.now(),
      syllabus: INITIAL_SYLLABUS,
      isMining: false,
      miningStartTime: null,
      miningMode: 'STANDARD',
      defconLevel: 5,
      inventory: {
          neuralStimulantUntil: null,
          cryoStasisUntil: null,
          ghostProtocolUntil: null
      },
      syndicate: null,
      activeLobbies: [],
      
      // Network State
      globalEvents: [],
      onlineStatus: 'CONNECTING',
      activeUsers: 1, 
      showManual: false,
      showProfile: false,

      // --- ACTIONS ---

      updateProfile: (callsign, bio) => {
          set({ callsign, bio });
          get().syncToCloud();
      },

      toggleManual: () => set(state => ({ showManual: !state.showManual })),
      toggleProfile: () => set(state => ({ showProfile: !state.showProfile })),

      setArchetype: (archetype) => {
          set({ archetype, efficiency: 1.1 });
          get().syncToCloud();
      },

      startMining: (mode = 'STANDARD') => set({ 
        isMining: true, 
        miningStartTime: Date.now(),
        miningMode: mode
      }),

      stopMining: (success, durationMinutes) => {
        const state = get();
        const isDuel = state.miningMode === 'DUEL';
        
        if (!success) {
          const penaltyMultiplier = isDuel ? 5.0 : 1.0; 
          const basePenalty = state.archetype === 'SENTINEL' ? 0.5 : 1.0;
          const loss = Math.floor(state.netWorth * 0.05 * basePenalty * penaltyMultiplier);
          
          const msg = isDuel 
            ? `${state.callsign} LOST DUEL PROTOCOL (-$${loss})`
            : `${state.callsign} FAILED FOCUS PROTOCOL (-$${loss})`;
            
          state.pushGlobalEvent(msg, 'COMBAT');
          
          set({ isMining: false, miningStartTime: null, netWorth: Math.max(0, state.netWorth - loss) });
          get().syncToCloud();
          return -loss;
        }

        const baseRate = 10;
        let efficiency = state.efficiency;
        if (isDuel) efficiency *= 2.0;

        // Apply Neural Stimulant
        const now = Date.now();
        if (state.inventory.neuralStimulantUntil && state.inventory.neuralStimulantUntil > now) {
            efficiency *= 2.0;
        }

        let yieldAmount = durationMinutes * baseRate * efficiency;
        
        const oneDay = 24 * 60 * 60 * 1000;
        let newStreak = state.streak;
        
        // Streak Logic
        const daysSinceLast = (now - state.lastActive) / oneDay;
        
        if (daysSinceLast < 2) {
             if (new Date(state.lastActive).getDate() !== new Date(now).getDate()) {
                newStreak += 1;
            }
        } else {
            if (state.inventory.cryoStasisUntil && state.inventory.cryoStasisUntil > now) {
                // Frozen
            } else {
                newStreak = 0;
            }
        }

        if (durationMinutes > 15 || isDuel) {
             const msg = isDuel 
            ? `${state.callsign} WON DUEL PROTOCOL (+$${yieldAmount.toFixed(0)})`
            : `${state.callsign} EXTRACTED $${yieldAmount.toFixed(0)}`;
            state.pushGlobalEvent(msg, 'MARKET');
        }

        set({ 
          isMining: false, 
          miningStartTime: null, 
          netWorth: state.netWorth + yieldAmount,
          streak: newStreak,
          lastActive: now,
          willpower: Math.min(100, state.willpower + 1)
        });
        
        get().syncToCloud();

        return yieldAmount;
      },

      buyItem: (item, cost) => {
          const state = get();
          if (state.netWorth < cost) return;
          
          const now = Date.now();
          const oneHour = 60 * 60 * 1000;
          const oneDay = 24 * 60 * 60 * 1000;
          
          const newInventory = { ...state.inventory };
          
          if (item === 'NEURAL') newInventory.neuralStimulantUntil = now + oneHour;
          if (item === 'CRYO') newInventory.cryoStasisUntil = now + oneDay;
          if (item === 'GHOST') newInventory.ghostProtocolUntil = now + oneDay;

          set({
              netWorth: state.netWorth - cost,
              inventory: newInventory
          });
          
          if (item !== 'GHOST') {
              state.pushGlobalEvent(`${state.callsign} PURCHASED ${item} AUGMENT`, 'MARKET');
          }
          get().syncToCloud();
      },

      // --- SYNDICATE LOGIC ---
      createSyndicate: (name) => {
          const state = get();
          const code = Math.random().toString(36).substring(2, 7).toUpperCase();
          const newSyndicate = {
              id: 'SYN-' + Math.floor(Math.random() * 1000),
              name,
              code,
              wealth: state.netWorth,
              commanderId: state.id,
              members: [{
                  id: state.id,
                  name: state.callsign,
                  netWorth: state.netWorth,
                  status: 'ONLINE' as const,
                  rank: 'COMMANDER' as Rank
              }]
          };
          set({ syndicate: newSyndicate });
          get().pushGlobalEvent(`${state.callsign} ESTABLISHED SYNDICATE [${name}]`, 'SYSTEM');
          get().syncToCloud();
      },

      joinSyndicate: (code) => {
          const state = get();
          // Mock join logic (Simulating backend)
          // In a real app with Supabase, we would query the table.
          // Here we just attach to a mock structure if it matches "OMEGA" or similar, 
          // OR if we are simulating, we just create a local representation.
          
          const joinedSyndicate = {
              id: 'SYN-' + code,
              name: `SYNDICATE-${code}`,
              code: code,
              wealth: 500000,
              commanderId: 'UNKNOWN',
              members: [
                  { id: 'UNKNOWN', name: 'COMMANDER_X', netWorth: 400000, status: 'OFFLINE' as const, rank: 'COMMANDER' as Rank },
                  { id: state.id, name: state.callsign, netWorth: state.netWorth, status: 'ONLINE' as const, rank: 'INITIATE' as Rank }
              ]
          };
          
          set({ syndicate: joinedSyndicate });
          get().pushGlobalEvent(`${state.callsign} JOINED FACTION ${code}`, 'SYSTEM');
          get().syncToCloud();
      },

      leaveSyndicate: () => {
          set({ syndicate: null });
          get().syncToCloud();
      },

      promoteMember: (memberId) => {
          const state = get();
          if (!state.syndicate || state.syndicate.commanderId !== state.id) return;
          
          const updatedMembers = state.syndicate.members.map(m => {
              if (m.id === memberId) {
                  const newRank: Rank = m.rank === 'INITIATE' ? 'OPERATIVE' : (m.rank === 'OPERATIVE' ? 'LIEUTENANT' : 'LIEUTENANT');
                  return { ...m, rank: newRank };
              }
              return m;
          });
          
          set({ syndicate: { ...state.syndicate, members: updatedMembers }});
          get().syncToCloud();
      },

      // --- PVP LOGIC ---
      createDuelLobby: (wager) => {
          const state = get();
          if (state.netWorth < wager) return;
          
          const lobby: DuelLobby = {
              id: Math.random().toString(36).substring(7),
              hostName: state.callsign,
              wager,
              status: 'OPEN'
          };
          
          // In real backend, insert into 'lobbies' table
          set(s => ({ activeLobbies: [lobby, ...s.activeLobbies] }));
      },

      joinDuelLobby: (lobbyId) => {
          const state = get();
          const lobby = state.activeLobbies.find(l => l.id === lobbyId);
          if (!lobby || state.netWorth < lobby.wager) return;
          
          get().startMining('DUEL');
          // In real backend, update lobby status to IN_PROGRESS
          set(s => ({ 
             activeLobbies: s.activeLobbies.filter(l => l.id !== lobbyId) 
          }));
      },
      
      refreshLobbies: () => {
          // Simulate fetching
          const mockLobbies: DuelLobby[] = [
              { id: '1', hostName: 'VEX_99', wager: 500, status: 'OPEN' },
              { id: '2', hostName: 'KAI_ZEN', wager: 2500, status: 'OPEN' },
          ];
          set({ activeLobbies: mockLobbies });
      },

      // --- STANDARD ACTIONS ---
      completeTier: (chapterId, tierId) => {
        const state = get();
        const chapter = state.syllabus.find(c => c.id === chapterId);
        if (!chapter) return;

        const tierConfig = TIER_CONFIG[tierId];
        let cost = tierConfig.baseValue;
        
        if (state.archetype === 'STRATEGIST' && tierConfig.category === 'THEORY') cost = cost * 0.85;
        if (state.archetype === 'VANGUARD' && tierConfig.category === 'COMBAT') cost = cost * 0.85;

        if (state.netWorth < cost) {
            alert("INSUFFICIENT FUNDS TO ANNEX TERRITORY");
            return;
        }

        const updatedSyllabus = state.syllabus.map(c => {
          if (c.id !== chapterId) return c;
          return {
            ...c,
            lastRevised: Date.now(),
            isDecayed: false,
            tiers: c.tiers.map(t => t.id === tierId ? { ...t, completed: true, timestamp: Date.now() } : t)
          };
        });

        state.pushGlobalEvent(`${state.callsign} ANNEXED ${chapter.name.toUpperCase()} [${tierId}]`, 'ANNEX');

        set({
          syllabus: updatedSyllabus,
          netWorth: state.netWorth - cost
        });
        
        get().syncToCloud();
      },

      updateDecay: () => {
        const state = get();
        const now = Date.now();
        const updatedSyllabus = state.syllabus.map(c => {
          const isDecayed = (now - c.lastRevised) > DECAY_THRESHOLD_MS;
          return { ...c, isDecayed };
        });
        set({ syllabus: updatedSyllabus });
      },

      calculateCAGR: () => {
        const state = get();
        const daysActive = Math.max(1, (Date.now() - state.startDate) / (1000 * 60 * 60 * 24));
        const dailyGrowth = state.netWorth / daysActive;
        return Math.floor(dailyGrowth * 365);
      },

      pushGlobalEvent: async (message, type) => {
          const state = get();
          if (state.inventory.ghostProtocolUntil && state.inventory.ghostProtocolUntil > Date.now()) {
              return; 
          }

          if (isSupabaseConfigured()) {
              await supabase.from('global_events').insert({ message, type });
          } else {
               set(state => ({
                  globalEvents: [
                      { id: Math.random().toString(36), message, timestamp: Date.now(), type },
                      ...state.globalEvents
                  ].slice(0, 50)
              }));
          }
      },

      syncToCloud: async () => {
          if (!isSupabaseConfigured()) return;
          const state = get();
          
          await supabase.from('profiles').upsert({
              callsign: state.callsign,
              net_worth: state.netWorth,
              archetype: state.archetype,
              last_active: new Date().toISOString(),
              data: { 
                  syllabus: state.syllabus,
                  inventory: state.inventory,
                  syndicate: state.syndicate,
                  bio: state.bio
              }
          }, { onConflict: 'callsign' });
      },

      connectToNetwork: async () => {
          if (!isSupabaseConfigured()) {
              console.warn("SUPABASE NOT CONFIGURED: Running in Offline Mode");
              set({ onlineStatus: 'ERROR' });
              return;
          }

          set({ onlineStatus: 'CONNECTING' });

          // 1. Fetch Global Events
          const { data: history } = await supabase
            .from('global_events')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(20);

          if (history) {
              set({ 
                  globalEvents: history.map(e => ({
                      id: e.id,
                      message: e.message,
                      type: e.type as any,
                      timestamp: new Date(e.created_at).getTime()
                  })),
                  onlineStatus: 'ONLINE' 
              });
          }

          // 2. Fetch Active User Count
          const { count } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .gt('last_active', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
            
          set({ activeUsers: count || 1 });

          // 3. Attempt to Hydrate User State from Cloud
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('callsign', get().callsign)
            .single();

          if (profile && profile.data) {
             const cloudData = profile.data;
             set({
                 netWorth: profile.net_worth,
                 archetype: profile.archetype,
                 syllabus: cloudData.syllabus || get().syllabus,
                 inventory: cloudData.inventory || get().inventory,
                 syndicate: cloudData.syndicate || get().syndicate,
                 bio: cloudData.bio || get().bio
             });
          }

          // 4. Subscribe to Ticker
          const channel = supabase
            .channel('public:global_events')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'global_events' }, (payload) => {
                const newEvent = payload.new;
                set(state => ({
                    globalEvents: [{
                        id: newEvent.id,
                        message: newEvent.message,
                        type: newEvent.type as any,
                        timestamp: new Date(newEvent.created_at).getTime()
                    }, ...state.globalEvents].slice(0, 50)
                }));
            })
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    set({ onlineStatus: 'ONLINE' });
                }
            });
            
          // Initial Sync Up
          get().syncToCloud();
      }
    }),
    {
      name: 'prosov-v4-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
