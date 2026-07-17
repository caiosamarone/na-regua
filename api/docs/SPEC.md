# Na Régua — API Technical Specification

> Gerada a partir das ADRs 001–014. Revisão: 2026-07-02 (v2).
> Esta SPEC é o guia de implementação para desenvolvedores.
> Decisões de arquitetura detalhadas estão nas ADRs correspondentes.
>
> **Mudanças da v2:** entidades `OtpToken` e `InvitationToken`; endpoint de logout;
> slot calculation com conversão de timezone explícita (ADR 010); fluxo de
> confirmação em duas etapas para blocked dates; rejeição de cancel/done em
> estados terminais; rate limit de OTP por IP; correções em rotas e query de geolocation.

---

## 1. Introdução

### 1.1 Stack & Tecnologias

| Camada    | Tecnologia             | Versão / Notas                                                                |
| --------- | ---------------------- | ----------------------------------------------------------------------------- |
| Runtime   | Node.js + TypeScript   | Strict mode                                                                   |
| Framework | Fastify                | Plugins: @fastify/rate-limit, @fastify/cors, @fastify/multipart, @fastify/jwt |
| ORM       | Prisma 6               | PostgreSQL provider                                                           |
| Banco     | PostgreSQL (Neon)      | Extensions: cube, earthdistance, btree_gist                                   |
| Validação | Zod                    | Schemas em todos os endpoints                                                 |
| Logger    | Pino                   | Fastify built-in (ADR 014)                                                    |
| Email     | Resend HTTP SDK        | Templates em src/modules/templates/                                           |
| Upload    | Cloudinary Node.js SDK | Imagens: JPEG, PNG, WebP ≤ 5MB                                                |
| Geocoding | Nominatim (OSM)        | Gratuito, sem API key                                                         |
| Datetime  | date-fns-tz ou luxon   | Conversões UTC ↔ local                                                        |

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
- Logout revoga o refresh token atual (e a família); ver `POST /auth/logout`

**Roles por ordem de privilégio:** `SUPER_ADMIN` > `BARBERSHOP_ADMIN` > `BARBER` > `CUSTOMER`

#### 1.2.3 Multi-Tenancy (ADR 001)

- Tabelas tenant-scoped possuem `barbershopId` FK
- Hook do Fastify injeta `barbershopId` automaticamente a partir do JWT de staff
- Customer JWT **não** carrega `barbershopId` — o contexto vem do request (rota `/barbershops/:id`)
- `SUPER_ADMIN` não tem tenant — `barbershopId` é null no JWT

#### 1.2.4 Timezone (ADR 010)

| Tipo                  | Armazenamento                     | Exemplo                                     |
| --------------------- | --------------------------------- | ------------------------------------------- |
| Instantes absolutos   | `timestamptz` UTC                 | `Appointment.startTime`, `cancelledAt`      |
| Horários operacionais | Wall-clock local (String `HH:mm`) | `OperatingHour.startTime = "09:00"`         |
| Fuso do barbershop    | IANA (String)                     | `Barbershop.timezone = "America/Sao_Paulo"` |

- Conversões UTC ↔ local acontecem **sempre na API**
- Frontend exibe em local time do barbershop, não faz math de timezone

#### 1.2.5 Soft Delete (ADR 011)

| Entidade    | Flag       | Pode desativar se houver future BOOKED? |
| ----------- | ---------- | --------------------------------------- |
| StaffMember | `isActive` | ❌ HTTP 409 com lista de appointments   |
| Service     | `isActive` | ✅ A qualquer momento                   |
| Barbershop  | `active`   | ✅ (Super Admin apenas)                 |

`isBookable` vs `isActive`: flags independentes. `isBookable=false` = indisponível para **novos** bookings, mantém appointments futuros.

#### 1.2.6 Paginação

- Listagens que podem crescer (`/customers/me/appointments`, `/barbershops/:id/appointments`) aceitam `?page` (default 1) e `?pageSize` (default 20, máx 100)
- Response inclui meta: `{ "data": [...], "meta": { "page", "pageSize", "total" } }`

#### 1.2.7 Estrutura e imports

- O código segue a arquitetura de **Vertical Slices**: cada módulo vive em `src/modules/<feature>/` com subpastas `models/`, `gateways/`, `helpers/`, `use-cases/`, `controllers/` e `routes/`.
- Os **use cases** concentram toda lógica de negócio (sem dependências HTTP/Prisma) e os **controllers** (Fastify handlers) ficam dentro de `controllers/`, nunca junto dos use cases.
- Sempre importa tipos gerados pelo Prisma a partir de `src/generated/prisma/client` (não usar `@prisma/client`).

---

### 1.3 Estratégia de Testes Automatizados

O projeto adota uma abordagem cirúrgica de testes baseada no melhor custo-benefício de manutenção e confiança (Modelo de Troféu de Testes).

┌──────────────────────────────────────────────┐
│ Testes de Integração (E2E) │ ◄── Controllers (Fastify)
├──────────────────────────────────────────────┤
│ Testes Unitários de Negócio │ ◄── Use Cases (Lógica pura)
└──────────────────────────────────────────────┘

#### 1.3.1 Testes Unitários (Camada de Domínio/Use Cases)

