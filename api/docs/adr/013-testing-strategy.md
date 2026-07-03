# API ADR 013: Testing Strategy

## Status

Proposed (stub — to be finalized before implementation)

## Context

The API needs a testing approach that covers multi-tenant isolation, appointment scheduling edge cases, and auth flows without slowing down MVP delivery.

## Decision

_To be decided. Candidates:_

- **Unit tests**: slot calculation, timezone conversion, overlap detection logic
- **Integration tests**: API endpoints with test database (Prisma + PostgreSQL)
- **Test runner**: Vitest (aligns with TypeScript/Fastify ecosystem)
- **Test database**: separate Neon branch or Docker PostgreSQL for CI

## Consequences

_To be documented once the strategy is finalized._
