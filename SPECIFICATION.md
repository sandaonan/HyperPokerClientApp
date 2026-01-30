# HyperPoker 產品規格書 (Product Specification)

## 1. 系統概述
HyperPoker 是一個針對德州撲克玩家設計的移動端優先 (Mobile-First) Web 應用程式。提供玩家管理俱樂部會籍、報名賽事、查看戰績以及個人身份驗證功能。

**技術架構**:
- **前端**: React + TypeScript + Vite + Tailwind CSS
- **後端**: Supabase (PostgreSQL 資料庫)
- **部署**: Vercel (GitHub 整合)
- **狀態管理**: React Hooks + LocalStorage (Mock 資料備援)

## 2. 會員系統 (User System)

### 2.1 身份驗證與註冊
- **註冊方式**: 帳號/密碼註冊，密碼使用 SHA-256 雜湊存儲於 Supabase `member` 表
- **登入方式**: 帳號/密碼驗證，支援 Supabase 資料庫驗證
- **訪客模式**: 未登入用戶可瀏覽俱樂部和賽事資訊，但無法進行預約或報名操作

### 2.2 個人資料管理 (Profile & Identity)

#### 2.2.1 一般資料 (Non-Sensitive Data)
- **欄位**: 暱稱 (`nickname`)、手機號碼 (`mobile`)、性別 (`gender`)
- **性別選項**: 男 (`male`)、女 (`female`)、傾向不透露 (`other`)
- **修改規則**: 修改一般資料**不影響**會籍狀態，可直接更新
- **手機號碼**: 已移除 OTP 驗證流程，可直接編輯並點擊「更新」按鈕保存

#### 2.2.2 敏感資料 (Sensitive Data)
- **欄位**: 真實姓名 (`full_name`)、身分證字號 (`id_number`)、生日 (`date_of_birth`)、證件照片 (`id_url` / KYC)
- **邏輯規則**:
  1. 用戶註冊時不需要立即填寫敏感資料
  2. **觸發驗證重置**: 若用戶修改「敏感資料」（姓名、身分證、生日），系統將：
     - 強制將該用戶在**所有**已加入俱樂部的 `kyc_status` 重置為 `unverified`
     - 顯示確認對話框，提醒用戶需重新至櫃檯完成真人核對
  3. 用戶需至俱樂部櫃檯進行真人核對，由櫃檯人員（後台）將 `kyc_status` 改回 `verified`

### 2.3 資料同步機制
- **優先順序**: Supabase 資料庫 > LocalStorage (Mock 資料)
- **Fallback**: 當 Supabase 不可用時，自動切換至 LocalStorage Mock API
- **資料映射**: 前端 `User` 類型與 Supabase `member` 表自動映射

## 3. 俱樂部系統 (Club System)

### 3.1 俱樂部資料來源
- **Supabase 俱樂部**: 從 `club` 表獲取，狀態為 `activated` 的俱樂部
- **Mock 俱樂部**: 本地 `SEED_CLUBS` 定義的測試俱樂部（ID 格式: `c-1`, `c-2`, `c-3`）
- **合併邏輯**: Supabase 俱樂部優先，若 ID 重疊則 Supabase 資料覆蓋 Mock 資料

### 3.2 會籍狀態系統 (Membership Status System)

#### 3.2.1 資料庫狀態 (Database Status)
會籍資料存儲於 Supabase `club_member` 表，包含兩個關鍵狀態欄位：

| 欄位 | 類型 | 可能值 | 說明 |
| :--- | :--- | :--- | :--- |
| `member_status` | Enum | `pending_approval`, `activated`, `deactivated` | 會員審核狀態 |
| `kyc_status` | Enum | `verified`, `unverified` | 身份驗證狀態 |

#### 3.2.2 前端顯示狀態 (Frontend Display Status)
前端 `Wallet` 物件的 `status` 欄位映射如下：

