# API ADR 010: Time and Timezone Handling

## Status

Accepted

## Context

Appointments, operating hours, cancellation lead time, and blocked dates all depend on datetime semantics. Without an explicit timezone strategy, slot calculation and lead-time comparisons are ambiguous across barbershops and regions.

## Decision

### Storage Rules

- **Absolute instants** (`Appointment.startTime`, `Appointment.endTime`, `cancelledAt`, `createdAt`, `updatedAt`) are stored in **UTC** using PostgreSQL `timestamptz`.
- **Operating hours** are stored as **local wall-clock time** per barbershop: `(dayOfWeek, startTime, endTime)` with no timezone embedded in the time values.
- Each `Barbershop` has a **`timezone`** field (IANA identifier, e.g. `America/Sao_Paulo`).

### Conversion Rules

- All conversions between wall-clock time and UTC happen **in the API**, using the barbershop's `timezone`.
- The frontend displays times in the barbershop's local timezone; it does not perform timezone math.
- Slot generation, lead-time validation, and blocked-date checks all operate on UTC instants derived from the barbershop timezone.

### Examples

- Operating hour: Monday 09:00–18:00 in `America/Sao_Paulo` → API converts to UTC range for slot generation on that calendar date.
- Customer selects slot at 10:00 local → API stores `startTime` as the corresponding UTC instant.

## Consequences

- Requires a timezone library in the API (e.g. `date-fns-tz` or `luxon`)
- `Barbershop.timezone` must be set during tenant creation (Super Admin) and is editable by Barbershop Admin thereafter
- All datetime comparisons (conflicts, lead time, DONE transition) use UTC instants — no ambiguity
- Brazil-only MVP still benefits: explicit timezone avoids hardcoding assumptions and supports future expansion
