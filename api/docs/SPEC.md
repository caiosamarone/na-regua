# Na Régua — API Technical Specification

> Gerada a partir das ADRs 001–012. Data: 2026-07-02.
> Esta SPEC é o guia de implementação para desenvolvedores.
> Decisões de arquitetura detalhadas estão nas ADRs correspondentes.

---

## 1. Introdução

### 1.1 Stack & Tecnologias

| Camada | Tecnologia | Versão / Notas |
|--------|-----------|----------------|
| Runtime | Node.js + TypeScript | Strict mode |
| Framework | Fastify | Plugins: @fastify/rate-limit, @fastify/cors, @fastify/multipart |
| ORM | Prisma 6 | PostgreSQL provider |
| Banco | PostgreSQL (Neon) | Extensions: cube, earthdistance, btree_gist |
| Validação | Zod | Schemas em todos os endpoints |
| Logger | Pino | Fastify built-in |
| Email | Resend HTTP SDK | Templates em src/modules/templates/ |
| Upload | Cloudinary Node.js SDK | Imagens: JPEG, PNG, WebP ≤ 5MB |
| Geocoding | Nominatim (OSM) | Gratuito, sem API key |
| Datetime | date-fns-tz ou luxon | Conversões UTC ↔ local |

### 1.2 Convenções Gerais

#### 1.2.1 Formato de Resposta (ADR 005)

**Sucesso:**
```json
{ "data": { ... } }
```

**Erro:**
```json
{
  "error": "Human-readable message",
  "code": "ERROR_CODE",
  "details": {}
}
```

#### 1.2.2 Autenticação (ADR 002)

- Header: `Authorization: Bearer <token>`
- Access token: JWT HS256, 30min
- Refresh token: opaco (SHA-256 hash no BD), 7 dias, rotação com reuse detection
- Staff JWT: `{ sub, role, barbershopId }` — `barbershopId` presente
- Customer JWT: `{ sub, role: "CUSTOMER" }` — sem `barbershopId`

**Roles por ordem de privilégio:** `SUPER_ADMIN` > `BARBERSHOP_ADMIN` > `BARBER` > `CUSTOMER`

#### 1.2.3 Multi-Tenancy (ADR 001)

- Tabelas tenant-scoped possuem `barbershopId` FK
- Hook do Fastify injeta `barbershopId` automaticamente a partir do JWT de staff
- Customer JWT **não** carrega `barbershopId` — o contexto vem do request (rota `/barbershops/:id`)
- `SUPER_ADMIN` não tem tenant — `barbershopId` é null no JWT

#### 1.2.4 Timezone (ADR 010)

| Tipo | Armazenamento | Exemplo |
|------|--------------|---------|
| Instantes absolutos | `timestamptz` UTC | `Appointment.startTime`, `cancelledAt` |
| Horários operacionais | Wall-clock local (String `HH:mm`) | `OperatingHour.startTime = "09:00"` |
| Fuso do barbershop | IANA (String) | `Barbershop.timezone = "America/Sao_Paulo"` |

- Conversões UTC ↔ local acontecem **sempre na API**
- Frontend exibe em local time do barbershop, não faz math de timezone

#### 1.2.5 Soft Delete (ADR 011)

| Entidade | Flag | Pode desativar se houver future BOOKED? |
|----------|------|----------------------------------------|
| StaffMember | `isActive` | ❌ HTTP 409 com lista de appointments |
| Service | `isActive` | ✅ A qualquer momento |
| Barbershop | `active` | ✅ (Super Admin apenas) |

`isBookable` vs `isActive`: flags independentes. `isBookable=false` = indisponível para **novos** bookings, mantém appointments futuros.

---

## 2. Módulo: Auth

### 2.1 Entidades

#### StaffMember

