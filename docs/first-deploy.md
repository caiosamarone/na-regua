# First Deploy — API na Render + Neon

Guia passo a passo para configurar o deploy inicial da API do Na Régua.

---

## Ajustes recentes (antes do deploy)

Antes de seguir o guia, as seguintes alterações já foram aplicadas no código:

- **`prisma.config.ts`**: `import "dotenv/config"` removido — o Prisma CLI carrega `.env` automaticamente e em produção as env vars vêm da plataforma.
- **`package.json`**: `start` alterado para `tsx src/server.ts` (roda direto, sem precisar de build). `tsx` movido para `dependencies` para ficar disponível em produção.
- **`package.json`**: `build` agora executa `prisma generate && tsc` — o Build Command no Render fica simplificado para `npm install && npm run build`.

---

## Sumário

1. [Criar banco no Neon](#1-criar-banco-no-neon)
2. [Configurar Prisma + Migration Inicial](#2-configurar-prisma--migration-inicial)
3. [Fazer o Push Inicial no GitHub](#3-fazer-o-push-inicial-no-github)
4. [Criar Web Service no Render](#4-criar-web-service-no-render)
5. [Configurar CI/CD (monorepo)](#5-configurar-cicd-monorepo)
6. [Verificar o Deploy](#6-verificar-o-deploy)

---

## 1. Criar banco no Neon

### 1.1 Acessar o Neon

1. Vá para [https://console.neon.tech](https://console.neon.tech)
2. Faça login (GitHub ou Google)
3. Crie ou selecione um projeto com nome `na-regua`

### 1.2 Criar o banco

Dentro do projeto:

1. Vá em **Branches** → branch `main` já existe por padrão
2. Vá em **Databases** → clique **New Database**
   - **Name:** `na-regua` (ou o nome que preferir)
   - **Owner:** `neondb` (default)

### 1.3 Obter a Connection String

1. Vá em **Dashboard** → **Connection Details**
2. Selecione **Prisma** como formato
3. Copie a string `DATABASE_URL`. Ela será algo como:

```
DATABASE_URL="postgresql://neondb_owner:...@ep-xxx.us-east-2.aws.neon.tech/na-regua?sslmode=require"
```

> **Importante:** A URL já vem com `sslmode=require` no final. Mantenha isso.

### 1.4 Extensões PostgreSQL

Após criar o banco, execute o seguinte SQL no **Neon SQL Editor** (será necessário para funcionalidades futuras, mas pode fazer agora):

```sql
CREATE EXTENSION IF NOT EXISTS cube;
CREATE EXTENSION IF NOT EXISTS earthdistance;
CREATE EXTENSION IF NOT EXISTS btree_gist;
```

---

## 2. Configurar Prisma + Migration Inicial

> **Nota:** O diretório `api/prisma/` ainda não existe. Vamos criá-lo.

### 2.1 Criar schema Prisma

```bash
cd api
npx prisma init
```

Isso cria:
- `prisma/schema.prisma`
- `.env` (se não existir — já existe, então não sobrescreve)

### 2.2 Escrever o schema inicial (apenas tabela de teste)

Abra `api/prisma/schema.prisma` e cole apenas uma tabela simples para validar que o deploy funciona:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model DeployTest {
  id        String   @id @default(cuid())
  message   String
  createdAt DateTime @default(now())
}
```

> **Nota:** O schema completo do domínio (Barbershop, StaffMember, Appointment, etc.) será adicionado em uma migration posterior. Este é apenas um deploy de validação.

### 2.3 Atualizar .env com a DATABASE_URL do Neon

Edite `api/.env` e substitua `DATABASE_URL` pelo valor copiado do Neon:

```env
DATABASE_URL="postgresql://neondb_owner:...@ep-xxx.us-east-2.aws.neon.tech/na-regua?sslmode=require"
```

### 2.4 Rodar a migration inicial

```bash
cd api
npx prisma migrate dev --name init
```

Isso vai:
- Criar a migration em `api/prisma/migrations/`
- Aplicar as tabelas no banco Neon
- Gerar o Prisma Client

### 2.5 Verificar

```bash
npx prisma studio
```

Abra o Studio para confirmar que todas as tabelas aparecem (vazias, sem seed).

### 2.6 Atualizar src/server.ts com Prisma

Garanta que o `server.ts` inicializa o Prisma (já está pronto em `src/config/prisma.ts`):

```typescript
import Fastify from "fastify";
import { env } from "./config/env";
import { prisma } from "./config/prisma";

const app = Fastify({ logger: true });

async function start() {
  await prisma.$connect();
  app.log.info("Database connected");

  await app.listen({ port: env.PORT, host: "0.0.0.0" });
}

start();
```

---

## 3. Fazer o Push Inicial no GitHub

> **Importante:** O repositório no GitHub deve ser separado do webapp (conforme ADR 006: "Separate repos for API and WebApp"). Se for usar um monorepo só, a configuração de CI/CD muda (veja seção 5).

```bash
# Se ainda não tem repositório remoto para a API
cd api
git init
git add .
git commit -m "chore: initial API setup with Prisma schema"

# Criar repositório no GitHub: https://github.com/new (ex: na-regua-api)
git remote add origin git@github.com:seu-user/na-regua-api.git
git push -u origin main
```

---

## 4. Criar Web Service no Render

### 4.1 Acessar o Render

1. Vá para [https://dashboard.render.com](https://dashboard.render.com)
2. Faça login (GitHub)
3. Clique em **New +** → **Web Service**

### 4.2 Conectar repositório

1. Selecione **Build and deploy from a Git repository**
2. Conecte o GitHub e selecione o repositório `na-regua-api`
3. Se for monorepo, configure o **Root Directory** como `api` (veja seção 5)

### 4.3 Configurar o Web Service

| Campo | Valor |
|-------|-------|
| **Name** | `na-regua-api` |
| **Region** | `Frankfurt (EU)` ou `Ohio (US)` — escolha a mais próxima |
| **Branch** | `main` |
| **Root Directory** | Deixe vazio **se repo é só API**. Se monorepo, coloque `api` |
| **Runtime** | `Node` |
| **Build Command** | `npm install && npm run build` (o build script já executa `prisma generate`) |
| **Start Command** | `npm run start` |
| **Plan** | `Free` |

### 4.4 Adicionar Environment Variables

Clique em **Advanced** e adicione:

| Key | Value | Notas |
|-----|-------|-------|
| `DATABASE_URL` | `postgresql://...` | Do Neon, com `sslmode=require` |
| `JWT_SECRET` | (string aleatória com 32+ chars) | `openssl rand -hex 32` |
| `CORS_ORIGIN` | `https://seu-webapp.vercel.app` | Depois de fazer deploy do webapp |
| `NODE_ENV` | `production` | |
| `PORT` | `8080` | Render define essa porta internamente |
| `RESEND_API_KEY` | `re_xxxxxxxx` | Da sua conta Resend |

> **Atenção:** O Render **não** lê seu `.env` local. Você precisa digitar ou copiar as variáveis manualmente no painel do Render.

### 4.5 Criar o Web Service

Clique em **Create Web Service**.

O deploy vai começar automaticamente. Acompanhe os logs no dashboard.

---

## 5. Configurar CI/CD (monorepo)

> Esta seção é necessária **apenas se a API e o WebApp estão no mesmo repositório GitHub** (monorepo).  
> Se estiverem em repositórios separados, pule esta seção — o Render já monitora o branch `main` do repo da API.

### 5.1 Problema

Se api/ e webapp/ estão no mesmo repositório, o Render vai detectar qualquer push (mesmo de webapp/) e disparar um build desnecessário da API.

### 5.2 Solução: render.yaml com Ignored Paths

Render permite configurar **Ignored Paths** para evitar builds quando certos diretórios mudam.

Crie o arquivo `api/render.yaml` na raiz da API:

```yaml
services:
  - type: web
    name: na-regua-api
    env: node
    region: ohio
    plan: free
    buildCommand: npm install && npm run build
    startCommand: npm run start
    healthCheckPath: /
    envVars:
      - key: DATABASE_URL
        sync: false
      - key: JWT_SECRET
        sync: false
      - key: CORS_ORIGIN
        sync: false
      - key: NODE_ENV
        value: production
      - key: PORT
        value: "8080"
      - key: RESEND_API_KEY
        sync: false
    autoDeploy:
      enabled: true
      ignoredPaths:
        - webapp/**
        - docs/**
        - AGENTS.md
        - .gitignore
```

Depois de criar o arquivo, faça o deploy via **Render Blueprint** (em vez de Web Service manual):

1. No Render, vá em **Dashboard** → **Blueprints**
2. Conecte o repositório (mesmo monorepo)
3. Render detecta o `render.yaml` e cria o serviço
4. As variáveis marcadas como `sync: false` precisam ser preenchidas manualmente no painel da Render

> **Alternativa mais simples:** Se preferir não usar Blueprint, configure **Ignored Paths** diretamente no Web Service:
> 1. No dashboard do Render, vá em `na-regua-api` → **Settings**
> 2. Role até **Auto-Deploy**
> 3. Em **Ignored Paths**, adicione: `webapp/**`, `docs/**`
> 4. Clique **Save Changes**

### 5.3 Verificar CI/CD

1. Faça uma alteração em `api/src/server.ts`
2. Commit e push para `main`
3. Render deve disparar um build automático
4. Faça uma alteração em `webapp/algum-arquivo.tsx`
5. Commit e push — Render **não** deve disparar build

---

## 6. Verificar o Deploy

### 6.1 Logs do Render

No dashboard do Web Service, clique em **Logs** e confira:

```
✓ Build successful
✓ Starting service
✓ Listening on port 8080
```

### 6.2 Health Check (após implementar)

Após adicionar uma rota de health check no server:

```typescript
app.get("/health", async () => ({ status: "ok" }));
```

Acesse: `https://na-regua-api.onrender.com/health`

### 6.3 Prisma Studio Remoto (opcional)

Para ver o banco de produção:

```bash
cd api
DATABASE_URL="postgresql://..." npx prisma studio
```

> **Nunca exponha o Prisma Studio em produção.** Use apenas localmente com a URL do Neon.

---

## Resumo dos comandos

```bash
# 1. Setup Prisma
cd api
npx prisma init
# editar prisma/schema.prisma (colocar model DeployTest)
npx prisma migrate dev --name init

# 2. Push para GitHub
git add .
git commit -m "chore: first deploy validation"
git push

# 3. Render fará o deploy automaticamente

# 4. Verificar
curl https://na-regua-api.onrender.com/health
```
