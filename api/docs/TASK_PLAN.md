# Na Régua — Task Plan de Implementação

> **Contexto:** Projeto em scaffold inicial. Apenas `DeployTest` no Prisma, módulos vazios, sem rotas, sem auth, sem error handling.
>
> **Arquitetura:** Vertical Slices (`src/modules/<feature>/`) com Ports & Adapters prático.
>
> **Convenção de nomes:** `kebab-case` com sufixos (`.schema.ts`, `.repository.ts`, `prisma-*.repository.ts`, `.use-case.ts`, `.controller.ts`, `.error.ts`, `.routes.ts`).
>
> **Import de tipos Prisma:** Sempre usar `src/generated/prisma/client`, nunca `@prisma/client`.

---

## Testes Automatizados (SPEC §1.3)

> O projeto já tem o Jest configurado no `package.json` / `jest.config.ts`. Siga o "Modelo de Troféu" descrito na SPEC.

- [x] Criar helpers de testes unitários em `src/tests/helpers/` que forneçam repositórios em memória com arrays, para usar em todos os `use-case` (reset entre casos, sem Prisma)
- [ ] Para cada `use-case` colocado em `src/modules/*/use-cases/`, criar `*.use-case.spec.ts` que cobre caminhos felizes e falhas de regras de negócio. Use Jest (setup já existente) e garanta 100% de cobertura lógica (fluxo positivo + erros).

---

## Fase 0 — Fundação & Infraestrutura Compartilhada

_Pré-requisito para todas as fases seguintes._

### 0.1 Schema Prisma Completo

Criar TODOS os modelos do banco em `prisma/schema.prisma`, substituindo o `DeployTest` placeholder.

**Modelos a criar:**

- `Barbershop` — dados do tenant, timezone, slot config, flags de ativação
- `OperatingHour` — grade semanal (dayOfWeek, startTime/endTime como string `HH:mm`)
- `BlockedDate` — intervalos de data bloqueada por barbershop
- `StaffMember` — funcionários com role, senha, flags de atividade
- `Customer` — clientes com email canônico e googleId opcional
- `RefreshToken` — sessões com tokenHash, family para reuse detection
- `MagicLinkToken` — tokens de magic link para customer
- `OtpToken` — códigos OTP de 6 dígitos para reset de senha
- `InvitationToken` — convites para staff (admin/barber)
- `Service` — serviços oferecidos pelo barbershop
- `Appointment` — agendamentos com snapshots, status, campos de cancelamento

**Extensões PostgreSQL**:

- `cube`, `earthdistance` (geolocation)
- `btree_gist` (exclusion constraint para double-booking)

**Exclusion constraint** na tabela `Appointment`:

```sql
ALTER TABLE "Appointment"
ADD CONSTRAINT no_double_booking
EXCLUDE USING gist (
  "barberId" WITH =,
  tstzrange("startTime", "endTime") WITH &&
)
WHERE (status = 'BOOKED');
```

**Índice GiST** para geolocation:

```sql
CREATE INDEX idx_barbershop_location ON barbershops
USING gist (ll_to_earth(latitude, longitude));
```

- [x] **0.1a** — Escrever schema completo em `prisma/schema.prisma`
- [x] **0.1b** — Criar migration inicial com SQL raw das extensions + exclusion constraint + índice GiST
- [x] **0.1c** — Rodar `prisma generate` e verificar tipos gerados

### 0.2 Error Handling Compartilhado

- [x] **0.2a** — Criar classe base `AppError` em `src/shared/errors/app-error.ts`

### 0.3 Helpers Compartilhados

- [x] **0.3a** — Criar `src/shared/helpers/password.helper.ts` (hash com bcrypt, compare)
- [x] **0.3b** — Criar `src/shared/helpers/token.helper.ts` (geração de token opaco + SHA-256)

### 0.4 Server Setup & Plugins Globais

- [x] **0.4a** — Registrar plugins no `src/server.ts`:
  - `@fastify/cors` (com `CORS_ORIGIN`)
  - `@fastify/cookie`
  - `@fastify/jwt` (com `JWT_SECRET`)
  - `@fastify/rate-limit` (config global + hooks por rota)