- **Escopo:** Todos os arquivos sob a pasta `src/modules/*/use-cases/` devem possuir 100% de cobertura de testes lógicos.
- **Isolamento:** É expressamente proibido injetar a instância do Prisma ou chamar o banco de dados nesses testes. Toda e qualquer dependência de persistência deve ser suprida utilizando **In-Memory Repositories** (mocks em memória baseados em arrays simples).
- **O que testar:** Fluxo de sucesso, lançamentos de exceções de negócio (ex: `STAFF_HAS_FUTURE_BOOKINGS`) e validações de regras de transição de estado.

---

## 2. Módulo: Auth

### 2.1 Entidades

#### StaffMember

| Campo        | Tipo          | Notas                                        |
| ------------ | ------------- | -------------------------------------------- |
| id           | String (CUID) | PK                                           |
| barbershopId | String?       | FK → Barbershop. Nullable para SUPER_ADMIN   |
| email        | String        | Unique                                       |
| passwordHash | String        | bcrypt 10 rounds                             |
| name         | String        |                                              |
| role         | Enum          | SUPER_ADMIN, BARBERSHOP_ADMIN, BARBER        |
| isBookable   | Boolean       | default: BARBER=true, BARBERSHOP_ADMIN=false |
| isActive     | Boolean       | default true                                 |
| avatarUrl    | String?       | Cloudinary URL                               |
| createdAt    | DateTime      |                                              |
| updatedAt    | DateTime      |                                              |

#### Customer

| Campo     | Tipo          | Notas                                                  |
| --------- | ------------- | ------------------------------------------------------ |
| id        | String (CUID) | PK                                                     |
| email     | String        | Unique — chave canônica cross-tenant                   |
| name      | String        |                                                        |
| googleId  | String?       | Unique. Só vincula se email do Google for **verified** |
| avatarUrl | String?       | Google profile photo                                   |
| createdAt | DateTime      |                                                        |
| updatedAt | DateTime      |                                                        |

#### RefreshToken

| Campo         | Tipo          | Notas                                        |
| ------------- | ------------- | -------------------------------------------- |
| id            | String (CUID) | PK                                           |
| tokenHash     | String        | SHA-256 do token opaco                       |
| staffMemberId | String?       | FK → StaffMember                             |
| customerId    | String?       | FK → Customer                                |
| family        | String        | Identificador da sessão para reuse detection |
| expiresAt     | DateTime      | 7 dias                                       |
| revoked       | Boolean       | default false                                |
| createdAt     | DateTime      |                                              |

- `family` é gerado (CUID) no **login/emissão inicial** e **herdado** em cada rotação
- Exatamente um de `staffMemberId`/`customerId` é preenchido

#### MagicLinkToken

| Campo      | Tipo          | Notas                       |
| ---------- | ------------- | --------------------------- |
| id         | String (CUID) | PK                          |
| tokenHash  | String        | SHA-256                     |
| customerId | String        | FK → Customer               |
| expiresAt  | DateTime      | 15 minutos                  |
| consumedAt | DateTime?     | Null se ainda não consumido |

#### OtpToken (Password Reset)

| Campo         | Tipo          | Notas                          |
| ------------- | ------------- | ------------------------------ |
| id            | String (CUID) | PK                             |
| codeHash      | String        | SHA-256 do código de 6 dígitos |
| staffMemberId | String?       | FK → StaffMember               |
| customerId    | String?       | FK → Customer                  |
| expiresAt     | DateTime      | 15 minutos                     |
| consumedAt    | DateTime?     | Null se ainda não consumido    |
| createdAt     | DateTime      |                                |

- Reset serve para staff **e** customer — daí os dois FKs nullable (um preenchido)
- Invalidado após uso (`consumedAt`) e por expiração

#### InvitationToken

| Campo        | Tipo          | Notas                      |
| ------------ | ------------- | -------------------------- |
| id           | String (CUID) | PK                         |
| tokenHash    | String        | SHA-256 do token opaco     |
| email        | String        | Email do convidado         |
| barbershopId | String        | FK → Barbershop            |
| role         | Enum          | BARBERSHOP_ADMIN ou BARBER |
| expiresAt    | DateTime      | 72 horas                   |
| consumedAt   | DateTime?     | Null se ainda não aceito   |
| createdAt    | DateTime      |                            |

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
- Rotaciona: revoga atual + emite novo par (mesma `family`)

#### Logout

```
POST /auth/logout
Body: { refreshToken: string }
Auth: qualquer usuário autenticado
Response 200: { data: { message: "Logged out" } }
```

- Revoga o refresh token apresentado; opcionalmente toda a `family` (logout de todos os dispositivos) via `?allDevices=true`
- Access token permanece válido até expirar (máx 30min) — trade-off aceito para MVP

#### Password Reset (OTP)

```
POST /auth/forgot-password
Body: { email }
Rate limit: 3/email/hour, 5/IP/hour
Response 200: { data: { message: "OTP sent if email exists" } }

POST /auth/reset-password
Body: { email, otp: string, newPassword: string }
Response 200: { data: { message: "Password updated" } }
Error 400: OTP_INVALID — código inválido, expirado ou já consumido
```

- OTP: 6 dígitos criptograficamente aleatório, hash SHA-256, 15min expiry, single-use
- Aplica-se a staff e customer (resolve o email na tabela correspondente)
- `newPassword` deve seguir política: 8+ chars, 1 uppercase, 1 símbolo

#### Invite Flow (Barbershop Admin / Barber)

