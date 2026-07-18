import { InMemoryBarbershopRepository } from "../../../tests/helpers/in-memory-barbershop.repository";
import { BlockedDatesUseCase } from "./blocked-dates.use-case";

function daysFromNow(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

function dateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

class MockEmailService {
  sendInvite = jest.fn().mockResolvedValue(undefined);
  sendCancellation = jest.fn().mockResolvedValue(undefined);
}

describe("BlockedDatesUseCase", () => {
  let repository: InMemoryBarbershopRepository;
  let emailService: MockEmailService;
  let useCase: BlockedDatesUseCase;

  let blockStart: string;
  let blockEnd: string;

  beforeEach(() => {
    repository = new InMemoryBarbershopRepository();
    emailService = new MockEmailService();
    useCase = new BlockedDatesUseCase(repository, emailService as any);

    jest.useFakeTimers({ advanceTimers: true });
    jest.setSystemTime(new Date("2026-07-17T12:00:00Z"));

    blockStart = dateStr(daysFromNow(1));
    blockEnd = dateStr(daysFromNow(3));
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
    repository.reset();
  });

  const defaultBarbershop = {
    id: "shop-1",
    name: "Barbearia Teste",
    slug: "barbearia-teste",
    address: "Rua Teste, 123",
    cep: "01001-000",
    neighborhood: "Centro",
    city: "São Paulo",
    state: "SP",
    latitude: null,
    longitude: null,
    timezone: "America/Sao_Paulo",
    phone: null,
    logoUrl: null,
    slotIntervalMinutes: 30,
    cancellationLeadTimeMinutes: 180,
    active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const defaultAppointments = [
    {
      id: "apt-1",
      barbershopId: "shop-1",
      customerId: "cust-1",
      barberId: "stf-1",
      serviceId: "svc-1",
      startTime: new Date("2026-07-18T10:00:00Z"),
      endTime: new Date("2026-07-18T10:30:00Z"),
      status: "BOOKED" as const,
      cancelledById: null,
      cancelledByRole: null,
      cancellationReason: null,
      cancelledAt: null,
      customer: { id: "cust-1", name: "Maria", email: "maria@test.com" },
      service: { name: "Corte" },
    },
    {
      id: "apt-2",
      barbershopId: "shop-1",
      customerId: "cust-2",
      barberId: "stf-1",
      serviceId: "svc-2",
      startTime: new Date("2026-07-19T14:00:00Z"),
      endTime: new Date("2026-07-19T14:30:00Z"),
      status: "BOOKED" as const,
      cancelledById: null,
      cancelledByRole: null,
      cancellationReason: null,
      cancelledAt: null,
      customer: { id: "cust-2", name: "João", email: "joao@test.com" },
      service: { name: "Barba" },
    },
  ];

  describe("preview mode", () => {
    it("should return affected appointments in the date range", async () => {
      repository.barbershops.push(defaultBarbershop);
      repository.appointments.push(...defaultAppointments);

      const result = await useCase.execute(
        "shop-1",
        blockStart,
        blockEnd,
      );

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        id: "apt-1",
        customerName: "Maria",
        serviceName: "Corte",
      });
    });

    it("should not cancel any appointments", async () => {
      repository.barbershops.push(defaultBarbershop);
      repository.appointments.push(...defaultAppointments);

      await useCase.execute("shop-1", blockStart, blockEnd);

      expect(repository.appointments.every((a) => a.status === "BOOKED")).toBe(
        true,
      );
      expect(repository.blockedDates).toHaveLength(0);
    });
  });

  describe("confirm mode", () => {
    it("should create blocked date and cancel overlapping appointments", async () => {
      repository.barbershops.push(defaultBarbershop);
      repository.appointments.push(...defaultAppointments);

      const result = await useCase.execute(
        "shop-1",
        blockStart,
        blockEnd,
        "Feriado",
        "admin-id",
        "BARBERSHOP_ADMIN",
      );

      expect(result.blockedDate.reason).toBe("Feriado");
      expect(result.cancelledCount).toBe(2);
      expect(repository.blockedDates).toHaveLength(1);
      expect(repository.appointments[0].status).toBe("CANCELLED");
      expect(repository.appointments[1].status).toBe("CANCELLED");
      expect(emailService.sendCancellation).toHaveBeenCalledTimes(2);
    });
  });

  describe("common validation", () => {
    it("should throw BarbershopNotFoundError when barbershop does not exist", async () => {
      await expect(
        useCase.execute("non-existent", blockStart, blockEnd),
      ).rejects.toThrow("Barbearia não encontrada");

      await expect(
        useCase.execute(
          "non-existent",
          blockStart,
          blockEnd,
          null,
          "admin-id",
          "BARBERSHOP_ADMIN",
        ),
      ).rejects.toThrow("Barbearia não encontrada");
    });

    it("should throw BlockedDatesInPastError when startDate is in the past", async () => {
      repository.barbershops.push({
        ...defaultBarbershop,
        id: "shop-2",
      });

      await expect(
        useCase.execute("shop-2", "2020-01-01", "2020-01-02"),
      ).rejects.toThrow("Não é possível bloquear datas passadas");

      await expect(
        useCase.execute(
          "shop-2",
          "2020-01-01",
          "2020-01-02",
          null,
          "admin-id",
          "BARBERSHOP_ADMIN",
        ),
      ).rejects.toThrow("Não é possível bloquear datas passadas");
    });
  });
});