- [x] **0.4b** — Criar global error handler que captura `AppError` e lança no formato `{ error, code, details }`
- [x] **0.4c** — Criar hook `onRequest` ou `preHandler` de autenticação JWT
- [x] **0.4d** — Criar helper de autorização por role (ex: `requireRole('BARBERSHOP_ADMIN')`)
- [x] **0.4e** — Criar hook de tenant context: extrair `barbershopId` do JWT ou param da rota

### 0.5 Email Service

- [x] **0.5a** — Criar `src/shared/services/email.service.ts` (wrapper do Resend SDK)
  - Métodos: `sendMagicLink()`, `sendInvite()`, `sendOTP()`, `sendCancellationConfirmation()`, `sendBookingConfirmation()`

---

## Fase 1 — Módulo: Auth

_Pré-requisito: Fase 0._

**Diretório:** `src/modules/auth/`

### 1.1 Schemas de Validação

- [x] **1.1a** — Criar `src/modules/auth/models/auth.schema.ts`

### 1.2 Erros de Negócio

- [x] **1.2a** — Criar `src/modules/auth/errors/auth-errors.ts`

### 1.3 Gateway (Port & Adapter)

- [x] **1.3a** — Criar interface `src/modules/auth/gateways/auth.repository.ts`
- [x] **1.3b** — Criar implementação `src/modules/auth/gateways/prisma-auth.repository.ts`

### 1.4 Use Cases

- [x] **1.4a** — `staff-login.use-case.ts`
- [x] **1.4b** — `customer-google-auth.use-case.ts`
- [x] **1.4c** — `send-magic-link.use-case.ts`
- [x] **1.4d** — `verify-magic-link.use-case.ts`
- [x] **1.4e** — `refresh-token.use-case.ts`
- [x] **1.4f** — `logout.use-case.ts`
- [x] **1.4g** — `forgot-password.use-case.ts`
- [x] **1.4h** — `reset-password.use-case.ts`
- [x] **1.4i** — `accept-invite.use-case.ts`

### 1.5 Controllers

- [x] **1.5a** — `staff-login.controller.ts` em `controllers/` _TESTED_
- [x] **1.5b** — `customer-google-auth.controller.ts` em `controllers/` _TESTED_
- [x] **1.5c** — `send-magic-link.controller.ts`_TESTED_
- [x] **1.5d** — `verify-magic-link.controller.ts`_TESTED_
- [x] **1.5e** — `refresh-token.controller.ts`_TESTED_
- [x] **1.5f** — `logout.controller.ts`_TESTED_
- [x] **1.5g** — `forgot-password.controller.ts`_TESTED_
- [x] **1.5h** — `reset-password.controller.ts`_TESTED_
- [x] **1.5i** — `accept-invite.controller.ts`_TESTED_

### 1.6 Route

- [x] **1.6a** — Criar `src/modules/auth/auth.routes.ts`

### 1.7 Testes

- [x] Criar spec unitário `src/modules/auth/use-cases/staff-login.use-case.spec.ts`
- [x] Criar spec unitário `src/modules/auth/use-cases/customer-google-auth.use-case.spec.ts`
- [x] Criar spec unitário `src/modules/auth/use-cases/send-magic-link.use-case.spec.ts`
- [x] Criar spec unitário `src/modules/auth/use-cases/verify-magic-link.use-case.spec.ts`
- [x] Criar spec unitário `src/modules/auth/use-cases/refresh-token.use-case.spec.ts`
- [x] Criar spec unitário `src/modules/auth/use-cases/logout.use-case.spec.ts`
- [x] Criar spec unitário `src/modules/auth/use-cases/forgot-password.use-case.spec.ts`
- [x] Criar spec unitário `src/modules/auth/use-cases/reset-password.use-case.spec.ts`
- [x] Criar spec unitário `src/modules/auth/use-cases/accept-invite.use-case.spec.ts`

---

## Fase 2 — Módulo: Barbershop (Tenant)

_Pré-requisito: Fase 0 + Fase 1._