```
// 1. Super Admin cria barbershop + envia invite ao admin
POST /barbershops
Body: { name, address, cep, timezone, adminEmail }
Auth: SUPER_ADMIN
Response 201: { data: { barbershop, invitationSent: true } }

// 2. Admin recebe email com link → define senha
POST /auth/accept-invite
Body: { token, name, password }
Response 200: { data: { accessToken, refreshToken } }
Error 401: INVITATION_INVALID — token expirado ou já consumido
```

- O mesmo fluxo de convite é reutilizado pelo Barbershop Admin ao adicionar um novo staff (ver módulo Staff)

### 2.3 Endpoints

| Método | Rota                      | Auth | Descrição                         |
| ------ | ------------------------- | ---- | --------------------------------- |
| POST   | `/auth/login`             | No   | Staff login                       |
| POST   | `/auth/refresh`           | No   | Refresh token rotation            |
| POST   | `/auth/logout`            | Yes  | Revoga refresh token (ou família) |
| POST   | `/auth/google`            | No   | Customer Google OAuth             |
| POST   | `/auth/magic-link`        | No   | Envia magic link email            |
| POST   | `/auth/magic-link/verify` | No   | Consome magic link                |
| POST   | `/auth/forgot-password`   | No   | Envia OTP                         |
| POST   | `/auth/reset-password`    | No   | Redefine senha com OTP            |
| POST   | `/auth/accept-invite`     | No   | Aceita convite + define senha     |

### 2.4 Role Matrix

| Ação                               | SUPER_ADMIN | BARBERSHOP_ADMIN | BARBER | CUSTOMER |
| ---------------------------------- | ----------- | ---------------- | ------ | -------- |
| Criar/ativar/desativar barbershop  | ✅          | ❌               | ❌     | ❌       |
| Gerenciar staff/services/horários  | ❌          | ✅               | ❌     | ❌       |
| Atualizar isBookable (qualquer staff)       | ❌          | ✅               | ❌     | ❌       |
| Ver métricas globais               | ✅          | ❌               | ❌     | ❌       |
| Ver métricas da barbearia          | ❌          | ✅               | ❌     | ❌       |
| Ver métricas pessoais              | ❌          | ❌               | ✅     | ❌       |
| Ver agenda (todos staff)           | ❌          | ✅               | ❌     | ❌       |
| Ver própria agenda                 | ❌          | ✅               | ✅     | ❌       |
| Marcar DONE                        | ❌          | ✅               | ✅     | ❌       |
| Cancelar appointment (staff)       | ❌          | ✅               | ✅     | ❌       |
| Cancelar próprio appointment       | ❌          | ❌               | ❌     | ✅       |
| Bloquear datas                     | ❌          | ✅               | ❌     | ❌       |

---

## 3. Módulo: Barbershop (Tenant)

### 3.1 Entidades

#### Barbershop

| Campo                       | Tipo          | Notas                            |
| --------------------------- | ------------- | -------------------------------- |
| id                          | String (CUID) | PK                               |
| name                        | String        |                                  |
| slug                        | String        | Unique, usado em URLs            |
| address                     | String        |                                  |
| cep                         | String        |                                  |
| neighborhood                | String        |                                  |
| city                        | String        |                                  |
| state                       | String        |                                  |
| latitude                    | Float?        | Nullable — se geocoding falhar   |
| longitude                   | Float?        | Nullable                         |
| timezone                    | String        | IANA, ex: "America/Sao_Paulo"    |
| phone                       | String?       |                                  |
| logoUrl                     | String?       | Cloudinary URL                   |
| slotIntervalMinutes         | Int           | Default 30                       |
| cancellationLeadTimeMinutes | Int           | Default 180 (3h)                 |
| active                      | Boolean       | Default false. Super Admin ativa |
| createdAt                   | DateTime      |                                  |
| updatedAt                   | DateTime      |                                  |

#### OperatingHour

| Campo        | Tipo          | Notas                    |
| ------------ | ------------- | ------------------------ |
| id           | String (CUID) | PK                       |
| barbershopId | String        | FK → Barbershop          |
| dayOfWeek    | Int           | 0=Dom, 1=Seg, ..., 6=Sáb |
| startTime    | String        | "HH:mm" local            |
| endTime      | String        | "HH:mm" local            |

Split shifts: um `dayOfWeek` pode ter múltiplos registros. Ex: (1, "09:00", "12:00") e (1, "13:00", "18:00").

#### BlockedDate

| Campo        | Tipo          | Notas                       |
| ------------ | ------------- | --------------------------- |
| id           | String (CUID) | PK                          |
| barbershopId | String        | FK → Barbershop             |
| startDate    | DateTime      | Whole-day, meia-noite local |
| endDate      | DateTime      | Whole-day, meia-noite local |
| reason       | String?       | Ex: "Reforma", "Feriado"    |

### 3.2 Endpoints

#### Públicos (sem auth)

| Método | Rota                              | Parâmetros                  | Descrição                                           |
| ------ | --------------------------------- | --------------------------- | --------------------------------------------------- |
| GET    | `/barbershops/search`             | `q?, lat?, lng?, radiusKm?` | Busca textual + proximidade via earthdistance       |
| GET    | `/barbershops/:id`                | —                           | Perfil + horários + serviços + staff bookable       |
| GET    | `/barbershops/:id/staff/bookable` | —                           | Lista staff com `isBookable=true` e `isActive=true` |
| GET    | `/barbershops/:id/services`       | —                           | Lista serviços com `isActive=true`                  |

#### Super Admin