| Campo | Tipo | Notas |
|-------|------|-------|
| id | String (CUID) | PK |
| barbershopId | String? | FK → Barbershop. Nullable para SUPER_ADMIN |
| email | String | Unique |
| passwordHash | String | bcrypt 10 rounds |
| name | String | |
| role | Enum | SUPER_ADMIN, BARBERSHOP_ADMIN, BARBER |
| isBookable | Boolean | default: BARBER=true, BARBERSHOP_ADMIN=false |
| isActive | Boolean | default true |
| avatarUrl | String? | Cloudinary URL |
| createdAt | DateTime | |
| updatedAt | DateTime | |

#### Customer

| Campo | Tipo | Notas |
|-------|------|-------|
| id | String (CUID) | PK |
| email | String | Unique — chave canônica cross-tenant |
| name | String | |
| googleId | String? | Unique. Só vincula se email do Google for **verified** |
| avatarUrl | String? | Google profile photo |
| createdAt | DateTime | |
| updatedAt | DateTime | |

#### RefreshToken

| Campo | Tipo | Notas |
|-------|------|-------|
| id | String (CUID) | PK |
| tokenHash | String | SHA-256 do token opaco |
| staffMemberId | String? | FK → StaffMember |
| customerId | String? | FK → Customer |
| expiresAt | DateTime | 7 dias |
| revoked | Boolean | default false |
| family | String | Identificador para reuse detection |

#### MagicLinkToken

| Campo | Tipo | Notas |
|-------|------|-------|
| id | String (CUID) | PK |
| tokenHash | String | SHA-256 |
| customerId | String | FK → Customer |
| expiresAt | DateTime | 15 minutos |
| consumedAt | DateTime? | Null se ainda não consumido |

### 2.2 Fluxos

#### Staff Login

```
POST /auth/login
Body: { email, password }
Response 200: { data: { accessToken, refreshToken, staff: { id, name, email, role, barbershopId } } }
Error 401: UNAUTHORIZED — credenciais inválidas
```

#### Customer Google OAuth

```
POST /auth/google
Body: { idToken: string }     // Google ID Token verificado pela API
Response 200: { data: { accessToken, refreshToken, customer: { id, name, email } } }
```

- Se email já existe → linka `googleId` no Customer existente
- Se email Google **não verified** → bloqueia vinculo automático

#### Customer Magic Link

```
POST /auth/magic-link
Body: { email }
Response 200: { data: { message: "Email sent if account exists" } }
// Sempre 200 mesmo se email não existe (evita enumeração)

POST /auth/magic-link/verify
Body: { token: string }
Response 200: { data: { accessToken, refreshToken, customer: { id, name, email } } }
Error 401: MAGIC_LINK_INVALID — token expirado ou já consumido
```

#### Refresh Token Rotation

```
POST /auth/refresh
Body: { refreshToken: string }
Response 200: { data: { accessToken, refreshToken } }
```

- Valida hash no BD, verifica expiração e `revoked`
- Se token já revogado → **reuse detection**: revoga toda a família (todos tokens com mesmo `family`)
- Rotaciona: revoga atual + emite novo par

#### Password Reset (OTP)

```
POST /auth/forgot-password
Body: { email }
Rate limit: 3/email/hour, 5/IP/hour
Response 200: { data: { message: "OTP sent if email exists" } }

POST /auth/reset-password
Body: { email, otp: string, newPassword: string }
Response 200: { data: { message: "Password updated" } }
```

- OTP: 6 dígitos criptograficamente aleatório, hash SHA-256, 15min expiry
- `newPassword` deve seguir política: 8+ chars, 1 uppercase, 1 símbolo

#### Invite Flow (Barbershop Admin)

```
// 1. Super Admin cria barbershop + envia invite
POST /barbershops
Body: { name, address, cep, adminEmail }
Auth: SUPER_ADMIN
Response 201: { data: { barbershop, invitationSent: true } }

// 2. Admin recebe email com link → define senha
POST /auth/accept-invite
Body: { token, name, password }
Response 200: { data: { accessToken, refreshToken } }
```

