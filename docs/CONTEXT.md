# Na Régua — Domain Glossary

## Product

| Term | Definition |
|------|------------|
| **Na Régua** | A multi-tenant SaaS platform for barbershop management. Barbershops manage appointments and staff; end customers book services. |
| **Super Admin** | The platform owner (singular). Onboards barbershops (initial setup) and manages subscription status (activate/deactivate). Does not edit barbershops after creation. |
| **Barbershop Admin** | User role within a barbershop tenant. Owns all barbershop management after creation: profile, staff, services, operating hours, blocked dates, metrics, and cancellation settings. May mark themselves bookable if they also cut hair, and can toggle bookability (`isBookable`) for any staff member. |
| **Barber** | User role within a barbershop tenant. Has a simplified schedule view and can mark appointments as completed or cancelled. Whether they appear in the customer booking picker is controlled by the `isBookable` flag, not by role alone. |
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
| **Coordinates** | Latitude and longitude stored for each barbershop. Set during tenant creation; editable by Barbershop Admin. |
| **Proximity Search** | End customer's browser requests geolocation permission; the app compares the customer's coordinates against barbershop coordinates to find nearby results. |

## Subscription (MVP)

| Term | Definition |
|------|------------|
| **Subscription** | A barbershop's right to use the platform. Managed manually by the Super Admin (no automated payment integration in MVP). |
| **Active Status** | Boolean flag on the barbershop entity. Inactive barbershops cannot be found or used by end customers. |

## Scheduling

| Term | Definition |
|------|------------|
| **Bookable Staff Member** | A staff member available for customer booking (`isBookable = true`, `isActive = true`, role BARBER or BARBERSHOP_ADMIN). Shown as "Barbeiro" in the customer UI. |
| **Operating Interval** | A contiguous open period within a day (e.g. 09:00–12:00). A barbershop may have multiple intervals per day (split shifts). |
| **Slot** | A bookable appointment start time. Occupies `[start, start + service duration]` and must fit entirely within one operating interval. |
| **Slot Interval** | The fixed grid step between candidate slot start times for a barbershop (default: 30 minutes). |
| **Blocked Date** | A date range during which a barbershop does not accept bookings. Created by the Barbershop Admin. |
| **Lead Time** | Minimum notice required before a customer can cancel without a penalty warning (default: 3 hours). Configurable per barbershop. |
| **Service Snapshot** | Price, duration, and name captured on the appointment at booking time. Preserves historical accuracy when services change. |
| **Timezone** | IANA timezone identifier for a barbershop (e.g. `America/Sao_Paulo`). Determines how local wall-clock times map to absolute instants. |

## Tech Stack

| Term | Definition |
|------|------------|
| **API** | Node.js + TypeScript + Fastify + Prisma ORM + PostgreSQL (hosted on Neon) |
| **WebApp** | Next.js + TypeScript + ShadCN + TanStack Query + React Hook Form + Zod + Tailwind CSS |
| **Deploy API** | Render |
| **Deploy WebApp** | Vercel |
| **Database** | PostgreSQL via Neon (free tier for MVP) |
