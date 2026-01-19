import { Club, GameRecord, Tournament, User } from './types';

// Modified mock user to simulate a "New User" state (incomplete profile)
export const MOCK_USER: User = {
  id: 'u-123456',
  name: '', // Empty for new user
  nationalId: '', // Empty for new user
  nickname: '',
  mobile: '',
  birthday: '',
  isForeigner: false,
  kycUploaded: false,
  isProfileComplete: false, 
  avatarUrl: '',
};

export const CLUBS: Club[] = [
  {
    id: 'c-1',
    name: '6Bet Poker Club',
    tier: 'Platinum',
    localId: '6Bet-888',
    balance: 15400,
    points: 3500,
    currency: 'USD',
  },
  {
    id: 'c-2',
    name: 'Ace High Taipei',
    tier: 'Emerald',
    localId: 'AH-007',
    balance: 5200,
    points: 120,
    currency: 'USD',
  },
  {
    id: 'c-3',
    name: 'Royal Flush Arena',
    tier: 'Diamond',
    localId: 'RFA-999',
    balance: 50000,
    points: 12000,
    currency: 'USD',
  },
];

const today = new Date();
const tomorrow = new Date(today);
tomorrow.setDate(tomorrow.getDate() + 1);

const MOCK_STRUCTURE = [
  { level: 1, smallBlind: 100, bigBlind: 100, ante: 100, duration: 20 },
  { level: 2, smallBlind: 100, bigBlind: 200, ante: 200, duration: 20 },
  { level: 3, smallBlind: 200, bigBlind: 300, ante: 300, duration: 20 },
  { level: 4, smallBlind: 200, bigBlind: 400, ante: 400, duration: 20 },
  { level: 5, smallBlind: 300, bigBlind: 600, ante: 600, duration: 20 },
  { level: 6, smallBlind: 400, bigBlind: 800, ante: 800, duration: 20 },
];

export const TOURNAMENTS: Tournament[] = [
  {
    id: 't-1',
    name: 'Daily Deepstack',
    description: 'Our signature daily event. 20K starting chips, 20 min levels. Late reg until level 8.',
    buyIn: 3000,
    fee: 400,
    startingChips: 20000,
    startTime: new Date(today.setHours(today.getHours() + 1)).toISOString(), 
    reservedCount: 45,
    maxCap: 60,
    isLateRegEnded: false,
    structure: MOCK_STRUCTURE,
  },
  {
    id: 't-2',
    name: 'High Roller Event',
    description: 'For the serious players. Deep structure, 30 min clock.',
    buyIn: 10000,
    fee: 1000,
    startingChips: 50000,
    startTime: new Date(today.setHours(today.getHours() + 4)).toISOString(),
    reservedCount: 12,
    maxCap: 20,
    isLateRegEnded: false,
    structure: MOCK_STRUCTURE,
  },
  {
    id: 't-3',
    name: 'Turbo Bounty',
    description: 'Fast paced action. $500 bounty for each elimination.',
    buyIn: 2000,
    fee: 300,
    startingChips: 15000,
    startTime: new Date(today.setHours(today.getHours() - 2)).toISOString(), 
    reservedCount: 60,
    maxCap: 60,
    isLateRegEnded: true,
    structure: MOCK_STRUCTURE,
  },
];

export const GAME_HISTORY: GameRecord[] = [
  { id: 'g-1', date: '2023-10-01', gameName: 'Daily Deepstack', profit: -3400 },
  { id: 'g-2', date: '2023-10-03', gameName: 'Cash Game 50/100', profit: 12500 },
  { id: 'g-3', date: '2023-10-05', gameName: 'Turbo Bounty', profit: -2300 },
  { id: 'g-4', date: '2023-10-06', gameName: 'Cash Game 100/200', profit: 45000 },
  { id: 'g-5', date: '2023-10-08', gameName: 'Saturday Special', profit: -5000 },
];