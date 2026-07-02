# API ADR 002: Authentication

## Status

Accepted

## Context

Three user personas: Super Admin, Staff (Barbershop Admin + Barber), and End Customer. Each has different auth requirements.

## Decision

### Auth Mechanism
- **JWT** via `@fastify/jwt` (HS256)
- **Bearer token** in `Authorization` header
- **Access token**: 30 minutes
- **Refresh token**: 7 days (with rotation — invalidated on each use)
- **Refresh endpoint**: `POST /auth/refresh`

### Auth Flows

| Persona | Method | Endpoint |
|---------|--------|----------|
| Super Admin & Staff | Email + password (bcrypt) | `POST /auth/login` |
| End Customer | Google OAuth (primary) | `POST /auth/google` (API verifies Google ID token) |
| End Customer | Magic link (fallback) | `POST /auth/magic-link` |
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

### Invite Flow (Barbershop Admin)
1. Super Admin fills barbershop info + admin email
2. API sends invitation email with a one-time link/token
3. Admin clicks link, sets own password → account activated

### Password Recovery (OTP)
- 6-digit numeric code
- 15-minute expiry
- Rate limited: 3/email/hour, 5/IP/hour
- Invalidated after use

## Consequences
- Bearer tokens require secure storage on the frontend (memory/localStorage)
- Refresh token rotation reduces risk from token theft
- Google OAuth requires a GCP project with consent screen
- Magic link and OTP both require Resend (transactional email)
