# Na Régua — Domain Glossary

## Product

| Term | Definition |
|------|------------|
| **Na Régua** | A multi-tenant SaaS platform for barbershop management. Barbershops manage appointments and staff; end customers book services. |
| **Super Admin** | The platform owner (singular). Responsible for onboarding barbershops, managing subscriptions manually, and overall system administration. |
| **Barbershop Admin** | User role within a barbershop tenant. Responsible for managing the barbershop's profile, staff, services, and viewing analytics. |
| **Barber** | User role within a barbershop tenant. Has a simplified schedule view and can mark appointments as completed or cancelled. |
| **End Customer** | External user who browses nearby barbershops and books appointments. Authenticates via Google OAuth or email + magic link. |

## Authentication & Access

| Term | Definition |
|------|------------|
| **Password Auth** | Authentication method for Super Admin, Barbershop Admin, and Barber users. Credentials stored as hashed passwords in the database. |
| **Google OAuth** | Primary authentication method for End Customers. |
| **Magic Link** | Fallback authentication for End Customers who cannot or prefer not to use Google. |

## Multi-Tenancy

| Term | Definition |
|------|------------|
| **Tenant** | A barbershop. Each tenant has its own isolated data scope (staff, services, appointments, customers). |
| **Tenant Isolation** | All tenant-scoped queries are filtered by `barbershopId`. No cross-tenant data leakage. |

## Core Domain

| Term | Definition |
|------|------------|
| **Barbershop** | A registered business entity (tenant). Contains profile info, address, geolocation, operating hours, and subscription status. |
| **Service** | A haircut, beard trim, or any offering a barbershop provides. Has a name, duration, and price. |
| **Appointment** | A booking made by an end customer for a specific service with a specific barber at a specific datetime. |
| **Staff Member** | A user (Admin or Barber) associated with a barbershop tenant. |
| **Operating Hours** | The days and times a barbershop is open, configured per day of the week. |

## Geolocation

| Term | Definition |
|------|------------|
| **Coordinates** | Latitude and longitude stored for each barbershop. Captured during onboarding by Super Admin. |
| **Proximity Search** | End customer's browser requests geolocation permission; the app compares the customer's coordinates against barbershop coordinates to find nearby results. |

## Subscription (MVP)

| Term | Definition |
|------|------------|
| **Subscription** | A barbershop's right to use the platform. Managed manually by the Super Admin (no automated payment integration in MVP). |
| **Active Status** | Boolean flag on the barbershop entity. Inactive barbershops cannot be found or used by end customers. |

## Tech Stack

| Term | Definition |
|------|------------|
| **API** | Node.js + TypeScript + Fastify + Prisma ORM + PostgreSQL (hosted on Neon) |
| **WebApp** | Next.js + TypeScript + ShadCN + TanStack Query + React Hook Form + Zod + Tailwind CSS |
| **Deploy API** | Render |
| **Deploy WebApp** | Vercel |
| **Database** | PostgreSQL via Neon (free tier for MVP) |
