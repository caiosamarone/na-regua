# WebApp ADR 004: Dashboard (Barbershop Admin)

## Status

Accepted

## Context

The Barbershop Admin dashboard is the core management interface for each tenant.

## Decision

### MVP Dashboard Sections
1. **Overview** — Key metrics (on-the-fly):
   - Revenue today/this week/this month
   - Total appointments today
   - Most requested services
   - Barber with most completed appointments
   - Busiest day of the week
2. **Appointments** — List/filter of all appointments (by date, barber, status)
3. **Services** — CRUD table (name, duration, price, active/inactive)
4. **Staff** — Manage barbers (add, remove, view schedule)
5. **Operating Hours** — Per day of week configuration (open/close time, off days)
6. **Settings** — Barbershop info, logo upload, cancellation lead time

### Metrics Implementation
- Metrics calculated on-the-fly via API endpoints (no pre-aggregated tables)
- Dedicated `GET /admin/metrics` endpoint (by period)
- Frontend uses TanStack Query with appropriate stale times (5 min for metrics)

### Layout
- Sidebar navigation on desktop, bottom tab nav on mobile
- Header with barbershop name and logged-in user info
- Loading skeletons using ShadCN Skeleton component

## Consequences
- On-the-fly metrics may be slow with large datasets (acceptable for MVP)
- TanStack Query caching reduces redundant API calls
- Mobile-responsive layout ensures barbers can use it on their phones
