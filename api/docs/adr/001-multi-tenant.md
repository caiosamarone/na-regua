# API ADR 001: Multi-Tenant Architecture

## Status

Accepted

## Context

Multiple barbershops (tenants), each with isolated data (staff, services, appointments, customers).

## Decision

**Row-level (discriminator) isolation**: Every tenant-scoped table includes a `barbershopId` foreign key.

- No separate database per tenant
- No separate schema per tenant
- Middleware/hook reads `barbershopId` from authenticated staff JWT and injects into queries
- Customers are **not** tenant-scoped: a single customer can book at multiple barbershops
- Customer JWT does not carry a `barbershopId`; the `barbershopId` comes from the URL/request context

### Tenant-Scoped Tables
- `Service` (via `barbershopId`)
- `StaffMember` (via `barbershopId`, nullable for Super Admin)
- `OperatingHour` (via `barbershopId`)
- `Appointment` (via `barbershopId`)

### Cross-Tenant Tables
- `Customer` (shared across tenants, identified by email/Google ID)

## Consequences
- Simpler infrastructure for MVP
- Must never omit tenant filter in queries
- RLS in PostgreSQL can be added later as a safety net
- Customer data is global — a customer sees their full history across all barbershops