| 前端狀態 | 代碼 | 資料庫條件 | 前端顯示標籤 | 行為限制 |
| :--- | :--- | :--- | :--- | :--- |
| **正常會員** | `active` | `member_status = activated`<br>`kyc_status = verified` | 無額外標籤 | ✅ 可預約、可報名、可檢視詳情 |
| **需驗證身份** | `active` | `member_status = activated`<br>`kyc_status = unverified` | 「需驗證身份」標籤 | ❌ **不可報名/預約**<br>進入俱樂部頁面顯示警告 |
| **申請審核中** | `applying` | `member_status = pending_approval` | 「申請審核中」標籤 | ❌ **不可報名/預約**<br>顯示「審核中」標籤 |
| **停權** | `banned` | `member_status = deactivated` | 「已停權」標籤 | ❌ 無法進行任何操作 |

#### 3.2.3 狀態轉換流程
1. **申請加入**: `member_status = pending_approval`, `kyc_status = unverified`
2. **後台審核通過**: `member_status = activated`, `kyc_status = unverified` (需櫃檯驗證)
3. **櫃檯驗證完成**: `member_status = activated`, `kyc_status = verified` (可正常使用)
4. **修改敏感資料**: 所有俱樂部的 `kyc_status` 重置為 `unverified`，需重新驗證

### 3.3 加入流程
1. **新用戶註冊**:
   - 註冊時**不會**自動加入任何俱樂部
   - 用戶需手動申請加入俱樂部
2. **申請新俱樂部**:
   - 用戶點擊「申請加入」
   - 系統創建 `club_member` 記錄，狀態為 `pending_approval`
   - **Supabase 俱樂部**: 需後台手動審核（無自動通過）
   - **Mock 俱樂部**: 8 秒後自動通過審核（僅用於測試）

### 3.4 會員專屬頁面 (Membership Card)
在個人檔案中點擊已加入的俱樂部，可開啟詳細會員卡片：
- **數位會員卡**: 顯示會員等級、專屬條碼 (供櫃檯掃描)
- **里程進度**: 顯示目前累積積分/Buy-in 與下一級別的門檻進度
- **財務資訊**: 顯示該俱樂部的儲值金餘額、歷史總獎金
- **反饋**: 提供跳轉至外部問卷/LINE 的連結

### 3.5 附近協會功能
- **地圖整合**: 使用 Leaflet.js 顯示附近協會位置
- **地點資訊**: 整合 Google Places API 資料（地址、評分、營業時間等）
- **導航功能**: 提供 Google Maps 導航連結

## 4. 賽事系統 (Tournament System)

### 4.1 報名資格驗證 (Registration Eligibility)
賽事預約/報名前，系統會檢查以下條件：

1. **會員狀態檢查** (`member_status`):
   - ✅ `member_status = activated` → 通過
   - ❌ `member_status = pending_approval` → 拒絕，提示「您的入會申請正在審核中，請稍候」
   - ❌ `member_status = deactivated` → 拒絕，提示「您已被該協會停權」

2. **身份驗證檢查** (`kyc_status`):
   - ✅ `kyc_status = verified` → 通過
   - ❌ `kyc_status = unverified` → 拒絕，提示「請至櫃檯完成身份驗證後方可報名」

3. **綜合判斷**:
   - 僅當 `member_status = activated` **且** `kyc_status = verified` 時，用戶才能預約/報名賽事

### 4.2 報名流程 (Registration Flow)
賽事詳情頁面根據用戶狀態顯示不同按鈕：

1. **未報名**:
   - **前提**: 賽事狀態必須為 `OPEN`（未截止報名）
   - **額滿處理**: 若人數已達上限，按鈕顯示「**加入候補 (Join Waitlist)**」。點擊後依然可以預約，但狀態標記為候補
   - 顯示按鈕: **「預約」** 或 **「加入候補」**
   - 行為: 點擊後不扣款，僅佔位。Modal **不關閉**，狀態更新為已預約

2. **已預約 (Reserved/Waitlisted)**:
   - 顯示按鈕 A: **「取消預約」** (點擊後取消席位/候補)
   - 顯示按鈕 B: **「確認報名」** (Buy-in)
   - 行為: 檢查俱樂部錢包餘額。若餘額充足，扣除 (Buy-in + Fee) 並將狀態改為 `paid`。若餘額不足，按鈕 Disable

