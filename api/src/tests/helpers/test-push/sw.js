self.addEventListener("push", (event) => {
  console.log("[SW] Push received");

  let data;
  try {
    data = event.data?.json();
  } catch (e) {
    console.log("[SW] JSON parse error:", e.message);
    data = null;
  }

  const title = data?.title ?? "Na Régua (teste)";
  const body = data?.body ?? "Você tem um agendamento!";

  const options = {
    body,
    tag: data?.tag ?? "na-regua",
    data: { url: data?.url },
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
      .then(() => console.log("[SW] Notification shown"))
      .catch((err) => console.log("[SW] Notification error:", err))
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? "/";
  event.waitUntil(clients.openWindow(url));
});

self.addEventListener("activate", () => {
  console.log("[SW] Activated");
});
