# API ADR 015: Commission per Barber

## Status

Accepted

## Context

Barbershop Admins need to track and pay commissions to barbers based on services performed. Each barber can have an individual commission percentage. The system must calculate commission automatically when an appointment is marked DONE and allow the admin to register manual payments.

## Decision

### Commission Percentage

- Stored as a field `commissionPercent` (Decimal, nullable) on `StaffMember`
- If null, defaults to 0% — no commission for that staff member
- Configured by Barbershop Admin when creating or editing a staff member
- Unique per barber (not per role or per service)

### Calculation

- Triggered **automatically** when an appointment transitions to `DONE`
- Formula: `commissionAmount = priceAtBooking * (commissionPercent / 100)`
- Base value: `priceAtBooking` (snapshot) — same as revenue metrics
- Result stored in a new `CommissionEntry` record

### Commission Entry Model

```prisma
model CommissionEntry {
  id                String   @id @default(cuid())
  barbershopId      String
  staffMemberId     String
  appointmentId     String   @unique
  commissionPercent Decimal  // snapshot of % at time of calculation
  priceAtBooking    Decimal  // snapshot of service value
  amount            Decimal  // calculated amount
  status            CommissionStatus @default(PENDING)
  paidAt            DateTime?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  staffMember   StaffMember  @relation(fields: [staffMemberId], references: [id])
  appointment   Appointment  @relation(fields: [appointmentId], references: [id])
  barbershop    Barbershop   @relation(fields: [barbershopId], references: [id])
}

enum CommissionStatus {
  PENDING
  PAID
}
```

### Payment Flow (Manual)

- Barbershop Admin views pending commissions per barber in the dashboard
- Admin can pay:
  - **Single barber**: selects a barber and marks all their PENDING entries as PAID
  - **Bulk pay**: marks all PENDING entries across all barbers as PAID
- Payment happens **outside the platform** (cash, Pix, transfer) — the system only registers it
- When paying, `status` changes to `PAID` and `paidAt` is set to the current timestamp
- A `CommissionPayment` record is created to track the batch

### Commission Payment Model

```prisma
model CommissionPayment {
  id             String   @id @default(cuid())
  barbershopId   String
  staffMemberId  String?
  amount         Decimal
  paidAt         DateTime @default(now())
  notes          String?
  createdAt      DateTime @default(now())

  staffMember  StaffMember? @relation(fields: [staffMemberId], references: [id])
  barbershop   Barbershop   @relation(fields: [barbershopId], references: [id])
  entries      CommissionEntry[]
}
```

- `staffMemberId` nullable: if null, it's a bulk payment (all barbers); if set, it's a single-barber payment

### Dashboard Visibility

**Barbershop Admin:**
- List of barbers with: name, commission %, total PENDING amount, total PAID this month
- Ability to filter by barber and date range

**Barber:**
- Total commission generated (all time or in period)
- Pending balance (unpaid)
- No ability to mark as paid — read-only

### Access Control

- **Barbershop Admin**: full CRUD — set commission %, view all pending/payed, register payments
- **Barber**: read-only — view own totals and pending balance

## Consequences

- Commission calculation adds a write operation to the DONE transition
- The `commissionPercent` snapshot on `CommissionEntry` ensures historical accuracy even if the barber's % changes later
- No integration with payment gateways for MVP — all payments are registered manually
- Future: can be extended to support per-service percentages, minimum guarantees, or automatic payouts
