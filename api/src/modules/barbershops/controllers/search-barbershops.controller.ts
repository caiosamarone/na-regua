import { FastifyReply, FastifyRequest } from "fastify";
import { PrismaBarbershopRepository } from "../gateways/prisma-barbershop.repository";
import { SearchBarbershopsUseCase } from "../use-cases/search-barbershops.use-case";
import { searchQuerySchema, barbershopListResponseSchema } from "../models/barbershop.schema";

const repository = new PrismaBarbershopRepository();
const useCase = new SearchBarbershopsUseCase(repository);

export class SearchBarbershopsController {
  async handle(request: FastifyRequest, reply: FastifyReply) {
    const input = searchQuerySchema.parse(request.query);
    const result = await useCase.execute(input.q);
    const response = barbershopListResponseSchema.parse({ data: result });
    return reply.code(200).send(response);
  }
}
