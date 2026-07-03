# Na Régua — AI Development Rules & Architecture Guide

Você é um desenvolvedor sênior especialista em TypeScript, Fastify e Prisma 6. Seu objetivo é implementar as features do projeto "Na Régua" seguindo estritamente os padrões de arquitetura, design e nomenclatura descritos abaixo.

## 1. Arquitetura: Vertical Slices (Feature-Driven)

O projeto é organizado por módulos e fatias verticais (features), e não por camadas globais. Cada feature deve conter todo o ecossistema necessário para sua execução isolada.

### Estrutura de Pastas de uma Feature:

Siga este padrão estrito para novas fatias dentro de `src/modules/<feature>/`:

- `models/`: Schemas Zod para validação de entrada/saída de dados.
- `gateways/`: Contém a PORT (Interface do repositório) e o ADAPTER (Implementação concreta com Prisma).
- `errors/`: Erros de negócio específicos herdados do `AppError` global.
- `helpers/`: Funções utilitárias puras que servem apenas a esta feature.
- `use-cases/`: O caso de uso (Lógica de negócio pura, sem Fastify, sem Prisma).
- `controllers/`: Fastify Handlers — validam com Zod, injetam dependências no use case e devolvem a resposta HTTP.

## 2. Padrão de Nomenclatura (Kebab-Case com Sufixos)

O OpenCode e o sistema de arquivos devem seguir rigorosamente o padrão lowercase separado por hífens com sufixos explícitos de papel arquitetural:

- **Zod Schema:** `<nome-da-entidade>.schema.ts` (Ex: `appointment.schema.ts`)
- **Gateway (Interface/Port):** `<nome-do-recurso>.repository.ts` (Ex: `appointment.repository.ts`)
- **Gateway (Prisma/Adapter):** `prisma-<nome-do-recurso>.repository.ts` (Ex: `prisma-appointment.repository.ts`)
- **Use Case (Ação):** `<acao-da-feature>.use-case.ts` (Ex: `create-appointment.use-case.ts`)
- **Controller (HTTP Handler):** `<acao-da-feature>.controller.ts` (Ex: `create-appointment.controller.ts`) dentro de `controllers/`
- **Teste Unitário:** `<acao-da-feature>.use-case.spec.ts` (Ex: `staff-login.use-case.spec.ts`)
- **Errors:** `<nome-do-erro>.error.ts` (Ex: `appointment-conflict.error.ts`)
- **Helpers:** `<nome-da-funcao>.helper.ts` (Ex: `slot-math.helper.ts`)
- **Routes (Plugin Fastify):** `<feature>.routes.ts` (Ex: `booking.routes.ts`)

## 3. Princípios de Ports & Adapters Prático

- **Sem Entidades puras:** Não crie classes de entidade isoladas do banco para evitar mapeamentos duplicados. Use os tipos gerados pelo Prisma Client como Modelos de Dados e o Zod para validação de integridade.
- **Inversão de Dependência:** Use Cases NUNCA importam o Prisma diretamente. Eles dependem estritamente da interface do Gateway (Port). O Controller injeta o repositório concreto (Adapter) no Use Case.
- **Fluxo de Dados:** O Controller valida os dados usando Zod, repassa para o Use Case e este aciona o Gateway.
- **Controllers nunca devem ficar dentro de `use-cases/`.** Eles têm sua própria pasta `controllers/`.

## 4. Importação de Tipos Prisma

- **Sempre** importar tipos gerados do Prisma a partir de `src/generated/prisma/client`.
- **Nunca** importar de `@prisma/client`. Exemplo correto:

```typescript
import type { StaffRole } from "../../generated/prisma/client";
```

## 5. Padrão de Tratamento de Erros

- **Erros Globais (`src/shared/errors/`):** Contém a classe base `AppError` (que estende `Error` carregando `statusCode` e `code` em string).
- **Erros por Feature (`src/modules/<feature>/errors/`):** Erros específicos de regras de negócio devem herdar de `AppError` (Ex: `class AppointmentConflictError extends AppError`). Os Casos de Uso devem lançar essas instâncias.

## 6. Padrão de Helpers e Utilitários

- **Global (`src/shared/helpers/`):** Apenas funções genéricas e puras sem regras do domínio do negócio (ex: gerador de SHA-256, formatador BRL).
- **Local (`src/modules/<feature>/helpers/`):** Funções acessórias específicas da regra daquela fatia (ex: cálculos de fuso horário ou conversão de string de horas para minutos).

## 7. Diretrizes de Código e Stack Técnica

- **Runtime:** Node.js + TypeScript em Strict Mode.
- **Framework:** Fastify. Use plugins nativos e rotas encapsuladas por módulo.
- **Banco de Dados:** PostgreSQL (Neon) via Prisma 6. Sempre use transações (`prisma.$transaction`) ao executar operações com validações dependentes (ex: soft-delete de staff ou double-booking).
- **Fusos Horários:** Salve instantes absolutos em UTC (`timestamptz`). Agendas nascem em local time (`HH:mm`) do tenant, mas o cálculo de slots deve convertê-las para UTC antes de cruzar dados no banco.

## 8. Testes Automatizados (Quality Gate)

**Todo caso de uso implementado DEVE ter seu respectivo teste unitário.** A implementação do use case e do teste são inseparáveis. Siga o "Modelo de Troféu" (SPEC §1.3):

### Testes Unitários (Use Cases)

- **Escopo:** Todo `src/modules/*/use-cases/*.use-case.ts` deve ter um `*.use-case.spec.ts` ao lado.
- **Isolamento:** NUNCA usar Prisma real. Use repositórios em memória (arrays simples) para simular o banco.
- **O que testar:** Fluxo de sucesso + lançamento de todas as exceções de negócio.

## 9. Ordem de Implementação (Regra de Ouro)

1. Schema Zod (`models/`)
2. Erros de negócio (`errors/`)
3. Interface do repositório + implementação Prisma (`gateways/`)
4. **Use Case** (`use-cases/`) — lógica pura
5. **Teste unitário do Use Case** (`use-cases/*.use-case.spec.ts`) — **obrigatório antes de passar para o controller**
6. **Controller** (`controllers/`)
7. **Registrar rota** (`*.routes.ts`)
