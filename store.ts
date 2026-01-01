
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
  checkIntegrity: () => void;
  
  // Market Actions
  buyItem: (item: 'NEURAL' | 'CRYO' | 'GHOST', cost: number) => void;
  
  // Syndicate Actions
  createSyndicate: (name: string) => void;
  joinSyndicate: (code: string) => void;
  leaveSyndicate: () => Promise<void>;
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

// Helper to play sounds safely
const playSound = (type: 'MATCH' | 'ERROR') => {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    if (type === 'MATCH') {
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(880, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
        osc.start();
        osc.stop(ctx.currentTime + 0.5);
    }
};

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

      checkIntegrity: () => {
          const state = get();
          // If a session has been running for > 4 hours, it's likely a bug or exploit attempt.
          // Auto-terminate without reward to maintain economy balance.
          if (state.isMining && state.miningStartTime) {
              const elapsedMinutes = (Date.now() - state.miningStartTime) / 1000 / 60;
              if (elapsedMinutes > 240) {
                  console.warn("Session exceeded 4 hours. Terminating for integrity.");
                  set({ isMining: false, miningStartTime: null, activeDuelId: null, hostingLobbyId: null, currentWager: 0 });
              }
          }
      },

      updateProfile: async (callsign, bio) => {
          const state = get();
          set({ callsign, bio });
          
          if (isSupabaseConfigured() && state.id) {
              // 1. Update Profile
              await supabase.from('profiles').update({
                  callsign, 
                  data: { ...state, bio } 
              }).eq('id', state.id);

              // 2. Sync Syndicate Member Name
              if (state.syndicate) {
                  const { data: syn } = await supabase.from('syndicates').select('*').eq('id', state.syndicate.id).single();
                  if (syn && syn.members) {
                      const updatedMembers = syn.members.map((m: any) => 
                          m.id === state.id ? { ...m, name: callsign } : m
                      );
                      await supabase.from('syndicates').update({ members: updatedMembers }).eq('id', state.syndicate.id);
                  }
              }
          }
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
        if (!state.isMining) return 0;

        // --- FAILURE LOGIC ---
        if (!success) {
           let penalty = Math.floor(state.netWorth * 0.20);
           if (state.archetype === 'SENTINEL') penalty = Math.floor(penalty * 0.5);
           if (state.netWorth > 0 && penalty === 0) penalty = 1;

           // PvP Forfeit Logic
           if (state.miningMode === 'DUEL' && state.activeDuelId && isSupabaseConfigured()) {
               try {
                   const { data: lobby } = await supabase.from('duel_lobbies').select('host_id, challenger_id').eq('id', state.activeDuelId).single();
                   if (lobby) {
                       const winnerId = lobby.host_id === state.id ? lobby.challenger_id : lobby.host_id;
                       if (winnerId) {
                           await supabase.from('duel_lobbies').update({ status: 'FINISHED', winner_id: winnerId }).eq('id', state.activeDuelId);
                       }
                   }
               } catch (err) { console.error("Resign error", err); }
           }

           set({ 
               isMining: false, miningStartTime: null, hostingLobbyId: null, activeDuelId: null, currentWager: 0,
               netWorth: Math.max(0, state.netWorth - penalty) 
           });

           state.pushGlobalEvent(`${state.callsign} FAILED PROTOCOL (-${penalty} $NW)`, 'COMBAT');
           return -penalty;
        }

        // --- SUCCESS LOGIC ---
        let finalEarned = 0;

        if (state.miningMode === 'DUEL') {
             const pot = state.currentWager * 2;
             let victoryConfirmed = false;

             if (state.activeDuelId && isSupabaseConfigured()) {
                 const { data, error } = await supabase
                    .from('duel_lobbies')
                    .update({ status: 'FINISHED', winner_id: state.id })
                    .eq('id', state.activeDuelId)
                    .is('winner_id', null)
                    .select('id');
                 
                 if (!error && data && data.length > 0) victoryConfirmed = true;
                 else {
                     const { data: check } = await supabase.from('duel_lobbies').select('winner_id').eq('id', state.activeDuelId).single();
                     if (check && check.winner_id === state.id) victoryConfirmed = true;
                 }
             } else {
                 victoryConfirmed = true; // Offline
             }

             if (victoryConfirmed) {
                 finalEarned = pot;
                 set({
                     isMining: false, miningStartTime: null, hostingLobbyId: null, activeDuelId: null, currentWager: 0,
                     netWorth: state.netWorth + pot, lastActive: Date.now()
                 });
                 state.pushGlobalEvent(`${state.callsign} WON DUEL (+$${pot})`, 'COMBAT');
             } else {
                 alert("DEFEAT: OPPONENT CLAIMED VICTORY FIRST");
                 set({ isMining: false, miningStartTime: null, hostingLobbyId: null, activeDuelId: null, currentWager: 0 });
                 return 0;
             }

        } else {
             // STANDARD MINING
             if (isSupabaseConfigured()) {
                const { data: yieldAmount, error } = await supabase.rpc('mine_resources', { duration_minutes: durationMinutes, mode: 'STANDARD' });
                if (!error) finalEarned = yieldAmount || 0;
             } else {
                finalEarned = Math.floor(durationMinutes * 10 * state.efficiency);
             }
             if (state.inventory.neuralStimulantUntil && state.inventory.neuralStimulantUntil > Date.now()) finalEarned *= 2;

             set({ 
              isMining: false, miningStartTime: null, 
              netWorth: state.netWorth + finalEarned, lastActive: Date.now(), streak: state.streak 
            });
            
             if (durationMinutes > 15) state.pushGlobalEvent(`${state.callsign} EXTRACTED $${finalEarned}`, 'MARKET');
        }

        // --- SYNDICATE WEALTH SYNC ---
        if (state.syndicate && isSupabaseConfigured()) {
            const { data: currentSyn } = await supabase.from('syndicates').select('*').eq('id', state.syndicate.id).single();
            if (currentSyn && Array.isArray(currentSyn.members)) {
                const members = currentSyn.members as any[];
                const updatedMembers = members.map(m => m.id === state.id ? { ...m, netWorth: state.netWorth + finalEarned } : m); // Use predicted new NW
                
                const totalWealth = updatedMembers.reduce((sum, m) => sum + (m.netWorth || 0), 0);
                
                await supabase.from('syndicates').update({ members: updatedMembers, wealth: totalWealth }).eq('id', state.syndicate.id);
            }
        }

        return finalEarned;
      },

      buyItem: (item, cost) => {
          const state = get();
          if (state.netWorth < cost) return;
          const now = Date.now();
          const newInventory = { ...state.inventory };
          
          if (item === 'NEURAL') newInventory.neuralStimulantUntil = now + (60 * 60 * 1000);
          if (item === 'CRYO') newInventory.cryoStasisUntil = now + (24 * 60 * 60 * 1000);
          if (item === 'GHOST') newInventory.ghostProtocolUntil = now + (24 * 60 * 60 * 1000);

          set({ netWorth: state.netWorth - cost, inventory: newInventory });
          if (item !== 'GHOST') state.pushGlobalEvent(`${state.callsign} PURCHASED ${item} AUGMENT`, 'MARKET');
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
              id: syndicateId, name, code, wealth: state.netWorth - COST, commanderId: state.id,
              members: [{ id: state.id, name: state.callsign, netWorth: state.netWorth - COST, status: 'ONLINE', rank: 'COMMANDER' }]
          };

          if (isSupabaseConfigured()) {
              const { error } = await supabase.from('syndicates').insert({
                  id: newSyndicate.id, name: newSyndicate.name, code: newSyndicate.code,
                  commander_id: newSyndicate.commanderId, wealth: newSyndicate.wealth, members: newSyndicate.members
              });
              if (error) { alert("FAILED: " + error.message); return; }
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

              const members = Array.isArray(data.members) ? data.members : [];
              if (members.find((m: any) => m.id === state.id)) { alert("ALREADY A MEMBER"); return; }

              const newMember = { id: state.id, name: state.callsign, netWorth: state.netWorth - COST, status: 'ONLINE', rank: 'INITIATE' };
              const newWealth = (data.wealth || 0) + COST + (state.netWorth - COST); // Add user's wealth to total
              
              const { error: updateError } = await supabase.from('syndicates').update({
                  members: [...members, newMember], wealth: newWealth
              }).eq('id', data.id);

              if (updateError) { alert("JOIN FAILED"); return; }

              set({ 
                  syndicate: { id: data.id, name: data.name, code: data.code, wealth: newWealth, commanderId: data.commander_id, members: [...members, newMember] }, 
                  netWorth: state.netWorth - COST 
              });
              get().pushGlobalEvent(`${state.callsign} JOINED FACTION ${data.name}`, 'SYSTEM');
              get().connectToNetwork();
          }
      },

      leaveSyndicate: async () => {
          const state = get();
          if (!state.syndicate) return;

          if (isSupabaseConfigured()) {
              // If Commander, dissolve syndicate
              if (state.syndicate.commanderId === state.id) {
                  await supabase.from('syndicates').delete().eq('id', state.syndicate.id);
                  get().pushGlobalEvent(`${state.callsign} DISSOLVED FACTION ${state.syndicate.name}`, 'SYSTEM');
              } else {
                  // If Member, remove self from array AND subtract wealth
                  const updatedMembers = state.syndicate.members.filter(m => m.id !== state.id);
                  const newWealth = updatedMembers.reduce((sum, m) => sum + m.netWorth, 0);
                  await supabase.from('syndicates').update({ members: updatedMembers, wealth: newWealth }).eq('id', state.syndicate.id);
              }
          }
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
      },

      // --- PVP LOGIC ---
      createDuelLobby: async (duration) => {
          const state = get();
          const wager = duration * 50;
          if (state.netWorth < wager) { alert("INSUFFICIENT FUNDS"); return; }
          const lobbyId = crypto.randomUUID();

          set({ netWorth: state.netWorth - wager }); // Lock Funds
          if (isSupabaseConfigured()) {
              const { error } = await supabase.from('duel_lobbies').insert({
                  id: lobbyId, host_name: state.callsign, host_id: state.id, wager: wager, status: 'OPEN', duration: duration 
              });
              if (error) { set((s) => ({ netWorth: s.netWorth + wager })); alert("NETWORK ERROR"); return; }
              
              // Add ZOMBIE CLEANUP listener
              const cleanup = () => {
                 supabase.from('duel_lobbies').delete().eq('id', lobbyId).then(() => console.log('Lobby cleaned'));
              };
              window.addEventListener('beforeunload', cleanup);
          }
          set({ hostingLobbyId: lobbyId, activeLobbies: [{ id: lobbyId, hostName: state.callsign, hostId: state.id, wager, duration, status: 'OPEN' }, ...state.activeLobbies] });
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
          
          set({ hostingLobbyId: null, netWorth: state.netWorth + refundAmount, activeLobbies: state.activeLobbies.filter(l => l.id !== lobbyId) });
      },

      joinDuelLobby: async (lobbyId, wager) => {
          const state = get();
          if (state.netWorth < wager) { alert("INSUFFICIENT FUNDS"); return; }

          set({ netWorth: state.netWorth - wager });
          if (isSupabaseConfigured()) {
              const { error } = await supabase.from('duel_lobbies').update({ status: 'IN_PROGRESS', challenger_id: state.id }).eq('id', lobbyId);
              if (error) { set(s => ({ netWorth: s.netWorth + wager })); alert("MATCHMAKING FAILED"); return; }
          }
          get().startMining('DUEL', wager, lobbyId);
          set(s => ({ activeLobbies: s.activeLobbies.filter(l => l.id !== lobbyId) }));
      },
      
      refreshLobbies: async () => {
          if (isSupabaseConfigured()) {
              const { data } = await supabase.from('duel_lobbies').select('*').eq('status', 'OPEN').neq('host_id', get().id).order('created_at', { ascending: false }).limit(20);
              if (data) {
                  set({ activeLobbies: data.map(l => ({
                      id: l.id, hostName: l.host_name, hostId: l.host_id, wager: l.wager, duration: l.duration || l.wager / 50, status: l.status as 'OPEN' | 'IN_PROGRESS'
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

        if (state.netWorth < cost) { alert("INSUFFICIENT FUNDS"); return; }

        const updatedSyllabus = state.syllabus.map(c => {
          if (c.id !== chapterId) return c;
          return {
            ...c, lastRevised: Date.now(), isDecayed: false,
            tiers: c.tiers.map(t => t.id === tierId ? { ...t, completed: true, timestamp: Date.now() } : t)
          };
        });

        if (isSupabaseConfigured()) await supabase.rpc('annex_territory', { cost: Math.floor(cost), updated_syllabus: updatedSyllabus });
        
        state.pushGlobalEvent(`${state.callsign} ANNEXED ${state.syllabus.find(c=>c.id===chapterId)?.name.toUpperCase()} [${tierId}]`, 'ANNEX');
        set({ syllabus: updatedSyllabus, netWorth: state.netWorth - cost });
      },

      updateDecay: () => {
        const state = get();
        const now = Date.now();
        set({ syllabus: state.syllabus.map(c => ({ ...c, isDecayed: (now - c.lastRevised) > DECAY_THRESHOLD_MS })) });
      },

      calculateCAGR: () => {
        const state = get();
        const daysActive = Math.max(1, (Date.now() - state.startDate) / (1000 * 60 * 60 * 24));
        return Math.floor((state.netWorth / daysActive) * 365);
      },

      pushGlobalEvent: async (message, type) => {
          if (isSupabaseConfigured()) await supabase.from('global_events').insert({ message, type });
      },

      syncToCloud: async () => {
          if (!isSupabaseConfigured()) return;
          const state = get();
          if (!state.id) return; 
          await supabase.from('profiles').update({
              callsign: state.callsign, archetype: state.archetype, net_worth: state.netWorth,
              data: { efficiency: state.efficiency, inventory: state.inventory, syndicate: state.syndicate, bio: state.bio, syllabus: state.syllabus }
          }).eq('id', state.id);
      },

      connectToNetwork: async () => {
          if (!isSupabaseConfigured()) { set({ onlineStatus: 'ERROR' }); return; }
          if (networkChannel) { supabase.removeChannel(networkChannel); networkChannel = null; }

          set({ onlineStatus: 'CONNECTING' });

          try {
              const { data: { session } } = await supabase.auth.getSession();
              const userId = session?.user?.id;

              if (userId) {
                  set({ id: userId });
                  const { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).single();
                  if (profile) {
                      set({
                          callsign: profile.callsign, netWorth: profile.net_worth, archetype: profile.archetype,
                          syllabus: profile.data?.syllabus || INITIAL_SYLLABUS, efficiency: profile.data?.efficiency || 1.0,
                          inventory: profile.data?.inventory || get().inventory, syndicate: profile.data?.syndicate || get().syndicate, bio: profile.data?.bio || get().bio
                      });
                  }
              }

              networkChannel = supabase.channel('public:network');

              // A. Global Events
              networkChannel.on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'global_events' }, (payload) => {
                    const newEvent = payload.new as any;
                    set(state => ({ globalEvents: [{ id: newEvent.id, message: newEvent.message, type: newEvent.type as any, timestamp: new Date(newEvent.created_at).getTime() }, ...state.globalEvents].slice(0, 50) }));
              });

              // B. PvP Lobbies
              networkChannel.on('postgres_changes', { event: '*', schema: 'public', table: 'duel_lobbies' }, (payload) => {
                    const state = get();
                    const newRecord = payload.new as any;
                    
                    // HOST START
                    if (state.hostingLobbyId && newRecord && newRecord.id === state.hostingLobbyId && newRecord.status === 'IN_PROGRESS') {
                        playSound('MATCH'); // ALERT HOST
                        get().startMining('DUEL', newRecord.wager, newRecord.id); 
                    }

                    // INSTANT WIN LISTENER
                    if (state.activeDuelId && newRecord && newRecord.id === state.activeDuelId && newRecord.status === 'FINISHED') {
                         if (newRecord.winner_id === state.id) {
                             if (state.isMining) {
                                 // Force stop as success (true), duration 0.
                                 get().stopMining(true, 0); 
                                 alert("VICTORY: OPPONENT FORFEIT");
                             }
                         }
                    }
                    get().refreshLobbies();
              });

              // C. Syndicate Sync
              networkChannel.on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'syndicates' }, (payload) => {
                  const state = get();
                  const newData = payload.new as any;
                  // If we are IN this syndicate, update our local view
                  if (state.syndicate && state.syndicate.id === newData.id) {
                      set({ syndicate: { id: newData.id, name: newData.name, code: newData.code, wealth: newData.wealth, commanderId: newData.commander_id, members: newData.members }});
                  }
              });

              networkChannel.subscribe((status) => { if (status === 'SUBSCRIBED') set({ onlineStatus: 'ONLINE' }); });
              get().refreshLobbies();

          } catch (e) { console.error("Network Link Failed:", e); set({ onlineStatus: 'ERROR' }); }
      }
    }),
    { name: 'prosov-v4-storage', storage: createJSONStorage(() => localStorage) }
  )
);
