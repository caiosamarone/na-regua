import { FastifyReply, FastifyRequest } from "fastify";
import { PrismaAppointmentRepository } from "../gateways/prisma-appointment.repository";
import { CustomerCancelAppointmentUseCase } from "../use-cases/customer-cancel-appointment.use-case";
import { cancelAppointmentInputSchema } from "../models/appointment.schema";

const repository = new PrismaAppointmentRepository();
const useCase = new CustomerCancelAppointmentUseCase(repository);

export class CustomerCancelAppointmentController {
  async handle(
    request: FastifyRequest<{ Params: { id: string }; Querystring: { reason?: string } }>,
    reply: FastifyReply,
  ) {
    const { id } = request.params;
    const customerId = (request.user as { sub: string }).sub;
    const body = cancelAppointmentInputSchema.parse(request.body);

    const result = await useCase.execute(id, customerId, body.reason);

    const response: any = {
      data: {
        ...result.appointment,
        priceAtBooking: Number(result.appointment.priceAtBooking),
      },
    };

    if (result.warning) {
      response.data.warning = result.warning;
    }

    return reply.code(200).send(response);
  }
}
