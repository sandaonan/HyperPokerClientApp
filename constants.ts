
import { Club, Tournament, GameRecord, NearbyClub } from './types';

export const LINE_LIFF_ID = 'YOUR_LIFF_ID_HERE'; 

// Static Definitions for Clubs (Metadata only)
export const SEED_CLUBS: Club[] = [
  {
    id: 'c-1',
    name: 'Hyper 協會',
    description: '台北市最頂級的德州撲克競技協會，致力於提供國際級的賽事體驗。我們擁有最專業的發牌團隊、最舒適的賽事環境以及最公正的賽事規則。\n\n每日舉辦多場高額保證賽事，並定期舉辦年度大賽。場館內設有豪華休息區、專業餐飲服務，讓您在激烈的腦力激盪後能獲得充分的放鬆。無論您是職業選手還是休閒玩家，Hyper 協會都是您展現牌技的最佳舞台。歡迎隨時蒞臨挑戰！',
    bannerUrl: 'https://placehold.co/1000x400/450a0a/fbbf24?text=HYPER+POKER+CLUB&font=playfair-display', 
    tier: 'Platinum',
    localId: 'Hyper-888',
    currency: 'USD',
    feedbackUrl: 'https://forms.gle/placeholder_feedback_form',
    latitude: 25.033964, // Near Taipei 101
    longitude: 121.564472,
  },
  {
    id: 'c-2',
    name: 'Ace High 台北',
    description: 'Ace High 專注於推廣健康撲克運動，打造一個新手友善且充滿活力的競技社群。我們特別設立了新手教學桌，由專業教練手把手指導，讓您快速掌握德州撲克的精髓。\n\n每週五舉辦的「狂歡夜」更是吸引無數玩家共襄盛舉，現場氣氛熱烈，是結交牌友的最佳場所。(已驗證協會)',
    bannerUrl: 'https://images.unsplash.com/photo-1544552866-d3ed42536cfd?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
    tier: 'Emerald',
    localId: 'AH-007',
    currency: 'USD',
    feedbackUrl: 'https://forms.gle/placeholder_feedback_form',
    latitude: 25.042250, // Near Zhongxiao Dunhua
    longitude: 121.551300,
  },
  {
    id: 'c-3',
    name: '皇家同花順競技場',
    description: '全台最大規模賽事場地，擁有超過 30 張專業比賽桌，可同時容納數百名玩家同場競技。我們定期承辦大型國際巡迴賽事，是台灣撲克通往世界的橋樑。\n\n場館位於交通便利的市中心，周邊機能完善。加入我們，體驗最刺激的大型錦標賽氛圍！',
    bannerUrl: 'https://images.unsplash.com/photo-1605870445919-838d190e8e1b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
    tier: 'Diamond',
    localId: 'RFA-999',
    currency: 'USD',
    latitude: 25.047800, // Near Taipei Main Station
    longitude: 121.517100,
  },
];

