
export type ViewState = 'login' | 'home' | 'tournaments' | 'profile' | 'my-games';

export interface User {
  id: string;
  username: string; // Login ID
  password?: string;
  
  // Profile Fields
  name?: string; 
  nationalId?: string;
  nickname?: string;
  mobile?: string;
  mobileVerified?: boolean; // Added for OTP
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
  feedbackUrl?: string; // Added: External link for feedback
  latitude?: number; // Added for Geolocation
  longitude?: number; // Added for Geolocation
}

// active: 正常會員
// pending: 需身份驗證 (資料修改或新戶)
// applying: 申請加入審核中
// banned: 停權
export type MembershipStatus = 'active' | 'pending' | 'banned' | 'applying';

export interface Wallet {
  userId: string;
  clubId: string;
  balance: number; // 儲值金餘額
  points: number;  // 積分
  joinDate: string; // ISO Date Added
  status: MembershipStatus;
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
  // Mock display info for the list
  userDisplayName?: string; 
  userLocalId?: string; 
}

export type TournamentType = '錦標賽' | '限時錦標賽' | '衛星賽' | '賞金賽';

export interface Tournament {
  id: string;
  clubId: string; // Link to Club
  name: string;
  description?: string;
  type: TournamentType; // Added
  promotionNote?: string; // Added: Club formatted text
  buyIn: number;
  fee: number;
  startingChips: number;
  startTime: string; // ISO String
  reservedCount: number; // Calculated field from Registrations
  maxCap: number;
  isLateRegEnded: boolean;
  lateRegLevel: number; // Added: Level number where reg ends
  structure: BlindLevel[];
  clockUrl?: string; // Added: Link to tournament clock
}

export interface GameRecord {
  id: string;
  userId: string;
  date: string; // ISO Date
  gameName: string;
  clubName: string; 
  buyIn: number;    
  entryCount: number; 
  seatNumber?: number; // Added
  profit: number; 
  type?: TournamentType; // Added for history display
  points?: number; // Added for display in StatsView
}
