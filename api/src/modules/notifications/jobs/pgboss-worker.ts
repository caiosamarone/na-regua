import PgBoss from "pg-boss";
import { PrismaAppointmentRepository } from "../../booking/gateways/prisma-appointment.repository";
import { PrismaPushSubscriptionRepository } from "../gateways/prisma-push-subscription.repository";
import { PushChannel } from "../channels/push.channel";
import { ReminderJob } from "./reminder.job";
import { PgBossScheduler, REMINDER_JOB } from "./pgboss-scheduler";
import type { NotificationJobScheduler } from "./notification-job-scheduler";
import { env } from "../../../config/env";

export async function startPgBossWorker(): Promise<NotificationJobScheduler> {
  const boss = new PgBoss(env.DATABASE_URL);
  await boss.start();

  const scheduler = new PgBossScheduler(boss);

  await boss.createQueue(REMINDER_JOB).catch(() => {});

  const appointmentRepository = new PrismaAppointmentRepository();
  const subscriptionRepository = new PrismaPushSubscriptionRepository();
  const pushChannel = new PushChannel(env.VAPID_SUBJECT, env.VAPID_PUBLIC_KEY, env.VAPID_PRIVATE_KEY);
  const reminderJob = new ReminderJob(appointmentRepository, subscriptionRepository, pushChannel);

  await boss.work(REMINDER_JOB, async (jobs) => {
    for (const job of jobs) {
      const { appointmentId } = job.data as { appointmentId: string };
      await reminderJob.execute(appointmentId);
    }
  });

  return scheduler;
}