export const NEARBY_CLUBS_DATA: NearbyClub[] = [
    {
        place_id: "ChIJFaPehP-rQjQR9qha-trFLtc",
        name: "City Poker 德州撲克競技協會 南京店",
        address: "南京東路五段19-10號11F",
        formatted_address: "105台灣台北市松山區南京東路五段19-10號11F",
        rating: 5,
        latitude: 25.051841,
        longitude: 121.55792,
        vicinity: "松山區",
        openNow: true,
        google_maps_url: "https://maps.google.com/?cid=15937494323223013366",
        website: "https://www.facebook.com/CityPokerNJ",
        opening_hours: [
            "星期一: 14:00 – 06:00",
            "星期二: 14:00 – 06:00",
            "星期三: 14:00 – 06:00",
            "星期四: 14:00 – 06:00",
            "星期五: 14:00 – 06:00",
            "星期六: 14:00 – 06:00",
            "星期日: 14:00 – 06:00"
        ]
    },
    {
        place_id: "ChIJefJa7QarQjQRFBO9lbcj__I",
        name: "台灣華人德州撲克競技協會",
        address: "建國北路一段80號B1樓",
        formatted_address: "10491台灣台北市中山區建國北路一段80號B1樓",
        rating: 3.9,
        latitude: 25.0495031,
        longitude: 121.5362797,
        vicinity: "中山區",
        openNow: true,
        google_maps_url: "https://maps.google.com/?cid=17437701764121596692",
        website: "https://ctpclub.com/",
        opening_hours: [
            "星期一: 24 小時營業",
            "星期二: 24 小時營業",
            "星期三: 24 小時營業",
            "星期四: 24 小時營業",
            "星期五: 24 小時營業",
            "星期六: 24 小時營業",
            "星期日: 24 小時營業"
        ]
    },
    {
        place_id: "ChIJFUhhGOirQjQRt71DYGjdh5M",
        name: "Ace8 - Poker 國際撲克競技協會",
        address: "南京東路四段11號3 樓",
        formatted_address: "105台灣台北市松山區南京東路四段11號3樓",
        rating: 4.4,
        latitude: 25.0520064,
        longitude: 121.5498153,
        vicinity: "松山區",
        openNow: true,
        google_maps_url: "https://maps.google.com/?cid=10630448777123954039",
        website: "https://www.facebook.com/Ace8Poker",
        opening_hours: [
            "星期一: 15:00 – 07:00",
            "星期二: 15:00 – 07:00",
            "星期三: 15:00 – 07:00",
            "星期四: 15:00 – 07:00",
            "星期五: 15:00 – 07:00",
            "星期六: 14:00 – 07:00",
            "星期日: 14:00 – 07:00"
        ]
    },
    {
        place_id: "ChIJRV8rYsupQjQR8_RF-KKmgA8",
        name: "Poker Face 德州撲克協會永和店",
        address: "中正路399號",
        formatted_address: "234台灣新北市永和區中正路399號",
        rating: 5,
        latitude: 25.0041795,
        longitude: 121.5171489,
        vicinity: "永和區",
        openNow: true,
        google_maps_url: "https://maps.google.com/?cid=1119567936603013063",
        website: "https://www.facebook.com/PokerFaceYonghe",
        opening_hours: [
            "星期一: 13:00 – 05:00",
            "星期二: 13:00 – 05:00",
            "星期三: 13:00 – 05:00",
            "星期四: 13:00 – 05:00",
            "星期五: 13:00 – 06:00",
            "星期六: 13:00 – 06:00",
            "星期日: 13:00 – 05:00"
        ]
    },
    {
        place_id: "ChIJR0ZL08QDaDQROZUiq0tEDY8",
        name: "XD Poker新店德州撲克競技協會",
        address: "中正路504號2樓",
        formatted_address: "231台灣新北市新店區中正路504號2樓",
        rating: 4.4,
        latitude: 24.9825767,
        longitude: 121.5339004,
        vicinity: "新店區",
        openNow: true,
        google_maps_url: "https://maps.google.com/?cid=10305886980630713657",
        website: "https://www.facebook.com/XDPokerClub",
        opening_hours: [
            "星期一: 14:00 – 02:00",
            "星期二: 14:00 – 02:00",
            "星期三: 14:00 – 02:00",
            "星期四: 14:00 – 02:00",
            "星期五: 14:00 – 04:00",
            "星期六: 14:00 – 04:00",
            "星期日: 14:00 – 02:00"
        ]
    },
    {
        place_id: "ChIJT1SvRACpQjQRGyqd16ly8N0",
        name: "City Poker德州撲克 中和店",
        address: "民享街4號",
        formatted_address: "235台灣新北市中和區民享街4號",
        rating: 3.3,
        latitude: 25.0054157,
        longitude: 121.4738877,
        vicinity: "中和區",
        openNow: true,
        google_maps_url: "https://maps.google.com/?cid=15993883398905387547",
        website: "https://www.facebook.com/CityPokerZH",
        opening_hours: [
            "星期一: 15:00 – 03:00",
            "星期二: 15:00 – 03:00",
            "星期三: 15:00 – 03:00",
            "星期四: 15:00 – 03:00",
            "星期五: 15:00 – 05:00",
            "星期六: 15:00 – 05:00",
            "星期日: 15:00 – 03:00"
        ]
    }
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

const COMMON_RULES = `1.比賽最後30分鐘不得參賽。
2.每次報名為相同起始計分牌。
3.開賽後不得移除任意計分牌，需使用至當前比賽結束止。
4.參賽者不得將計分牌攜帶離開牌桌。
5.嚴禁參賽者自行將計分牌拿回櫃檯領取獎勵。
6.比賽結束後，參賽者須等待記分員與裁判進行計分牌分數確認，依照計分牌數量進行排名，並依照比賽名次發放獎金。
7.Nice hand德州撲克俱樂部將保留所有賽事最終解釋權。
8.中途退賽或判定失格將移除計分牌，不退回參賽費用。
9.每個報名依報名的比賽分別提撥獎金，作為前三名獎勵，分別額外獲得50%、30%、20%的額外獎勵(總獎池提撥)`;

export const SEED_TOURNAMENTS: Tournament[] = [
  // --- CLUB 1: HYPER (Scenarios) ---
  {
    id: 't-1',
    clubId: 'c-1',
    name: '每日深籌賽',
    description: '我們的招牌每日賽事。(正常開放情境)',
    type: '錦標賽',
    promotionNote: `🔥 早鳥優惠：開賽前完成報名，加贈 2,000 籌碼！\n${COMMON_RULES}`,
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
    id: 't-demo-1',
    clubId: 'c-1',
    name: '新秀練習賽',
    description: '專為新手設計，體驗實戰氛圍。(測試: 可預約 Demo)',
    type: '衛星賽',
    promotionNote: `前三名可獲得週賽門票一張。\n${COMMON_RULES}`,
    buyIn: 1000,
    fee: 100,
    startingChips: 10000,
    startTime: new Date(new Date().setHours(new Date().getHours() + 2)).toISOString(),
    reservedCount: 5,
    maxCap: 40,
    isLateRegEnded: false,
    lateRegLevel: 4,
    structure: MOCK_STRUCTURE,
  },
  {
    id: 't-2',
    clubId: 'c-1',
    name: '豪客賽',
    description: '專為高額玩家打造。(測試超額紅色顯示)',
    type: '錦標賽',
    promotionNote: `包含自助餐點與無限暢飲。\n${COMMON_RULES}`,
    buyIn: 10000,
    fee: 1000,
    startingChips: 50000,
    startTime: new Date(new Date().setHours(new Date().getHours() + 4)).toISOString(),
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
    promotionNote: `每淘汰一人可獲得 $500 賞金。\n${COMMON_RULES}`,
    buyIn: 2000,
    fee: 300,
    startingChips: 15000,
    startTime: new Date(new Date().setHours(new Date().getHours() - 2)).toISOString(), // Started ago
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
    promotionNote: COMMON_RULES,
    buyIn: 1000,
    fee: 100,
    startingChips: 10000,
    startTime: new Date(new Date().setDate(new Date().getDate() - 1)).toISOString(), // Yesterday
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
    promotionNote: `現場提供免費啤酒。\n${COMMON_RULES}`,
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
    id: 't-demo-2',
    clubId: 'c-2',
    name: '平日積分賽',
    description: '平日晚間固定賽事，累積積分換大獎。(測試: 可預約 Demo)',
    type: '錦標賽',
    promotionNote: COMMON_RULES,
    buyIn: 1500,
    fee: 200,
    startingChips: 20000,
    startTime: new Date(new Date().setHours(new Date().getHours() + 3, 30)).toISOString(), 
    reservedCount: 8,
    maxCap: 40,
    isLateRegEnded: false,
    lateRegLevel: 6,
    structure: MOCK_STRUCTURE,
  },
  {
    id: 't-2-2',
    clubId: 'c-2',
    name: '菁英單挑賽',
    description: '極限單挑，名額有限。(測試: 候補名單功能)',
    type: '錦標賽',
    promotionNote: COMMON_RULES,
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
    promotionNote: COMMON_RULES,
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
    promotionNote: COMMON_RULES,
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
    clubName: 'Hyper 協會',
    buyIn: 3000,
    entryCount: 1,
    seatNumber: 5,
    profit: 5400,
    type: '錦標賽',
    points: 50
  },
  {
    id: 'g-2',
    userId: 'u-1',
    date: '2023-10-05T19:00:00Z',
    gameName: '豪客賽',
    clubName: 'Hyper 協會',
    buyIn: 10000,
    entryCount: 2, // Re-entered once
    seatNumber: 8,
    profit: -20000, // Total loss (10000 * 2)
    type: '錦標賽',
    points: 10
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
    type: '賞金賽',
    points: 35
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
    type: '限時錦標賽',
    points: 120
  }
];
