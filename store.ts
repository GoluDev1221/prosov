import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { UserState, Archetype, Chapter, TierType, GlobalEvent, ActiveBuffs } from './types';
import { INITIAL_SYLLABUS, DECAY_THRESHOLD_MS, TIER_CONFIG } from './constants';
import { supabase, isSupabaseConfigured } from './supabaseClient';

interface StoreActions {
  setArchetype: (a: Archetype) => void;
  startMining: (mode?: 'STANDARD' | 'DUEL') => void;
  stopMining: (success: boolean, durationMinutes: number) => number;
  completeTier: (chapterId: string, tierId: TierType) => void;
  updateDecay: () => void;
  calculateCAGR: () => number;
  
  // Market Actions
  buyItem: (item: 'NEURAL' | 'CRYO' | 'GHOST', cost: number) => void;
  
  // Syndicate Actions
  joinSyndicate: (name: string) => void;

  // Network Actions
  connectToNetwork: () => void;
  pushGlobalEvent: (msg: string, type: GlobalEvent['type']) => void;
  syncToCloud: () => void;
}

// Generate a static ID for this client instance if one doesn't exist
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
      syndicateName: null,
      syndicateMembers: [],
      
      // Network State
      globalEvents: [],
      onlineStatus: 'CONNECTING',
      activeUsers: 1, 

      // Actions
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
            ? `${getClientId()} LOST DUEL PROTOCOL (-$${loss})`
            : `${getClientId()} FAILED FOCUS PROTOCOL (-$${loss})`;
            
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
        
        // Streak Logic with Cryo-Stasis check
        const daysSinceLast = (now - state.lastActive) / oneDay;
        
        if (daysSinceLast < 2) {
             // Maintained
             if (new Date(state.lastActive).getDate() !== new Date(now).getDate()) {
                newStreak += 1;
            }
        } else {
            // Check Cryo
            if (state.inventory.cryoStasisUntil && state.inventory.cryoStasisUntil > now) {
                // Frozen, do not reset
            } else {
                newStreak = 0;
            }
        }

        if (durationMinutes > 15 || isDuel) {
             const msg = isDuel 
            ? `${getClientId()} WON DUEL PROTOCOL (+$${yieldAmount.toFixed(0)})`
            : `${getClientId()} EXTRACTED $${yieldAmount.toFixed(0)}`;
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
              state.pushGlobalEvent(`${getClientId()} PURCHASED ${item} AUGMENT`, 'MARKET');
          }
          get().syncToCloud();
      },

      joinSyndicate: (name) => {
          set({
              syndicateName: name,
              syndicateMembers: [
                  { id: '1', name: getClientId(), netWorth: get().netWorth, status: 'ONLINE' },
                  { id: '2', name: 'VEX_99', netWorth: 124000, status: 'ONLINE' },
                  { id: '3', name: 'KAI_ZEN', netWorth: 98000, status: 'OFFLINE' },
                  { id: '4', name: 'NEO_XY', netWorth: 45000, status: 'ONLINE' },
              ]
          });
          get().syncToCloud();
      },

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

        state.pushGlobalEvent(`${getClientId()} ANNEXED ${chapter.name.toUpperCase()} [${tierId}]`, 'ANNEX');

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
          const clientId = getClientId();
          
          await supabase.from('profiles').upsert({
              callsign: clientId,
              net_worth: state.netWorth,
              archetype: state.archetype,
              last_active: new Date().toISOString(),
              data: { 
                  syllabus: state.syllabus,
                  inventory: state.inventory,
                  syndicateName: state.syndicateName
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

          // 3. Attempt to Hydrate User State from Cloud (Cross-Device Sync)
          const clientId = getClientId();
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('callsign', clientId)
            .single();

          if (profile && profile.data) {
             const cloudData = profile.data;
             // Merge strategy: Cloud wins on netWorth if higher, but we trust local lastRevised usually. 
             // For simplicity in this V4, we trust Cloud if it exists.
             set({
                 netWorth: profile.net_worth,
                 archetype: profile.archetype,
                 syllabus: cloudData.syllabus || get().syllabus,
                 inventory: cloudData.inventory || get().inventory,
                 syndicateName: cloudData.syndicateName || get().syndicateName
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