### 2.3 Endpoints

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| POST | `/auth/login` | No | Staff login |
| POST | `/auth/refresh` | No | Refresh token rotation |
| POST | `/auth/google` | No | Customer Google OAuth |
| POST | `/auth/magic-link` | No | Envia magic link email |
| POST | `/auth/magic-link/verify` | No | Consome magic link |
| POST | `/auth/forgot-password` | No | Envia OTP |
| POST | `/auth/reset-password` | No | Redefine senha com OTP |
| POST | `/auth/accept-invite` | No | Aceita convite + define senha |

### 2.4 Role Matrix

| Ação | SUPER_ADMIN | BARBERSHOP_ADMIN | BARBER | CUSTOMER |
|------|-------------|------------------|--------|----------|
| Criar/ativar/desativar barbershop | ✅ | ❌ | ❌ | ❌ |
| Gerenciar staff/services/horários | ❌ | ✅ | ❌ | ❌ |
| Toggle isBookable (qualquer staff) | ❌ | ✅ | ❌ | ❌ |
| Ver métricas | ❌ | ✅ | ❌ | ❌ |
| Ver agenda (todos staff) | ❌ | ✅ | ❌ | ❌ |
| Ver própria agenda | ❌ | ✅ | ✅ | ❌ |
| Marcar DONE | ❌ | ✅ | ✅ | ❌ |
| Cancelar appointment (staff) | ❌ | ✅ | ✅ | ❌ |
| Cancelar próprio appointment | ❌ | ❌ | ❌ | ✅ |
| Bloquear datas | ❌ | ✅ | ❌ | ❌ |

---

## 3. Módulo: Barbershop (Tenant)

### 3.1 Entidades

#### Barbershop

| Campo | Tipo | Notas |
|-------|------|-------|
| id | String (CUID) | PK |
| name | String | |
| slug | String | Unique, usado em URLs |
| address | String | |
| cep | String | |
| neighborhood | String | |
| city | String | |
| state | String | |
| latitude | Float? | Nullable — se geocoding falhar |
| longitude | Float? | Nullable |
| timezone | String | IANA, ex: "America/Sao_Paulo" |
| phone | String? | |
| logoUrl | String? | Cloudinary URL |
| slotIntervalMinutes | Int | Default 30 |
| cancellationLeadTimeMinutes | Int | Default 180 (3h) |
| active | Boolean | Default false. Super Admin ativa |
| createdAt | DateTime | |
| updatedAt | DateTime | |

#### OperatingHour

| Campo | Tipo | Notas |
|-------|------|-------|
| id | String (CUID) | PK |
| barbershopId | String | FK → Barbershop |
| dayOfWeek | Int | 0=Dom, 1=Seg, ..., 6=Sáb |
| startTime | String | "HH:mm" local |
| endTime | String | "HH:mm" local |

Split shifts: um `dayOfWeek` pode ter múltiplos registros. Ex: (1, "09:00", "12:00") e (1, "13:00", "18:00").

#### BlockedDate

| Campo | Tipo | Notas |
|-------|------|-------|
| id | String (CUID) | PK |
| barbershopId | String | FK → Barbershop |
| startDate | DateTime | Whole-day, meia-noite local |
| endDate | DateTime | Whole-day, meia-noite local |
| reason | String? | Ex: "Reforma", "Feriado" |

### 3.2 Endpoints

#### Públicos (sem auth)

| Método | Rota | Parâmetros | Descrição |
|--------|------|-----------|-----------|
| GET | `/barbershops/nearby` | `lat, lng, radius` (metros) | Proximity search via earthdistance |
| GET | `/barbershops` | `?city=&neighborhood=&q=` | Text search fallback |
| GET | `/barbershops/:id` | — | Perfil + horários + serviços + staff bookable |
| GET | `/barbershops/:id/staff` | — | Lista staff com `isBookable=true` e `isActive=true` |
| GET | `/barbershops/:id/services` | — | Lista serviços com `isActive=true` |

