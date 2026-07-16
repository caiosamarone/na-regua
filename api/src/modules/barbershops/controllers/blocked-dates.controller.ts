import { FastifyReply, FastifyRequest } from "fastify";
import { PrismaBarbershopRepository } from "../gateways/prisma-barbershop.repository";
import { BlockedDatesUseCase } from "../use-cases/blocked-dates.use-case";
import { blockedDateInputSchema, blockedDateQuerySchema, blockedDatePreviewResponseSchema, blockedDateConfirmResponseSchema } from "../models/barbershop.schema";
import { getBarbershopIdFromToken } from "../../../shared/hooks/auth.hook";
import { EmailService } from "../../../shared/services/email.service";

const repository = new PrismaBarbershopRepository();
const useCase = new BlockedDatesUseCase(repository, new EmailService());

export class BlockedDatesController {
  async handle(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) {
    const { id } = request.params;
    const body = blockedDateInputSchema.parse(request.body);
    const { confirm } = blockedDateQuerySchema.parse(request.query);

    if (confirm) {
      getBarbershopIdFromToken(request);
      const user = request.user as { sub: string };
      const result = await useCase.execute(
        id, body.startDate, body.endDate, body.reason ?? null,
        user.sub, "BARBERSHOP_ADMIN",
      );
      const response = blockedDateConfirmResponseSchema.parse({ data: result });
      return reply.code(200).send(response);
    }

    const affected = await useCase.execute(id, body.startDate, body.endDate);
    const response = blockedDatePreviewResponseSchema.parse({
      data: { preview: true as const, affectedAppointments: affected },
    });
    return reply.code(200).send(response);
  }
}
