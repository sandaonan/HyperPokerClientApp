export type ViewState = 'login' | 'home' | 'tournaments' | 'profile' | 'my-games';

export interface User {
  id: string;
  username: string; // Login ID
  password?: string; // In real app, this is hashed. Mock app stores plain for demo.
  
  // Profile Fields (Optional at start)
  name?: string; // Real Name
  nationalId?: string;
  nickname?: string;
  mobile?: string;
  birthday?: string;
  isForeigner?: boolean;
  kycUploaded?: boolean;
  isProfileComplete: boolean;
  avatarUrl?: string;
  lineUserId?: string;
}

export interface Club {
  id: string;
  name: string;
  description?: string;
  bannerUrl?: string;
  tier: 'Platinum' | 'Emerald' | 'Diamond' | 'Gold' | 'Silver';
  localId: string;
  currency: string;
  // Balance/Points removed from here, moved to Wallet
}

export interface Wallet {
  userId: string;
  clubId: string;
  balance: number;
  points: number;
}

export interface BlindLevel {
  level: number;
  smallBlind: number;
  bigBlind: number;
  ante: number;
  duration: number; // minutes
}

export type RegistrationStatus = 'reserved' | 'paid' | 'cancelled';

export interface Registration {
  id: string;
  tournamentId: string;
  userId: string;
  status: RegistrationStatus;
  timestamp: string;
}

export interface Tournament {
  id: string;
  clubId: string; // Link to Club
  name: string;
  description?: string;
  buyIn: number;
  fee: number;
  startingChips: number;
  startTime: string; // ISO String
  reservedCount: number; // Calculated field from Registrations
  maxCap: number;
  isLateRegEnded: boolean;
  structure: BlindLevel[];
}

export interface GameRecord {
  id: string;
  userId: string;
  date: string; // ISO Date
  gameName: string;
  profit: number; // Can be negative
}