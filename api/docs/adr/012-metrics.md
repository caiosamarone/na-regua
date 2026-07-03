# API ADR 012: Metrics (On-the-Fly Aggregation)

## Status

Accepted

## Context

Barbershop Admins need revenue and performance insights. The PRD specifies on-the-fly metrics (no data warehouse). Appointment price/duration are snapshotted at booking time (ADR 004).

## Decision

### Calculation Approach

- **On-the-fly aggregation** via Prisma `groupBy` or raw SQL queries
- Scoped by `barbershopId` + date range (query params: `from`, `to`)
- Uses **`priceAtBooking`** from the appointment snapshot — not the current service price

### Revenue Definition

- Revenue counts only appointments with status **`DONE`** (service rendered)
- `BOOKED` (future) and `CANCELLED` are excluded from revenue totals

### Metrics Exposed

| Metric | Aggregation |
|--------|-------------|
| Total revenue | `SUM(priceAtBooking)` where `status = DONE` |
| Top services | `GROUP BY serviceName`, count + revenue |
| Top barbers | `GROUP BY barberId`, count + revenue (who performed the service — includes bookable admins; no role filter) |
| Busiest days | `GROUP BY dayOfWeek(startTime)`, count |

Top barbers ranks by who performed the appointment (`barberId`), regardless of staff role. A bookable `BARBERSHOP_ADMIN` appears naturally; a manager-only admin with no appointments does not.

### Access Control

- **Barbershop Admin only** — barbers and customers cannot access metrics endpoints
- All queries filtered by `barbershopId` from staff JWT

### Endpoint

- `GET /barbershops/:id/metrics?from=2026-07-01&to=2026-07-31`

## Consequences

- No materialized views or background jobs for MVP
- Performance acceptable for MVP scale; may need caching or pre-aggregation post-MVP
- Metrics remain accurate even when service prices change after booking
