# Push Notification Reminder — Feature Spec

## Problem Statement

End customers book appointments but often forget them. The system already sends transactional email (ADR 009), but email is not immediate and may go unread. Customers need a way to be reminded of upcoming appointments that reaches them even when they are not actively browsing the webapp.

## Solution

Deliver push notifications to end customers' devices via the **Web Push API** (service worker + PushManager) 1 hour before each appointment. The notification is scheduled at booking confirmation time via a **PgBoss** job queue and delivered regardless of whether the webapp tab is open or closed.

The notification system is designed as a **channel abstraction** so that future delivery methods (WhatsApp, SMS) can be added without changing existing job logic.

## User Stories

1. As an end customer who booked an appointment, I want to receive a push notification 1h before my appointment, so that I don't forget.
2. As an end customer, I want to opt in to push notifications during login/signup, so that I can choose whether to receive them.
3. As an end customer, I want to disable push notifications in my settings at any time, so that I can stop receiving them if I change my mind.
4. As an end customer with multiple devices, I want to receive notifications on all of them, so that I don't miss reminders regardless of device.
5. As an end customer, I want the notification to show the barber name, barbershop name, and appointment time, so that I know the details at a glance.
6. As an end customer, I want to tap the notification and be taken to the webapp homepage, so that I can act on the reminder.
7. As an end customer who cancelled an appointment, I want to not receive the reminder, so that I'm not bothered unnecessarily.
8. As a developer, I want a channel abstraction for notifications, so that future channels (WhatsApp, SMS) are added without changing existing job or use-case code.
9. As a barbershop admin, I want my customers to receive push reminders automatically, so that fewer appointments are missed without me needing to configure anything.

## Implementation Decisions

### Delivery Mechanism
- **Web Push API** via `PushManager.subscribe()` + service worker (no FCM SDK)
- VAPID keys for server authentication
- Backend library: `web-push` npm package
- Notification content delivered as JSON payload parsed by the service worker `push` event handler

### Job Scheduling
- **PgBoss** on the existing PostgreSQL database (no Redis dependency)
- Job enqueued in the `CreateAppointmentUseCase` after successful appointment creation (inline, no event bus)
- Job fires at `appointment.startTime - 1h`
- At send time, the job verifies `appointment.status === BOOKED` before dispatching (does not cancel the job on cancellation — race-safe)
- On send failure due to expired subscription (HTTP 410 Gone), the subscription is deleted from DB and the job continues with remaining subscriptions

### Database — PushSubscription Model

```
model PushSubscription {
  id         String   @id @default(cuid())
  customerId String
  endpoint   String   @unique
  keys       Json     // { p256dh: string, auth: string }
  deviceInfo String?  // user-agent header from the browser
  createdAt  DateTime @default(now())
}
```

- One-to-many from Customer: a customer may have multiple subscriptions (one per browser/device)
- No tenant isolation needed — PushSubscription is per Customer, not per Barbershop

### Appointment Model Change
- Add field: `notifiedAt DateTime?` to track whether the reminder was sent

### Module Structure

```
src/modules/notifications/
├── notifications.module.ts       // register routes + PgBoss worker
├── notifications.routes.ts       // POST /push/subscriptions, DELETE /push/subscriptions/:id, GET /vapid-public-key
├── channels/
│   ├── channel.interface.ts      // NotificationChannel interface
│   └── push.channel.ts           // Web Push API implementation
├── jobs/
│   └── reminder.job.ts           // PgBoss job handler
├── errors/
│   └── notification-errors.ts    // subscription not found, etc.
└── gateways/
    └── push-subscription.repository.ts  // DB access interface
```

### Notification Content
- **Title:** `"Lembrete de agendamento — {nome da barbearia}"`
- **Body:** `"{barber} te espera na {barbershop} às {hora}. Não vai perder, hein?"`
- **Tag:** `"appointment-reminder-{appointmentId}"` (prevents stacking duplicate notifications)
- **Click action:** open webapp homepage

### Timezone
- `{hora}` is formatted in the **barbershop's timezone** (from `Barbershop.timezone`), using the same `date-fns-tz` approach in ADR 010

### Opt-in / Opt-out
- Web push subscription created during login/signup flow (frontend calls `PushManager.subscribe()` then POSTs the subscription to the API)
- `/push/subscriptions` DELETE endpoint allows the frontend to remove a subscription when the user toggles notifications off
- VAPID public key exposed at `GET /vapid-public-key`

### Environment Variables
```
VAPID_PUBLIC_KEY=<generated>
VAPID_PRIVATE_KEY=<generated>
VAPID_SUBJECT=mailto:contact@naregua.app
```

- Added to `src/config/env.ts` Zod schema and `.env.example`

## Testing Decisions

### Approach
- Test the **use case** (job handler) as the highest seam — same pattern as `CreateAppointmentUseCase.spec.ts` and other existing use-case tests
- Unit-test `PushChannel` with a mocked `web-push` SDK
- Unit-test the VAPID public key endpoint

### What makes a good test
- Only test external behaviour: "given a BOOKED appointment due for reminder, the channel is called with the correct payload"
- Do not test PgBoss internals or service worker registration
- Mock the notification channel interface and the PgBoss library; use an in-memory `PushSubscriptionRepository`

### Prior Art
- All use-case tests use the same pattern: `InMemoryRepository` + `jest.fn()` for external services
- `CreateAppointmentUseCase.spec.ts` is the closest reference (validates domain rules, calls repository)

### Test Files (new)
```
src/modules/notifications/jobs/reminder.job.spec.ts
src/modules/notifications/channels/push.channel.spec.ts
src/modules/notifications/notifications.routes.spec.ts
```

## Out of Scope
- WhatsApp or SMS notification channels (future)
- Transactional push notifications (confirmation, cancellation — email only for now)
- Push notification preference UI in the webapp
- Notification delivery analytics (open rate, click rate)
- Mobile push notifications (Apple Push, FCM native)
- `NO_SHOW` appointment status

## ⚠️ Reverter Antes do Deploy

Itens temporários introduzidos durante o desenvolvimento/teste que precisam ser revertidos:

1. **`api/src/modules/booking/use-cases/create-appointment.use-case.ts`** — linha `const reminderAt = addMinutes(new Date(), 1);` deve voltar para `const reminderAt = subHours(startTime, 1);`
2. **`api/src/server.ts`** — `app.register(cors, { origin: "*", ... })` deve voltar para `app.register(cors, { origin: env.CORS_ORIGIN, ... })`

## Further Notes
- The `CreateAppointmentUseCase` must accept a `PgBoss` instance or a `NotificationJobScheduler` interface to enqueue the reminder job. This keeps the use case testable and avoids coupling to PgBoss directly.
- When a customer's subscription returns 410, we delete only that subscription and continue with the remaining ones — one dead subscription does not prevent delivery to other devices.
- **iOS limitação:** Push notifications no iOS (qualquer browser — Safari, Chrome, Firefox) só funcionam se o usuário adicionar o webapp à Tela de Início como PWA. Abas normais do Safari não recebem push. No Android (Chrome/Firefox) e Desktop funciona nativamente sem essa exigência.
- O processo do Web Push API é idêntico independente do framework frontend (Next.js, React+Vite, etc.) — só muda onde o arquivo `sw.js` é servido.
