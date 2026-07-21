import Fastify from "fastify";
import cors from "@fastify/cors";
import cookie from "@fastify/cookie";
import jwt from "@fastify/jwt";
import rateLimit from "@fastify/rate-limit";
import { env } from "./config/env";
import { prisma } from "./config/prisma";
import { ZodError } from "zod";
import { AppError } from "./shared/errors/app-error";
import { authRoutes } from "./modules/auth/auth.routes";
import { barbershopRoutes } from "./modules/barbershops/barbershops.routes";
import { staffRoutes } from "./modules/staff/staff.routes";
import { serviceRoutes } from "./modules/services/services.routes";
import { bookingRoutes } from "./modules/booking/booking.routes";
import { metricsRoutes } from "./modules/metrics/metrics.routes";
import { uploadRoutes } from "./modules/upload/upload.routes";
import { commissionRoutes } from "./modules/commission/commission.routes";
import { timeOffRoutes } from "./modules/timeoff/timeoff.routes";
import { notificationsRoutes } from "./modules/notifications/notifications.routes";
import { startPgBossWorker } from "./modules/notifications/jobs/pgboss-worker";
import type { NotificationJobScheduler } from "./modules/notifications/jobs/notification-job-scheduler";

declare module "fastify" {
  interface FastifyInstance {
    scheduler?: NotificationJobScheduler;
  }
}

async function start() {
  const app = Fastify({ logger: true });

  app.register(cors, { origin: "*", credentials: true });
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

  await prisma.$connect();
  const scheduler = await startPgBossWorker();
  app.decorate("scheduler", scheduler);

  app.register(authRoutes);
  app.register(barbershopRoutes);
  app.register(staffRoutes);
  app.register(serviceRoutes);
  app.register(bookingRoutes);
  app.register(metricsRoutes);
  app.register(uploadRoutes);
  app.register(commissionRoutes);
  app.register(timeOffRoutes);
  app.register(notificationsRoutes);

  app.setErrorHandler((error, request, reply) => {
    if (error instanceof AppError) {
      return reply
        .status(error.statusCode)
        .send({ error: error.message, code: error.code, details: error.details });
    }

    if (error instanceof ZodError) {
      return reply.status(400).send({
        error: "Dados inválidos",
        code: "VALIDATION_ERROR",
        details: error.flatten().fieldErrors,
      });
    }

    request.log.error(error);
    return reply.status(500).send({
      error: "Internal server error",
      code: "INTERNAL_ERROR",
      details: {},
    });
  });

  await app.listen({ port: env.PORT, host: "0.0.0.0" });
}

start();
