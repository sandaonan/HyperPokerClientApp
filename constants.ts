
import { Club, Tournament, GameRecord } from './types';

export const LINE_LIFF_ID = 'YOUR_LIFF_ID_HERE'; 

// Static Definitions for Clubs (Metadata only)
export const SEED_CLUBS: Club[] = [
  {
    id: 'c-1',
    name: 'Hyper 俱樂部',
    description: '台北市最頂級的德州撲克競技協會。每週舉辦多場高額賽事。',
    bannerUrl: 'https://placehold.co/1000x400/450a0a/fbbf24?text=HYPER+POKER+CLUB&font=playfair-display', 
    tier: 'Platinum',
    localId: 'Hyper-888',
    currency: 'USD',
    feedbackUrl: 'https://forms.gle/placeholder_feedback_form',
  },
  {
    id: 'c-2',
    name: 'Ace High 台北',
    description: '專注於推廣健康撲克運動。新手友善。(已驗證俱樂部)',
    bannerUrl: 'https://images.unsplash.com/photo-1544552866-d3ed42536cfd?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
    tier: 'Emerald',
    localId: 'AH-007',
    currency: 'USD',
    feedbackUrl: 'https://forms.gle/placeholder_feedback_form',
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
  { level: 5, smallBlind: 300, bigBlind: 600, ante: 600, duration: 20 },
  { level: 6, smallBlind: 400, bigBlind: 800, ante: 800, duration: 20 },
  { level: 7, smallBlind: 500, bigBlind: 1000, ante: 1000, duration: 20 },
  { level: 8, smallBlind: 600, bigBlind: 1200, ante: 1200, duration: 20 },
];

export const SEED_TOURNAMENTS: Tournament[] = [
  // --- CLUB 1: HYPER (Scenarios) ---
  {
    id: 't-1',
    clubId: 'c-1',
    name: '每日深籌賽',
    description: '我們的招牌每日賽事。(正常開放情境)',
    type: '錦標賽',
    promotionNote: '🔥 早鳥優惠：開賽前完成報名，加贈 2,000 籌碼！\n💎 翡翠會員以上免服務費。',
    buyIn: 3000,
    fee: 400,
    startingChips: 20000,
    startTime: new Date(today.setHours(today.getHours() + 1)).toISOString(), 
    reservedCount: 15,
    maxCap: 60,
    isLateRegEnded: false,
    lateRegLevel: 6,
    structure: MOCK_STRUCTURE,
    clockUrl: 'https://www.youtube.com/watch?v=placeholder',
  },
  {
    id: 't-2',
    clubId: 'c-1',
    name: '豪客賽',
    description: '專為高額玩家打造。(測試超額紅色顯示)',
    type: '錦標賽',
    promotionNote: '包含自助餐點與無限暢飲。',
    buyIn: 10000,
    fee: 1000,
    startingChips: 50000,
    startTime: new Date(today.setHours(today.getHours() + 4)).toISOString(),
    reservedCount: 22, // Over cap
    maxCap: 20,
    isLateRegEnded: false,
    lateRegLevel: 8,
    structure: MOCK_STRUCTURE,
    clockUrl: 'https://www.youtube.com/watch?v=placeholder',
  },
  {
    id: 't-3',
    clubId: 'c-1',
    name: '快速獵人賽',
    description: '快節奏賽事。(測試截止報名情境)',
    type: '賞金賽',
    promotionNote: '每淘汰一人可獲得 $500 賞金。',
    buyIn: 2000,
    fee: 300,
    startingChips: 15000,
    startTime: new Date(today.setHours(today.getHours() - 2)).toISOString(), // Started ago
    reservedCount: 45,
    maxCap: 60,
    isLateRegEnded: true, // CLOSED
    lateRegLevel: 4,
    structure: MOCK_STRUCTURE,
  },
  {
    id: 't-4',
    clubId: 'c-1',
    name: '昨日回顧賽',
    description: '昨天的比賽。(測試歷史回顧)',
    type: '限時錦標賽',
    promotionNote: '',
    buyIn: 1000,
    fee: 100,
    startingChips: 10000,
    startTime: new Date(today.setDate(today.getDate() - 1)).toISOString(), // Yesterday
    reservedCount: 50,
    maxCap: 60,
    isLateRegEnded: true,
    lateRegLevel: 4,
    structure: MOCK_STRUCTURE,
  },

  // --- CLUB 2: ACE HIGH (Fully Active Scenarios) ---
  {
    id: 't-2-1',
    clubId: 'c-2',
    name: '週五狂歡夜',
    description: 'Ace High 最受歡迎的賽事，適合所有玩家。(測試: 正常預約/報名)',
    type: '錦標賽',
    promotionNote: '現場提供免費啤酒。',
    buyIn: 2000,
    fee: 200,
    startingChips: 15000,
    startTime: new Date(new Date().setHours(new Date().getHours() + 2)).toISOString(), 
    reservedCount: 10,
    maxCap: 50,
    isLateRegEnded: false,
    lateRegLevel: 6,
    structure: MOCK_STRUCTURE,
    clockUrl: 'https://www.youtube.com/watch?v=placeholder',
  },
  {
    id: 't-2-2',
    clubId: 'c-2',
    name: '菁英單挑賽',
    description: '極限單挑，名額有限。(測試: 候補名單功能)',
    type: '錦標賽',
    promotionNote: '',
    buyIn: 5000,
    fee: 500,
    startingChips: 30000,
    startTime: new Date(new Date().setHours(new Date().getHours() + 3)).toISOString(),
    reservedCount: 12, // Over Cap of 10
    maxCap: 10,
    isLateRegEnded: false,
    lateRegLevel: 4,
    structure: MOCK_STRUCTURE,
    clockUrl: 'https://www.youtube.com/watch?v=placeholder',
  },
  {
    id: 't-2-3',
    clubId: 'c-2',
    name: '下午茶休閒賽',
    description: '輕鬆打，累積積分。(測試: 已截止報名)',
    type: '衛星賽',
    promotionNote: '',
    buyIn: 500,
    fee: 50,
    startingChips: 5000,
    startTime: new Date(new Date().setHours(new Date().getHours() - 1)).toISOString(),
    reservedCount: 30,
    maxCap: 40,
    isLateRegEnded: true, // Closed
    lateRegLevel: 4,
    structure: MOCK_STRUCTURE,
  },
  {
    id: 't-2-4',
    clubId: 'c-2',
    name: '上週冠軍賽',
    description: '回顧上週精彩賽事。(測試: 歷史賽事)',
    type: '錦標賽',
    promotionNote: '',
    buyIn: 6000,
    fee: 600,
    startingChips: 25000,
    startTime: new Date(new Date().setDate(new Date().getDate() - 7)).toISOString(),
    reservedCount: 45,
    maxCap: 60,
    isLateRegEnded: true,
    lateRegLevel: 8,
    structure: MOCK_STRUCTURE,
  },
];

export const GAME_HISTORY: GameRecord[] = [
  {
    id: 'g-1',
    userId: 'u-1',
    date: '2023-10-01T20:00:00Z',
    gameName: '每日深籌賽',
    clubName: 'Hyper 俱樂部',
    buyIn: 3000,
    entryCount: 1,
    seatNumber: 5,
    profit: 5400,
    type: '錦標賽'
  },
  {
    id: 'g-2',
    userId: 'u-1',
    date: '2023-10-05T19:00:00Z',
    gameName: '豪客賽',
    clubName: 'Hyper 俱樂部',
    buyIn: 10000,
    entryCount: 2, // Re-entered once
    seatNumber: 8,
    profit: -20000, // Total loss (10000 * 2)
    type: '錦標賽'
  },
  {
    id: 'g-3',
    userId: 'u-1',
    date: '2023-10-10T20:00:00Z',
    gameName: '快速獵人賽',
    clubName: 'Ace High 台北',
    buyIn: 2000,
    entryCount: 1,
    seatNumber: 2,
    profit: 3200,
    type: '賞金賽'
  },
  {
    id: 'g-4',
    userId: 'u-1',
    date: '2023-10-15T22:00:00Z',
    gameName: '週末狂歡限時賽',
    clubName: '皇家同花順競技場',
    buyIn: 5000,
    entryCount: 1,
    seatNumber: 6,
    profit: 12500,
    type: '限時錦標賽'
  }
];
