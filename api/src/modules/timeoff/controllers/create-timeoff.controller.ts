import { FastifyReply, FastifyRequest } from "fastify";
import { PrismaBarbershopRepository } from "../../barbershops/gateways/prisma-barbershop.repository";
import { PrismaTimeOffRepository } from "../gateways/prisma-timeoff.repository";
import { CreateTimeOffUseCase } from "../use-cases/create-timeoff.use-case";
import { createTimeOffSchema } from "../models/timeoff.schema";
import { EmailService } from "../../../shared/services/email.service";

const barbershopRepo = new PrismaBarbershopRepository();
const timeOffRepo = new PrismaTimeOffRepository();
const emailService = new EmailService();
const useCase = new CreateTimeOffUseCase(barbershopRepo, timeOffRepo, emailService);

export class CreateTimeOffController {
  async handle(
    request: FastifyRequest<{
      Params: { id?: string; staffMemberId?: string };
    }>,
    reply: FastifyReply,
  ) {
    const payload = request.user as { sub: string; role: string; barbershopId?: string };
    const input = createTimeOffSchema.parse(request.body);

    const staffMemberId = request.params.staffMemberId ?? payload.sub;
    const barbershopId = request.params.id ?? payload.barbershopId!;

    if (input.confirm) {
      const result = await useCase.execute(
        barbershopId,
        staffMemberId,
        input.startDate,
        input.endDate,
        input.startTime ?? null,
        input.endTime ?? null,
        payload.sub,
        payload.role,
      );
      return reply.code(201).send({ data: result });
    }

    const result = await useCase.execute(barbershopId, staffMemberId, input.startDate, input.endDate);
    return reply.code(200).send({ data: result });
  }
}
