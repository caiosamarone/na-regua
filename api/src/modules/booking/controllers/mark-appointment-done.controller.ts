import { FastifyReply, FastifyRequest } from "fastify";
import { PrismaAppointmentRepository } from "../gateways/prisma-appointment.repository";
import { PrismaStaffRepository } from "../../staff/gateways/prisma-staff.repository";
import { PrismaCommissionRepository } from "../../commission/gateways/prisma-commission.repository";
import { MarkAppointmentDoneUseCase } from "../use-cases/mark-appointment-done.use-case";
import { AppError } from "../../../shared/errors/app-error";

const repository = new PrismaAppointmentRepository();
const staffRepository = new PrismaStaffRepository();
const commissionRepository = new PrismaCommissionRepository();
const useCase = new MarkAppointmentDoneUseCase(repository, staffRepository, commissionRepository);

export class MarkAppointmentDoneController {
  async handle(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) {
    const { id } = request.params;
    const payload = request.user as { sub: string; role: string; barbershopId?: string };

    if (!payload.barbershopId) throw new AppError(403, "FORBIDDEN", "Permissão insuficiente");

    const result = await useCase.execute(id, payload.sub, payload.role, payload.barbershopId);

    return reply.code(200).send({
      data: {
        ...result,
        priceAtBooking: Number(result.priceAtBooking),
      },
    });
  }
}
