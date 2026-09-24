# API ADR 002: Authentication

## Status

Accepted

## Context

Three user personas: Super Admin, Staff (Barbershop Admin + Barber), and End Customer. Each has different auth requirements.

## Decision

### Auth Mechanism
- **JWT** via  (HS256)
- **Bearer token** in `Authorization` header
- **Access token**: 30 minutes
- **Refresh token**: 7 days (opaque token, stored server-side with hash — see Refresh Token Storage)
- **Refresh endpoint**: `POST /auth/refresh`

### Auth Flows

| Persona | Method | Endpoint |
|---------|--------|----------|
| Super Admin & Staff | Email + password (bcrypt) | `POST /auth/login` |
| End Customer | Google OAuth (primary) | `POST /auth/google` (API verifies Google ID token) |
| End Customer | Magic link (fallback) | `POST /auth/magic-link` → `POST /auth/magic-link/verify` |
| All | Password reset (OTP) | `POST /auth/forgot-password` + `POST /auth/reset-password` |

### JWT Payloads
**Staff:**
```json
{ "sub": "staffId", "role": "SUPER_ADMIN|BARBERSHOP_ADMIN|BARBER", "barbershopId": "..." }
```

**Customer:**
```json
{ "sub": "customerId", "role": "CUSTOMER" }
```

### Customer Identity
- **Email is the canonical unique key** for `Customer` — one account per email
- Google OAuth links to an existing account when the Google email is **verified** (`googleId` stored on the same record)
- Magic link uses the same email — no duplicate accounts
- If Google returns an unverified email, automatic linking is blocked

### Refresh Token Storage
- Dedicated `RefreshToken` table: `tokenHash` (SHA-256), `userId` or `customerId`, `expiresAt`, `revoked`
- Token sent to client is an opaque random string (not a JWT)
- On rotation: old token is revoked, new token issued
- **Reuse detection**: if a revoked token is presented again, the entire token family/session is invalidated

### Magic Link
- Opaque random token stored with **hash** in `MagicLinkToken` table
- 15-minute expiry, single-use (`consumedAt` set on first use)
- Same storage pattern as OTP and refresh tokens
- `POST /auth/magic-link` takes an optional `client` (`web` | `mobile`, default `web`). `web` links to `FRONTEND_URL/auth/magic-link?token=…`; `mobile` links to `MOBILE_MAGIC_LINK_URL?token=…` (default `naregua://auth/magic-link`) so the native app verifies the token itself (see `mobile/docs/adr/002-auth-integration.md`)


### Invite Flow (Barbershop Admin)
1. Super Admin fills barbershop info + admin email
2. API sends invitation email with a one-time link/token
3. Admin clicks link, sets own password → account activated


### Password Recovery (OTP)
- 6-digit numeric code stored with hash
- 15-minute expiry
- Rate limited: 3/email/hour, 5/IP/hour
- Invalidated after use

### Role vs Bookability

`role` controls **authorization** (what a staff member can do). `isBookable` on `StaffMember` controls **bookability** (whether they appear in the customer booking picker).

- A `BARBERSHOP_ADMIN` who also cuts hair sets `isBookable = true` — they keep admin powers and become bookable
- A manager-only admin keeps `isBookable = false` — admin powers without appearing in the picker
- `role` and `isBookable` are independent dimensions; see ADR 011 for lifecycle semantics

**Bookable staff query** (customer picker):
```
role IN (BARBER, BARBERSHOP_ADMIN) AND isBookable = true AND isActive = true
```

Defaults: `BARBER` → `isBookable = true`; `BARBERSHOP_ADMIN` → `isBookable = false` (can enable for self); `SUPER_ADMIN` → always `isBookable = false` (not tenant-scoped, never bookable).

### Authorization / Role Matrix

| Action | Super Admin | Barbershop Admin | Barber | Customer |
|--------|-------------|------------------|--------|----------|
| Create barbershop tenant | Yes | No | No | No |
| Activate/deactivate barbershop | Yes | No | No | No |
| Edit barbershop profile/address/hours | No (post-creation) | Yes | No | No |
| Manage services/barbers | No | Yes | No | No |
| Toggle staff bookability | No | Yes (any staff in tenant) | No | No |
| Block date ranges | No | Yes | No | No |
| View metrics | No | Yes | No | No |
| Book/cancel own appointments | No | No | No | Yes |
| View own schedule | No | Yes (all) | Yes (own) | No |
| Mark appointment DONE | No | Yes | Yes | No |

Super Admin **creates** the barbershop (initial profile, address, timezone, admin invite) and can **activate/deactivate** thereafter. All ongoing management belongs to the Barbershop Admin.

## Consequences
- Bearer tokens require secure storage on the frontend (memory/localStorage)
- Refresh token rotation with reuse detection reduces risk from token theft
- Google OAuth requires a GCP project with consent screen
- Magic link, OTP, and refresh tokens all require server-side storage and Resend (transactional email)
- No `JWT_REFRESH_SECRET` needed — refresh tokens are opaque, not signed JWTs
