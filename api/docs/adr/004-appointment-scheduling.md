# API ADR 004: Appointment Scheduling

## Status

Accepted

## Context

Customers book appointments with specific barbers at specific times. Slot calculation, double-booking prevention, and status lifecycle.

## Decision

### Booking Flow
1. Customer selects **barber** → **service** → sees available time slots
2. Picks a time → modal **"Confirm appointment?"** → confirms
3. Appointment created with status **BOOKED**
4. No intermediate PENDING/unconfirmed state

### Slot Calculation (In-Memory)
- Endpoint: `GET /barbershops/:id/slots?barberId=x&serviceId=y&date=2026-07-03`
- Logic:
  1. Fetch operating hours for the barber's barbershop on that day of week
  2. Fetch all BOOKED appointments for that barber on that date
  3. Get service duration
  4. Generate possible start times from open to close (minus duration)
  5. Remove slots overlapping with existing appointments
  6. Return remaining slots
- Frontend renders available times, disables occupied ones

### Double-Booking Prevention
- Before creating, query for conflicting `barberId + dateTime` with status BOOKED
- If conflict → HTTP 409 (`APPOINTMENT_CONFLICT`)
- Check runs inside a Prisma transaction

### Appointment Statuses
- `BOOKED` — active, confirmed appointment
- `CANCELLED` — removed, available for re-booking
- `DONE` — service rendered, marked by barber

## Consequences
- In-memory calculation is simple but gets slower with more appointments (acceptable for MVP)
- Database unique constraint on (barberId, dateTime) can be added later
- Frontend polling for slot updates (acceptable for MVP)
