import { InMemoryBarbershopRepository } from "../../../tests/helpers/in-memory-barbershop.repository";
import { InMemoryTimeOffRepository } from "../../../tests/helpers/in-memory-timeoff.repository";
import { CreateTimeOffUseCase } from "./create-timeoff.use-case";

describe("CreateTimeOffUseCase", () => {
  let barbershopRepo: InMemoryBarbershopRepository;
  let timeOffRepo: InMemoryTimeOffRepository;
  let emailService: { sendCancellation: jest.Mock };
  let useCase: CreateTimeOffUseCase;

  beforeEach(() => {
    barbershopRepo = new InMemoryBarbershopRepository();
    timeOffRepo = new InMemoryTimeOffRepository();
    emailService = { sendCancellation: jest.fn().mockResolvedValue(undefined) };
    useCase = new CreateTimeOffUseCase(barbershopRepo, timeOffRepo, emailService as any);
  });

  it("should preview affected appointments", async () => {
    barbershopRepo.barbershops.push({ id: "shop-1", timezone: "America/Sao_Paulo" } as any);
    timeOffRepo.appointments.push({
      id: "apt-1",
      customerId: "cust-1",
      customerName: "João",
      customerEmail: "joao@email.com",
      startTime: "2026-08-10T10:00:00.000Z",
      serviceName: "Corte",
    });

    const result = await useCase.execute("shop-1", "staff-1", "2026-08-10", "2026-08-10");

    expect(result).toHaveLength(1);
    expect(result[0].customerName).toBe("João");
  });

  it("should confirm and create timeoff with cancellation", async () => {
    barbershopRepo.barbershops.push({ id: "shop-1", timezone: "America/Sao_Paulo" } as any);
    timeOffRepo.appointments.push({
      id: "apt-1",
      customerId: "cust-1",
      customerName: "João",
      customerEmail: "joao@email.com",
      startTime: "2026-08-10T10:00:00.000Z",
      serviceName: "Corte",
    });

    const result = await useCase.execute(
      "shop-1", "staff-1", "2026-08-10", "2026-08-10",
      "12:00", "14:00", "admin-1", "BARBERSHOP_ADMIN",
    );

    expect(result).toHaveProperty("timeOff");
    expect(result).toHaveProperty("cancelledCount", 1);
    expect(timeOffRepo.timeOffs).toHaveLength(1);
    expect(timeOffRepo.timeOffs[0].staffMemberId).toBe("staff-1");
    expect(emailService.sendCancellation).toHaveBeenCalled();
  });

  it("should throw when barbershop does not exist", async () => {
    await expect(
      useCase.execute("invalid", "staff-1", "2026-08-10", "2026-08-10"),
    ).rejects.toThrow("Barbearia não encontrada");
  });
});
