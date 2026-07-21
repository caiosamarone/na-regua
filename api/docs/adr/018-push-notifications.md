# API ADR 018: Push Notification Reminders

## Status

Accepted

## Context

End customers need to be reminded of upcoming appointments. Transactional email (ADR 009) covers confirmation and cancellation but is not ideal for time-sensitive reminders — it may go unread or be delayed. Push notifications delivered via the Web Push API reach the user even when the webapp tab is closed, making them suitable for appointment reminders.

The system must also support future notification channels (WhatsApp, SMS) without rewriting the job logic.

## Decision

### Delivery: Web Push API + Service Worker

- Use the **Web Push API** natively via `PushManager.subscribe()` in the browser
- Service worker is required — push delivery works even when the webapp tab is closed
- Backend sends pushes via the `web-push` npm package
- VAPID keys for server authentication (`VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`)
- VAPID public key exposed at `GET /vapid-public-key` (not build-time env) so key rotation does not require a frontend rebuild

### Job Queue: PgBoss on PostgreSQL

- **PgBoss** runs on the existing PostgreSQL database — no Redis dependency
- The reminder job is enqueued at booking confirmation, scheduled for `appointment.startTime - 1h`
- At send time, the job verifies `appointment.status === BOOKED` before dispatching
- On HTTP 410 (expired subscription): delete the subscription from DB and continue with remaining subscriptions
- Only the reminder is push-based. Transactional notifications (confirmation, cancellation) remain email-only (ADR 009)

### Notification Content

| Part | Value |
|------|-------|
| Title | `"Lembrete de agendamento — {barbershopName}"` |
| Body | `"{barber} te espera na {barbershop} às {localTime}. Não vai perder, hein?"` |
| Tag | `"appointment-reminder-{appointmentId}"` — prevents stacking |
| Click target | Webapp homepage |

`localTime` is formatted in the barbershop's timezone (follows ADR 010).

### Channel Abstraction

A `NotificationChannel` interface decouples job logic from delivery mechanism:

```typescript
interface NotificationChannel {
  send(recipient: PushSubscription, payload: NotificationPayload): Promise<SendResult>;
}
```

The reminder job iterates over all active channels for the target recipient and calls `send()`. Future channels (WhatsApp) implement the same interface without touching the job.

### Database: PushSubscription Model

```prisma
model PushSubscription {
  id         String   @id @default(cuid())
  customerId String
  endpoint   String   @unique
  keys       Json
  deviceInfo String?
  createdAt  DateTime @default(now())

  customer   Customer @relation(fields: [customerId], references: [id], onDelete: Cascade)
}
```

- One-to-many from Customer (multiple devices per customer)
- No tenant isolation — subscriptions belong to the Customer, not to a Barbershop
- Expired subscriptions removed on 410 during send

### Appointment Model — new field

```prisma
model Appointment {
  // ... existing fields
  notifiedAt DateTime?
}
```

### Module Structure

```
src/modules/notifications/
├── notifications.module.ts
├── notifications.routes.ts
├── channels/
│   ├── channel.interface.ts
│   └── push.channel.ts
├── jobs/
│   └── reminder.job.ts
├── errors/
│   └── notification-errors.ts
└── gateways/
    └── push-subscription.repository.ts
```

### Endpoints

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/vapid-public-key` | None | Returns VAPID public key for client-side subscription |
| POST | `/push/subscriptions` | Customer | Stores a new push subscription |
| DELETE | `/push/subscriptions/:id` | Customer | Removes a subscription (opt-out) |

### Booking Integration

The `CreateAppointmentUseCase` receives a `NotificationJobScheduler` interface (not PgBoss directly) to enqueue the reminder job after successful creation. This keeps the use case testable and decoupled from the job queue library:

```typescript
interface NotificationJobScheduler {
  scheduleReminder(appointmentId: string, scheduledAt: Date): Promise<void>;
}
```

### Environment Variables

```env
VAPID_PUBLIC_KEY=<generated>
VAPID_PRIVATE_KEY=<generated>
VAPID_SUBJECT=mailto:contact@naregua.app
```

## Consequences

- Push reminders reach customers even when they are not actively on the site, reducing missed appointments
- PgBoss on existing PostgreSQL avoids additional infrastructure cost and complexity
- The channel interface makes WhatsApp/SMS future-proof without touching job logic
- Customers with multiple devices receive the reminder on all of them
- If VAPID keys need rotation, the endpoint serves the new key immediately without a frontend deployment
- Busca status at send time (instead of canceling the job) eliminates race conditions between cancellation and job execution

### Browser & Platform Limitations

- **Android:** Chrome and Firefox support push notifications natively — works fully
- **Desktop:** Chrome, Edge, Firefox, and Safari (macOS 13+) support push notifications natively
- **iOS (any browser):** Push notifications only work if the user adds the webapp to the Home Screen as a PWA. Chrome on iOS uses WebKit and has the same limitation as Safari. Regular Safari tabs do not receive push notifications.
- The Web Push API process is identical regardless of frontend framework (Next.js, React+Vite, etc.) — only the service worker file location changes
