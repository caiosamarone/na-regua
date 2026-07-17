# API ADR 016: TimeOff (Staff-Specific Partial-Day Blocking)

## Status

Accepted

## Context

The existing `BlockedDate` entity blocks full days for an entire barbershop (admin-only). Staff members (barbers and admin barbers) need to block specific time ranges in their own schedule for personal commitments, without affecting other staff or requiring full-day blocks.

## Decision

### New Entity: `TimeOff`

```prisma
model TimeOff {
  id             String    @id @default(cuid())
  barbershopId   String
  staffMemberId  String
  startDate      DateTime  // local date (meia-noite local) — first day
  endDate        DateTime  // local date (meia-noite local) — last day
  startTime      String?   // "HH:mm" local — nullable (null = dia inteiro)
  endTime        String?   // "HH:mm" local — nullable (null = dia inteiro)
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt

  staffMember  StaffMember @relation(fields: [staffMemberId], references: [id])
  barbershop   Barbershop  @relation(fields: [barbershopId], references: [id])
}
```

- `startDate` and `endDate` define the date range in the barbershop's local timezone
- When `startTime` and `endTime` are **both null**: the entire date range is blocked (whole days)
- When `startTime` and `endTime` are **both set**: the time range applies to **each day** in `[startDate, endDate]`
  - Example: startDate=2026-07-10, endDate=2026-07-12, startTime="12:00", endTime="14:00" → blocks 12:00-14:00 on Jul 10, 11, and 12
- When `startDate == endDate` and times are set: single-day partial block

### Blocking Logic

- Only affects the **specific staff member** (`staffMemberId`)
- Other staff and the barbershop's `OperatingHour` remain unaffected
- Slot calculation must exclude time ranges where the requested `barberId` has an active `TimeOff`

### Access Control

- **BARBER**: can only create/edit/delete their own TimeOff entries
- **BARBERSHOP_ADMIN**: can create/edit/delete TimeOff for any staff member (including themselves as staff)
- **CUSTOMER**: no access

### Booking Conflict Resolution

Same two-step flow as `BlockedDate` (ADR 008):

1. **Preview** (`confirm=false`): lists all `BOOKED` appointments that would be affected, without persisting
2. **Confirm** (`confirm=true`): creates the `TimeOff` and cancels affected appointments in a transaction

Only appointments that fall **entirely or partially** within the blocked time are included in the preview/cancellation.

### Endpoint Design

```
POST   /staff/me/time-off          — BARBER creates own TimeOff (preview/confirm)
GET    /staff/me/time-off           — BARBER lists own TimeOff
DELETE /staff/me/time-off/:id       — BARBER deletes own TimeOff

POST   /barbershops/:id/staff/:staffId/time-off   — BARBERSHOP_ADMIN (preview/confirm)
GET    /barbershops/:id/time-off                   — BARBERSHOP_ADMIN lists all TimeOff
DELETE /barbershops/:id/time-off/:id               — BARBERSHOP_ADMIN deletes any
```

### Slot Calculation Impact

The slot calculation algorithm (SPEC §6.3) must add an additional filter:

```
After calculating available slots in local time:
  → For each candidate slot, check if it falls within an active TimeOff for the barber
  → TimeOff is active if: candidate date ∈ [startDate, endDate] AND
    (times are null OR candidate local time ∈ [startTime, endTime))
  → If active → exclude slot
```

## Consequences

- TimeOff is distinct from BlockedDate — two separate entities with different scopes
- Preview flow adds complexity but prevents accidental cancellations
- Slot calculation needs an additional query (TimeOff for the barber within date range)
- No recurring TimeOff for MVP — only one-off blocks
- Future: can be extended with recurrence rules or integration with calendar sync
