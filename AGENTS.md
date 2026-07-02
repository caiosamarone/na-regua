# Na Régua — Project Guide for AI Agents

## Overview

Multi-tenant SaaS platform connecting barbershops with customers. Monorepo with `api/` (Fastify + Prisma + PostgreSQL) and `webapp/` (Next.js + ShadCN + TanStack Query).

## Directory Structure

```
na-regua/
├── AGENTS.md                   # This file — project conventions for AI
├── docs/
│   ├── PRD.md                  # Product requirements
│   ├── CONTEXT.md              # Domain glossary
│   └── adr/                    # Project-level ADRs
│       ├── 001-project-overview.md
│       ├── 005-mvp-scope.md
│       └── 006-deployment.md
├── api/
│   ├── docs/adr/               # API-specific ADRs (001-009)
│   ├── prisma/schema.prisma    # Database schema
│   ├── src/
│   │   ├── server.ts           # Fastify entry point
│   │   ├── config/             # Env, Prisma client
│   │   ├── modules/            # Feature modules (auth, appointments, etc.)
│   │   └── shared/             # Errors, utils, tenant context
│   └── package.json
└── webapp/
    ├── docs/adr/               # WebApp-specific ADRs (001-004)
    ├── src/
    │   ├── app/                # Next.js App Router
    │   ├── components/         # UI, layout, forms, domain
    │   ├── lib/                # Utils, API client
    │   ├── hooks/              # Custom hooks
    │   └── types/              # Shared TypeScript types
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
| `webapp/docs/adr/001-auth-integration.md` | NextAuth handles Google → API JWT is the auth token |
| `webapp/docs/adr/003-component-architecture.md` | Directory conventions, TanStack + RHF + Zod |

## Coding Conventions

### API
- Use `AppError` class for business errors (statusCode, code, details)
- All endpoints wrapped in try/catch with `handleError`
- Zod schemas for all input validation
- Tenant-scoped queries must use `getBarbershopId(request)`
- Route files: `src/modules/{feature}/{feature}.routes.ts`

### WebApp
- Pages under `src/app/(route-group)/page.tsx`
- Domain components in `src/components/domain/`
- API calls via the `api` client in `src/lib/api.ts`
- Forms: RHF + Zod + `@hookform/resolvers`
- Server state: TanStack Query (useQuery/useMutation)

### Database (Prisma)
- Default IDs: CUID
- Tenant filter always applied in WHERE
- Appointment statuses: BOOKED, CANCELLED, DONE
- Timestamps: `createdAt` + `updatedAt` on all tables

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
```

## Links

- **API ADRs**: `api/docs/adr/` (001 to 009)
- **WebApp ADRs**: `webapp/docs/adr/` (001 to 004)
- **PRD**: `docs/PRD.md`
- **Glossary**: `docs/CONTEXT.md`