| Método | Rota                      | Auth        | Descrição                   |
| ------ | ------------------------- | ----------- | --------------------------- |
| POST   | `/barbershops`            | SUPER_ADMIN | Criar + enviar invite admin |
| PATCH  | `/barbershops/:id/status` | SUPER_ADMIN | Ativar/desativar (`active`) |

#### Barbershop Admin

| Método | Rota                                            | Auth             | Descrição                                    |
| ------ | ----------------------------------------------- | ---------------- | -------------------------------------------- |
| PATCH  | `/barbershops/:id/profile`                      | BARBERSHOP_ADMIN | Editar nome, endereço, timezone, phone       |
| POST   | `/barbershops/:id/logo`                         | BARBERSHOP_ADMIN | Upload logo (multipart)                      |
| GET    | `/barbershops/:id/operating-hours`              | BARBERSHOP_ADMIN | Listar grade atual                           |
| PUT    | `/barbershops/:id/operating-hours`              | BARBERSHOP_ADMIN | **Substituir** grade completa (array)        |
| POST   | `/barbershops/:id/blocked-dates`                | BARBERSHOP_ADMIN | Criar blocked date range (preview + confirm) |
| DELETE | `/barbershops/:id/blocked-dates/:blockedDateId` | BARBERSHOP_ADMIN | Remover blocked date                         |

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

#### POST /blocked-dates — Regras (fluxo em duas etapas)

**Etapa 1 — Preview** (`confirm` ausente ou `false`): a API calcula e **retorna** os appointments `BOOKED` afetados, sem persistir nada.

```json
// POST /barbershops/:id/blocked-dates?confirm=false
// Body: { startDate, endDate, reason }
{
  "data": {
    "preview": true,
    "affectedAppointments": [
      {
        "id": "...",
        "customerId": "...",
        "startTime": "...",
        "serviceName": "..."
      }
    ]
  }
}
```

**Etapa 2 — Confirm** (`?confirm=true`): cria o `BlockedDate` e cancela os appointments afetados numa transação.

```json
// POST /barbershops/:id/blocked-dates?confirm=true
{
  "data": {
    "blockedDate": {
      "id": "...",
      "startDate": "...",
      "endDate": "...",
      "reason": "..."
    },
    "cancelledCount": 3
  }
}
```

- Cada appointment cancelado recebe: `status=CANCELLED`, `cancelledByRole = BARBERSHOP_ADMIN`, `cancellationReason = reason`, `cancelledAt`
- Email de cancelamento enviado para cada customer afetado

### 3.3 Geolocation (ADR 007)

A busca por proximidade foi unificada no endpoint `/barbershops/search`. Quando os parâmetros `lat`, `lng` e `radiusKm` são fornecidos, a query utiliza a extensão `earthdistance` do PostgreSQL:

```sql
SELECT * FROM barbershops
WHERE earth_box(ll_to_earth(:lat, :lng), :radius_meters) @> ll_to_earth(latitude, longitude)
  AND earth_distance(ll_to_earth(:lat, :lng), ll_to_earth(latitude, longitude)) <= :radius_meters
  AND active = true
  AND latitude IS NOT NULL
  AND longitude IS NOT NULL
  AND (name ILIKE :q OR city ILIKE :q OR neighborhood ILIKE :q)
ORDER BY distance ASC
```

- Query executa via Prisma `$queryRawUnsafe` (parâmetros bindados)
- Índice GiST: `CREATE INDEX idx_barbershop_location ON barbershops USING gist (ll_to_earth(latitude, longitude));`
- Quando `lat`/`lng`/`radiusKm` não são enviados, a busca é puramente textual via Prisma `findMany` com `ILIKE` em `name`, `city` e `neighborhood`

#### Geocoding na Criação

- Super Admin informa CEP + endereço
- API chama Nominatim (OSM) para resolver coordenadas
- Se geocoding falhar → `latitude`/`longitude` = null → barbershop aparece apenas em text search
- Admin pode corrigir endereço + re-geocodificar via `PATCH /barbershops/:id/profile`
- Manual override: admin pode enviar `latitude`/`longitude` explicitamente
- Respeitar usage policy / rate limit do Nominatim

---

## 4. Módulo: Staff

### 4.1 Entidade

StaffMember (mesma tabela do módulo Auth — vide seção 2.1)

### 4.2 Endpoints

| Método | Rota                              | Auth             | Descrição                                      |
| ------ | --------------------------------- | ---------------- | ---------------------------------------------- |
| GET    | `/barbershops/:id/staff`          | BARBERSHOP_ADMIN | Listar todo staff do tenant                    |
| GET    | `/barbershops/:id/staff/bookable` | No               | Listar apenas staff bookable (customer picker) |
| POST   | `/barbershops/:id/staff`          | BARBERSHOP_ADMIN | Convidar novo staff (email + role)             |
| PATCH  | `/staff/:id`                      | BARBERSHOP_ADMIN | Editar nome, role, isBookable                  |
| DELETE | `/staff/:id`                      | BARBERSHOP_ADMIN | Soft-delete (isActive=false)                   |

- `POST /staff` cria um `InvitationToken` e dispara email de convite (mesmo fluxo `accept-invite`)

### 4.3 Regras

#### Bookable Staff Query (customer picker)

```sql
WHERE role IN ('BARBER', 'BARBERSHOP_ADMIN')
  AND isBookable = true
  AND isActive = true
  AND barbershopId = :id
```

