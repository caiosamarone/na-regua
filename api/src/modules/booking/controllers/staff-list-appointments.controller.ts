import { FastifyReply, FastifyRequest } from "fastify";
import { PrismaAppointmentRepository } from "../gateways/prisma-appointment.repository";
import { StaffListAppointmentsUseCase } from "../use-cases/staff-list-appointments.use-case";
import { listAppointmentsQuerySchema } from "../models/appointment.schema";

const repository = new PrismaAppointmentRepository();
const useCase = new StaffListAppointmentsUseCase(repository);

export class StaffListAppointmentsController {
  async handle(
    request: FastifyRequest<{ Params: { id: string }; Querystring: { status?: string; from?: string; to?: string; barberId?: string; page?: string; pageSize?: string } }>,
    reply: FastifyReply,
  ) {
    const { id } = request.params;
    const payload = request.user as { sub: string; role: string; barbershopId?: string };
    const query = listAppointmentsQuerySchema.parse(request.query);

    const result = await useCase.execute({
      barbershopId: id,
      barberId: query.barberId,
      status: query.status,
      from: query.from ? new Date(query.from) : undefined,
      to: query.to ? new Date(query.to) : undefined,
      page: query.page,
      pageSize: query.pageSize,
      staffRole: payload.role,
      staffId: payload.sub,
    });

    return reply.code(200).send({
      data: result.data.map((a: any) => ({
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
