import webPush from "web-push";
import type { NotificationChannel, NotificationPayload, SendResult } from "./channel.interface";

export class PushChannel implements NotificationChannel {
  constructor(vapidSubject: string, vapidPublicKey: string, vapidPrivateKey: string) {
    webPush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
  }

  async send(
    subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
    payload: NotificationPayload,
  ): Promise<SendResult> {
    try {
      await webPush.sendNotification(
        { endpoint: subscription.endpoint, keys: subscription.keys },
        JSON.stringify(payload),
      );
      return { success: true };
    } catch (error: unknown) {
      if (error instanceof Error && "statusCode" in error && (error as any).statusCode === 410) {
        return { success: false, error: "EXPIRED" };
      }
      const message = error instanceof Error ? error.message : "Erro desconhecido";
      return { success: false, error: message };
    }
  }
}
