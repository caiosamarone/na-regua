export type SendResult = { success: true } | { success: false; error: string };

export interface NotificationPayload {
  title: string;
  body: string;
  tag?: string;
  url?: string;
}

export interface NotificationChannel {
  send(subscription: { endpoint: string; keys: { p256dh: string; auth: string } }, payload: NotificationPayload): Promise<SendResult>;
}