- `BARBER`: default `true` — admin pode desativar via `PATCH /staff/:id`
- `BARBERSHOP_ADMIN`: default `false` — admin pode ativar para si
- `SUPER_ADMIN`: sempre `isBookable = false` (não é tenant-scoped)
- Barbeiro **não** altera a própria flag; apenas o Barbershop Admin

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
    "appointments": [{ "id": "...", "startTime": "...", "customerId": "..." }]
  }
}
```

3. Se não existirem → seta `isActive = false`

---

## 5. Módulo: Service

### 5.1 Entidade

| Campo           | Tipo          | Notas           |
| --------------- | ------------- | --------------- |
| id              | String (CUID) | PK              |
| barbershopId    | String        | FK → Barbershop |
| name            | String        |                 |
| description     | String?       |                 |
| durationMinutes | Int           | Ex: 30, 45, 60  |
| price           | Decimal       | BRL (R$)        |
| isActive        | Boolean       | Default true    |
| createdAt       | DateTime      |                 |
| updatedAt       | DateTime      |                 |

### 5.2 Endpoints

| Método | Rota                                 | Auth             | Descrição                        |
| ------ | ------------------------------------ | ---------------- | -------------------------------- |
| GET    | `/barbershops/:id/services`          | No               | Lista serviços ativos            |
| GET    | `/barbershops/:id/services?all=true` | BARBERSHOP_ADMIN | Lista todos (inclusive inativos) |
| POST   | `/barbershops/:id/services`          | BARBERSHOP_ADMIN | Criar serviço                    |
| PATCH  | `/services/:id`                      | BARBERSHOP_ADMIN | Editar nome, duração, preço      |
| DELETE | `/services/:id`                      | BARBERSHOP_ADMIN | Soft-delete (isActive=false)     |

### 5.3 Regras

- Soft-delete permitido **a qualquer momento**, mesmo com appointments futuros
- Appointments existentes mantêm o snapshot (`serviceName`, `priceAtBooking`, `durationAtBooking`)
- Serviço inativo não aparece no customer picker, mas o histórico de appointments permanece íntegro

---

## 6. Módulo: Booking (Appointment)

### 6.1 Entidade

#### Appointment

| Campo              | Tipo                   | Notas                                            |
| ------------------ | ---------------------- | ------------------------------------------------ |
| id                 | String (CUID)          | PK                                               |
| barbershopId       | String                 | FK → Barbershop                                  |
| customerId         | String                 | FK → Customer                                    |
| barberId           | String                 | FK → StaffMember                                 |
| serviceId          | String                 | FK → Service (referência; valores usam snapshot) |
| serviceName        | String                 | Snapshot no momento do booking                   |
| priceAtBooking     | Decimal                | Snapshot                                         |
| durationAtBooking  | Int                    | Snapshot (minutos)                               |
| startTime          | DateTime (timestamptz) | UTC                                              |
| endTime            | DateTime (timestamptz) | UTC (startTime + durationAtBooking)              |
| status             | Enum                   | BOOKED, CANCELLED, DONE                          |
| cancelledById      | String?                | FK → Customer ou StaffMember                     |
| cancelledByRole    | Enum?                  | CUSTOMER, BARBER, BARBERSHOP_ADMIN               |
| cancellationReason | String?                | Free text                                        |
| cancelledAt        | DateTime?              | UTC                                              |
| createdAt          | DateTime               |                                                  |
| updatedAt          | DateTime               |                                                  |

### 6.2 Endpoints

#### Customer

| Método | Rota                             | Auth     | Parâmetros                                     | Descrição                    |
| ------ | -------------------------------- | -------- | ---------------------------------------------- | ---------------------------- |
| GET    | `/barbershops/:id/slots`         | No       | `barberId`, `serviceId`, `date`                | Slots disponíveis            |
| POST   | `/appointments`                  | CUSTOMER | `barbershopId, barberId, serviceId, startTime` | Criar booking                |
| GET    | `/customers/me/appointments`     | CUSTOMER | `?status=&from=&to=&page=&pageSize=`           | Listar próprios appointments |
| PATCH  | `/appointments/:id/cancel`       | CUSTOMER | `?reason=`                                     | Cancelar próprio appointment |

#### Staff

| Método | Rota                            | Auth                     | Descrição                                                        |
| ------ | ------------------------------- | ------------------------ | ---------------------------------------------------------------- |
| GET    | `/barbershops/:id/appointments` | BARBERSHOP_ADMIN, BARBER | Listar appointments (`?date=&barberId=&status=&page=&pageSize=`) |
| PATCH  | `/appointments/:id/cancel`      | BARBERSHOP_ADMIN, BARBER | Cancelar (staff, sem lead time)                                  |
| PATCH  | `/appointments/:id/done`        | BARBERSHOP_ADMIN, BARBER | Marcar como DONE                                                 |

#### Unificadas (CUSTOMER + Staff)

| Método | Rota                   | Auth         | Descrição                                                       |
| ------ | ---------------------- | ------------ | --------------------------------------------------------------- |
| GET    | `/appointments/:id`    | JWT (qualquer role) | Detalhe do agendamento — CUSTOMER vê só os próprios; staff vê qualquer um da barbearia (BARBER scoped) |

- Barber só enxerga/atua nos próprios appointments (`barberId = jwt.sub`); Admin vê todos do tenant

### 6.3 Slot Calculation — Algoritmo (timezone-aware, ADR 010)

```
GET /barbershops/:id/slots?barberId=x&serviceId=y&date=2026-07-03
```

**Passo a passo:**

1. Determinar o `dayOfWeek` da `date` **no timezone do barbershop**
2. **Excluir BlockedDates** — se `date` cair em algum range bloqueado, retornar lista vazia
3. Buscar `OperatingHours` do barbershop para esse `dayOfWeek` (wall-clock local)
4. Buscar `Service.durationMinutes` (= `durationAtBooking`)
5. Buscar appointments `BOOKED` do barber que intersectam o dia (comparação em UTC)
6. Para cada operating interval, gerar candidatos em **local time** no step `slotIntervalMinutes`
7. Converter cada candidato local → **UTC** usando `Barbershop.timezone` (respeitando DST)
8. Validar: `[start, start+duration]` cabe inteiro no interval **e** não colide com nenhum BOOKED (comparação em UTC)
9. Retornar slots com `startTime` em ISO local e o correspondente UTC

```typescript
// Pseudo-código (usa date-fns-tz)
import { zonedTimeToUtc } from "date-fns-tz";

