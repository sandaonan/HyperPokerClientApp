export type ViewState = 'login' | 'home' | 'tournaments' | 'profile' | 'my-games';

export interface User {
  id: string;
  name: string; // Real Name
  nationalId: string;
  nickname: string;
  mobile: string;
  birthday: string;
  isForeigner: boolean;
  kycUploaded: boolean;
  isProfileComplete: boolean;
  avatarUrl?: string;
}

export interface Club {
  id: string;
  name: string;
  tier: 'Platinum' | 'Emerald' | 'Diamond' | 'Gold' | 'Silver';
  localId: string;
  balance: number;
  points: number;
  currency: string;
}

export interface BlindLevel {
  level: number;
  smallBlind: number;
  bigBlind: number;
  ante: number;
  duration: number; // minutes
}

export interface Tournament {
  id: string;
  name: string;
  description?: string;
  buyIn: number;
  fee: number;
  startingChips: number;
  startTime: string; // ISO String
  reservedCount: number;
  maxCap: number;
  isLateRegEnded: boolean;
  structure: BlindLevel[];
}

export interface GameRecord {
  id: string;
  date: string; // ISO Date
  gameName: string;
  profit: number; // Can be negative
}