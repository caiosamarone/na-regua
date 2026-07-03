import Fastify from "fastify";

import { env } from "./config/env";

const app = Fastify({ logger: true });

async function start() {
  await app.listen({ port: 8080, host: "0.0.0.0" });
}

start();
