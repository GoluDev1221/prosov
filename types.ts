
export type Archetype = 'STRATEGIST' | 'VANGUARD' | 'SENTINEL' | 'OPERATIVE';

export type TierType = 'L' | 'RTQ' | 'NP' | 'JP' | 'KS' | 'TS';

export type Rank = 'COMMANDER' | 'LIEUTENANT' | 'OPERATIVE' | 'INITIATE';

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
    rank: Rank;
}

export interface SyndicateData {
    id: string;
    name: string;
    code: string;
    wealth: number;
    commanderId: string;
    members: SyndicateMember[];
}

export interface DuelLobby {
    id: string;
    hostName: string;
    hostId: string; // Added to prevent self-joining
    wager: number;
    duration: number; // in minutes
    status: 'OPEN' | 'IN_PROGRESS';
}

export interface UserState {
  // Identity
  id: string;
  callsign: string;
  bio: string;
  
  // Stats
  netWorth: number; // $NW
  efficiency: number; // 0.1 to 2.0
  willpower: number; // 0-100
  archetype: Archetype | null;
  startDate: number;
  streak: number;
  lastActive: number;
  syllabus: Chapter[];
  
  // Mining Status
  isMining: boolean;
  miningStartTime: number | null;
  miningMode: 'STANDARD' | 'DUEL'; 
  currentWager: number; // Track active wager for payout logic
  hostingLobbyId: string | null; // Track if user is waiting in lobby
  defconLevel: number; 
  
  // Economy Items
  inventory: ActiveBuffs;

  // Network State
  globalEvents: GlobalEvent[];
  onlineStatus: 'CONNECTING' | 'ONLINE' | 'ERROR';
  activeUsers: number;
  
  // Syndicate
  syndicate: SyndicateData | null;
  
  // PvP
  activeLobbies: DuelLobby[];
  
  // UI Flags
  showManual: boolean;
  showProfile: boolean;
}

export interface MiningSession {
  durationMinutes: number;
  potentialYield: number;
}
