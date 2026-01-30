
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
  email?: string; // Added: Email field (optional)
  birthday?: string;
  gender?: 'male' | 'female' | 'other'; // Added: Gender field
  isForeigner?: boolean;
  nationality?: string; // Added: Nationality for KYC
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

export interface NearbyClub {
  place_id: string;
  name: string;
  address: string; // Legacy short address
  formatted_address?: string; // New: Full address from Google
  rating: number;
  latitude: number;
  longitude: number;
  vicinity: string;
  openNow: boolean;
  isPartner?: boolean; // New: Determines if booking is allowed via App
  opening_hours?: string[]; // New: Array of daily hours strings
  google_maps_url?: string; // New: Direct link
  website?: string; // New: Official site
  photoReference?: string;
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
  kycStatus?: 'verified' | 'unverified' | null; // KYC verification status
}

export interface BlindLevel {
  level: number; // 级别
  smallBlind: number; // 小盲
  bigBlind: number; // 大盲
  ante: number; // 前注 (ANTE)
  duration: number; // 时间 (minutes)
  isBreak?: boolean; // 是否为休息时间 (break)
  breakDuration?: number; // 休息时长 (minutes, 仅当 isBreak 为 true 时使用)
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

export type TournamentType = '錦標賽' | '限時錦標賽' | '衛星賽' | '賞金賽' | '豪克系列賽';

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
  maxRebuy?: number; // Added: Maximum number of re-buys allowed
  structure: BlindLevel[];
  clockUrl?: string; // Added: Link to tournament clock
  durationMinutes?: number; // Added: Tournament duration in minutes (from Supabase)
}

export interface GameRecord {
  id: string;
  userId: string;
  date: string; // ISO Date
  gameName: string;
  clubName: string; 
  buyIn: number;    
  entryCount: number; // Number of buy-ins (re-entries)
  seatNumber?: number; // Added
  profit: number; // Should be >= 0 (if no prize, profit = 0)
  type?: TournamentType; // Added for history display
  points?: number; // 6 points (regular points)
  activityPoints?: number; // Activity points (活動點數)
}
