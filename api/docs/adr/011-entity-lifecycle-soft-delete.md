# API ADR 011: Entity Lifecycle and Soft Delete

## Status

Accepted

## Context

Barbers and services accumulate appointment history over time. Hard-deleting entities breaks historical records, metrics, and referential integrity. The PRD allows admins to "remove" barbers and deactivate services.

## Decision

### Soft Delete via `isActive`

- `StaffMember.isActive` (default `true`) — barbers and admins
- `Service.isActive` (default `true`) — services

Deactivation sets `isActive = false`. Records are never hard-deleted if they have associated appointments.

### Availability vs Lifecycle (`isBookable`)

`StaffMember.isBookable` (default varies by role) is **separate from** `isActive`. It controls whether a staff member accepts **new** bookings without removing them from the tenant.

| Flag | Meaning |
|------|---------|
| `isBookable = false` | Temporary unavailability for new bookings. Keeps future `BOOKED` appointments. Excluded from customer picker. |
| `isActive = false` | Soft-delete / lifecycle deactivation. Must resolve future `BOOKED` appointments first (see below). Excluded from customer picker. |

- Setting `isBookable = false` does **not** cancel future appointments; re-enabling bookability is instant for new bookings
- All staff with `isBookable = false` is a valid state (no new bookings against those members)
- **Defaults:** `BARBER` → `isBookable = true`; `BARBERSHOP_ADMIN` → `isBookable = false` (admin may enable for self); `SUPER_ADMIN` → always `isBookable = false` (not tenant-scoped, never bookable)
- **Who can toggle:** Barbershop Admin may toggle `isBookable` for any staff in the tenant; barbers cannot toggle their own bookability
- **Future evolution:** A dedicated `Provider` entity may replace or complement this flag post-MVP if non-user bookable resources are needed

### Barber Deactivation Rules

- A staff member can only be deactivated (`isActive = false`) when they have **no future `BOOKED` appointments**
- If future bookings exist → HTTP 409 with list of affected appointments; admin must cancel or reassign first
- Past appointments (`DONE`, `CANCELLED`) retain the barber reference for history
- Inactive staff are excluded from customer booking flows (not shown in barber selection)

### Service Deactivation Rules

- A service can be deactivated at any time (`isActive = false`)
- Deactivated services are excluded from customer booking flows
- Existing appointments retain their service snapshot (see ADR 004)

### Barbershop Deactivation (Super Admin)

- Super Admin sets `Barbershop.active = false` — barbershop is hidden from search and booking
- Does not delete data; reactivation restores visibility

## Consequences

- Historical data is always preserved
- Barber removal requires proactive handling of future bookings
- Queries for booking/reservation must filter `isActive = true`
- Metrics and history queries include inactive entities where relevant
