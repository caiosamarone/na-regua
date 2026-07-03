# API ADR 004: Appointment Scheduling

## Status

Accepted

## Context

Customers book appointments with specific barbers at specific times. Slot calculation, double-booking prevention, and status lifecycle.

## Decision

### Bookable Staff Selection

The customer booking picker lists **bookable staff members** — not every staff account. Query (tenant-scoped):

```
role IN (BARBER, BARBERSHOP_ADMIN) AND isBookable = true AND isActive = true
```

Authorization vs bookability: see ADR 002. Availability vs lifecycle (`isBookable` vs `isActive`): see ADR 011.

### Booking Flow
1. Customer selects **bookable staff member** (shown as barber in UI) → **service** → sees available time slots
2. Picks a time → modal **"Confirm appointment?"** → confirms
3. Appointment created with status **BOOKED**
4. No intermediate PENDING/unconfirmed state


### Slot Calculation (In-Memory)
- Endpoint: `GET /barbershops/:id/slots?barberId=x&serviceId=y&date=2026-07-03`
- Logic:
  1. Fetch operating hour **intervals** for the barbershop on that day of week (see ADR 001)
  2. Exclude dates in `BlockedDate` ranges for the barbershop
  3. Fetch all BOOKED appointments for that barber on that date (using `startTime`/`endTime`)
  4. Get service duration
  5. Generate candidate start times on a fixed grid: `Barbershop.slotIntervalMinutes` (default 30) — e.g. 09:00, 09:30, 10:00
  6. Each candidate occupies `[start, start + duration]` — valid only if it fits entirely within **one** operating interval
  7. Remove candidates overlapping with existing BOOKED appointments
  8. Return remaining slots (displayed in barbershop local time — see ADR 010)
- Frontend renders available times, disables occupied ones

### Service Snapshot at Booking

On creation, the appointment stores:
- `priceAtBooking` — service price at time of booking
- `durationAtBooking` — service duration at time of booking
- `serviceName` — service name at time of booking
- `startTime` / `endTime` — UTC instants (`endTime = startTime + durationAtBooking`)

Metrics and conflict detection use these snapshot values, not the live service record.


### Double-Booking Prevention
- Conflict detection uses **interval overlap**, not start-time equality
- Two appointments conflict if `[startTime, endTime)` ranges overlap for the same `barberId` with status BOOKED
- Check runs inside a Prisma transaction
- Database-level guarantee via PostgreSQL exclusion constraint:
  ```sql
  EXCLUDE USING gist (
    "barberId" WITH =,
    tstzrange("startTime", "endTime") WITH &&
  ) WHERE (status = 'BOOKED')
  ```
- Requires `btree_gist` extension (enable in Neon alongside `cube`/`earthdistance`)
- Violation — HTTP 409 (`APPOINTMENT_CONFLICT`)

### Appointment Statuses
- `BOOKED` — active, confirmed appointment
- `CANCELLED` — removed, available for re-booking
- `DONE` — service rendered, marked by barber or admin

No `NO_SHOW` status in MVP.

### Status Transitions
- `BOOKED` → `CANCELLED` — by customer, barber, or admin (see ADR 008)
- `BOOKED` → `DONE` — by barber or admin, **only after `startTime` has passed**
- `CANCELLED` and `DONE` are terminal states

## Consequences
- In-memory calculation is simple but gets slower with more appointments (acceptable for MVP)
- Exclusion constraint provides race-condition-safe double-booking prevention at the database level
- Service snapshot preserves accurate historical metrics even when prices change
- Frontend polling for slot updates (acceptable for MVP)
- All datetime handling follows ADR 010 (UTC storage, local display)
