import { FastifyReply, FastifyRequest } from "fastify";
import { PrismaAppointmentRepository } from "../gateways/prisma-appointment.repository";
import { GetSlotsUseCase } from "../use-cases/get-slots.use-case";
import { slotQuerySchema } from "../models/appointment.schema";
import { AppError } from "../../../shared/errors/app-error";

const repository = new PrismaAppointmentRepository();
const useCase = new GetSlotsUseCase(repository);

export class GetSlotsController {
  async handle(
    request: FastifyRequest<{ Params: { id: string }; Querystring: { barberId?: string; serviceId: string; date: string } }>,
    reply: FastifyReply,
  ) {
    const { id } = request.params;
    const query = slotQuerySchema.parse(request.query);
    const barbershopId = id;

    const slots = await useCase.execute(barbershopId, query.serviceId, query.date, query.barberId);

    const data = slots.map((s) => ({
      startTimeLocal: s.startTimeLocal,
      startTimeUtc: s.startTimeUtc.toISOString(),
      endTimeUtc: s.endTimeUtc.toISOString(),
    }));

    return reply.code(200).send({ data });
  }
}
