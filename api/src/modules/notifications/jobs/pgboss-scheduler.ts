import PgBoss from "pg-boss";
import type { NotificationJobScheduler } from "./notification-job-scheduler";

const REMINDER_JOB = "appointment-reminder";

export class PgBossScheduler implements NotificationJobScheduler {
  constructor(private boss: PgBoss) {}

  async scheduleReminder(appointmentId: string, scheduledAt: Date): Promise<void> {
    await this.boss.sendAfter(REMINDER_JOB, { appointmentId }, {}, scheduledAt);
  }
}

export { REMINDER_JOB };
