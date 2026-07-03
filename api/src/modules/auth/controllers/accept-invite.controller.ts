import { FastifyReply, FastifyRequest } from "fastify";
import { PrismaAuthRepository } from "../gateways/prisma-auth.repository";
import { AcceptInviteUseCase } from "../use-cases/accept-invite.use-case";
import { acceptInviteSchema, messageResponseSchema } from "../models/auth.schema";

const repository = new PrismaAuthRepository();
const useCase = new AcceptInviteUseCase(repository);

export class AcceptInviteController {
  async handle(request: FastifyRequest, reply: FastifyReply) {
    const input = acceptInviteSchema.parse(request.body);
    await useCase.execute(input.token, input.name, input.password);
    const response = messageResponseSchema.parse({
      data: { message: "Convite aceito com sucesso" },
    });
    return reply.code(200).send(response);
  }
}
