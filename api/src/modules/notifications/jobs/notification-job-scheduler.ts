export interface NotificationJobScheduler {
  scheduleReminder(appointmentId: string, scheduledAt: Date): Promise<void>;
}
