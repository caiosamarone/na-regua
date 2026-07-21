import type { AppointmentRepository } from "../../booking/gateways/appointment.repository";
import type { PushSubscriptionRepository } from "../gateways/push-subscription.repository";
import type { NotificationChannel } from "../channels/channel.interface";
import type { NotificationJobScheduler } from "./notification-job-scheduler";

export class ReminderJob {
  constructor(
    private appointmentRepository: AppointmentRepository,
    private subscriptionRepository: PushSubscriptionRepository,
    private pushChannel: NotificationChannel,
  ) {}

  async execute(appointmentId: string): Promise<void> {
    console.log("[ReminderJob] Executing....");
    const appointment =
      await this.appointmentRepository.findById(appointmentId);
    if (!appointment) return;
    if (appointment.status !== "BOOKED") return;
    if (appointment.notifiedAt) return;

    const barbershop = await this.appointmentRepository.findBarbershopById(
      appointment.barbershopId,
    );
    if (!barbershop) return;

    const subscriptions = await this.subscriptionRepository.findByCustomerId(
      appointment.customerId,
    );
    if (subscriptions.length === 0) return;

    const barber = await this.appointmentRepository.findStaffById(
      appointment.barberId,
    );
    const barberName = barber?.name ?? "Barbeiro";

    const localTime = this.formatLocalTime(
      appointment.startTime,
      barbershop.timezone,
    );

    const payload = {
      title: `Lembrete de agendamento — ${barbershop.name}`,
      body: `${barberName} te espera na ${barbershop.name} às ${localTime}. Não vai perder, hein?`,
      tag: `appointment-reminder-${appointmentId}`,
      url: `/appointments/${appointmentId}`,
    };

    for (const subscription of subscriptions) {
      const result = await this.pushChannel.send(
        { endpoint: subscription.endpoint, keys: subscription.keys },
        payload,
      );

      if (result.success === false && result.error === "EXPIRED") {
        await this.subscriptionRepository.delete(subscription.id);
      }
    }

    await this.appointmentRepository.updateNotifiedAt(appointmentId);
  }

  private formatLocalTime(utcDate: Date, timezone: string): string {
    try {
      const date = new Date(utcDate);
      const formatter = new Intl.DateTimeFormat("pt-BR", {
        timeZone: timezone,
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
      return formatter.format(date);
    } catch {
      return utcDate.toISOString().slice(11, 16);
    }
  }
}
