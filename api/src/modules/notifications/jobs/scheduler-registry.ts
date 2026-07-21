import type { NotificationJobScheduler } from "./notification-job-scheduler";

let schedulerInstance: NotificationJobScheduler | undefined;

export function setScheduler(scheduler: NotificationJobScheduler) {
  schedulerInstance = scheduler;
}

export function getScheduler(): NotificationJobScheduler | undefined {
  return schedulerInstance;
}
