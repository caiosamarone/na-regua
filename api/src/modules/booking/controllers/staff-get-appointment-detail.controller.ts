import { FastifyReply, FastifyRequest } from "fastify";
import { PrismaAppointmentRepository } from "../gateways/prisma-appointment.repository";
import { StaffGetAppointmentDetailUseCase } from "../use-cases/staff-get-appointment-detail.use-case";
import { AppError } from "../../../shared/errors/app-error";

const repository = new PrismaAppointmentRepository();
const useCase = new StaffGetAppointmentDetailUseCase(repository);

export class StaffGetAppointmentDetailController {
  async handle(
    request: FastifyRequest<{ Params: { id: string; appointmentId: string } }>,
    reply: FastifyReply,
  ) {
    const { id, appointmentId } = request.params;
    const payload = request.user as { sub: string; role: string; barbershopId?: string };

    if (payload.role !== "SUPER_ADMIN" && payload.barbershopId !== id) {
      throw new AppError(403, "FORBIDDEN", "Permissão insuficiente");
    }

    const result = await useCase.execute(appointmentId, payload.sub, payload.role, id);

    return reply.code(200).send({
      data: {
        ...result,
        priceAtBooking: Number(result.priceAtBooking),
      },
    });
  }
}
