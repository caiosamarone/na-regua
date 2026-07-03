# Na Régua — Product Requirements Document

## 1. Product Overview

**Na Régua** is a multi-tenant SaaS platform that connects barbershops with their customers. Barbershops manage their schedule, staff, and services; customers find nearby barbershops and book appointments.

**Tagline:** Agendamento inteligente para sua barbearia.

---

## 2. Target Personas

### Super Admin
- **Who:** App owner (singular — you)
- **Goal**: Onboard barbershops and manage subscriptions (activate/deactivate)
- **Access:** Email + password; creates barbershops and controls active status only — does not edit barbershops after creation

### Barbershop Admin
- **Who:** Manager/owner of a barbershop tenant
- **Goal:** Manage services, staff, schedule, and view metrics
- **Access:** Barbershop-scoped dashboard via email + password

### Barber
- **Who:** Employee barber
- **Goal:** View personal schedule, cancel appointments
- **Access:** Limited barbershop-scoped view via email + password

### End Customer
- **Who:** Individual looking for a barbershop
- **Goal:** Find nearby barbershops, book/cancel appointments
- **Access:** Google OAuth (primary) or email + magic link (fallback)

---

## 3. User Stories

### Customer
- As a customer, I want to find barbershops near me so I can choose one conveniently
- As a customer, I want to see barbers, services, and prices before booking
- As a customer, I want to book an appointment with a specific barber at a specific time
- As a customer, I want to cancel my appointment if my plans change
- As a customer, I want to see my upcoming and past appointments

### Barbershop Admin
- As an admin, I want to manage services (name, duration, price, active/inactive)
- As an admin, I want to manage barbers (add, remove, toggle bookability, view schedule)
- As an admin, I want to toggle staff bookability (available/unavailable for booking) for any team member

- As an admin, I want to see all appointments and cancel them if needed
- As an admin, I want to configure operating hours and exception days
- As an admin, I want to view revenue and top services/barbers metrics
- As an admin, I want to set the cancellation lead time for my barbershop
- As an admin, I want to upload my barbershop logo
- As an admin who also cuts hair, I want to mark myself as bookable so customers can schedule with me
- As an admin, I want to block date ranges for my barbershop (e.g., holidays, renovation)

### Barber
- As a barber, I want to see my daily/weekly schedule
- As a barber, I want to cancel a customer's appointment with a reason
- As a barber, I want to mark appointments as done

### Super Admin
- As a super admin, I want to create a barbershop tenant and invite the admin
- As a super admin, I want to activate/deactivate barbershops (subscription control)

---

## 4. Feature Scope

### MVP (Phase 1)

| Feature | Description |
|---------|-------------|
| Tenant creation | Super Admin creates barbershop + invites admin via email |
| Staff auth | Email + password login for Super Admin and Staff |
| Customer auth | Google OAuth (primary) + magic link (fallback) |
| Barber management | Barbershop Admin adds/removes barbers |
| Service management | CRUD services per barbershop |
| Operating hours | Per-day config with open/close time and off days |
| Appointment booking | Customer picks barber → service → time → confirms |
| Slot calculation | In-memory available slot calculation |
| Double-booking prevention | API-level conflict check in transaction |
| Customer cancellation | Cancel with configurable lead time (default 3h) |
| Staff cancellation | Cancel with reason tracking |
| Geolocation search | GPS-based nearby barbershops via earthdistance |
| Address search fallback | Text search by city/neighborhood |
| Metrics (on-the-fly) | Revenue, top services, top barbers, busiest days |
| File upload | Cloudinary for barber photos and barbershop logo |
| Transactional email | Resend (magic link, OTP, invitation, confirmation, cancellation) |
| Password recovery | OTP-based reset (6-digit code, 15min expiry) |
| Blocked dates | Barbershop Admin blocks date ranges (with confirmation for affected bookings) |

### Post-MVP (Not in Scope for Phase 1)

| Feature | Reason Excluded |
|---------|-----------------|
| Automated subscription payments | Requires Stripe integration — manual control for MVP |
| SMS/WhatsApp notifications | Additional cost and complexity |
| Review/rating system | Nice-to-have, not core to booking |
| Multi-language / i18n | Portuguese-only for MVP (Brazil market) |
| Mobile app | Responsive web app is sufficient |
| Real-time (WebSockets) | Polling is acceptable for MVP |
| Advanced analytics | On-the-fly metrics only; no data warehouse |
| Customer profile management | Minimal profile (name, email) for MVP |

---

## 5. User Flows

### Customer Booking Flow
```
Landing → Search barbershops → GPS permission?
  ├── Granted → See nearby list → Select barbershop
  └── Denied → Text search → Select barbershop
    → View barbers → Select barber
    → View services → Select service
    → View available slots → Pick time
    → Confirm modal → BOOKED → Email confirmation
```

### Barbershop Onboarding Flow
```
Super Admin creates barbershop (name, address, CEP, admin email)
  → Invitation email sent to admin
  → Admin clicks link → Sets password → Logs in
  → Configures: operating hours, services, staff, logo
  → Activates (Super Admin controls active flag)
```

### Cancellation Flow
```
Customer opens appointments → Selects appointment → "Cancel"
  ├── Within lead time → Free cancellation → Status: CANCELLED
  └── Past lead time → Warning (50% charge) → Confirm → CANCELLED
```

---

## 6. Success Metrics (MVP)

| Metric | Target |
|--------|--------|
| Barbershops onboarded | 5 in first month |
| Appointments booked | 50/week |
| Customer retention | >2 appointments/customer |
| Cancellation rate | <15% |
| Geolocation accuracy | >80% accept GPS permission |

---

## 7. Constraints & Assumptions

- **Timezone**: Brazil (Brasília) only for MVP
- **Language**: Portuguese only
- **Currency**: BRL (R$)
- **Platform**: Web only (desktop + mobile responsive)
- **Authentication**: No 2FA for MVP
- **Database**: PostgreSQL via Neon free tier (0.5GB storage)
- **Email volume**: Under Resend free tier (100 emails/day)
- **File storage**: Cloudinary free tier
- **Subscription**: Managed manually — no automated billing

---

## 8. Glossary

See [CONTEXT.md](./CONTEXT.md) for full domain glossary.
