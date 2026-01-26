# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

HyperPoker is a mobile-first React web application for Texas Hold'em poker players. It manages club memberships, tournament registrations, player statistics, and identity verification. The app uses a mock API with localStorage for data persistence during development.

## Build & Development Commands

```bash
# Install dependencies
npm install

# Run development server (http://localhost:3000)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Tech Stack

- **Framework**: React 19 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS (via CDN, configured in index.html)
- **State Management**: React Context API (AlertContext)
- **Data Layer**: Mock API service with localStorage
- **External SDKs**: LINE LIFF SDK (for potential LINE integration)

## Architecture

### Component Structure

- `App.tsx` - Root component with view routing and bottom navigation
- `components/ui/` - Reusable UI primitives (Button, Card, Input, Modal, AlertDialog, etc.)
- `components/views/` - Page-level components (LoginView, HomeView, TournamentView, ProfileView, StatsView)
- `contexts/` - React contexts (AlertProvider for custom alerts)
- `services/mockApi.ts` - Mock backend service using localStorage
- `types.ts` - All TypeScript interfaces
- `constants.ts` - Seed data for clubs and tournaments

### Data Flow

1. **Mock API Service**: `services/mockApi.ts` simulates backend operations with localStorage
   - Auto-initializes seed data on first load
   - Seeds a test user: `player1` / `password`
   - Implements async delays to simulate network latency

2. **State Management**:
   - App-level state managed via React hooks in `App.tsx`
   - Global alert system via `AlertContext` (replaces native alerts)
   - No Redux despite presence in package.json

3. **View Routing**: Manual view state management in `App.tsx` via `ViewState` type
   - Views: `login`, `home`, `tournaments`, `profile`, `my-games`
   - No router library used

### Key Business Logic

#### Membership Status System (`Wallet.status`)

| Status | Code | Behavior |
|--------|------|----------|
| Active | `active` | Full access to all features |
| Pending | `pending` | Cannot register for tournaments; needs in-person verification at club counter |
| Applying | `applying` | Application under review; limited access |
| Banned | `banned` | No access |

**Critical Rule**: When a user modifies sensitive data (name, nationalId, birthday, KYC), ALL their club memberships reset to `pending` status. This forces re-verification at each club counter.

#### Tournament Registration Flow

1. **Reserve**: No payment, just holds a spot (status: `reserved`)
2. **Buy-in**: Deducts balance from club wallet (status: `paid`)
3. **Cancel**:
   - Reserved registrations can be cancelled freely
   - **Paid registrations CANNOT be cancelled via app** (must contact club counter)
4. **Waitlist**: If tournament is at capacity, users can still reserve (join waitlist)

#### Data Persistence Keys

All data stored in localStorage with prefix `hp_`:
- `hp_users` - User accounts
- `hp_wallets` - Club memberships and balances
- `hp_tournaments` - Tournament data
- `hp_registrations` - Registration records
- `hp_current_user` - Session user ID
- `hp_clubs` - Club metadata

### Alert System

The app uses a custom AlertDialog component (NOT native browser alerts). Access via `useAlert()` hook:

```tsx
const { showAlert, showConfirm, showPrompt } = useAlert();

await showAlert('Title', 'Message');
const confirmed = await showConfirm('Title', 'Are you sure?');
const input = await showPrompt('Title', 'Enter value:');
```

All alert types return Promises and are styled to match the dark/gold casino theme.

### Styling Conventions

- **Theme**: Dark mode with amber/gold accent (casino aesthetic)
- **Colors**: Defined in tailwind.config within index.html
  - Background: `#0a0a0a`, Surface: `#171717`
  - Primary: `#d97706` (amber-600)
  - Danger: `#ef4444`, Text: `#fafafa`
- **Typography**: Inter (sans-serif), Playfair Display (display font)
- **Effects**: Gold glow effects via `.glow-text` and `.glow-border` classes

## Important Files

- `SPECIFICATION.md` - Detailed Chinese product specification covering all business rules
- `types.ts` - All TypeScript interfaces and type definitions
- `constants.ts` - Seed data for clubs, tournaments, and game history
- `vite.config.ts` - Path alias `@/` points to project root
- `index.html` - Tailwind config, fonts, and LINE LIFF SDK

## Development Notes

- The app is designed for mobile-first viewing (max-width: 28rem/448px container)
- Test credentials: username `player1`, password `password`
- Mock auto-approval: Club applications auto-approve after 8 seconds
- OTP verification mock code: `1234`
- All UI text is in Traditional Chinese (Taiwan)
- Bottom navigation is only visible when user is logged in
- The app expects `GEMINI_API_KEY` in `.env.local` but currently doesn't use Gemini API (legacy from template)

## Path Alias

The `@/` alias resolves to the project root directory:
```typescript
import { User } from '@/types';
import { mockApi } from '@/services/mockApi';
```