#### Super Admin

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| POST | `/barbershops` | SUPER_ADMIN | Criar + enviar invite admin |
| PATCH | `/barbershops/:id/status` | SUPER_ADMIN | Ativar/desativar (`active`) |

#### Barbershop Admin

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| PATCH | `/barbershops/:id/profile` | BARBERSHOP_ADMIN | Editar nome, endereço, timezone, phone |
| POST | `/barbershops/:id/logo` | BARBERSHOP_ADMIN | Upload logo (multipart) |
| GET | `/barbershops/:id/operating-hours` | BARBERSHOP_ADMIN | Listar grade atual |
| PUT | `/barbershops/:id/operating-hours` | BARBERSHOP_ADMIN | **Substituir** grade completa (array) |
| POST | `/barbershops/:id/blocked-dates` | BARBERSHOP_ADMIN | Criar blocked date range |
| DELETE | `/barbershops/:id/blocked-dates/:id` | BARBERSHOP_ADMIN | Remover blocked date |

#### PUT /operating-hours — Regras

```json
// Request body
[
  { "dayOfWeek": 1, "startTime": "09:00", "endTime": "12:00" },
  { "dayOfWeek": 1, "startTime": "13:00", "endTime": "18:00" },
  { "dayOfWeek": 2, "startTime": "09:00", "endTime": "18:00" }
]
```

- Substituição **atômica**: deleta todos registros existentes e insere novos (numa transação)
- Dias não enviados = fechado (sem OperatingHour para aquele dayOfWeek)
- Validação Zod: `startTime` < `endTime`, formato `HH:mm`, intervalos não podem sobrepor no mesmo dia

#### POST /blocked-dates — Regras

- Ao criar um bloqueio, a API **deve retornar** a lista de appointments `BOOKED` afetados:
```json
{
  "data": {
    "blockedDate": { ... },
    "affectedAppointments": [
      { "id": "...", "customerId": "...", "startTime": "...", "serviceName": "..." }
    ]
  }
}
```

- O admin **confirma** o bloqueio para que os appointments sejam cancelados automaticamente com:
  - `cancelledByRole = BARBERSHOP_ADMIN`
  - `cancellationReason` = reason do block
- Email de cancelamento enviado para cada customer afetado

### 3.3 Geolocation (ADR 007)

```sql
SELECT * FROM barbershops
WHERE earth_box(ll_to_earth(:lat, :lng), :radius_meters) @> ll_to_earth(lat, lng)
  AND earth_distance(ll_to_earth(:lat, :lng), ll_to_earth(lat, lng)) <= :radius_meters
  AND active = true
  AND latitude IS NOT NULL
```

- Query executa via Prisma `$queryRawUnsafe` ou view materializada
- Índice GiST: `CREATE INDEX idx_barbershop_location ON barbershops USING gist (ll_to_earth(latitude, longitude));`
- Fallback text search: `WHERE city ILIKE :q OR neighborhood ILIKE :q AND active = true`

#### Geocoding na Criação

- Super Admin informa CEP + endereço
- API chama Nominatim (OSM) para resolver coordenadas
- Se geocoding falhar → `latitude`/`longitude` = null → barbershop aparece apenas em text search
- Admin pode corrigir endereço + re-geocodificar via `PATCH /barbershops/:id/profile`
- Manual override: admin pode enviar `latitude`/`longitude` explicitamente

---

## 4. Módulo: Staff

### 4.1 Entidade

StaffMember (mesma tabela do módulo Auth — vide seção 2.1)

