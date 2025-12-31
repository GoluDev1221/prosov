export type Archetype = 'STRATEGIST' | 'VANGUARD' | 'SENTINEL' | 'OPERATIVE';

export type TierType = 'L' | 'RTQ' | 'NP' | 'JP' | 'KS' | 'TS';

export interface TierStatus {
  id: TierType;
  label: string;
  completed: boolean;
  timestamp: number | null; // epoch
}

export interface Chapter {
  id: string;
  subject: 'PHYSICS' | 'CHEMISTRY' | 'BIOLOGY';
  name: string;
  tiers: TierStatus[];
  lastRevised: number; // epoch
  isDecayed: boolean;
  difficulty: number; // 1-5 multiplier
}

export interface GlobalEvent {
  id: string;
  message: string;
  timestamp: number;
  type: 'ANNEX' | 'COMBAT' | 'SYSTEM' | 'MARKET';
}

export interface ActiveBuffs {
    neuralStimulantUntil: number | null; // epoch
    cryoStasisUntil: number | null; // epoch
    ghostProtocolUntil: number | null; // epoch
}

export interface SyndicateMember {
    id: string;
    name: string;
    netWorth: number;
    status: 'ONLINE' | 'OFFLINE';
}

export interface UserState {
  netWorth: number; // $NW
  efficiency: number; // 0.1 to 2.0
  willpower: number; // 0-100
  archetype: Archetype | null;
  startDate: number;
  streak: number;
  lastActive: number;
  syllabus: Chapter[];
  isMining: boolean;
  miningStartTime: number | null;
  miningMode: 'STANDARD' | 'DUEL'; // Track mining context
  defconLevel: number; // 5 (calm) to 1 (panic)
  
  // Economy Items
  inventory: ActiveBuffs;

  // Network State
  globalEvents: GlobalEvent[];
  onlineStatus: 'CONNECTING' | 'ONLINE' | 'ERROR';
  activeUsers: number;
  
  // Syndicate
  syndicateName: string | null;
  syndicateMembers: SyndicateMember[];
}

export interface MiningSession {
  durationMinutes: number;
  potentialYield: number;
}