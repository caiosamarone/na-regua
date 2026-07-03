# API ADR 008: Cancellation Policy

## Status

Accepted

## Context

Appointments can be cancelled by customers or staff. Rules differ based on who cancels and how much notice is given. Barbershop Admins can also block date ranges (e.g. holidays, renovations).

## Decision

### Who Can Cancel
- **End Customer**: via their own appointments view
- **Barber**: via their schedule view
- **Barbershop Admin**: via the dashboard

### Cancellation Lead Time (Customer)
- Each barbershop configures a **cancellation lead time** (default: 3 hours)
- If customer cancels **after** the lead time → UI shows a warning that **50% of the service value may be charged**
- No actual payment processing in MVP — purely informational
- Lead time comparison uses UTC instants (see ADR 010)

### Blocked Dates (Barbershop Admin)
- **Barbershop Admin** creates blocked date ranges — Super Admin cannot block dates
- Model: `BlockedDate(barbershopId, startDate, endDate, reason)` — whole-day granularity
- Blocked dates exclude days from slot generation (see ADR 004)
- When creating a block, API returns list of affected `BOOKED` appointments in the range
- On admin confirmation, those appointments are cancelled with:
  - `cancelledByRole = BARBERSHOP_ADMIN`
  - `cancellationReason` = block reason (e.g. "barbearia bloqueada")
  - Cancellation email sent to affected customers

### Data Tracking
All cancellations record on the `Appointment` record:
- `cancelledById` — staff or customer ID
- `cancelledByRole` — enum: `CUSTOMER | BARBER | BARBERSHOP_ADMIN`
- `cancellationReason` — free text (optional)
- `cancelledAt` — timestamp (UTC)

### Schema Changes
New columns on `Appointment`:
- `cancelledById String?`
- `cancelledByRole String?`
- `cancellationReason String?`
- `cancelledAt DateTime?`

New column on `Barbershop`:
- `cancellationLeadTimeMinutes Int @default(180)` (3 hours)

New table:
- `BlockedDate`: `barbershopId`, `startDate`, `endDate`, `reason`

### Availability After Cancellation
- Cancelled slots are immediately available for re-booking

## Consequences
- Lead time configurable per barbershop, giving flexibility
- No payment integration in MVP — warning is informational only
- Re-booking cancelled slots is instant, no cool-down period
- Blocked dates require explicit confirmation before mass-cancelling existing bookings
