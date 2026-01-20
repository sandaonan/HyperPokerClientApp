import { Club, Tournament, GameRecord } from './types';

export const LINE_LIFF_ID = 'YOUR_LIFF_ID_HERE'; 

// Static Definitions for Clubs (Metadata only)
export const SEED_CLUBS: Club[] = [
  {
    id: 'c-1',
    name: '6Bet 撲克俱樂部',
    description: '台北市最頂級的德州撲克競技協會。每週舉辦多場高額賽事。',
    bannerUrl: 'https://placehold.co/1000x400/450a0a/fbbf24?text=6+BET+LIVE+POKER+SHOW&font=playfair-display', 
    tier: 'Platinum',
    localId: '6Bet-888',
    currency: 'USD',
  },
  {
    id: 'c-2',
    name: 'Ace High 台北',
    description: '專注於推廣健康撲克運動。新手友善。',
    bannerUrl: 'https://images.unsplash.com/photo-1544552866-d3ed42536cfd?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
    tier: 'Emerald',
    localId: 'AH-007',
    currency: 'USD',
  },
  {
    id: 'c-3',
    name: '皇家同花順競技場',
    description: '全台最大規模賽事場地。',
    bannerUrl: 'https://images.unsplash.com/photo-1605870445919-838d190e8e1b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
    tier: 'Diamond',
    localId: 'RFA-999',
    currency: 'USD',
  },
];

const today = new Date();
const MOCK_STRUCTURE = [
  { level: 1, smallBlind: 100, bigBlind: 100, ante: 100, duration: 20 },
  { level: 2, smallBlind: 100, bigBlind: 200, ante: 200, duration: 20 },
  { level: 3, smallBlind: 200, bigBlind: 300, ante: 300, duration: 20 },
  { level: 4, smallBlind: 200, bigBlind: 400, ante: 400, duration: 20 },
];

export const SEED_TOURNAMENTS: Tournament[] = [
  {
    id: 't-1',
    clubId: 'c-1',
    name: '每日深籌賽',
    description: '我們的招牌每日賽事。',
    buyIn: 3000,
    fee: 400,
    startingChips: 20000,
    startTime: new Date(today.setHours(today.getHours() + 1)).toISOString(), 
    reservedCount: 0,
    maxCap: 60,
    isLateRegEnded: false,
    structure: MOCK_STRUCTURE,
  },
  {
    id: 't-2',
    clubId: 'c-1',
    name: '豪客賽',
    description: '專為高額玩家打造。',
    buyIn: 10000,
    fee: 1000,
    startingChips: 50000,
    startTime: new Date(today.setHours(today.getHours() + 4)).toISOString(),
    reservedCount: 0,
    maxCap: 20,
    isLateRegEnded: false,
    structure: MOCK_STRUCTURE,
  },
  {
    id: 't-3',
    clubId: 'c-2', // Different Club
    name: '快速獵人賽',
    description: '快節奏賽事。',
    buyIn: 2000,
    fee: 300,
    startingChips: 15000,
    startTime: new Date(today.setHours(today.getHours() - 2)).toISOString(), 
    reservedCount: 0,
    maxCap: 60,
    isLateRegEnded: true,
    structure: MOCK_STRUCTURE,
  },
];

export const GAME_HISTORY: GameRecord[] = [
  {
    id: 'g-1',
    userId: 'u-1',
    date: '2023-10-01T20:00:00Z',
    gameName: '每日深籌賽',
    profit: 5400
  },
  {
    id: 'g-2',
    userId: 'u-1',
    date: '2023-10-05T19:00:00Z',
    gameName: '豪客賽',
    profit: -10000
  },
  {
    id: 'g-3',
    userId: 'u-1',
    date: '2023-10-10T20:00:00Z',
    gameName: '快速獵人賽',
    profit: 3200
  },
  {
    id: 'g-4',
    userId: 'u-1',
    date: '2023-10-15T22:00:00Z',
    gameName: '常規桌 NLH 50/100',
    profit: 12500
  }
];