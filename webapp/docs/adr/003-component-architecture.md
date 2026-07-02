# WebApp ADR 003: Component Architecture

## Status

Accepted

## Context

The WebApp needs a consistent, reusable component structure. ShadCN is the UI library.

## Decision

### Directory Structure
```
src/
├── app/                 # Next.js App Router pages
│   ├── (public)/        # Public routes (landing, find barbershops)
│   ├── (auth)/          # Login, register, magic-link
│   ├── (customer)/      # Customer dashboard
│   └── (admin)/         # Barbershop Admin dashboard
├── components/
│   ├── ui/              # ShadCN primitives (button, input, dialog, etc.)
│   ├── layout/          # Navbar, Sidebar, Footer
│   ├── forms/           # Reusable form components (with RHF + Zod)
│   └── domain/          # Domain-specific components (AppointmentCard, BarberSelector, etc.)
├── hooks/               # Custom hooks (useGeolocation, useAuth, etc.)
├── lib/                 # Utilities (api client, cn, date helpers)
├── providers/           # React context providers (AuthProvider, QueryProvider)
└── types/               # Shared TypeScript types/interfaces
```

### Data Fetching
- **TanStack Query** for all server state
- Custom `useApi` hook wrapping the query client with auth headers
- Mutations for creates/updates/deletes (with optimistic updates where valuable)

### Forms
- **React Hook Form** for form state management
- **Zod** for schema validation (shared patterns with API)
- `@hookform/resolvers/zod` to bridge RHF + Zod
- Reusable form field components wrapping ShadCN inputs + error display

### State Management
- Server state: TanStack Query (source of truth)
- Auth state: React context (AuthProvider)
- No global state library needed for MVP

## Consequences
- Clear separation of concerns: pages, domain components, UI primitives
- TanStack Query handles caching, refetching, and loading states
- No Redux/Zustand overhead for MVP