**Diretório:** `src/modules/barbershops/`

### 2.1 Schemas de Validação

- [x] **2.1a** — Criar `src/modules/barbershops/models/barbershop.schema.ts`

### 2.2 Erros

- [x] **2.2a** — Criar `src/modules/barbershops/errors/barbershop-errors.ts`

### 2.3 Gateway

- [x] **2.3a** — Criar interface `src/modules/barbershops/gateways/barbershop.repository.ts`
- [x] **2.3b** — Criar `src/modules/barbershops/gateways/prisma-barbershop.repository.ts`

### 2.4 Helpers

- [x] **2.4a** — Criar `src/modules/barbershops/helpers/geocoding.helper.ts`

### 2.5 Use Cases e Controllers

- [x] **2.5b** — `search-barbershops.use-case.ts` + controller _TESTED_
- [x] **2.5c** — `get-barbershop-profile.use-case.ts` + controller _TESTED_
- [x] **2.5d** — `get-bookable-staff.use-case.ts` + controller + spec _TESTED_
- [x] **2.5e** — `get-services.use-case.ts` + controller + spec _TESTED_
- [x] **2.5f** — `create-barbershop.use-case.ts` + controller + spec _TESTED_
- [x] **2.5g** — `update-barbershop-status.use-case.ts` + controller + spec _TESTED_
- [x] **2.5h** — `update-barbershop-profile.use-case.ts` + controller + spec _TESTED_
- [x] **2.5i** — `replace-operating-hours.use-case.ts` + controller + spec _TESTED_
- [x] **2.5j** — `preview-blocked-dates.use-case.ts` + controller + spec _TESTED_
- [x] **2.5l** — `delete-blocked-date.use-case.ts` + controller + spec _TESTED_

### 2.6 Route

- [x] **2.6a** — Criar `src/modules/barbershops/barbershops.routes.ts`

---

## Fase 3 — Módulo: Staff

_Pré-requisito: Fase 0 + Fase 1 + Fase 2._

**Diretório:** `src/modules/staff/`

### 3.1 Schemas

- [x] **3.1a** — Criar `src/modules/staff/models/staff.schema.ts`

### 3.2 Erros

- [x] **3.2a** — Criar `src/modules/staff/errors/staff-errors.ts`

### 3.3 Gateway

- [x] **3.3a** — Criar `src/modules/staff/gateways/staff.repository.ts`
- [x] **3.3b** — Criar `src/modules/staff/gateways/prisma-staff.repository.ts`

### 3.4 Use Cases e Controllers

- [x] **3.4a** — `list-staff.use-case.ts` + controller + spec _TESTED_
- [x] **3.4b** — `invite-staff.use-case.ts` + controller + spec _TESTED_
- [x] **3.4c** — `update-staff.use-case.ts` + controller + spec _TESTED_
- [x] **3.4e** — `soft-delete-staff.use-case.ts` + controller + spec _TESTED_

### 3.5 Route

- [x] **3.5a** — Criar `src/modules/staff/staff.routes.ts`

---

## Fase 4 — Módulo: Service

_Pré-requisito: Fase 0 + Fase 1 + Fase 2._

**Diretório:** `src/modules/services/`

### 4.1 Schemas

- [x] **4.1a** — Criar `src/modules/services/models/service.schema.ts`

### 4.2 Erros

- [x] **4.2a** — Criar `src/modules/services/errors/service-errors.ts`

### 4.3 Gateway

- [x] **4.3a** — Criar `src/modules/services/gateways/service.repository.ts`
- [x] **4.3b** — Criar `src/modules/services/gateways/prisma-service.repository.ts`

### 4.4 Use Cases e Controllers

- [x] **4.4a** — `list-services.use-case.ts` + controller _TESTED_
- [x] **4.4b** — `create-service.use-case.ts` + controller _TESTED_
- [x] **4.4c** — `update-service.use-case.ts` + controller _TESTED_
- [x] **4.4d** — `soft-delete-service.use-case.ts` + controller _TESTED_

### 4.5 Route

- [x] **4.5a** — Criar `src/modules/services/services.routes.ts`

