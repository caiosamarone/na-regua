import { FastifyReply, FastifyRequest } from "fastify";
import { PrismaStaffRepository } from "../gateways/prisma-staff.repository";
import { PrismaAuthRepository } from "../../auth/gateways/prisma-auth.repository";
import { InviteStaffUseCase } from "../use-cases/invite-staff.use-case";
import { inviteStaffInputSchema } from "../models/staff.schema";
import { EmailService } from "../../../shared/services/email.service";
import { getBarbershopIdFromToken } from "../../../shared/hooks/auth.hook";

const repository = new PrismaStaffRepository();
const authRepository = new PrismaAuthRepository();
const emailService = new EmailService();
const useCase = new InviteStaffUseCase(repository, authRepository, emailService);

export class InviteStaffController {
  async handle(request: FastifyRequest, reply: FastifyReply) {
    const barbershopId = getBarbershopIdFromToken(request);
    const input = inviteStaffInputSchema.parse(request.body);
    const result = await useCase.execute(barbershopId, input.email, input.name, input.role, input.commissionPercent);
    return reply.code(201).send({ data: result });
  }
}
