# Na Régua — Project Guide for AI Agents

## Overview

Multi-tenant SaaS platform connecting barbershops with customers. Monorepo with three apps that share one backend:

- `api/` — Fastify + Prisma + PostgreSQL (single source of truth for all clients)
- `webapp/` — Next.js + ShadCN + TanStack Query
- `mobile/` — React Native (Expo) + TanStack Query *(new — being bootstrapped)*

The webapp and the mobile app are both **clients of the same API**. Business rules (slot calculation, tenant isolation, cancellation policy, etc.) live in the API only — never reimplement them in a client.

## Directory Structure

```
na-regua/
├── AGENTS.md                   # This file — project conventions for AI
├── CLAUDE.md                   # Claude Code entry point (imports this file)
├── .github/workflows/          # CI/CD (mobile-ci, mobile-cd, mobile-eas-deploy)
├── docs/
│   ├── PRD.md                  # Product requirements
│   ├── CONTEXT.md              # Domain glossary
│   ├── first-deploy.md         # First deploy walkthrough
│   └── adr/                    # Project-level ADRs
│       ├── 001-project-overview.md
│       ├── 002-mvp-scope.md
│       └── 003-deployment.md
├── api/
│   ├── docs/adr/               # API-specific ADRs (001-018)
│   ├── prisma/schema.prisma    # Database schema
│   ├── src/
│   │   ├── server.ts           # Fastify entry point
│   │   ├── config/             # Env, Prisma client
│   │   ├── modules/            # Feature modules (auth, booking, notifications, etc.)
│   │   └── shared/             # Errors, utils, tenant context
│   └── package.json
├── webapp/
│   ├── docs/adr/               # WebApp-specific ADRs (001-004)
│   ├── src/
│   │   ├── app/                # Next.js App Router
│   │   ├── components/         # UI, layout, forms, domain
│   │   ├── lib/                # Utils, API client
│   │   ├── hooks/              # Custom hooks
│   │   └── types/              # Shared TypeScript types
│   └── package.json
└── mobile/                     # React Native app (Expo SDK 57)
    ├── AGENTS.md / CLAUDE.md   # Expo-specific agent rules (from the template)
    ├── docs/adr/               # Mobile-specific ADRs (001 build & release)
    ├── src/
    │   ├── app/                # Expo Router file-based routes (only screens/layouts)
    │   ├── components/         # UI + domain components
    │   ├── constants/          # Theme and constants
    │   ├── lib/                # API client, auth/token storage, utils
    │   ├── hooks/              # Custom hooks (TanStack Query wrappers)
    │   └── types/              # Shared TypeScript types
    ├── assets/                 # Icons, splash, images
    ├── scripts/eas-deploy.mjs  # CD: new EAS build vs OTA update (fingerprint)
    ├── app.json                # Expo config
    ├── eas.json                # EAS build profiles (development, preview, production)
    └── package.json
```

## Critical ADRs (Read These First Before Coding)

| File | Why It Matters |
|------|----------------|
| `api/docs/adr/001-multi-tenant.md` | All queries need barbershopId filter |
| `api/docs/adr/002-authentication.md` | Bearer JWT, 30min expiry, refresh rotation |
| `api/docs/adr/004-appointment-scheduling.md` | Slot calc in memory, no PENDING status |
| `api/docs/adr/003-security.md` | Rate limits, password policy, CORS rules |
| `api/docs/adr/005-error-handling.md` | `{ data }` / `{ error, code, details }` format |
| `api/docs/adr/010-time-and-timezone.md` | Times are rendered in the barbershop's timezone |
| `api/docs/adr/018-push-notifications.md` | Web Push only today — mobile needs a native channel |
| `mobile/docs/adr/001-build-and-release.md` | EAS profiles, fingerprint build-vs-OTA, CI/CD triggers |
| `webapp/docs/adr/001-auth-integration.md` | NextAuth handles Google → API JWT is the auth token |
| `webapp/docs/adr/003-component-architecture.md` | Directory conventions, TanStack + RHF + Zod |

## Coding Conventions

