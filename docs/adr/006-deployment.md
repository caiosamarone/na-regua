# ADR 006: Deployment Strategy

## Status

Accepted

## Context

Two deployable artifacts (API and WebApp) plus a database. Cost-effective MVP deployment.

## Decision

| Component | Platform | Justification |
|-----------|----------|---------------|
| **API** | Render (Web Service) | Easy Node.js deploy, auto-deploy from GitHub |
| **WebApp** | Vercel | Native Next.js support, CDN, free tier |
| **Database** | Neon (PostgreSQL) | Free tier (0.5GB, 100 compute hours/mo), serverless |
| **File Storage** | Cloudinary | Generous free tier for images |
| **Email** | Resend | Transactional emails (magic link, OTP, invitations) |
| **Source Control** | GitHub | Separate repos for API and WebApp |

### CI/CD
- Both platforms have GitHub integration for automatic deploys on `main`

## Consequences
- Render free tier spins down after inactivity (cold start delay)
- Free tiers sufficient for low-traffic MVP
- Separate repos = no monorepo tooling overhead
