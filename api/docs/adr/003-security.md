# API ADR 003: Security & API Protection

## Status

Accepted

## Context

Public API needs baseline protections: rate limiting, password policy, and CORS.

## Decision

### Rate Limiting
- **Library**: `@fastify/rate-limit`
- **Global**: 100 req/min/IP
- **Auth endpoints**: 10 req/min/IP, 3 req/email/hour
- **Appointment creation**: 20 req/min/authenticated user

### Password Policy
- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 symbol (`!@#$%^&*`)
- Hashed with bcrypt (10 rounds)

### CORS
- Production: only Vercel domain
- Development: `http://localhost:3000`
- Methods: GET, POST, PUT, PATCH, DELETE
- Headers: Content-Type, Authorization

### OTP Security
- Cryptographically random 6-digit code
- 15-minute expiry
- Invalidated after use
- Rate limited per email and IP

### General
- Input validation via Zod on all endpoints
- Stack traces suppressed in production
- No sensitive data in error messages

## Out of Scope (MVP)
- CSRF (not needed with Bearer tokens)
- API key management
- Audit logging
- HTTPS (handled by Render/Vercel)

## Consequences
- Rate limiting prevents brute force but needs tuning for real usage
- Strict password policy may cause user friction
- No CSRF simplifies frontend but relies on Bearer token security
