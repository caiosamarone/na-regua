import { FastifyReply, FastifyRequest } from "fastify";
import { PrismaAppointmentRepository } from "../gateways/prisma-appointment.repository";
import { GetCustomerAppointmentDetailUseCase } from "../use-cases/get-customer-appointment-detail.use-case";

const repository = new PrismaAppointmentRepository();
const useCase = new GetCustomerAppointmentDetailUseCase(repository);

export class GetCustomerAppointmentDetailController {
  async handle(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) {
    const { id } = request.params;
    const customerId = (request.user as { sub: string }).sub;

    const result = await useCase.execute(id, customerId);

    return reply.code(200).send({
      data: {
        ...result,
        priceAtBooking: Number(result.priceAtBooking),
      },
    });
  }
}