3. **已付款 (Paid)**:
   - **App 端不可取消**: 一旦完成付款報名，用戶**無法**透過 App 自行取消或退款
   - 顯示提示: 顯示「已完成報名，如需異動請洽櫃檯」等提示字樣

### 4.3 賽事列表顯示
- **卡片資訊**: 需清晰顯示起始籌碼 (Starting Chips) 與目前盲注結構
- **參加人數**:
  - 顯示格式為 `目前人數 / 上限`
  - **超額顯示**: 若目前人數超過上限 (例如包含候補)，該文字需顯示為**紅色**以示區別
- **狀態標籤**:
  - `OPEN`: 開放報名 (包含延遲註冊期間)
  - `CLOSED`: 報名已完全截止 (無法預約)
  - **名稱**: 賽事名稱不應包含狀態文字 (如"已額滿")，純粹顯示名稱

### 4.4 賽事詳情與功能
- **賽事時鐘**: 若賽事進行中，提供連結開啟即時賽事時鐘 (Tournament Clock)
- **名單顯示**: 預約名單需區分 **「正選名單」** (名額內) 與 **「候補名單」** (名額外)，並標示候補順位

## 5. UI/UX 規範

### 5.1 設計風格
- **色調**: Dark Mode，背景色為 `#000000` (brand-black)
- **主色**: 品牌綠色 `#06C167` (brand-green)，用於主要按鈕和強調元素
- **卡片**: 深灰色背景 `#171717` (brand-dark)，邊框 `#333333` (brand-border)
- **文字**: 主要文字 `#FFFFFF` (brand-white)，次要文字 `#A3A3A3` (brand-gray)
- **元件**: 使用卡片式設計，強調層級

### 5.2 主題系統 (Theme System)
- **集中管理**: 所有顏色定義於 `theme.ts` 的 `THEME` 物件
- **Tailwind 配置**: 自訂顏色定義於 `tailwind.config.js`
- **一致性**: 所有 UI 元件統一使用 `THEME` 變數，確保樣式一致性

### 5.3 互動反饋 (Alerts)
- **全面替換原生 Alert**: 使用客製化的 `AlertDialog` 元件
- **類型**:
  - `alert`: 單純訊息提示
  - `confirm`: 雙按鈕確認 (如：取消預約確認、修改敏感資料警告)
  - `prompt`: 輸入框提示 (已移除，手機號碼直接編輯)

### 5.4 動態 UI 反饋
- **按鈕狀態**: 當暱稱或手機號碼被修改時，「更新」按鈕變為綠色，更新成功後恢復原色
- **載入狀態**: 使用 `Loader2` 圖示顯示載入中狀態
- **狀態標籤**: 使用脈衝動畫 (`animate-pulse`) 強調需要用戶注意的狀態

## 6. 資料結構摘要 (TypeScript Interfaces)

### 6.1 核心資料類型

#### User
```typescript
interface User {
  id: string;                    // 對應 Supabase member.id
  username: string;              // 登入帳號 (member.account)
  name?: string;                 // 真實姓名 (member.full_name)
  nationalId?: string;           // 身分證字號 (member.id_number)
  nickname?: string;              // 暱稱 (member.nick_name)
  mobile?: string;               // 手機號碼 (member.mobile_phone)
  birthday?: string;              // 生日 (member.date_of_birth)
  gender?: 'male' | 'female' | 'other'; // 性別 (member.gender)
  kycUploaded?: boolean;         // 是否上傳證件 (member.id_url)
  isProfileComplete: boolean;    // 是否完成資料填寫
}
```

#### Wallet (會籍)
```typescript
interface Wallet {
  userId: string;                // 用戶 ID
  clubId: string;                // 俱樂部 ID
  balance: number;               // 儲值金餘額 (club_member.balance)
  points: number;                // 積分
  joinDate: string;              // 加入日期 (club_member.joined_date)
  status: MembershipStatus;      // 前端狀態 (映射自 member_status)
  kycStatus?: 'verified' | 'unverified' | null; // KYC 狀態 (club_member.kyc_status)
}

type MembershipStatus = 'active' | 'pending' | 'banned' | 'applying';
```