function calculateSlots(barbershop, barberId, serviceId, dateStr): Slot[] {
  const tz = barbershop.timezone;
  const dayOfWeek = getLocalDayOfWeek(dateStr, tz);
  if (isBlocked(barbershop.id, dateStr, tz)) return [];

  const intervals = getOperatingHours(barbershop.id, dayOfWeek); // [{start:"09:00", end:"12:00"}, ...]
  const duration = getServiceDuration(serviceId); // minutos
  const booked = getBookedAppointments(barberId, dateStr, tz); // UTC [start,end]

  const slots: Slot[] = [];
  for (const interval of intervals) {
    const openMin = toMinutes(interval.start); // 540
    const closeMin = toMinutes(interval.end); // 720
    for (
      let m = openMin;
      m + duration <= closeMin;
      m += barbershop.slotIntervalMinutes
    ) {
      const localStart = composeLocal(dateStr, m, tz); // wall-clock local
      const startUtc = zonedTimeToUtc(localStart, tz); // UTC
      const endUtc = addMinutes(startUtc, duration);
      const hasConflict = booked.some(
        (apt) => startUtc < apt.endTime && endUtc > apt.startTime,
      );
      if (!hasConflict) {
        slots.push({
          startTimeLocal: localStart,
          startTimeUtc: startUtc,
          endTimeUtc: endUtc,
        });
      }
    }
  }
  return slots;
}
```

> **Importante:** nunca gerar/compararslots em "minutos ingênuos". A grade nasce em local time
> e é convertida para UTC antes de qualquer comparação com `Appointment.startTime/endTime`.

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

- Transições a partir de `CANCELLED`/`DONE` são rejeitadas (estados terminais)

#### Regra DONE

- `PATCH /appointments/:id/done` só pode ser chamado **após** `startTime` ter passado (comparação UTC)
- Se tentar marcar DONE antes do horário → HTTP 400 `APPOINTMENT_NOT_YET_STARTED`
- Se o appointment não estiver `BOOKED` → HTTP 409 `APPOINTMENT_NOT_ACTIONABLE`

### 6.6 Cancellation (ADR 008)

#### Pré-condição (customer e staff)

- Só é possível cancelar appointments em status `BOOKED`
- Se já estiver `CANCELLED`/`DONE` → HTTP 409 `APPOINTMENT_NOT_ACTIONABLE`

#### Customer Cancellation

```
PATCH /appointments/:id/cancel (CUSTOMER)
```

1. Verificar se appointment pertence ao customer (JWT `sub`) e está `BOOKED`
2. Calcular lead time restante: `Appointment.startTime - now()` (UTC)
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
- Sem validação de lead time (staff pode cancelar qualquer appointment BOOKED)
- Enviar email para o customer

#### Availability After Cancellation

- Slot é imediatamente disponível para re-booking (sem cool-down)

---

## 7. Módulo: Metrics

### 7.1 Endpoints

Três endpoints segmentados por role:

| Role              | Método | Rota                       | Parâmetros                         | Descrição                                         |
| ----------------- | ------ | -------------------------- | ---------------------------------- | ------------------------------------------------- |
| SUPER_ADMIN       | GET    | `/admin/metrics`           | `from` (ISO date), `to` (ISO date) | Métricas agregadas de todas as barbearias         |
| BARBERSHOP_ADMIN  | GET    | `/barbershops/:id/metrics` | `from` (ISO date), `to` (ISO date) | Métricas da barbearia no período                  |
| BARBER            | GET    | `/staff/me/metrics`        | `from` (ISO date), `to` (ISO date) | Métricas pessoais do barbeiro autenticado         |

### 7.2 Agregações

Todas as queries usam range `[from, to]` em `startTime`.
Apenas appointments com **status = DONE** são considerados para receita.
Valores usam `priceAtBooking` (snapshot), não preço atual do serviço.

#### 7.2.1 SUPER_ADMIN — `GET /admin/metrics`

```sql
-- Número de barbearias ativas
SELECT COUNT(*)::int as "activeBarbershops"
FROM "Barbershop"
WHERE active = true

-- Receita total do período (todas barbearias)
SELECT COALESCE(SUM("priceAtBooking")::decimal, 0) as "totalRevenue"
FROM "Appointment"
WHERE status = 'DONE'
  AND "startTime" >= :from
  AND "startTime" < :to + interval '1 day'

-- Total DONE no período
SELECT COUNT(*)::int as "totalDone"
FROM "Appointment"
WHERE status = 'DONE'
  AND "startTime" >= :from
  AND "startTime" < :to + interval '1 day'

