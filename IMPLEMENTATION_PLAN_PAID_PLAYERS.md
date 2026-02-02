# Implementation Plan: Paid Players Display and Reservation Status

## Overview
This plan addresses two tasks from `todo.md`:
1. Update paid players display to show tournaments created from waitlist (using `from_waitlist_id`)
2. Improve reservation status display to prevent duplicate reservations

## Task 1: Paid Players Display from Tournament Table

### Current Implementation
- `TournamentDetailModal` shows paid players from `playerList` filtered by `status === 'paid'`
- For Supabase clubs, this comes from `getTournamentRegistrations()` which only shows reservations
- Need to query `tournament` table to find tournaments created from this waitlist

### Files to Create
- `services/supabaseTournamentPaid.ts` - Service for fetching paid players from tournament table

### Files to Modify
- `components/views/TournamentDetailModal.tsx` - Update paid players display
- `types.ts` - Add interface for tournament paid players data if needed

### Implementation Details

1. **Create `supabaseTournamentPaid.ts` service**:
   - Function: `getPaidPlayersByWaitlistId(tournamentWaitlistId: number, clubId: number)`
   - Query `tournament` table where `from_waitlist_id = tournamentWaitlistId` AND `club_id = clubId`
   - For each tournament found:
     - Query `tournament_player` table where `tournament_id = tournament.id` AND `status IN ('confirmed', 'active')`
     - Count players per tournament
     - Return structure:
       ```typescript
       interface TournamentPaidData {
         tournamentId: number;
         tournamentName: string;
         playerCount: number;
       }
       ```

2. **Update `TournamentDetailModal.tsx`**:
   - Add state: `const [paidTournaments, setPaidTournaments] = useState<TournamentPaidData[]>([])`
   - Fetch paid tournaments when modal opens (only for Supabase clubs)
   - Display in "已繳費" tab:
     - Show total count: sum of all `playerCount`
     - When clicked, show horizontal scrollable list
     - Each item shows: Tournament name + player count
     - Layout: Vertical list (each tournament on a row), horizontal scroll

3. **UI Design for Paid Tournaments List**:
   ```
   [已繳費 (總數)]
   
   When expanded:
   ┌─────────────────────────────┐
   │ → Tournament 1 (5人)         │
   │ → Tournament 2 (3人)         │
   │ → Tournament 3 (8人)         │
   └─────────────────────────────┘
   (Horizontal scroll if needed)
   ```

## Task 2: Reservation Status Display

### Current Implementation
- `TournamentDetailModal` already shows "已預約席位" when `registration.status === 'reserved'`
- But the reservation button might still be clickable
- Need to ensure reservation button is disabled/hidden when user already has a reservation

### Files to Modify
- `components/views/TournamentDetailModal.tsx` - Update reservation button logic

### Implementation Details

1. **Check if user already has reservation**:
   - Check `registration` prop - if exists and `status === 'reserved'`, user has reservation
   - Also check `playerList` to see if current user's ID is in reserved list
   - For Supabase clubs, check reservation table

2. **Update UI**:
   - If user has reservation:
     - Hide/disable "預約席位" button
     - Show "已預約席位" message (already exists)
     - Show "取消預約" button (already exists)
   - If user doesn't have reservation:
     - Show "預約席位" button (normal flow)

3. **Visual Distinction**:
   - Reservation button should be clearly disabled when user already reserved
   - "已預約席位" should be more prominent

## Data Flow

### Task 1 Flow:
```
TournamentDetailModal opens
  ↓
Check if Supabase club
  ↓
Call getPaidPlayersByWaitlistId(tournamentWaitlistId, clubId)
  ↓
Query tournament table (from_waitlist_id = waitlistId)
  ↓
For each tournament, query tournament_player (status = confirmed/active)
  ↓
Count players per tournament
  ↓
Display in "已繳費" tab
```

### Task 2 Flow:
```
TournamentDetailModal renders
  ↓
Check registration prop
  ↓
Check playerList for current user
  ↓
If reservation exists:
  - Hide reservation button
  - Show "已預約席位" + "取消預約" button
Else:
  - Show "預約席位" button
```

## Implementation Order

1. **Task 2** (Reservation Status) - Simpler, improves UX immediately
2. **Task 1** (Paid Players) - More complex, requires new service

## Testing Considerations

- Test paid players display for Supabase clubs shows correct tournament counts
- Test horizontal scroll works when many tournaments exist
- Test reservation button is disabled when user already reserved
- Test mock clubs still work (no changes needed for mock)
- Verify "已繳費" tab shows correct total count
- Verify tournament list displays correctly with horizontal scroll

