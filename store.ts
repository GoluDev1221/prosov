
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { UserState, Archetype, Chapter, TierType, GlobalEvent, Rank, DuelLobby, SyndicateData } from './types';
import { INITIAL_SYLLABUS, DECAY_THRESHOLD_MS, TIER_CONFIG } from './constants';
import { supabase, isSupabaseConfigured } from './supabaseClient';
import { RealtimeChannel } from '@supabase/supabase-js';

interface StoreActions {
  // Profile
  updateProfile: (callsign: string, bio: string) => void;
  toggleManual: () => void;
  toggleProfile: () => void;
  signOut: () => void; 
  
  // Gameplay
  setArchetype: (a: Archetype) => void;
  startMining: (mode?: 'STANDARD' | 'DUEL', wager?: number, duelId?: string) => void;
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
  createDuelLobby: (duration: number) => void;
  cancelDuelLobby: () => void;
  joinDuelLobby: (lobbyId: string, wager: number) => void;
  refreshLobbies: () => void;

  // Network Actions
  connectToNetwork: () => void;
  pushGlobalEvent: (msg: string, type: GlobalEvent['type']) => void;
  syncToCloud: () => void;
}

// Keep track of channel outside store to prevent serialization issues
let networkChannel: RealtimeChannel | null = null;

