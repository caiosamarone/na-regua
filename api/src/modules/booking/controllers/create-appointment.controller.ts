import { FastifyReply, FastifyRequest } from "fastify";
import { PrismaAppointmentRepository } from "../gateways/prisma-appointment.repository";
import { CreateAppointmentUseCase } from "../use-cases/create-appointment.use-case";
import { createAppointmentInputSchema } from "../models/appointment.schema";

const repository = new PrismaAppointmentRepository();
const useCase = new CreateAppointmentUseCase(repository);

export class CreateAppointmentController {
  async handle(request: FastifyRequest, reply: FastifyReply) {
    const body = createAppointmentInputSchema.parse(request.body);
    const customerId = (request.user as { sub: string }).sub;

    const result = await useCase.execute({
      barbershopId: body.barbershopId,
      customerId,
      barberId: body.barberId,
      serviceId: body.serviceId,
      startTime: body.startTime,
    });

    return reply.code(201).send({
      data: {
        ...result,
        priceAtBooking: Number(result.priceAtBooking),
      },
    });
  }
}
