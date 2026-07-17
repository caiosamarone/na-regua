import { FastifyReply, FastifyRequest } from "fastify";
import { PrismaAppointmentRepository } from "../gateways/prisma-appointment.repository";
import { GetCustomerAppointmentDetailUseCase } from "../use-cases/get-customer-appointment-detail.use-case";
import { StaffGetAppointmentDetailUseCase } from "../use-cases/staff-get-appointment-detail.use-case";
import { AppError } from "../../../shared/errors/app-error";

const repository = new PrismaAppointmentRepository();
const customerUseCase = new GetCustomerAppointmentDetailUseCase(repository);
const staffUseCase = new StaffGetAppointmentDetailUseCase(repository);

export class GetAppointmentDetailController {
  async handle(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) {
    const { id } = request.params;
    const payload = request.user as { sub: string; role: string; barbershopId?: string };

    if (payload.role === "CUSTOMER") {
      const result = await customerUseCase.execute(id, payload.sub);

      return reply.code(200).send({
        data: {
          ...result,
          priceAtBooking: Number(result.priceAtBooking),
        },
      });
    }

    if (payload.role === "BARBER" || payload.role === "BARBERSHOP_ADMIN") {
      if (!payload.barbershopId) throw new AppError(403, "FORBIDDEN", "Permissão insuficiente");

      const result = await staffUseCase.execute(id, payload.sub, payload.role, payload.barbershopId);

      return reply.code(200).send({
        data: {
          ...result,
          priceAtBooking: Number(result.priceAtBooking),
        },
      });
    }

    throw new AppError(403, "FORBIDDEN", "Permissão insuficiente");
  }
}
