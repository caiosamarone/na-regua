# API ADR 008: Cancellation Policy

## Status

Accepted

## Context

Appointments can be cancelled by customers or barbers. Rules differ based on who cancels and how much notice is given.

## Decision

### Who Can Cancel
- **End Customer**: via their own appointments view
- **Barber**: via their schedule view
- **Barbershop Admin**: via the dashboard

### Cancellation Lead Time (Customer)
- Each barbershop configures a **cancellation lead time** (default: 3 hours)
- If customer cancels **after** the lead time → UI shows a warning that **50% of the service value may be charged**
- No actual payment processing in MVP — purely informational

### Data Tracking
All cancellations record on the `Appointment` record:
- `cancelledById` — staff or customer ID
- `cancelledByRole` — enum: `CUSTOMER | BARBER | BARBERSHOP_ADMIN`
- `cancellationReason` — free text (optional)
- `cancelledAt` — timestamp

### Schema Changes
New columns on `Appointment`:
- `cancelledById String?`
- `cancelledByRole String?`
- `cancellationReason String?`
- `cancelledAt DateTime?`

New column on `Barbershop`:
- `cancellationLeadTimeMinutes Int @default(180)` (3 hours)

### Availability After Cancellation
- Cancelled slots are immediately available for re-booking

## Consequences
- Lead time configurable per barbershop, giving flexibility
- No payment integration in MVP — warning is informational only
- Re-booking cancelled slots is instant, no cool-down period
