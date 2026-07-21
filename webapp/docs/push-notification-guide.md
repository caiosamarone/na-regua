# Guia de Integração — Push Notification (Frontend)

## Visão Geral

O sistema de push notifications usa **Web Push API** (nativa do browser, sem Firebase). O fluxo é:

1. Usuário faz login → obtém JWT
2. Frontend registra um Service Worker
3. Frontend solicita permissão de notificação
4. Frontend assina o Push (gera subscription) e envia pra API
5. API salva a subscription no banco
6. No momento do agendamento, um job PgBoss dispara o push
7. O Service Worker recebe o evento `push` e exibe a notificação

## Endpoints da API

### `GET /vapid-public-key`
Retorna a chave pública VAPID necessária pra criar a subscription.

```json
{ "publicKey": "BPzqNl9xV4..." }
```

### `POST /push/subscriptions`
**Auth:** Bearer JWT (role: CUSTOMER)  
Registra a subscription do browser.

```json
{
  "endpoint": "https://fcm.googleapis.com/...",
  "keys": { "p256dh": "...", "auth": "..." },
  "deviceInfo": "Chrome 126 macOS"
}
```

**Resposta:** `201 Created` (nova) ou `200 OK` (já existia)

### `DELETE /push/subscriptions/:id`
**Auth:** Bearer JWT (role: CUSTOMER)  
Remove uma subscription.

## Implementação no Frontend

### 1. Service Worker (`public/sw.js`)

```javascript
self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  const data = event.data?.json() ?? {
    title: "Na Régua",
    body: "Você tem um agendamento!",
  };

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/icon.png",
      data: { url: data.url },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? "/";
  event.waitUntil(clients.openWindow(url));
});
```

### 2. Registrar SW e Assinar Push

```typescript
// 1. Buscar VAPID key
const { publicKey } = await api.get("/vapid-public-key");

// 2. Registrar Service Worker
const registration = await navigator.serviceWorker.register("/sw.js");

// 3. Aguardar o SW ficar ativo
await navigator.serviceWorker.ready;

// 4. Solicitar permissão (dispara o prompt nativo do browser)
const permission = await Notification.requestPermission();
if (permission !== "granted") return;

// 5. Criar subscription
const subscription = await registration.pushManager.subscribe({
  userVisibleOnly: true,
  applicationServerKey: publicKey, // base64 URL-encoded
});

// 6. Enviar subscription pra API
await api.post("/push/subscriptions", subscription.toJSON());
```

> `applicationServerKey` é a VAPID public key como string base64 URL-encoded (a mesma retornada pela API).

### 3. Gerenciar Login/Logout

| Evento | Ação |
|--------|------|
| Login | Buscar subscriptions ativas do customer (se já existir, não recriar) |
| Logout | Remover subscription do device atual (`DELETE /push/subscriptions/:id`) |
| Troca de conta | Remover subscription da conta antiga, criar pra nova |

### 4. Tratar Subscription Expirada

A API automaticamente deleta subscriptions que retornam 410 (Gone). O frontend não precisa fazer nada, mas pode:

- Escutar o evento `pushsubscriptionchange` no Service Worker
- Recriar a subscription e reenviar pra API quando o endpoint mudar

### 5. Mensagem Push (payload)

```json
{
  "title": "Lembrete de agendamento — Nome da Barbearia",
  "body": "João te espera na Nome da Barbearia às 14:30. Não vai perder, hein?",
  "tag": "appointment-reminder-{appointmentId}",
  "url": "/appointments/{appointmentId}"
}
```

### 6. iOS (PWA)

Push notification no iOS **só funciona** se o usuário adicionar o webapp à Tela de Início (PWA). Abas normais do Safari não recebem push. No Android/Desktop funciona nativamente.

## Testes Manuais (DevTools)

No Chrome, após registrar o SW:

1. **Application > Service Workers** — verificar se o SW está "activated"
2. **Application > Push Subscription** — ver subscription ativa
3. No SW da lista, clicar **"Push"** com payload vazio pra testar
4. Console deve mostrar `[sw] showNotification chamado`

## Referências

- [Web Push API (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
- [Service Worker API (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- Especificação completa do backend: `api/docs/FUTURE-FEATURES.md`
