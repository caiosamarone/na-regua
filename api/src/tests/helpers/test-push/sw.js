self.addEventListener("install", (event) => {
  self.skipWaiting();
  console.log("[sw] install");
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
  console.log("[sw] activate");
});

async function notifyClients(payload) {
  const clientList = await clients.matchAll({ type: "window", includeUncontrolled: true });
  for (const client of clientList) {
    client.postMessage({ type: "PUSH_RECEIVED", ...payload });
  }
}

self.addEventListener("push", (event) => {
  console.log("[sw] push received", event);

  let data = {
    title: "Na Régua",
    body: "Você tem um agendamento!",
  };

  if (event.data) {
    try {
      data = { ...data, ...event.data.json() };
    } catch {
      data.body = event.data.text();
    }
  }

  event.waitUntil(
    (async () => {
      await notifyClients({
        title: data.title,
        body: data.body,
        permission: Notification.permission,
      });

      if (Notification.permission !== "granted") {
        console.error(
          "[sw] Notification.permission =",
          Notification.permission,
          "— conceda permissão na página.",
        );
        return;
      }

      await self.registration.showNotification(data.title, {
        body: data.body,
        icon: "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f514.png",
        data,
      });
      console.log("[sw] showNotification chamado — banner deve aparecer no SO");
    })(),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow("./");
    }),
  );
});
