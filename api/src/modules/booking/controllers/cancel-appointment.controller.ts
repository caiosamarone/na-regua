import { FastifyReply, FastifyRequest } from "fastify";
import { PrismaAppointmentRepository } from "../gateways/prisma-appointment.repository";
import { CustomerCancelAppointmentUseCase } from "../use-cases/customer-cancel-appointment.use-case";
import { StaffCancelAppointmentUseCase } from "../use-cases/staff-cancel-appointment.use-case";
import { cancelAppointmentInputSchema } from "../models/appointment.schema";
import { AppError } from "../../../shared/errors/app-error";

const repository = new PrismaAppointmentRepository();
const customerUseCase = new CustomerCancelAppointmentUseCase(repository);
const staffUseCase = new StaffCancelAppointmentUseCase(repository);

export class CancelAppointmentController {
  async handle(
    request: FastifyRequest<{ Params: { id: string }; Querystring: { reason?: string } }>,
    reply: FastifyReply,
  ) {
    const { id } = request.params;
    const payload = request.user as { sub: string; role: string; barbershopId?: string };
    const body = cancelAppointmentInputSchema.parse(request.body);

    if (payload.role === "CUSTOMER") {
      const result = await customerUseCase.execute(id, payload.sub, body.reason);

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

    if (payload.role === "BARBER" || payload.role === "BARBERSHOP_ADMIN") {
      if (!payload.barbershopId) throw new AppError(403, "FORBIDDEN", "Permissão insuficiente");

      const result = await staffUseCase.execute(id, payload.sub, payload.role, payload.barbershopId, body.reason);

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
