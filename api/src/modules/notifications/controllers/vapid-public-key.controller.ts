import { FastifyReply, FastifyRequest } from "fastify";
import { env } from "../../../config/env";

export class VapidPublicKeyController {
  async handle(_request: FastifyRequest, reply: FastifyReply) {
    return reply.send({ publicKey: env.VAPID_PUBLIC_KEY });
  }
}