### 4.2 Endpoints

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/barbershops/:id/staff` | BARBERSHOP_ADMIN | Listar todo staff do tenant |
| GET | `/barbershops/:id/staff/bookable` | No | Listar apenas staff bookable (customer picker) |
| POST | `/barbershops/:id/staff` | BARBERSHOP_ADMIN | Convidar novo staff (email + role) |
| PATCH | `/staff/:id` | BARBERSHOP_ADMIN | Editar nome, role |
| PATCH | `/staff/:id/bookable` | BARBERSHOP_ADMIN | Toggle isBookable |
| DELETE | `/staff/:id` | BARBERSHOP_ADMIN | Soft-delete (isActive=false) |
| POST | `/staff/:id/avatar` | BARBERSHOP_ADMIN | Upload avatar (multipart) |

### 4.3 Regras

#### Bookable Staff Query (customer picker)
```sql
WHERE role IN ('BARBER', 'BARBERSHOP_ADMIN')
  AND isBookable = true
  AND isActive = true
  AND barbershopId = :id
```

#### Toggle isBookable
- `BARBER`: default `true` — admin pode desativar
- `BARBERSHOP_ADMIN`: default `false` — admin pode ativar para si
- `SUPER_ADMIN`: sempre `isBookable = false` (não é tenant-scoped)

#### Soft-Delete (isActive = false)
```
DELETE /staff/:id
```

**Validação:**
1. Buscar todos appointments com `status = BOOKED` e `startTime > now()` para este staff
2. Se existir qualquer um → HTTP 409:
```json
{
  "error": "Staff member has future appointments. Cancel or reassign them first.",
  "code": "STAFF_HAS_FUTURE_BOOKINGS",
  "details": {
    "appointments": [ { "id": "...", "startTime": "...", "customerId": "..." } ]
  }
}
```
3. Se não existirem → seta `isActive = false`

---

## 5. Módulo: Service

### 5.1 Entidade

| Campo | Tipo | Notas |
|-------|------|-------|
| id | String (CUID) | PK |
| barbershopId | String | FK → Barbershop |
| name | String | |
| description | String? | |
| durationMinutes | Int | Ex: 30, 45, 60 |
| price | Decimal | BRL (R$) |
| isActive | Boolean | Default true |
| createdAt | DateTime | |
| updatedAt | DateTime | |

### 5.2 Endpoints

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/barbershops/:id/services` | No | Lista serviços ativos |
| GET | `/barbershops/:id/services?all=true` | BARBERSHOP_ADMIN | Lista todos (inclusive inativos) |
| POST | `/barbershops/:id/services` | BARBERSHOP_ADMIN | Criar serviço |
| PATCH | `/services/:id` | BARBERSHOP_ADMIN | Editar nome, duração, preço |
| DELETE | `/services/:id` | BARBERSHOP_ADMIN | Soft-delete (isActive=false) |

### 5.3 Regras

- Soft-delete permitido **a qualquer momento**, mesmo com appointments futuros
- Appointments existentes mantêm o snapshot (`serviceName`, `priceAtBooking`, `durationAtBooking`)
- Serviço inativo não aparece no customer picker, mas o histórico de appointments permanece íntegro

---

## 6. Módulo: Booking (Appointment)

### 6.1 Entidade

#### Appointment

| Campo | Tipo | Notas |
|-------|------|-------|
| id | String (CUID) | PK |
| barbershopId | String | FK → Barbershop |
| customerId | String | FK → Customer |
| barberId | String | FK → StaffMember |
| serviceName | String | Snapshot no momento do booking |
| priceAtBooking | Decimal | Snapshot |
| durationAtBooking | Int | Snapshot (minutos) |
| startTime | DateTime (timestamptz) | UTC |
| endTime | DateTime (timestamptz) | UTC (startTime + durationAtBooking) |
| status | Enum | BOOKED, CANCELLED, DONE |
| cancelledById | String? | FK → Customer ou StaffMember |
| cancelledByRole | Enum? | CUSTOMER, BARBER, BARBERSHOP_ADMIN |
| cancellationReason | String? | Free text |
| cancelledAt | DateTime? | UTC |
| createdAt | DateTime | |
| updatedAt | DateTime | |

### 6.2 Endpoints

#### Customer

