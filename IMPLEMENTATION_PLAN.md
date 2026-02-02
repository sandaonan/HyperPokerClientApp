# Implementation Plan: Reservation List and Queue Position

## Overview
This plan addresses two tasks from `todo.md`:
1. Update reservation list display in tournament detail modal to fetch from `reservation` table for Supabase clubs
2. Calculate and set `queue_position` when creating reservations

## Task 1: Update Reservation List Display

### Current Implementation
- `TournamentDetailModal` uses `mockApi.getTournamentRegistrations()` to fetch player list
- For mock clubs, it uses localStorage data
- For Supabase clubs, it should fetch from `reservation` table

### Files to Modify
- `services/mockApi.ts` - Update `getTournamentRegistrations()` method
- `services/supabaseReservation.ts` - Add function to get reservations with member info
- `components/views/TournamentDetailModal.tsx` - May need minor updates if data format changes

### Implementation Details

1. **Update `getTournamentRegistrations()` in `mockApi.ts`**:
   - Check if tournament belongs to Supabase club using `isSupabaseClub()`
   - If Supabase club:
     - Parse `tournamentId` as `tournament_waitlist_id` (number)
     - Call `getReservationsByTournamentWaitlist()` from `supabaseReservation.ts`
     - Map reservation data to `Registration` format:
       - `id`: `reservation.id.toString()`
       - `tournamentId`: `tournamentId` (string)
       - `userId`: `reservation.member_id.toString()`
       - `status`: Map `reservation.status` ('waiting' → 'reserved', 'confirmed' → 'paid')
       - `timestamp`: `reservation.requested_at`
       - `userLocalId`: Display `reservation.member_id` (as requested)
       - `userDisplayName`: Optional - can fetch from member table if needed
   - If mock club:
     - Continue using existing localStorage logic

2. **Update `getReservationsByTournamentWaitlist()` in `supabaseReservation.ts`**:
   - Already exists, but may need to:
     - Order by `queue_position` ASC (if not null), then by `requested_at` ASC
     - Return member_id for display

3. **Data Mapping**:
   - `reservation.status = 'waiting'` → `Registration.status = 'reserved'`
   - `reservation.status = 'confirmed'` → `Registration.status = 'paid'`
   - Display `member_id` as `userLocalId` in the UI

## Task 2: Calculate Queue Position

### Current Implementation
- `createReservation()` in `supabaseReservation.ts` sets `queue_position: null`
- Backend was supposed to calculate, but now frontend needs to calculate

### Files to Modify
- `services/supabaseReservation.ts` - Update `createReservation()` function

### Implementation Details

1. **Update `createReservation()` function**:
   - Before inserting new reservation:
     - Query existing reservations for the same `tournament_waitlist_id`
     - Filter by `status IN ('waiting', 'confirmed')` (active reservations)
     - Get maximum `queue_position` value
     - If no existing reservations or all have `null` queue_position:
       - Set `queue_position = 1`
     - Else:
       - Set `queue_position = max(queue_position) + 1`
   - Insert reservation with calculated `queue_position`

2. **Query Logic**:
   ```typescript
   // Get max queue_position for this tournament_waitlist_id
   const { data: existingReservations, error } = await supabase
     .from('reservation')
     .select('queue_position')
     .eq('tournament_waitlist_id', tournamentWaitlistId)
     .in('status', ['waiting', 'confirmed'])
     .not('queue_position', 'is', null)
     .order('queue_position', { ascending: false })
     .limit(1);
   
   const maxQueuePosition = existingReservations && existingReservations.length > 0
     ? existingReservations[0].queue_position
     : 0;
   
   const newQueuePosition = maxQueuePosition + 1;
   ```

3. **Edge Cases**:
   - If all existing reservations have `null` queue_position, start from 1
   - Handle concurrent reservations (race condition) - Supabase should handle this with transactions, but we'll set it correctly

## Implementation Order

1. **Task 2** (Queue Position) - Foundation, needed for proper ordering
2. **Task 1** (Reservation List) - Depends on Task 2 for correct ordering

## Testing Considerations

- Test reservation list display for Supabase clubs shows correct member_ids
- Test queue_position calculation when creating new reservations
- Test that reservations are ordered correctly by queue_position
- Test edge case: first reservation (queue_position = 1)
- Test edge case: all reservations have null queue_position
- Verify mock clubs still work with localStorage data

