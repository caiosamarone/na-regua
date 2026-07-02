# ADR 001: Project Overview

## Status

Accepted

## Context

Na Régua is a multi-tenant SaaS platform for barbershop management. It consists of two main components: a REST API and a Web Application.

## Decision

### Stack
- **API**: Node.js + TypeScript + Fastify + Prisma ORM + PostgreSQL
- **WebApp**: Next.js + TypeScript + ShadCN + TanStack Query + React Hook Form + Zod + Tailwind CSS
- **File Storage**: Cloudinary (barber photos, barbershop logos)

### Deployment
- **API**: Render
- **WebApp**: Vercel
- **Database**: Neon (PostgreSQL, free tier for MVP)

### Repository Structure
- Monorepo at `na-regua/` with `api/` and `webapp/` directories
- Separate GitHub repos for each artifact
- Independent deploy cycles

## Consequences
- Separation of concerns between backend and frontend
- Shared types/interfaces must be manually duplicated or extracted to a shared package