-- Total cancelamentos no período
SELECT COUNT(*)::int as "totalCancelled"
FROM "Appointment"
WHERE status = 'CANCELLED'
  AND "startTime" >= :from
  AND "startTime" < :to + interval '1 day'

-- Top 10 barbearias por receita
SELECT b.id as "barbershopId",
       b.name as "barbershopName",
       COUNT(a.id)::int as "appointmentCount",
       COALESCE(SUM(a."priceAtBooking")::decimal, 0) as "revenue"
FROM "Barbershop" b
LEFT JOIN "Appointment" a ON a."barbershopId" = b.id
  AND a.status = 'DONE'
  AND a."startTime" >= :from
  AND a."startTime" < :to + interval '1 day'
WHERE b.active = true
GROUP BY b.id, b.name
ORDER BY "revenue" DESC
LIMIT 10
```

#### 7.2.2 BARBERSHOP_ADMIN — `GET /barbershops/:id/metrics`

```sql
-- Total Revenue
SELECT SUM("priceAtBooking")::decimal
FROM "Appointment"
WHERE "barbershopId" = :id
  AND status = 'DONE'
  AND "startTime" >= :from
  AND "startTime" < :to + interval '1 day'

-- Top Services
SELECT "serviceName",
       COUNT(*)::int as "bookingCount",
       SUM("priceAtBooking")::decimal as "revenue"
FROM "Appointment"
WHERE "barbershopId" = :id AND status = 'DONE'
  AND "startTime" >= :from AND "startTime" < :to + interval '1 day'
GROUP BY "serviceName"
ORDER BY "revenue" DESC
LIMIT 10

-- Top Barbers
SELECT "barberId",
       COUNT(*)::int as "appointmentCount",
       SUM("priceAtBooking")::decimal as "revenue"
FROM "Appointment"
WHERE "barbershopId" = :id AND status = 'DONE'
  AND "startTime" >= :from AND "startTime" < :to + interval '1 day'
GROUP BY "barberId"
ORDER BY "revenue" DESC
LIMIT 10

-- Busiest Days
SELECT DATE("startTime") as "date",
       COUNT(*)::int as "appointmentCount"
FROM "Appointment"
WHERE "barbershopId" = :id AND status = 'DONE'
  AND "startTime" >= :from AND "startTime" < :to + interval '1 day'
GROUP BY DATE("startTime")
ORDER BY "appointmentCount" DESC
LIMIT 10
```

#### 7.2.3 BARBER — `GET /staff/me/metrics`

Todas as queries scoped por `barberId` (do JWT), sem `barbershopId` explícito.

```sql
-- Total DONE (count)
SELECT COUNT(*)::int as "totalDone"
FROM "Appointment"
WHERE "barberId" = :barberId
  AND status = 'DONE'
  AND "startTime" >= :from
  AND "startTime" < :to + interval '1 day'

-- Receita gerada
SELECT COALESCE(SUM("priceAtBooking")::decimal, 0) as "revenue"
FROM "Appointment"
WHERE "barberId" = :barberId
  AND status = 'DONE'
  AND "startTime" >= :from
  AND "startTime" < :to + interval '1 day'

-- Top serviços pessoais
SELECT "serviceName",
       COUNT(*)::int as "bookingCount",
       SUM("priceAtBooking")::decimal as "revenue"
FROM "Appointment"
WHERE "barberId" = :barberId
  AND status = 'DONE'
  AND "startTime" >= :from
  AND "startTime" < :to + interval '1 day'
GROUP BY "serviceName"
ORDER BY "bookingCount" DESC
LIMIT 5

-- Média de agendamentos por dia no período
WITH days AS (
  SELECT GENERATE_SERIES(:from::date, :to::date, '1 day'::interval)::date as day
)
SELECT
  COALESCE(COUNT(a.id)::int, 0) as "totalAppointments",
  COUNT(DISTINCT d.day)::int as "daysInPeriod",
  ROUND(
    COALESCE(COUNT(a.id)::decimal / NULLIF(COUNT(DISTINCT d.day), 0), 0),
    1
  ) as "avgPerDay"
FROM days d
LEFT JOIN "Appointment" a ON a."barberId" = :barberId
  AND a.status = 'DONE'
  AND DATE(a."startTime") = d.day
  AND a."startTime" >= :from
  AND a."startTime" < :to + interval '1 day'
```

### 7.3 Regras

- **Apenas DONE** conta como receita. BOOKED e CANCELLED são excluídos.
- Valores usam `priceAtBooking` (snapshot), não preço atual do serviço
- SUPER_ADMIN enxerga agregado de **todas as barbearias**, sem detalhes por tenant
- BARBERSHOP_ADMIN enxerga apenas sua própria barbearia (`barbershopId` do JWT ou param)
- BARBER enxerga apenas seus próprios appointments (scoped por `barberId` do JWT)
- On-the-fly aggregation via Prisma `groupBy` ou raw SQL

---

## 8. Módulo: File Upload

### 8.1 Fluxo

```
Frontend (multipart/form-data) → API → valida tipo/tamanho → Cloudinary SDK → URL salva no BD
```

### 8.2 Endpoints

| Método | Rota                      | Auth             | Descrição                |
| ------ | ------------------------- | ---------------- | ------------------------ |
| POST   | `/upload/barbershop-logo` | BARBERSHOP_ADMIN | Upload logo da barbearia |
| POST   | `/upload/staff-avatar`    | BARBERSHOP_ADMIN | Upload avatar de staff   |

### 8.3 Validação

```typescript
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

