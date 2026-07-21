import { FastifyReply, FastifyRequest } from "fastify";
import { PrismaPushSubscriptionRepository } from "../gateways/prisma-push-subscription.repository";
import { DeleteSubscriptionUseCase } from "../use-cases/delete-subscription.use-case";

const repository = new PrismaPushSubscriptionRepository();
const useCase = new DeleteSubscriptionUseCase(repository);

export class DeleteSubscriptionController {
  async handle(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const customerId = (request.user as { sub: string }).sub;

    await useCase.execute(id, customerId);

    return reply.code(204).send();
  }
}
