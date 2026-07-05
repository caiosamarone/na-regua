import { FastifyReply, FastifyRequest } from "fastify";
import { PrismaAppointmentRepository } from "../gateways/prisma-appointment.repository";
import { ListCustomerAppointmentsUseCase } from "../use-cases/list-customer-appointments.use-case";
import { listAppointmentsQuerySchema } from "../models/appointment.schema";

const repository = new PrismaAppointmentRepository();
const useCase = new ListCustomerAppointmentsUseCase(repository);

export class ListCustomerAppointmentsController {
  async handle(
    request: FastifyRequest<{ Querystring: { status?: string; from?: string; to?: string; page?: string; pageSize?: string } }>,
    reply: FastifyReply,
  ) {
    const customerId = (request.user as { sub: string }).sub;
    const query = listAppointmentsQuerySchema.parse(request.query);

    const result = await useCase.execute({
      customerId,
      status: query.status,
      from: query.from ? new Date(query.from) : undefined,
      to: query.to ? new Date(query.to) : undefined,
      page: query.page,
      pageSize: query.pageSize,
    });

    return reply.code(200).send({
      data: result.data.map((a) => ({
        ...a,
        priceAtBooking: Number(a.priceAtBooking),
      })),
      meta: {
        page: query.page,
        pageSize: query.pageSize,
        total: result.total,
      },
    });
  }
}
