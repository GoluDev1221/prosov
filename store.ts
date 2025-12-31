
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { UserState, Archetype, Chapter, TierType, GlobalEvent, Rank, DuelLobby, SyndicateData } from './types';
import { INITIAL_SYLLABUS, DECAY_THRESHOLD_MS, TIER_CONFIG } from './constants';
import { supabase, isSupabaseConfigured } from './supabaseClient';

interface StoreActions {
  // Profile
  updateProfile: (callsign: string, bio: string) => void;
  toggleManual: () => void;
  toggleProfile: () => void;
  signOut: () => void; // Added
  
  // Gameplay
  setArchetype: (a: Archetype) => void;
  startMining: (mode?: 'STANDARD' | 'DUEL') => void;
  stopMining: (success: boolean, durationMinutes: number) => Promise<number>;
  completeTier: (chapterId: string, tierId: TierType) => Promise<void>;
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

export const useStore = create<UserState & StoreActions>()(
  persist(
    (set, get) => ({
      // Initial State
      id: '', // Will be set by Auth
      callsign: 'OPERATOR',
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

      signOut: async () => {
          await supabase.auth.signOut();
          localStorage.clear();
          window.location.reload();
      },

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

      stopMining: async (success, durationMinutes) => {
        const state = get();
        const isDuel = state.miningMode === 'DUEL';
        
        if (!success) {
          const penalty = Math.floor(state.netWorth * 0.05);
           set({ isMining: false, miningStartTime: null, netWorth: Math.max(0, state.netWorth - penalty) });
           state.pushGlobalEvent(`${state.callsign} FAILED PROTOCOL (-$${penalty})`, 'COMBAT');
           return -penalty;
        }

        // SECURE: Call Server RPC to calculate and award money
        if (isSupabaseConfigured()) {
            const { data: yieldAmount, error } = await supabase.rpc('mine_resources', { 
                duration_minutes: durationMinutes,
                mode: state.miningMode
            });

            if (error) {
                console.error("Mining Sync Failed:", error);
            }

            const earned = yieldAmount || 0;
            
            set({ 
              isMining: false, 
              miningStartTime: null, 
              netWorth: state.netWorth + earned, // Optimistic update
              lastActive: Date.now(),
              streak: state.streak 
            });
            
             if (durationMinutes > 15) {
                state.pushGlobalEvent(`${state.callsign} EXTRACTED $${earned}`, 'MARKET');
             }

            return earned;

        } else {
            // OFFLINE MODE (Insecure fallback)
            const earned = durationMinutes * 10 * state.efficiency;
            set({ 
              isMining: false, 
              miningStartTime: null, 
              netWorth: state.netWorth + earned,
              lastActive: Date.now()
            });
            return earned;
        }
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
      createSyndicate: async (name) => {
          const state = get();
          const code = Math.random().toString(36).substring(2, 7).toUpperCase();
          const syndicateId = crypto.randomUUID(); 

          const newSyndicate: SyndicateData = {
              id: syndicateId,
              name,
              code,
              wealth: state.netWorth,
              commanderId: state.id,
              members: [{
                  id: state.id,
                  name: state.callsign,
                  netWorth: state.netWorth,
                  status: 'ONLINE',
                  rank: 'COMMANDER'
              }]
          };

          if (isSupabaseConfigured()) {
              const { error } = await supabase.from('syndicates').insert({
                  id: newSyndicate.id,
                  name: newSyndicate.name,
                  code: newSyndicate.code,
                  commander_id: newSyndicate.commanderId,
                  wealth: newSyndicate.wealth,
                  members: newSyndicate.members
              });
              if (error) {
                  alert("FAILED TO CREATE SYNDICATE");
                  return;
              }
          }

          set({ syndicate: newSyndicate });
          get().pushGlobalEvent(`${state.callsign} ESTABLISHED SYNDICATE [${name}]`, 'SYSTEM');
          get().syncToCloud();
      },

      joinSyndicate: async (code) => {
          const state = get();
          
          if (isSupabaseConfigured()) {
              const { data, error } = await supabase
                .from('syndicates')
                .select('*')
                .eq('code', code)
                .single();

              if (error || !data) {
                  alert("INVALID SYNDICATE CODE");
                  return;
              }

              const currentMembers = data.members || [];
              const newMember = {
                  id: state.id,
                  name: state.callsign,
                  netWorth: state.netWorth,
                  status: 'ONLINE',
                  rank: 'INITIATE'
              };

              await supabase.from('syndicates').update({
                  members: [...currentMembers, newMember]
              }).eq('id', data.id);

              const syndicateData: SyndicateData = {
                  id: data.id,
                  name: data.name,
                  code: data.code,
                  wealth: data.wealth,
                  commanderId: data.commander_id,
                  members: [...currentMembers, newMember]
              };

              set({ syndicate: syndicateData });
              get().pushGlobalEvent(`${state.callsign} JOINED FACTION ${data.name}`, 'SYSTEM');

          }
      },

      leaveSyndicate: async () => {
          set({ syndicate: null });
      },

      promoteMember: async (memberId) => {
          const state = get();
          if (!state.syndicate || state.syndicate.commanderId !== state.id) return;
          
          const updatedMembers = state.syndicate.members.map(m => {
              if (m.id === memberId) {
                  const newRank: Rank = m.rank === 'INITIATE' ? 'OPERATIVE' : (m.rank === 'OPERATIVE' ? 'LIEUTENANT' : 'LIEUTENANT');
                  return { ...m, rank: newRank };
              }
              return m;
          });
          
          if (isSupabaseConfigured()) {
               await supabase.from('syndicates').update({ members: updatedMembers }).eq('id', state.syndicate.id);
          }
          
          set({ syndicate: { ...state.syndicate, members: updatedMembers }});
      },

      // --- PVP LOGIC ---
      createDuelLobby: async (wager) => {
          const state = get();
          if (state.netWorth < wager) return;
          const lobbyId = crypto.randomUUID();

          if (isSupabaseConfigured()) {
              const { error } = await supabase.from('duel_lobbies').insert({
                  id: lobbyId,
                  host_name: state.callsign,
                  wager: wager,
                  status: 'OPEN'
              });
              if (error) console.error("Lobby Create Error:", error);
          }
          set(s => ({ activeLobbies: [{ id: lobbyId, hostName: state.callsign, wager, status: 'OPEN' }, ...s.activeLobbies] }));
      },

      joinDuelLobby: async (lobbyId) => {
          const state = get();
          if (isSupabaseConfigured()) {
              await supabase.from('duel_lobbies').update({ status: 'IN_PROGRESS' }).eq('id', lobbyId);
          }
          get().startMining('DUEL');
          set(s => ({ activeLobbies: s.activeLobbies.filter(l => l.id !== lobbyId) }));
      },
      
      refreshLobbies: async () => {
          if (isSupabaseConfigured()) {
              const { data } = await supabase
                .from('duel_lobbies')
                .select('*')
                .eq('status', 'OPEN')
                .order('created_at', { ascending: false })
                .limit(20);
              if (data) {
                  set({ activeLobbies: data.map(l => ({
                      id: l.id,
                      hostName: l.host_name,
                      wager: l.wager,
                      status: l.status as 'OPEN' | 'IN_PROGRESS'
                  }))});
              }
          }
      },

      // --- STANDARD ACTIONS ---
      completeTier: async (chapterId, tierId) => {
        const state = get();
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

        // SECURE: Call Server RPC to purchase territory
        if (isSupabaseConfigured()) {
            const { data: success, error } = await supabase.rpc('annex_territory', {
                cost: Math.floor(cost),
                updated_syllabus: updatedSyllabus
            });

            if (error || !success) {
                alert("TRANSACTION DECLINED BY NETWORK");
                return;
            }
        }

        const chapter = state.syllabus.find(c => c.id === chapterId);
        state.pushGlobalEvent(`${state.callsign} ANNEXED ${chapter?.name.toUpperCase()} [${tierId}]`, 'ANNEX');

        set({
          syllabus: updatedSyllabus,
          netWorth: state.netWorth - cost
        });
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
          if (isSupabaseConfigured()) {
              await supabase.from('global_events').insert({ message, type });
          }
      },

      syncToCloud: async () => {
          if (!isSupabaseConfigured()) return;
          const state = get();
          if (!state.id) return; 

          await supabase.from('profiles').update({
              callsign: state.callsign,
              archetype: state.archetype, // CRITICAL FIX: Save archetype to DB
              data: { 
                  efficiency: state.efficiency, 
                  inventory: state.inventory,
                  syndicate: state.syndicate,
                  bio: state.bio,
                  syllabus: state.syllabus // Also sync syllabus
              }
          }).eq('id', state.id);
      },

      connectToNetwork: async () => {
          if (!isSupabaseConfigured()) {
              set({ onlineStatus: 'ERROR' });
              return;
          }

          set({ onlineStatus: 'CONNECTING' });

          try {
              // 1. AUTHENTICATION CHECK
              const { data: { session } } = await supabase.auth.getSession();
              const userId = session?.user?.id;

              if (userId) {
                  set({ id: userId });
                  
                  // 2. Fetch or Create Profile
                  const { data: profile } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', userId)
                    .single();

                  if (!profile) {
                      const derivedName = session.user.email 
                         ? session.user.email.split('@')[0].toUpperCase() 
                         : `OPERATIVE-${userId.slice(0,4)}`;

                      await supabase.from('profiles').insert({
                          id: userId,
                          callsign: derivedName,
                          net_worth: 0,
                          data: { efficiency: 1.0, syllabus: INITIAL_SYLLABUS }
                      });
                  } else {
                      // Hydrate State from Server
                      set({
                          callsign: profile.callsign,
                          netWorth: profile.net_worth,
                          archetype: profile.archetype,
                          syllabus: profile.data?.syllabus || INITIAL_SYLLABUS,
                          efficiency: profile.data?.efficiency || 1.0,
                          inventory: profile.data?.inventory || get().inventory,
                          syndicate: profile.data?.syndicate || get().syndicate,
                          bio: profile.data?.bio || get().bio
                      });
                  }
              }

              // 3. FETCH RECENT EVENTS (Populate Ticker Immediately)
              const { data: recentEvents } = await supabase
                .from('global_events')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(20);
                
              if (recentEvents) {
                   set({ globalEvents: recentEvents.map(e => ({
                       id: e.id,
                       message: e.message,
                       type: e.type as any,
                       timestamp: new Date(e.created_at).getTime()
                   }))});
              }

              // 4. Subscriptions (Realtime)
              supabase
                .channel('public:network')
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
                .on('postgres_changes', { event: '*', schema: 'public', table: 'duel_lobbies' }, () => {
                    get().refreshLobbies();
                })
                .subscribe((status) => {
                    if (status === 'SUBSCRIBED') {
                        set({ onlineStatus: 'ONLINE' });
                    } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
                        set({ onlineStatus: 'ERROR' });
                    }
                });
                
              get().refreshLobbies();

          } catch (e) {
              console.error("Network Link Failed:", e);
              set({ onlineStatus: 'ERROR' });
          }
      }
    }),
    {
      name: 'prosov-v4-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