#### Club
```typescript
interface Club {
  id: string;                    // 俱樂部 ID (club.id)
  name: string;                   // 名稱 (club.name)
  description?: string;           // 描述 (club.description)
  bannerUrl?: string;            // 橫幅圖片 (club.logo_url)
  tier: 'Platinum' | 'Emerald' | 'Diamond' | 'Gold' | 'Silver';
  localId: string;               // 本地識別碼
  currency: string;              // 貨幣
  latitude?: number;             // 緯度 (club.location)
  longitude?: number;            // 經度 (club.location)
  feedbackUrl?: string;          // 反饋連結
}
```

#### Tournament
```typescript
interface Tournament {
  id: string;
  clubId: string;                // 所屬俱樂部
  name: string;
  type: TournamentType;           // 賽事類型
  buyIn: number;                 // 報名費
  fee: number;                   // 手續費
  startingChips: number;         // 起始籌碼
  startTime: string;             // 開始時間 (ISO)
  reservedCount: number;         // 已預約人數
  maxCap: number;                // 最大人數
  isLateRegEnded: boolean;       // 是否已截止報名
  structure: BlindLevel[];       // 盲注結構
  clockUrl?: string;             // 賽事時鐘連結
}
```

#### Registration
```typescript
interface Registration {
  id: string;
  tournamentId: string;
  userId: string;
  status: 'reserved' | 'paid' | 'cancelled';
  timestamp: string;
}
```

### 6.2 Supabase 資料庫映射

#### member 表 → User
- `member.id` → `User.id`
- `member.account` → `User.username`
- `member.full_name` → `User.name`
- `member.id_number` → `User.nationalId`
- `member.nick_name` → `User.nickname`
- `member.mobile_phone` → `User.mobile`
- `member.date_of_birth` → `User.birthday`
- `member.gender` → `User.gender`
- `member.id_url` → `User.kycUploaded` (布林值)

#### club_member 表 → Wallet
- `club_member.member_id` → `Wallet.userId`
- `club_member.club_id` → `Wallet.clubId`
- `club_member.balance` → `Wallet.balance`
- `club_member.member_status` → `Wallet.status` (映射)
- `club_member.kyc_status` → `Wallet.kycStatus`
- `club_member.joined_date` → `Wallet.joinDate`

#### club 表 → Club
- `club.id` → `Club.id`
- `club.name` → `Club.name`
- `club.description` → `Club.description`
- `club.logo_url` → `Club.bannerUrl`
- `club.location` → `Club.latitude`, `Club.longitude` (解析)

## 7. 技術實作細節

### 7.1 環境變數
- `VITE_SUPABASE_URL`: Supabase 專案 URL
- `VITE_SUPABASE_KEY`: Supabase 匿名金鑰 (Anon Key)

### 7.2 服務層架構
- **`lib/supabaseClient.ts`**: Supabase 客戶端初始化
- **`services/supabaseAuth.ts`**: 用戶認證與資料管理
- **`services/supabaseClub.ts`**: 俱樂部資料獲取
- **`services/supabaseClubMember.ts`**: 會籍管理
- **`services/mockApi.ts`**: Mock API 服務（Supabase 備援）

### 7.3 資料同步策略
- **優先順序**: Supabase → LocalStorage (Mock)
- **錯誤處理**: Supabase 查詢失敗時自動降級至 Mock API
- **資料合併**: Supabase 俱樂部與 Mock 俱樂部合併顯示，Supabase 優先

### 7.4 密碼安全
- **雜湊演算法**: SHA-256 (Web Crypto API)
- **存儲方式**: 僅存儲雜湊值，不存儲明文密碼

## 8. 部署與維護

### 8.1 部署平台
- **平台**: Vercel
- **版本控制**: GitHub
- **自動部署**: GitHub 推送自動觸發 Vercel 部署

### 8.2 環境配置
- 生產環境需在 Vercel 設定環境變數
- 開發環境使用 `.env.local` 檔案（不提交至 Git）

### 8.3 資料備份
- Supabase 自動備份資料庫
- LocalStorage Mock 資料僅用於開發測試，不作為生產資料來源

---

**最後更新**: 2024 (根據當前實作狀態)
**版本**: 2.0 (Supabase 整合版本)