### 4.6 Testes

- [x] Criar spec unitário `src/modules/services/use-cases/list-services.use-case.spec.ts`
- [x] Criar spec unitário `src/modules/services/use-cases/create-service.use-case.spec.ts`
- [x] Criar spec unitário `src/modules/services/use-cases/update-service.use-case.spec.ts`
- [x] Criar spec unitário `src/modules/services/use-cases/soft-delete-service.use-case.spec.ts`

---

## Fase 5 — Módulo: Booking (Appointment)

_Pré-requisito: Fase 0 + Fase 1 + Fase 2 + Fase 3 + Fase 4._

**Diretório:** `src/modules/booking/`

### 5.1 Schemas

- [x] **5.1a** — Criar `src/modules/booking/models/appointment.schema.ts`

### 5.2 Erros

- [x] **5.2a** — Criar `src/modules/booking/errors/booking-errors.ts`

### 5.3 Helpers

- [x] **5.3a** — Criar `src/modules/booking/helpers/slot-math.helper.ts`

### 5.4 Gateway

- [x] **5.4a** — Criar `src/modules/booking/gateways/appointment.repository.ts`
- [x] **5.4b** — Criar `src/modules/booking/gateways/prisma-appointment.repository.ts`

### 5.5 Use Cases e Controllers

- [x] **5.5a** — `get-slots.use-case.ts` + controller
- [x] **5.5b** — `create-appointment.use-case.ts` + controller _TESTED_
- [x] **5.5c** — `list-customer-appointments.use-case.ts` + controller _TESTED_
- [x] **5.5d** — `get-customer-appointment-detail.use-case.ts` + controller _TESTED_
- [x] **5.5e** — `customer-cancel-appointment.use-case.ts` + controller _TESTED_
- [x] **5.5f** — `staff-list-appointments.use-case.ts` + controller _TESTED_
- [x] **5.5g** — `staff-get-appointment-detail.use-case.ts` + controller _TESTED_
- [x] **5.5i** — `mark-appointment-done.use-case.ts` + controller _TESTED_

### 5.6 Route

- [x] **5.6a** — Criar `src/modules/booking/booking.routes.ts`

---

## Fase 6 — Módulo: Metrics

_Pré-requisito: Fase 0 + Fase 1 + Fase 2._

**Diretório:** `src/modules/metrics/`

### 6.1 Schemas

- [ ] **6.1a** — Criar `src/modules/metrics/models/metrics.schema.ts`

### 6.2 Use Case e Controller

- [ ] **6.2a** — `get-metrics.use-case.ts` + controller

### 6.3 Route

- [ ] **6.3a** — Criar `src/modules/metrics/metrics.routes.ts`

---

## Fase 7 — Módulo: File Upload

_Pré-requisito: Fase 0 + Fase 1._

**Diretório:** `src/modules/upload/`

### 7.1 Schemas

- [ ] **7.1a** — Criar `src/modules/upload/models/upload.schema.ts`

### 7.2 Erros

- [ ] **7.2a** — Criar `src/modules/upload/errors/upload-errors.ts`

### 7.3 Use Cases e Controllers

- [ ] **7.3a** — `upload-barbershop-logo.use-case.ts` + controller
- [ ] **7.3b** — `upload-staff-avatar.use-case.ts` + controller

### 7.4 Route

- [ ] **7.4a** — Criar `src/modules/upload/upload.routes.ts`

---

## Fase 8 — Seed & Scripts Auxiliares

- [x] **8.1** — Criar `prisma/seed.ts` com dados de teste

---

## Progresso

| Fase            | Status          |
| --------------- | --------------- |
| 0 — Fundação    | 🟢 Completo     |
| 1 — Auth        | 🟢 Completo     |
| 2 — Barbershop  | 🟢 Completo     |
| 3 — Staff       | 🟢 Completo     |
| 4 — Service     | 🟢 Completo     |
| 5 — Booking     | 🟢 Completo     |
| 6 — Metrics     | 🔴 Não iniciado |
| 7 — File Upload | 🔴 Não iniciado |
| 8 — Seed        | 🟢 Completo     |