| Método | Rota | Auth | Parâmetros | Descrição |
|--------|------|------|-----------|-----------|
| GET | `/barbershops/:id/slots` | No | `barberId`, `serviceId`, `date` | Slots disponíveis |
| POST | `/appointments` | CUSTOMER | `barbershopId, barberId, serviceId, startTime` | Criar booking |
| GET | `/customers/me/appointments` | CUSTOMER | `?status=&from=&to=` | Listar próprios appointments |
| GET | `/customers/me/appointments/:id` | CUSTOMER | — | Detalhe appointment |
| PATCH | `/appointments/:id/cancel` | CUSTOMER | `?reason=` | Cancelar próprio appointment |

#### Staff

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/barbershops/:id/appointments` | BARBERSHOP_ADMIN, BARBER | Listar appointments (filtro: `?date=&barberId=&status=`) |
| GET | `/barbershops/:id/appointments/:id` | BARBERSHOP_ADMIN, BARBER | Detalhe |
| PATCH | `/appointments/:id/cancel` | BARBERSHOP_ADMIN, BARBER | Cancelar (staff) |
| PATCH | `/appointments/:id/done` | BARBERSHOP_ADMIN, BARBER | Marcar como DONE |

### 6.3 Slot Calculation — Algoritmo

```
GET /barbershops/:id/slots?barberId=x&serviceId=y&date=2026-07-03
```

**Passo a passo:**

1. **Buscar OperatingHours** do barbershop para o `dayOfWeek` da `date`
2. **Excluir BlockedDates** — se `date` cair em algum range bloqueado, retornar lista vazia
3. **Buscar appointment duração** do serviço (`durationAtBooking` = `Service.durationMinutes`)
4. **Buscar appointments BOOKED** do barber na `date` (filtrar por `startTime`/`endTime` no dia UTC)
5. **Gerar grid de candidatos** a partir de cada operating interval:
   - Step: `Barbershop.slotIntervalMinutes` (default 30)
   - Exemplo: intervalo 09:00–12:00 → candidatos: 09:00, 09:30, 10:00, ..., 11:30
6. **Validar cada candidato**: `[start, start + duration]` cabe **inteiramente dentro** de um operating interval?
7. **Remover colisões**: candidato é removido se `[start, start + duration)` sobrepõe qualquer appointment BOOKED
8. **Retornar** array de `{ startTime: string (ISO local), endTime: string (ISO local) }`

```typescript
// Pseudo-código
function calculateSlots(barbershop, barberId, serviceId, date): Slot[] {
  const dayOfWeek = date.getDay()
  const intervals = getOperatingHours(barbershop.id, dayOfWeek)
  if (isBlocked(barbershop.id, date)) return []

  const duration = getServiceDuration(serviceId) // ou durationAtBooking
  const booked = getBookedAppointments(barberId, date) // BOOKED only

  const slots: Slot[] = []
  for (const interval of intervals) {
    for (let time = interval.start; time + duration <= interval.end; time += barbershop.slotIntervalMinutes) {
      const slotEnd = time + duration
      const hasConflict = booked.some(apt =>
        (time < apt.endTime && slotEnd > apt.startTime)
      )
      if (!hasConflict) slots.push({ startTime: time, endTime: slotEnd })
    }
  }
  return slots
}
```

**Observações de timezone:**
- `date` recebida como string ISO (ex: "2026-07-03") — interpretada no fuso do barbershop
- Operating hours estão em wall-clock local
- Candidatos são convertidos para UTC para comparação com appointments (que estão em timestamptz)
- Slots retornados são convertidos de volta para local time do barbershop

### 6.4 Double-Booking Prevention

**Duas camadas:**

1. **App Layer** (transação Prisma):
```typescript
await prisma.$transaction(async (tx) => {
  const conflict = await tx.appointment.findFirst({
    where: {
      barberId,
      status: 'BOOKED',
      startTime: { lt: endTime },
      endTime: { gt: startTime },
    }
  })
  if (conflict) throw new AppError(409, 'APPOINTMENT_CONFLICT')
  return tx.appointment.create({ data: { ... } })
})
```

2. **DB Layer** (PostgreSQL exclusion constraint):
```sql
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE "Appointment"
ADD CONSTRAINT no_double_booking
EXCLUDE USING gist (
  "barberId" WITH =,
  tstzrange("startTime", "endTime") WITH &&
)
WHERE (status = 'BOOKED');
```

- Violação do exclusion constraint → Prisma lança erro mapeado para HTTP 409 `APPOINTMENT_CONFLICT`

### 6.5 Status Machine

```
BOOKED ──────────→ CANCELLED  (qualquer role autorizada)
BOOKED ──────────→ DONE       (só barber/admin, apenas após startTime)
CANCELLED ───────→ (terminal)
DONE ────────────→ (terminal)
```

#### Regra DONE
- `PATCH /appointments/:id/done` só pode ser chamado **após** `startTime` ter passado (comparação UTC)
- Se tentar marcar DONE antes do horário → HTTP 400 `APPOINTMENT_NOT_YET_STARTED`

### 6.6 Cancellation (ADR 008)

#### Customer Cancellation

```
PATCH /appointments/:id/cancel (CUSTOMER)
```

1. Verificar se appointment pertence ao customer (JWT `sub`)
2. Calcular lead time restante: `Appointment.startTime - now()`
3. Se `leadTimeRestante < Barbershop.cancellationLeadTimeMinutes`:
   - Response inclui aviso:
```json
{
  "data": {
    "appointment": { ... },
    "warning": "50% do valor do serviço pode ser cobrado. Esta é uma simulação — nenhum pagamento será processado."
  }
}
```
4. Se lead time ainda válido → cancelamento livre
5. Atualizar: `status=CANCELLED`, `cancelledById`, `cancelledByRole=CUSTOMER`, `cancellationReason`, `cancelledAt`
6. Enviar email de confirmação de cancelamento

#### Staff Cancellation

```
PATCH /appointments/:id/cancel (BARBER | BARBERSHOP_ADMIN)
```

- `cancelledByRole = staff.role`
- Sem validação de lead time (staff pode cancelar qualquer appointment)
- Enviar email para o customer

#### Availability After Cancellation
- Slot é imediatamente disponível para re-booking (sem cool-down)

---

## 7. Módulo: Metrics

### 7.1 Endpoint

| Método | Rota | Auth | Parâmetros | Descrição |
|--------|------|------|-----------|-----------|
| GET | `/barbershops/:id/metrics` | BARBERSHOP_ADMIN | `from` (ISO date), `to` (ISO date) | Métricas do período |

### 7.2 Agregações

Todas as queries escopo `barbershopId` + range `[from, to]` em `startTime`.

#### Total Revenue
```sql
SELECT SUM("priceAtBooking")::decimal
FROM "Appointment"
WHERE "barbershopId" = :id
  AND status = 'DONE'
  AND "startTime" >= :from
  AND "startTime" < :to + interval '1 day'
