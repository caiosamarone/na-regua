# ADR 002: MVP Scope

## Status

Accepted

## Context

We need a functional MVP that can be validated with real barbershops while keeping complexity low.

## Decision

### In MVP Scope

- Super Admin creates/activates barbershop tenants via internal panel
- Barbershop Admin onboarding via email invitation (defines own password)
- Barbershop Admin dashboard: service CRUD, appointment management, operating hours, metrics (on-the-fly)
- Barber login: sees own schedule, can cancel appointments
- End customer registration (email + password + Google OAuth)
- End customer can browse nearby barbershops and book appointments
- Geolocation-based proximity search (browser GPS + earthdistance)
- Booking flow: choose barber → choose service → choose time → modal confirm → BOOKED
- Cancellation with configurable lead time (default 3h)
- File uploads via Cloudinary (barber photos, barbershop logo)

### Out of MVP Scope

- Automated payment/subscription integration (manual management)
- Advanced analytics & reports (basic on-the-fly metrics only)
- SMS/WhatsApp notifications
- Review/rating system
- Multi-language / i18n
- Mobile app
- Real-time features (websockets) — polling is acceptable

### Subscription Model (MVP)

- Controlled manually by Super Admin
- Barbershop has an `active` boolean flag
- Super Admin activates/deactivates based on offline payment agreement

## Consequences

- Manual subscription management is a bottleneck as tenants grow
- Polling for real-time updates is acceptable but not ideal
- Architecture must accommodate out-of-scope features later without breaking changes
