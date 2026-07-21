import { InMemoryAppointmentRepository } from "../../../tests/helpers/in-memory-appointment.repository";
import { InMemoryPushSubscriptionRepository } from "../../../tests/helpers/in-memory-push-subscription.repository";
import type { NotificationChannel, NotificationPayload } from "../channels/channel.interface";
import { ReminderJob } from "./reminder.job";

describe("ReminderJob", () => {
  let appointmentRepo: InMemoryAppointmentRepository;
  let subscriptionRepo: InMemoryPushSubscriptionRepository;
  let mockChannel: jest.Mocked<NotificationChannel>;
  let job: ReminderJob;

  const barbershopId = "shop-1";
  const customerId = "cust-1";
  const barberId = "barber-1";
  const appointmentId = "apt-1";

  beforeEach(() => {
    appointmentRepo = new InMemoryAppointmentRepository();
    subscriptionRepo = new InMemoryPushSubscriptionRepository();
    mockChannel = {
      send: jest.fn(),
    };

    appointmentRepo.barbershops.push({
      id: barbershopId,
      name: "Barbearia Teste",
      active: true,
      timezone: "America/Sao_Paulo",
      slotIntervalMinutes: 30,
      cancellationLeadTimeMinutes: 180,
    } as any);

    appointmentRepo.staffMembers.push({
      id: barberId,
      barbershopId,
      name: "João Barbeiro",
    } as any);

    appointmentRepo.appointments.push({
      id: appointmentId,
      barbershopId,
      customerId,
      barberId,
      serviceId: "svc-1",
      serviceName: "Corte",
      priceAtBooking: 50 as any,
      durationAtBooking: 30,
      startTime: new Date("2026-07-06T17:30:00.000Z"),
      endTime: new Date("2026-07-06T18:00:00.000Z"),
      status: "BOOKED",
      cancelledById: null,
      cancelledByRole: null,
      cancellationReason: null,
      cancelledAt: null,
      notifiedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);

    job = new ReminderJob(appointmentRepo, subscriptionRepo, mockChannel);
  });

  afterEach(() => {
    appointmentRepo.reset();
    subscriptionRepo.reset();
  });

  it("should send push notification and mark notifiedAt", async () => {
    await subscriptionRepo.create({ customerId, endpoint: "https://a.com/push", keys: { p256dh: "k1", auth: "a1" } });
    mockChannel.send.mockResolvedValue({ success: true });

    await job.execute(appointmentId);

    expect(mockChannel.send).toHaveBeenCalledTimes(1);
    const payload = mockChannel.send.mock.calls[0][1] as NotificationPayload;
    expect(payload.title).toContain("Barbearia Teste");
    expect(payload.body).toContain("João Barbeiro");
    expect(payload.tag).toBe(`appointment-reminder-${appointmentId}`);
    expect(payload.url).toBe(`/appointments/${appointmentId}`);

    const updated = await appointmentRepo.findById(appointmentId);
    expect(updated?.notifiedAt).toBeDefined();
  });

  it("should send to multiple subscriptions", async () => {
    await subscriptionRepo.create({ customerId, endpoint: "https://a.com/push", keys: { p256dh: "k1", auth: "a1" } });
    await subscriptionRepo.create({ customerId, endpoint: "https://b.com/push", keys: { p256dh: "k2", auth: "a2" } });
    mockChannel.send.mockResolvedValue({ success: true });

    await job.execute(appointmentId);

    expect(mockChannel.send).toHaveBeenCalledTimes(2);
  });

  it("should skip if appointment is not BOOKED", async () => {
    appointmentRepo.appointments[0].status = "CANCELLED";

    await job.execute(appointmentId);

    expect(mockChannel.send).not.toHaveBeenCalled();
  });

  it("should skip if appointment does not exist", async () => {
    await job.execute("nonexistent");

    expect(mockChannel.send).not.toHaveBeenCalled();
  });

  it("should skip if already notified", async () => {
    appointmentRepo.appointments[0].notifiedAt = new Date();
    mockChannel.send.mockResolvedValue({ success: true });

    await job.execute(appointmentId);

    expect(mockChannel.send).not.toHaveBeenCalled();
  });

  it("should skip if no subscriptions", async () => {
    mockChannel.send.mockResolvedValue({ success: true });

    await job.execute(appointmentId);

    expect(mockChannel.send).not.toHaveBeenCalled();
  });

  it("should delete expired subscriptions on 410 and continue", async () => {
    await subscriptionRepo.create({ customerId, endpoint: "https://a.com/push", keys: { p256dh: "k1", auth: "a1" } });
    await subscriptionRepo.create({ customerId, endpoint: "https://b.com/push", keys: { p256dh: "k2", auth: "a2" } });

    mockChannel.send
      .mockResolvedValueOnce({ success: false, error: "EXPIRED" })
      .mockResolvedValueOnce({ success: true });

    await job.execute(appointmentId);

    const remaining = await subscriptionRepo.findByCustomerId(customerId);
    expect(remaining).toHaveLength(1);
    expect(remaining[0].endpoint).toBe("https://b.com/push");
  });
});