```

#### Top Services
```sql
SELECT "serviceName",
       COUNT(*)::int as "bookingCount",
       SUM("priceAtBooking")::decimal as "revenue"
FROM "Appointment"
WHERE "barbershopId" = :id AND status = 'DONE'
  AND "startTime" >= :from AND "startTime" < :to + interval '1 day'
GROUP BY "serviceName"
ORDER BY "revenue" DESC
LIMIT 10
```

#### Top Barbers
```sql
SELECT "barberId",
       COUNT(*)::int as "appointmentCount",
       SUM("priceAtBooking")::decimal as "revenue"
FROM "Appointment"
WHERE "barbershopId" = :id AND status = 'DONE'
  AND "startTime" >= :from AND "startTime" < :to + interval '1 day'
GROUP BY "barberId"
ORDER BY "revenue" DESC
LIMIT 10
```

#### Busiest Days
```sql
SELECT DATE("startTime") as "date",
       COUNT(*)::int as "appointmentCount"
FROM "Appointment"
WHERE "barbershopId" = :id AND status = 'DONE'
  AND "startTime" >= :from AND "startTime" < :to + interval '1 day'
GROUP BY DATE("startTime")
ORDER BY "appointmentCount" DESC
LIMIT 10
```

### 7.3 Regras
- **Apenas DONE** conta como receita. BOOKED e CANCELLED são excluídos.
- Valores usam `priceAtBooking` (snapshot), não preço atual do serviço
- Acesso exclusivo BARBERSHOP_ADMIN
- On-the-fly aggregation via Prisma `groupBy` ou raw SQL

---

## 8. Módulo: File Upload

### 8.1 Fluxo

```
Frontend (multipart/form-data) → API → valida tipo/tamanho → Cloudinary SDK → URL salva no BD
```

### 8.2 Endpoints

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| POST | `/upload/barbershop-logo` | BARBERSHOP_ADMIN | Upload logo da barbearia |
| POST | `/upload/staff-avatar` | BARBERSHOP_ADMIN | Upload avatar de staff |

### 8.3 Validação

```typescript
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_SIZE = 5 * 1024 * 1024 // 5MB