// Validar antes de enviar ao Cloudinary
if (!ALLOWED_TYPES.includes(file.mimetype))
  throw new AppError(400, "INVALID_FILE_TYPE");
if (file.size > MAX_SIZE) throw new AppError(400, "FILE_TOO_LARGE");
```

### 8.4 Cloudinary Config

- Upload via `cloudinary.uploader.upload()` (stream ou buffer)
- `folder`: `na-regua/barbershops/:id/` ou `na-regua/staff/:id/`
- Response: `{ url: "https://res.cloudinary.com/..." }`
- Salvar URL no BD: `Barbershop.logoUrl` ou `StaffMember.avatarUrl`

---

## 9. Apêndices

### A. Error Codes

| HTTP | Code                          | Quando                                                   |
| ---- | ----------------------------- | -------------------------------------------------------- |
| 400  | `VALIDATION_ERROR`            | Zod validation failure. `details` contém erros por campo |
| 400  | `INVALID_FILE_TYPE`           | Upload com tipo não permitido                            |
| 400  | `FILE_TOO_LARGE`              | Upload > 5MB                                             |
| 400  | `APPOINTMENT_NOT_YET_STARTED` | Tentativa de marcar DONE antes do startTime              |
| 400  | `OTP_INVALID`                 | Código OTP inválido, expirado ou já consumido            |
| 401  | `UNAUTHORIZED`                | Token ausente, inválido ou expirado                      |
| 401  | `MAGIC_LINK_INVALID`          | Token de magic link expirado ou já consumido             |
| 401  | `INVITATION_INVALID`          | Token de convite expirado ou já consumido                |
| 403  | `FORBIDDEN`                   | Token válido, mas role não tem permissão                 |
| 404  | `NOT_FOUND`                   | Recurso não encontrado                                   |
| 409  | `APPOINTMENT_CONFLICT`        | Double-booking detectado                                 |
| 409  | `APPOINTMENT_NOT_ACTIONABLE`  | Cancel/done em appointment não-BOOKED (estado terminal)  |
| 409  | `EMAIL_ALREADY_EXISTS`        | Email duplicado (staff ou customer)                      |
| 409  | `STAFF_HAS_FUTURE_BOOKINGS`   | Tentativa de desativar staff com appointments futuros    |
| 429  | `RATE_LIMIT_EXCEEDED`         | Rate limit atingido                                      |
| 500  | `INTERNAL_ERROR`              | Erro inesperado (mensagem suprimida em produção)         |

### B. Rate Limits (ADR 003)

| Escopo                                | Limite  | Janela                 |
| ------------------------------------- | ------- | ---------------------- |
| Global (todos endpoints)              | 100 req | 1 minuto               |
| Auth endpoints                        | 10 req  | 1 minuto (por IP)      |
| Auth por email (login/OTP/magic link) | 3 req   | 1 hora                 |
| OTP por IP                            | 5 req   | 1 hora                 |
| Appointment creation                  | 20 req  | 1 minuto (autenticado) |

Configuração via `@fastify/rate-limit`.

### C. PostgreSQL Extensions

```sql
CREATE EXTENSION IF NOT EXISTS cube;
CREATE EXTENSION IF NOT EXISTS earthdistance;
CREATE EXTENSION IF NOT EXISTS btree_gist;
```

| Extension       | Usada em                                         |
| --------------- | ------------------------------------------------ |
| `cube`          | Dependência do `earthdistance`                   |
| `earthdistance` | Proximity search (geolocation)                   |
| `btree_gist`    | Exclusion constraint (double-booking prevention) |

Habilitar no Neon via dashboard SQL editor ou migration Prisma `CREATE EXTENSION`.

### D. Variáveis de Ambiente

| Variável               | Obrigatória | Notas                                        |
| ---------------------- | ----------- | -------------------------------------------- |
| `DATABASE_URL`         | Sim         | PostgreSQL (Neon)                            |
| `JWT_SECRET`           | Sim         | HS256, mín 16 chars                          |
| `CORS_ORIGIN`          | Sim         | Domínio do frontend (default localhost:3000) |
| `PORT`                 | Não         | Default 3333                                 |
| `NODE_ENV`             | Não         | development \| production \| test            |
| `RESEND_API_KEY`       | Sim         | Envio de email transacional                  |
| `GOOGLE_CLIENT_ID`     | Não\*       | \*Necessária para Google OAuth               |
| `GOOGLE_CLIENT_SECRET` | Não\*       | \*Necessária para Google OAuth               |
| `CLOUDINARY_URL`       | Sim         | Credenciais do Cloudinary                    |

---

## 10. Regras de Ouro ao Desenvolver (Quality Gate)

Antes de abrir qualquer Pull Request ou considerar uma feature concluída, o desenvolvedor deve garantir que:

1. A lógica de negócio está 100% isolada dentro do respectivo Use Case, livre de qualquer acoplamento com o protocolo HTTP (Fastify) ou tipos específicos de ORM (Prisma).
2. O formato global de payloads de resposta é estritamente respeitado: `{ data: {} }` para respostas bem-sucedidas e `{ error: string, code: string, details: {} }` para falhas capturadas.
3. A suíte de testes unitários do Use Case criado/alterado está passando e cobre os caminhos felizes e infelizes.
4. O endpoint correspondente foi validado manualmente via curl/insomnia ou teste de contrato, certificando o funcionamento das validações do Zod e das constraints do PostgreSQL.
