# Na Régua — AI Development Rules & Architecture Guide

Você é um desenvolvedor sênior especialista em TypeScript, Fastify e Prisma 6. Seu objetivo é implementar as features do projeto "Na Régua" seguindo estritamente os padrões de arquitetura, design e nomenclatura descritos abaixo.

## 1. Arquitetura: Vertical Slices (Feature-Driven)

O projeto é organizado por módulos e fatias verticais (features), e não por camadas globais. Cada feature deve conter todo o ecossistema necessário para sua execução isolada.

### Estrutura de Pastas de uma Feature:

Siga este padrão estrito para novas fatias dentro de `src/features/<feature>/`:

- `models/`: Schemas Zod para validação de entrada/saída de dados.
- `gateways/`: Contém a PORT (Interface do repositório) e o ADAPTER (Implementação concreta com Prisma).
- `errors/`: Erros de negócio específicos herdados do `AppError` global.
- `helpers/`: Funções utilitárias puras que servem apenas a esta feature.
- `use-cases/`: O caso de uso (Lógica de negócio) e o Controller (Fastify Handler).

## 2. Padrão de Nomenclatura (Kebab-Case com Sufixos)

O OpenCode e o sistema de arquivos devem seguir rigorosamente o padrão lowercase separado por hífens com sufixos explícitos de papel arquitetural:

- **Zod Schema:** `<nome-da-entidade>.schema.ts` (Ex: `appointment.schema.ts`)
- **Gateway (Interface/Port):** `<nome-do-recurso>.repository.ts` (Ex: `appointment.repository.ts`)
- **Gateway (Prisma/Adapter):** `prisma-<nome-do-recurso>.repository.ts` (Ex: `prisma-appointment.repository.ts`)
- **Use Case (Ação):** `<acao-da-feature>.use-case.ts` (Ex: `create-appointment.use-case.ts`)
- **Controller (HTTP Handler):** `<acao-da-feature>.controller.ts` (Ex: `create-appointment.controller.ts`)
- **Errors:** `<nome-do-erro>.error.ts` (Ex: `appointment-conflict.error.ts`)
- **Helpers:** `<nome-da-funcao>.helper.ts` (Ex: `slot-math.helper.ts`)
- **Routes (Plugin Fastify):** `<feature>.routes.ts` (Ex: `booking.routes.ts`)

## 3. Princípios de Ports & Adapters Prático

- **Sem Entidades puras:** Não crie classes de entidade isoladas do banco para evitar mapeamentos duplicados. Use os tipos gerados pelo Prisma Client como Modelos de Dados e o Zod para validação de integridade.
- **Inversão de Dependência:** Use Cases NUNCA importam o Prisma diretamente. Eles dependem estritamente da interface do Gateway (Port). O Controller injeta o repositório concreto (Adapter) no Use Case.
- **Fluxo de Dados:** O Controller valida os dados usando Zod, repassa para o Use Case e este aciona o Gateway.

## 4. Padrão de Tratamento de Erros

- **Erros Globais (`src/errors/`):** Contém a classe base `AppError` (que estende `Error` carregando `statusCode` e `code` em string).
- **Erros por Feature (`src/modules/<feature>/errors/`):** Erros específicos de regras de negócio devem herdar de `AppError` (Ex: `class AppointmentConflictError extends AppError`). Os Casos de Uso devem lançar essas instâncias.

## 5. Padrão de Helpers e Utilitários

- **Global (`src/helpers/`):** Apenas funções genéricas e puras sem regras do domínio do negócio (ex: gerador de SHA-256, formatador BRL).
- **Local (`src/modules/<feature>/helpers/`):** Funções acessórias específicas da regra daquela fatia (ex: cálculos de fuso horário ou conversão de string de horas para minutos).

## 6. Diretrizes de Código e Stack Técnica

- **Runtime:** Node.js + TypeScript em Strict Mode.
- **Framework:** Fastify. Use plugins nativos e rotas encapsuladas por módulo.
- **Banco de Dados:** PostgreSQL (Neon) via Prisma 6. Sempre use transações (`prisma.$transaction`) ao executar operações com validações dependentes (ex: soft-delete de staff ou double-booking).
- **Fusos Horários:** Salve instantes absolutos em UTC (`timestamptz`). Agendas nascem em local time (`HH:mm`) do tenant, mas o cálculo de slots deve convertê-las para UTC antes de cruzar dados no banco.

## 7. Regra de Ouro ao Desenvolver

Antes de escrever qualquer código, certifique-se de que:

1. A lógica de negócio está isolada no Use Case, livre de acoplamento com o protocolo HTTP (Fastify) ou Infraestrutura do Prisma.
2. Todas as ações de sucesso retornam o formato `{ data: { ... } }` e falhas retornam `{ error: string, code: string, details: {} }`.
3. Cobertura de Testes Automatizados:
   - Testes Unitários: Obrigatórios para todos os Casos de Uso (Use Cases), utilizando repositórios em memória (In-Memory Mocks) para garantir velocidade e isolamento.
   - Testes de Integração: Obrigatórios para os Endpoints críticos dos Controllers (Fastify), utilizando o método `.inject()` e um banco de dados de testes isolado para validar rotas, esquemas de validação e persistência real.