export const useStore = create<UserState & StoreActions>()(
  persist(
    (set, get) => ({
      // Initial State
      id: '', 
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
      currentWager: 0,
      hostingLobbyId: null,
      activeDuelId: null,

      defconLevel: 5,
      inventory: {
          neuralStimulantUntil: null,
          cryoStasisUntil: null,
          ghostProtocolUntil: null
      },
      syndicate: null,
      activeLobbies: [],
      
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

      startMining: (mode = 'STANDARD', wager = 0, duelId = undefined) => set({ 
        isMining: true, 
        miningStartTime: Date.now(),
        miningMode: mode,
        currentWager: wager,
        activeDuelId: duelId
      }),

      stopMining: async (success, durationMinutes) => {
        const state = get();
        
        // --- FAILURE LOGIC ---
        if (!success) {
           // 1. Calculate Base Penalty (20% of Remaining Net Worth)
           let penalty = Math.floor(state.netWorth * 0.20);
           
           if (state.archetype === 'SENTINEL') {
               penalty = Math.floor(penalty * 0.5);
           }
           if (state.netWorth > 0 && penalty === 0) penalty = 1;

           // 2. PvP Failure Handover
           if (state.miningMode === 'DUEL' && state.activeDuelId && isSupabaseConfigured()) {
               // I failed, so I set the opponent as winner.
               // We don't know opponent ID easily here without extra fetch, but we can try to set it via RPC or update
               // Ideally, we just resign.
               await supabase.rpc('resign_duel', { lobby_id: state.activeDuelId, loser_id: state.id });
           }

           set({ 
               isMining: false, 
               miningStartTime: null,
               hostingLobbyId: null, 
               activeDuelId: null,
               currentWager: 0,
               netWorth: Math.max(0, state.netWorth - penalty) 
           });

           state.pushGlobalEvent(`${state.callsign} FAILED PROTOCOL (-${penalty} $NW)`, 'COMBAT');
           return -penalty;
        }

        // --- SUCCESS LOGIC ---

        if (state.miningMode === 'DUEL') {
             // WINNER TAKES POT (Wager * 2)
             const pot = state.currentWager * 2;
             
             // If this was a manual stop (timer end), we claim the win in DB
             if (state.activeDuelId && isSupabaseConfigured()) {
                 await supabase.from('duel_lobbies').update({ 
                     status: 'FINISHED', 
                     winner_id: state.id 
                 }).eq('id', state.activeDuelId);
             }

             set({
                 isMining: false,
                 miningStartTime: null,
                 hostingLobbyId: null,
                 activeDuelId: null,
                 currentWager: 0,
                 netWorth: state.netWorth + pot,
                 lastActive: Date.now()
             });

             state.pushGlobalEvent(`${state.callsign} WON DUEL (+$${pot})`, 'COMBAT');
             return pot;

        } else {
             // STANDARD MINING
             let earned = 0;
             if (isSupabaseConfigured()) {
                const { data: yieldAmount, error } = await supabase.rpc('mine_resources', { 
                    duration_minutes: durationMinutes,
                    mode: 'STANDARD'
                });
                if (!error) earned = yieldAmount || 0;
             } else {
                earned = Math.floor(durationMinutes * 10 * state.efficiency);
             }

             // Apply Neural Stimulant
             if (state.inventory.neuralStimulantUntil && state.inventory.neuralStimulantUntil > Date.now()) {
                 earned *= 2;
             }

             set({ 
              isMining: false, 
              miningStartTime: null, 
              netWorth: state.netWorth + earned, 
              lastActive: Date.now(),
              streak: state.streak 
            });
            
             if (durationMinutes > 15) {
                state.pushGlobalEvent(`${state.callsign} EXTRACTED $${earned}`, 'MARKET');
             }

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
          const COST = 10;
          if (state.netWorth < COST) return;

          const code = Math.random().toString(36).substring(2, 7).toUpperCase();
          const syndicateId = crypto.randomUUID(); 

          const newSyndicate: SyndicateData = {
              id: syndicateId,
              name,
              code,
              wealth: state.netWorth - COST,
              commanderId: state.id,
              members: [{
                  id: state.id,
                  name: state.callsign,
                  netWorth: state.netWorth - COST,
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
              if (error) { alert("FAILED"); return; }
          }

          set({ syndicate: newSyndicate, netWorth: state.netWorth - COST });
          get().pushGlobalEvent(`${state.callsign} ESTABLISHED SYNDICATE [${name}]`, 'SYSTEM');
          get().connectToNetwork(); 
      },

      joinSyndicate: async (code) => {
          const state = get();
          const COST = 5;
          if (state.netWorth < COST) { alert("INSUFFICIENT FUNDS"); return; }
          
          if (isSupabaseConfigured()) {
              const { data, error } = await supabase.from('syndicates').select('*').eq('code', code).single();
              if (error || !data) { alert("INVALID CODE"); return; }

              const members = data.members || [];
              if (members.find((m: any) => m.id === state.id)) { alert("ALREADY A MEMBER"); return; }

              const newMember = {
                  id: state.id,
                  name: state.callsign,
                  netWorth: state.netWorth - COST,
                  status: 'ONLINE',
                  rank: 'INITIATE'
              };

              const newWealth = (data.wealth || 0) + COST;
              await supabase.from('syndicates').update({
                  members: [...members, newMember],
                  wealth: newWealth
              }).eq('id', data.id);

              const syndicateData: SyndicateData = {
                  id: data.id,
                  name: data.name,
                  code: data.code,
                  wealth: newWealth,
                  commanderId: data.commander_id,
                  members: [...members, newMember]
              };

              set({ syndicate: syndicateData, netWorth: state.netWorth - COST });
              get().pushGlobalEvent(`${state.callsign} JOINED FACTION ${data.name}`, 'SYSTEM');
              get().connectToNetwork();
          }
      },

      leaveSyndicate: async () => {
          set({ syndicate: null });
          // Optionally trigger network reconnect to clear subscriptions, or just let it be
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
      },

      // --- PVP LOGIC ---
      createDuelLobby: async (duration) => {
          const state = get();
          const wager = duration * 50;
          
          if (state.netWorth < wager) { alert("INSUFFICIENT FUNDS"); return; }
          
          const lobbyId = crypto.randomUUID();

          // 1. ESCROW
          set({ netWorth: state.netWorth - wager });

          if (isSupabaseConfigured()) {
              const { error } = await supabase.from('duel_lobbies').insert({
                  id: lobbyId,
                  host_name: state.callsign,
                  host_id: state.id,
                  wager: wager,
                  status: 'OPEN',
                  // Ensure DB has 'duration' column
                  duration: duration 
              });
              
              if (error) {
                  set((s) => ({ netWorth: s.netWorth + wager }));
                  alert("NETWORK ERROR");
                  return;
              }
          }

          set({ 
              hostingLobbyId: lobbyId,
              activeLobbies: [{ id: lobbyId, hostName: state.callsign, hostId: state.id, wager, duration, status: 'OPEN' }, ...state.activeLobbies] 
          });
      },

      cancelDuelLobby: async () => {
          const state = get();
          const lobbyId = state.hostingLobbyId;
          if (!lobbyId) return;

          if (isSupabaseConfigured()) {
              await supabase.from('duel_lobbies').delete().eq('id', lobbyId);
          }

          const lobby = state.activeLobbies.find(l => l.id === lobbyId);
          const refundAmount = lobby ? lobby.wager : (state.currentWager || 0);
          
          set({ 
              hostingLobbyId: null,
              netWorth: state.netWorth + refundAmount,
              activeLobbies: state.activeLobbies.filter(l => l.id !== lobbyId)
          });
      },

      joinDuelLobby: async (lobbyId, wager) => {
          const state = get();
          if (state.netWorth < wager) { alert("INSUFFICIENT FUNDS"); return; }

          set({ netWorth: state.netWorth - wager });

          if (isSupabaseConfigured()) {
              const { error } = await supabase.from('duel_lobbies').update({ 
                  status: 'IN_PROGRESS',
                  challenger_id: state.id 
              }).eq('id', lobbyId);

              if (error) {
                  set(s => ({ netWorth: s.netWorth + wager })); 
                  alert("MATCHMAKING FAILED");
                  return;
              }
          }
          
          get().startMining('DUEL', wager, lobbyId);
          set(s => ({ activeLobbies: s.activeLobbies.filter(l => l.id !== lobbyId) }));
      },
      
      refreshLobbies: async () => {
          if (isSupabaseConfigured()) {
              const { data } = await supabase
                .from('duel_lobbies')
                .select('*')
                .eq('status', 'OPEN')
                .neq('host_id', get().id) 
                .order('created_at', { ascending: false })
                .limit(20);
              if (data) {
                  set({ activeLobbies: data.map(l => ({
                      id: l.id,
                      hostName: l.host_name,
                      hostId: l.host_id,
                      wager: l.wager,
                      duration: l.duration || l.wager / 50, 
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

        if (isSupabaseConfigured()) {
            await supabase.rpc('annex_territory', {
                cost: Math.floor(cost),
                updated_syllabus: updatedSyllabus
            });
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
              archetype: state.archetype, 
              net_worth: state.netWorth,
              data: { 
                  efficiency: state.efficiency, 
                  inventory: state.inventory,
                  syndicate: state.syndicate,
                  bio: state.bio,
                  syllabus: state.syllabus 
              }
          }).eq('id', state.id);
      },

      connectToNetwork: async () => {
          if (!isSupabaseConfigured()) {
              set({ onlineStatus: 'ERROR' });
              return;
          }

          // Cleanup previous channel to prevent duplication
          if (networkChannel) {
              supabase.removeChannel(networkChannel);
              networkChannel = null;
          }

          set({ onlineStatus: 'CONNECTING' });

          try {
              // 1. AUTHENTICATION CHECK
              const { data: { session } } = await supabase.auth.getSession();
              const userId = session?.user?.id;

              if (userId) {
                  set({ id: userId });
                  const { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).single();

                  if (profile) {
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

              // 2. REALTIME SUBSCRIPTIONS
              networkChannel = supabase.channel('public:network');

              // A. Global Events
              networkChannel.on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'global_events' }, (payload) => {
                    const newEvent = payload.new;
                    set(state => ({
                        globalEvents: [{
                            id: newEvent.id,
                            message: newEvent.message,
                            type: newEvent.type as any,
                            timestamp: new Date(newEvent.created_at).getTime()
                        }, ...state.globalEvents].slice(0, 50)
                    }));
              });

              // B. PvP Lobbies
              networkChannel.on('postgres_changes', { event: '*', schema: 'public', table: 'duel_lobbies' }, (payload) => {
                    const state = get();
                    const newRecord = payload.new as any;
                    
                    // HOST: If I am hosting, and status -> IN_PROGRESS, Start Game
                    if (state.hostingLobbyId && newRecord && newRecord.id === state.hostingLobbyId) {
                        if (newRecord.status === 'IN_PROGRESS') {
                            const wager = newRecord.wager;
                            get().startMining('DUEL', wager, newRecord.id); 
                        }
                    }

                    // ACTIVE PLAYERS: If I am in a duel (Host or Challenger), and winner_id is set to ME, I win.
                    if (state.activeDuelId && newRecord && newRecord.id === state.activeDuelId) {
                         // Win via Forfeit (Opponent resigned/failed)
                         if (newRecord.winner_id === state.id) {
                             get().stopMining(true, 0); // Trigger Success (Duration irrelevant for forfeit win)
                             alert("VICTORY: OPPONENT CONNECTION LOST");
                         }
                    }
                    
                    get().refreshLobbies();
              });

              // C. Syndicate Sync
              // We listen to ALL syndicate updates and filter in callback to support changing syndicates dynamically
              networkChannel.on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'syndicates' }, (payload) => {
                  const state = get();
                  const newData = payload.new as any;
                  
                  if (state.syndicate && state.syndicate.id === newData.id) {
                      set({ syndicate: {
                          id: newData.id,
                          name: newData.name,
                          code: newData.code,
                          wealth: newData.wealth,
                          commanderId: newData.commander_id,
                          members: newData.members
                      }});
                  }
              });

              networkChannel.subscribe((status) => {
                  if (status === 'SUBSCRIBED') set({ onlineStatus: 'ONLINE' });
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
