# HyperPoker

<div align="center">
  <h3>德州撲克俱樂部管理系統</h3>
  <p>Mobile-First Web Application for Poker Players</p>
</div>

## 專案簡介

HyperPoker 是一個針對德州撲克玩家設計的移動端優先 (Mobile-First) Web 應用程式。提供玩家管理俱樂部會籍、報名賽事、查看戰績以及個人身份驗證功能。

## 技術架構

- **前端框架**: React 19+ with TypeScript
- **建置工具**: Vite
- **樣式系統**: Tailwind CSS
- **後端服務**: Supabase (PostgreSQL 資料庫)
- **路由管理**: React Router DOM v7
- **圖表庫**: Recharts
- **圖示庫**: Lucide React
- **部署平台**: Vercel

## 主要功能

### 1. 會員系統
- 帳號/密碼註冊與登入
- 個人資料管理（一般資料與敏感資料分離）
- KYC 身份驗證流程
- 訪客模式瀏覽

### 2. 俱樂部系統
- 俱樂部列表瀏覽
- 申請加入俱樂部
- 會籍狀態管理（審核中、已激活、需驗證身份、停權）
- 會員卡片顯示（數位會員卡、積分、財務資訊）
- 附近協會地圖功能

### 3. 賽事系統
- 賽事列表瀏覽（支援日期篩選、金額篩選）
- 賽事詳情查看（盲注結構、參賽名單、已繳費名單）
- 賽事預約與報名
- 候補名單管理
- 賽事狀態標籤（報名中、已截買、已結束）

### 4. 個人檔案
- 一般設定（暱稱、手機號碼、性別）
- 敏感資料設定（姓名、身分證、生日、證件照片）
- 會員卡管理（多個俱樂部會籍）
- 交易記錄查看（存款、提款）
- 積分系統（6points 點數、活動積分）

### 5. 歷史戰績
- 進行中/已報名賽事列表
- 歷史戰績記錄
- 數據統計與視覺化

## 快速開始

### 環境需求

- Node.js 18+
- npm 或 yarn

### 安裝步驟

1. **克隆專案**
   ```bash
   git clone <repository-url>
   cd hyperpoker
   ```

2. **安裝依賴**
   ```bash
   npm install
   ```

3. **設定環境變數**
   
   創建 `.env.local` 檔案：
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_KEY=your_supabase_anon_key
   ```

4. **啟動開發伺服器**
   ```bash
   npm run dev
   ```

5. **建置生產版本**
   ```bash
   npm run build
   ```

## 專案結構

```
hyperpoker/
├── components/          # React 元件
│   ├── ui/            # 可重用 UI 元件
│   └── views/         # 頁面級元件
├── contexts/          # React Context
├── services/          # API 服務層
├── lib/               # 工具函數
├── types.ts           # TypeScript 類型定義
├── theme.ts           # 主題配置
├── constants.ts       # 常數定義
└── supabase.ts        # Supabase 類型定義
```

## 設計規範

### 主題系統
- **深色模式優先**: 專為撲克俱樂部暗環境設計
- **品牌色**: 綠色 `#06C167` (brand-green)
- **背景色**: 黑色 `#000000` (brand-black)
- **卡片背景**: 深灰色 `#171717` (brand-dark)
- **統一主題**: 所有顏色定義於 `theme.ts` 的 `THEME` 物件

### 標籤排列順序
所有賽事卡片統一使用以下標籤順序：
1. **狀態標籤**: 報名中 / 已截買 / 已結束
2. **預約標籤**（如果有）: 已預約 / 已付款
3. **類型標籤**: 錦標賽 / 限時錦標賽 / 豪克系列賽等

### 時間顯示格式
- **日期格式**: 月/日（例如：2/2）
- **時間格式**: 時:分（例如：21:14）
- **顯示位置**: 卡片右上角，垂直排列

## 資料來源

### Supabase 資料庫
- **會員資料**: `member` 表
- **俱樂部資料**: `club` 表
- **會籍資料**: `club_member` 表
- **賽事資料**: `tournament_waitlist` 表
- **預約資料**: `reservation` 表
- **交易記錄**: `transactions` 表

### Mock 資料
- 當 Supabase 不可用時，自動切換至 LocalStorage Mock API
- Mock 資料用於開發測試，不作為生產資料來源

## 路由結構

- `/` - 首頁（俱樂部列表）
- `/login` - 登入頁面
- `/club/:clubId` - 俱樂部賽事列表
- `/profile` - 個人檔案
- `/stats` - 歷史戰績

## 開發規範

### 程式碼風格
- 使用 TypeScript 嚴格模式
- 所有資料使用 TypeScript interfaces 定義
- 遵循現有的程式碼模式與命名慣例

### 元件開發
- 使用 React Hooks 進行狀態管理
- 所有 API 呼叫透過 `services/mockApi.ts`
- 使用 `THEME` 物件確保樣式一致性
- 使用 `cn()` 工具函數進行條件式 class 合併

### 錯誤處理
- 使用 `AlertContext` 顯示用戶友好的錯誤訊息
- Supabase 查詢失敗時自動降級至 Mock API

## 部署

### Vercel 部署
1. 連接 GitHub 倉庫至 Vercel
2. 設定環境變數（`VITE_SUPABASE_URL`, `VITE_SUPABASE_KEY`）
3. 推送至 `main` 分支自動觸發部署

## 相關文件

- [產品規格書](./SPECIFICATION.md) - 完整的產品規格與技術細節
- [Supabase 設定指南](./SUPABASE_SETUP.md) - Supabase 資料庫設定說明
- [賽事資料映射](./TOURNAMENT_SUPABASE_MAPPING.md) - Tournament 類型與 Supabase 欄位映射

## 授權

Private Project

---

**最後更新**: 2024
**版本**: 2.0 (Supabase 整合版本)
