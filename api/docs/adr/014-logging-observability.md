# API ADR 014: Logging and Observability

## Status

Proposed (stub — to be finalized before implementation)

## Context

The API runs on Render and needs structured logging for debugging auth failures, email delivery issues, and appointment conflicts in production.

## Decision

_To be decided. Candidates:_

- **Logger**: Fastify built-in Pino logger (already enabled in `server.ts`)
- **Structured fields**: `requestId`, `userId`, `barbershopId`, `endpoint`, `duration`
- **Log levels**: error for 5xx and failed email sends; warn for 4xx; info for request lifecycle
- **Out of scope (MVP)**: distributed tracing, APM, audit logging (see ADR 003)

## Consequences

_To be documented once the strategy is finalized._
