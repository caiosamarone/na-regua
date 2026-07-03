import Fastify from "fastify";
import { env } from "./config/env";
import { prisma } from "./config/prisma";

const app = Fastify({ logger: true });

async function start() {
  const teste = await prisma.deployTest.count();
  console.log(teste, "teste!");
  await app.listen({ port: env.PORT, host: "0.0.0.0" });
}

start();