### API
- Use `AppError` class for business errors (statusCode, code, details)
- All endpoints wrapped in try/catch with `handleError`
- Zod schemas for all input validation
- Tenant-scoped queries must use `getBarbershopId(request)`
- Route files: `src/modules/{feature}/{feature}.routes.ts`
- Endpoints must stay client-agnostic — do not add web-only assumptions (cookies, redirects to web URLs) that break the mobile app

### WebApp
- Pages under `src/app/(route-group)/page.tsx`
- Domain components in `src/components/domain/`
- API calls via the `api` client in `src/lib/api.ts`
- Forms: RHF + Zod + `@hookform/resolvers`
- Server state: TanStack Query (useQuery/useMutation)

### Mobile (React Native)
- **Expo** (managed workflow, SDK 57) + **Expo Router** for navigation (`src/app/` directory, route groups like `(auth)`, `(customer)`, `(staff)`)
- Also follow `mobile/AGENTS.md` (Expo rules: use `npx expo install` to add packages, check versioned Expo docs, never edit `ios/`/`android/` by hand)
- Import alias: `@/*` → `src/*`
- TypeScript strict mode
- API calls via a single `api` client in `src/lib/api.ts`, mirroring the webapp client (same `{ data }` / `{ error, code, details }` handling)
- Server state: TanStack Query — same query keys and hook shapes as the webapp where possible
- Forms: RHF + Zod + `@hookform/resolvers`
- **Auth**: no NextAuth on mobile. Use native Google Sign-In to get a Google ID token and send it to `POST /auth/google`; staff use `POST /auth/login`. The API's JWT/refresh tokens are the session (ADR 002)
- **Token storage**: `expo-secure-store` for access + refresh tokens — never AsyncStorage for secrets
- Refresh on 401 via `POST /auth/refresh` with rotation; on refresh failure, clear tokens and send the user to login
- API base URL from `EXPO_PUBLIC_API_URL` (on a physical device/emulator, use the machine's LAN IP, not `localhost`)
- Dates/times: format in the barbershop's timezone (ADR 010), never the device timezone
- User-facing copy in Portuguese (pt-BR)
- Tests: Jest (`jest-expo`) + React Native Testing Library, in `__tests__/` folders outside `src/app/`; import `describe`/`it`/`expect` from `@jest/globals`
- Before finishing: `npm run lint`, `npm run typecheck`, `npm run test` (same checks as CI)
- Release: merge to `main` → CI → development (build or OTA) → production (build or OTA, after manual approval) (ADR 001). Anything that changes native code triggers a new build

### Database (Prisma)
- Default IDs: CUID
- Tenant filter always applied in WHERE
- Appointment statuses: BOOKED, CANCELLED, DONE
- Timestamps: `createdAt` + `updatedAt` on all tables

## Mobile — Open Points

The mobile app changes some earlier decisions. Update these docs as work progresses:

- `docs/PRD.md` and `docs/adr/002-mvp-scope.md` list "Mobile app" as out of scope / "web only" — revise them
- `api/docs/adr/018-push-notifications.md` covers Web Push only. Native push (Expo Push / FCM / APNs) needs a new ADR and a new channel in the `notifications` module
- CORS (ADR 003) does not apply to native requests, but rate limits and auth rules do
- Add mobile ADRs for auth integration, navigation and push as those decisions are made

## Running Locally

```bash
# API
cd api
cp .env.example .env    # fill DATABASE_URL
npm run db:push         # push schema to DB
npm run db:seed         # creates super admin
npm run dev             # http://localhost:3333

# WebApp
cd webapp
cp .env.example .env.local
npm run dev             # http://localhost:3000

# Mobile
cd mobile
cp .env.example .env    # set EXPO_PUBLIC_API_URL=http://<LAN-IP>:3333
npx expo start          # opens in the development build (expo-dev-client)
npx expo start --go     # or use Expo Go instead
```

## Links

- **API ADRs**: `api/docs/adr/` (001 to 018)
- **WebApp ADRs**: `webapp/docs/adr/` (001 to 004)
- **Mobile ADRs**: `mobile/docs/adr/` (001)
- **PRD**: `docs/PRD.md`
- **Glossary**: `docs/CONTEXT.md`
