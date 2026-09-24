# Guia de Release — App Mobile (EAS + Lojas)

Guia prático de como uma mudança sai do código e chega ao celular dos usuários. A decisão técnica por trás está no [ADR 001 — Build and Release](adr/001-build-and-release.md).

> **Estado atual (set/2026):** pipeline ativo só para **Android**. iOS e envio automático às lojas (`--auto-submit`) ainda **não** estão configurados — veja [Pendências](#8-pendências).

## Sumário

1. [Conceitos](#1-conceitos)
2. [Profiles do EAS](#2-profiles-do-eas)
3. [Pipeline (GitHub Actions)](#3-pipeline-github-actions)
4. [Fluxo de uma mudança](#4-fluxo-de-uma-mudança)
5. [Quando alterar o `version`](#5-quando-alterar-o-version)
6. [Das builds às lojas](#6-das-builds-às-lojas)
7. [Comandos úteis](#7-comandos-úteis)
8. [Pendências](#8-pendências)

---

## 1. Conceitos

| Termo | O que é |
|-------|---------|
| **Build** | O binário do app (APK/AAB no Android, IPA no iOS). Necessária quando muda código **nativo** |
| **OTA (EAS Update)** | Atualização só do JavaScript, baixada pelo app ao abrir — sem loja, sem build |
| **Fingerprint** | Hash de tudo que afeta o nativo (dependências nativas, plugins, SDK, `app.json`, `version`). Uma build só aceita OTA com o **mesmo** fingerprint |
| **Channel** | "Canal" de OTA que cada build escuta (`development`, `preview`, `production`) |
| **Environment (EAS)** | Conjunto de variáveis no expo.dev usado na build e na OTA (ex.: `EXPO_PUBLIC_API_URL`) |

**Mudança nativa** = instalar pacote com código nativo, atualizar o SDK do Expo, mexer em `plugins`, ícone, splash, permissões ou `version` no `app.json`. Todo o resto (telas, textos, regras de UI) é **só JS** e vai por OTA.

### Por que `EXPO_PUBLIC_API_URL` fica no expo.dev

Variáveis `EXPO_PUBLIC_*` viram texto fixo dentro do bundle na hora da build/OTA — o app não lê variáveis em tempo de execução. Como a build roda nos servidores do EAS e a OTA roda no GitHub Actions, nenhum dos dois tem o seu `.env` local (que está no `.gitignore`). Por isso o valor fica nas **Environment variables** do expo.dev, uma por ambiente. Build e OTA leem o mesmo valor, o que evita uma OTA apontar para a API errada. É "Plain text" porque não é segredo: vai dentro do app.

---

## 2. Profiles do EAS

Definidos em `mobile/eas.json`:

| Profile | Para quê | Android | iOS | Canal / ambiente |
|---------|----------|---------|-----|------------------|
| `development` | Development build (com `expo-dev-client`), para desenvolver | APK | Ad hoc (só aparelhos cadastrados) | `development` |
| `preview` | APK para testar/mandar para amigos | APK | Ad hoc | `preview` |
| `production` | Build de loja | AAB | App Store (**única aceita no TestFlight**) | `production` |

- O **número da build** (`versionCode`/`buildNumber`) é gerenciado e incrementado pelo EAS (`appVersionSource: remote` + `autoIncrement`)
- A **keystore do Android** fica guardada no expo.dev por app (`com.naregua.app`), não por profile — foi criada na primeira build e é reusada pelo CI
- A build de TestFlight é **o mesmo binário** que depois vai para a App Store: você não gera outra build para lançar

---

## 3. Pipeline (GitHub Actions)

```
PR ──► CI (lint, typecheck, testes)

merge na main ──► CI ──► deploy development ──► [sua aprovação] ──► deploy production
```

| Workflow | Quando roda |
|----------|-------------|
| `mobile-ci.yml` | Em PRs que mexem em `mobile/` |
| `mobile-cd.yml` | Em push na `main` que mexe em `mobile/`, ou manual (Actions → Mobile CD → Run workflow) |
| `mobile-eas-deploy.yml` | Chamado pelo `mobile-cd.yml`, uma vez por ambiente |

Em cada deploy, o script `mobile/scripts/eas-deploy.mjs` decide por plataforma:

1. Calcula o fingerprint atual
2. Existe build desse profile com esse fingerprint (na fila, rodando ou pronta)?
   - **Sim** → publica **OTA** no canal do profile
   - **Não** → dispara **build nova** (`--no-wait`: o job termina ao enfileirar, não espera a build)

O resultado (OTA ou build, ID, fingerprint) aparece no resumo do job no GitHub.

- **Aprovação de produção:** o environment `production` do GitHub tem *required reviewers*. O job fica esperando você clicar em **Review deployments → Approve** na página do run. Aprovações pendentes expiram em 30 dias; uma mais nova substitui a mais antiga
- **Plataformas:** variáveis do repositório `EAS_PLATFORMS_DEVELOPMENT` e `EAS_PLATFORMS_PRODUCTION` (padrão `android`; use `android,ios` quando o iOS estiver configurado)
- **Plano gratuito do EAS:** builds rodam **uma por vez**, em fila. Uma build em andamento não quebra o CD — a nova só espera

---

## 4. Fluxo de uma mudança

| # | Etapa | Quem |
|---|-------|------|
| 1 | Desenvolver com `npx expo start` + development build no celular (ou `npx expo start --go` para Expo Go) | Você |
| 2 | Abrir PR → CI roda | Você abre / automático |
| 3 | Merge na `main` → deploy **development** (OTA ou development build) | Automático |
| 4 | Se saiu development build nova, instalar no celular. Testar | Você |
| 5 | Aprovar o deploy **production** no GitHub | **Você** |
| 6 | Deploy production → OTA ou build de loja | Automático |
| 7 | *(só se saiu build nova)* Testar no TestFlight / teste interno e pedir revisão nas lojas | **Você** — veja [seção 6](#6-das-builds-às-lojas) |

> ⚠️ **OTA de produção não passa pelo TestFlight.** Ao aprovar uma mudança só de JS, a OTA vai **direto** para todos que têm a build de produção — inclusive usuários reais depois do lançamento. Teste bem em development antes de aprovar. Quando o app estiver publicado, considere rollout gradual (`eas update --rollout-percentage`) ou um canal `staging`.

Enquanto o app **não** estiver nas lojas, a build de produção (AAB) não tem muita utilidade — ninguém consegue instalá-la. Pode rejeitar/deixar expirar a aprovação e testar com o APK de `preview` e a development build.

---

## 5. Quando alterar o `version`

O `version` do `app.json` (ex.: `1.0.0`) é a versão que o usuário vê na loja. **Você altera manualmente, na sua branch, antes do merge** — mas só quando for uma nova versão de loja.

**Cenário A — só JS (a maioria):** não mexe no `version`. O merge vira OTA em development e, após aprovação, OTA em production. A versão continua a mesma.

**Cenário B — nova versão de loja:** altere o `version` na mesma branch da mudança (`1.0.0` → `1.1.0` para novidades, `1.0.1` para correções). Como o `version` faz parte do fingerprint, o pipeline **sempre** gera build nova (nunca OTA).

> **Regra:** se o merge tem mudança nativa, altere o `version` na mesma branch.
> Se esquecer, sai uma build nova com o mesmo `version` — o TestFlight aceita, mas depois que uma versão é publicada na App Store a Apple rejeita novos envios com o mesmo número.

Não altere o `version` em merges só de JS: isso forçaria builds à toa (e o plano gratuito tem limite mensal).

---

## 6. Das builds às lojas

São **três passos diferentes**:

| Passo | O que é | Como |
|-------|---------|------|
| 1. Enviar a build | Colocar o AAB/IPA na loja | `eas submit` (manual ou automático no pipeline) |
| 2. Testar | TestFlight (Apple) / Teste interno (Google) | Você e seus testers |
| 3. Pedir revisão e publicar | Enviar para a loja revisar e liberar ao público | **Sempre manual**, no site da loja |

### 6.1 Enviar a build (`eas submit`)

- **Não é upload manual.** O EAS envia o arquivo:
  - `npx eas-cli@latest submit -p android --profile production`
  - `npx eas-cli@latest submit -p ios --profile production`
- **Exceção:** o **primeiro** AAB no Google precisa de **upload manual** no Play Console (exigência do Google). Baixe o AAB no expo.dev e arraste em *Teste interno → Criar versão*. Do segundo em diante, o `eas submit` funciona
- IPA não tem upload pelo site — sem EAS, só pelo app Transporter no Mac
- O `eas submit` **nunca publica na loja**:
  - **Apple:** só envia ao App Store Connect → aparece no **TestFlight**
  - **Google:** envia para a faixa configurada. Usamos `internal` (teste interno). Configurar `track: "production"` + `releaseStatus: "completed"` publicaria direto após a revisão — **não usar**, pula o teste

### 6.2 Onde a build aparece

- **Google:** Play Console → **Testar e lançar → Testes → Teste interno**. Identificação: `versionCode (version)`, ex.: `3 (1.1.0)` — os mesmos números da build no expo.dev. Todos os AABs ficam em **Testar e lançar → Biblioteca de apps**. Leva alguns minutos de processamento; teste interno **não tem revisão**
- **Apple:** App Store Connect → **TestFlight**, alguns minutos após o envio

### 6.3 Pedir revisão

**Google** (https://play.google.com/console):
1. Selecione o app → **Testar e lançar → Testes → Teste interno**
2. Na versão enviada, **Promover versão → Produção**
3. Preencha as **notas da versão** (pt-BR) → **Próxima → Salvar**
4. Menu **Visão geral da publicação** → **Enviar alterações para revisão**
5. Aprovada → publica automaticamente (ou espera você clicar **Publicar**, se a *Publicação gerenciada* estiver ativa). Rejeitada → e-mail com o motivo

Revisão: primeira leva alguns dias; seguintes, de horas a ~1 dia. Na primeira vez, a *Visão geral da publicação* lista tudo o que falta preencher e só libera o envio quando estiver completo.

**Apple** (App Store Connect):
1. Aba **App Store** → crie a versão (ex.: 1.1.0)
2. Selecione a build (a mesma do TestFlight)
3. Preencha novidades (e screenshots, na primeira vez)
4. **Enviar para revisão** → escolha publicação automática ou manual após aprovação

Revisão: normalmente 1–2 dias.

### 6.4 TestFlight — convidando testers

- Só aceita builds do profile `production` (assinatura App Store)
- **Tester interno:** precisa ser usuário no App Store Connect. Sem revisão
- **Tester externo:** convite por e-mail ou link público; a primeira build passa por **revisão beta** da Apple (horas a 1–2 dias)
- A build do TestFlight usa o canal `production` e as variáveis do ambiente `production` (incluindo a URL da API). Builds do TestFlight **recebem OTAs** de produção
- Se precisar de testers com API de homologação: criar um profile `staging` (assinatura de loja, canal/ambiente próprios, só TestFlight)
- Amigo com Android: basta mandar o link do **APK de `preview`** no expo.dev

### 6.5 Pré-requisitos (uma vez só)

| | Apple | Google |
|---|---|---|
| Conta | Apple Developer (US$ 99/ano) | Google Play Console (US$ 25, única vez) |
| App na loja | App Store Connect (o `eas submit` interativo consegue criar) | Criar no Play Console |
| Credencial para o EAS enviar | Chave de API do App Store Connect (o EAS gera/guarda na 1ª execução) | *Service account* do Google Cloud com acesso ao Play Console (JSON cadastrado no EAS) |
| Primeira build | Build iOS **local e interativa** (`eas build -p ios --profile production`) para criar certificados | Já feita (keystore criada) |
| Primeiro envio | `eas submit` | **Upload manual** do AAB |
| Ficha da loja | Ícone, screenshots, descrição, **política de privacidade (URL)**, formulário **App Privacy** | Ícone, screenshots, descrição, **política de privacidade (URL)**, **Segurança dos dados**, **Classificação de conteúdo**, **Público-alvo** |

> Contas pessoais novas no Google podem exigir **teste fechado com testers por 14 dias** antes de liberar a produção — confira as regras atuais ao criar a conta.

**Resumo de cada lançamento, depois de tudo configurado:** aprovar no GitHub → testar no TestFlight/teste interno → **Enviar para revisão** em cada loja.

---

## 7. Comandos úteis

Rodar dentro de `mobile/`:

```bash
# Builds manuais
npx eas-cli@latest build -p android --profile preview       # APK para testar
npx eas-cli@latest build -p android --profile development   # development build
npx eas-cli@latest build -p android --profile production    # AAB de loja
# (--no-wait para não travar o terminal; -p ios / -p all quando tiver conta Apple)

# Acompanhar
npx eas-cli@latest build:list --limit 5
npx eas-cli@latest update:list

# Variáveis de ambiente do EAS
npx eas-cli@latest env:list --environment production

# Enviar para as lojas
npx eas-cli@latest submit -p android --profile production
npx eas-cli@latest submit -p ios --profile production

# Pipeline
gh workflow run mobile-cd.yml --ref main   # disparar manualmente
gh run list --limit 5                      # últimos runs
```

Setup já feito (referência): `eas login`, `eas init`, `eas update:configure`, secret `EXPO_TOKEN` no GitHub, environments `development`/`production` no GitHub, `EXPO_PUBLIC_API_URL` no expo.dev.

---

## 8. Pendências

- [ ] Conta Apple Developer + 1ª build iOS local + `EAS_PLATFORMS_*=android,ios`
- [ ] Conta Google Play + app criado + 1º upload manual do AAB + service account no EAS
- [ ] Envio automático no pipeline (`--auto-submit` nas builds de produção + `submit.production` no `eas.json` com `track: "internal"`)
- [ ] Ficha das lojas e política de privacidade
- [ ] Após o lançamento: rollout gradual de OTA ou canal `staging` para testers
