import { FastifyReply, FastifyRequest } from "fastify";
import { PrismaPushSubscriptionRepository } from "../gateways/prisma-push-subscription.repository";
import { CreateSubscriptionUseCase } from "../use-cases/create-subscription.use-case";
import { createSubscriptionInputSchema } from "../models/subscription.schema";

const repository = new PrismaPushSubscriptionRepository();
const useCase = new CreateSubscriptionUseCase(repository);

export class CreateSubscriptionController {
  async handle(request: FastifyRequest, reply: FastifyReply) {
    const body = createSubscriptionInputSchema.parse(request.body);
    const customerId = (request.user as { sub: string }).sub;

    const result = await useCase.execute({
      customerId,
      endpoint: body.endpoint,
      keys: body.keys,
      deviceInfo: body.deviceInfo,
    });

    return reply.code(result.alreadyExisted ? 200 : 201).send({ data: result.subscription });
  }
}