// Validar antes de enviar ao Cloudinary
if (!ALLOWED_TYPES.includes(file.mimetype)) throw new AppError(400, 'INVALID_FILE_TYPE')
if (file.size > MAX_SIZE) throw new AppError(400, 'FILE_TOO_LARGE')
```

### 8.4 Cloudinary Config

- Upload via `cloudinary.uploader.upload()` (stream ou buffer)
- `folder`: `na-regua/barbershops/:id/` ou `na-regua/staff/:id/`
- Response: `{ url: "https://res.cloudinary.com/..." }`
- Salvar URL no BD: `Barbershop.logoUrl` ou `StaffMember.avatarUrl`

---

## 9. Apêndices

### A. Error Codes

| HTTP | Code | Quando |
|------|------|--------|
| 400 | `VALIDATION_ERROR` | Zod validation failure. `details` contém erros por campo |
| 400 | `INVALID_FILE_TYPE` | Upload com tipo não permitido |
| 400 | `FILE_TOO_LARGE` | Upload > 5MB |
| 400 | `APPOINTMENT_NOT_YET_STARTED` | Tentativa de marcar DONE antes do startTime |
| 401 | `UNAUTHORIZED` | Token ausente, inválido ou expirado |
| 401 | `MAGIC_LINK_INVALID` | Token de magic link expirado ou já consumido |
| 403 | `FORBIDDEN` | Token válido, mas role não tem permissão |
| 404 | `NOT_FOUND` | Recurso não encontrado |
| 409 | `APPOINTMENT_CONFLICT` | Double-booking detectado |
| 409 | `EMAIL_ALREADY_EXISTS` | Email duplicado (staff ou customer) |
| 409 | `STAFF_HAS_FUTURE_BOOKINGS` | Tentativa de desativar staff com appointments futuros |
| 429 | `RATE_LIMIT_EXCEEDED` | Rate limit atingido |

### B. Rate Limits (ADR 003)

| Escopo | Limite | Janela |
|--------|--------|--------|
| Global (todos endpoints) | 100 req | 1 minuto |
| Auth endpoints | 10 req | 1 minuto |
| Auth por email | 3 req | 1 hora |
| Appointment creation | 20 req | 1 minuto (autenticado) |

Configuração via `@fastify/rate-limit`.

### C. PostgreSQL Extensions

```sql
CREATE EXTENSION IF NOT EXISTS cube;
CREATE EXTENSION IF NOT EXISTS earthdistance;
CREATE EXTENSION IF NOT EXISTS btree_gist;
```

| Extension | Usada em |
|-----------|----------|
| `cube` | Dependência do `earthdistance` |
| `earthdistance` | Proximity search (geolocation) |
| `btree_gist` | Exclusion constraint (double-booking prevention) |

Habilitar no Neon via dashboard SQL editor ou migration Prisma `CREATE EXTENSION`.
