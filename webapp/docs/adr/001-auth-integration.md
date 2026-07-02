# WebApp ADR 001: Authentication Integration

## Status

Accepted

## Context

The WebApp needs to authenticate three personas (Super Admin, Staff, End Customer) against the API. Google OAuth is required for customers.

## Decision

### Auth Library
- **NextAuth** to handle Google OAuth flow on the frontend

### Architecture
- NextAuth handles the **Google OAuth redirect/callback** (`/auth/google/callback`)
- After successful Google authentication, NextAuth sends the Google ID token to the API (`POST /auth/google`)
- The API verifies the Google token, creates/finds the customer, and returns the API's own JWT (Bearer)
- The frontend stores the API JWT and uses it for all subsequent API calls (`Authorization: Bearer <token>`)

### API JWT vs NextAuth JWT
- NextAuth session JWT is only used for the Google handshake
- The **API JWT** (returned by `POST /auth/google` and `POST /auth/login`) is the actual auth token for all business endpoints
- API JWT stored in memory (React context/state)
- Refresh token stored in localStorage for persistence across page reloads

### Login Flow
- **Staff**: email + password form → `POST /auth/login` → stores API JWT
- **Customer (Google)**: "Sign in with Google" → NextAuth → `POST /auth/google` → stores API JWT
- **Customer (Magic Link)**: email form → `POST /auth/magic-link` → click link in email → API JWT returned via redirect

### Route Protection
- Middleware checks for valid API JWT before rendering protected pages
- Role-based guards: `/admin/*` requires BARBERSHOP_ADMIN or SUPER_ADMIN

## Consequences
- Two JWT systems (NextAuth + API) adds conceptual complexity
- Google handshake requires both NextAuth config and API endpoint
- Storing refresh token in localStorage is less secure than httpOnly cookie but simpler
