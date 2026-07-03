import Fastify from "fastify";
import cors from "@fastify/cors";
import cookie from "@fastify/cookie";
import jwt from "@fastify/jwt";
import rateLimit from "@fastify/rate-limit";
import { env } from "./config/env";
import { prisma } from "./config/prisma";
import { AppError } from "./shared/errors/app-error";

const app = Fastify({ logger: true });

app.register(cors, { origin: env.CORS_ORIGIN, credentials: true });
app.register(cookie);
app.register(jwt, {
  secret: env.JWT_SECRET,
  sign: { expiresIn: "30m" },
});
app.register(rateLimit, {
  global: true,
  max: 100,
  timeWindow: "1 minute",
  keyGenerator: (request) => request.ip,
});

app.setErrorHandler((error, request, reply) => {
  if (error instanceof AppError) {
    return reply
      .status(error.statusCode)
      .send({ error: error.message, code: error.code, details: error.details });
  }

  request.log.error(error);
  return reply
    .status(500)
    .send({ error: "Internal server error", code: "INTERNAL_ERROR", details: {} });
});

async function start() {
  await prisma.$connect();
  await app.listen({ port: env.PORT, host: "0.0.0.0" });
}

start();
