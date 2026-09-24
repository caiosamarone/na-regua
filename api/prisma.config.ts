import { defineConfig, env } from "prisma/config";
import { readFileSync } from "fs";
import { resolve } from "path";

type Env = {
  DATABASE_URL: string;
};

function loadEnvVar(key: string): string {
  const value = process.env[key];
  if (value) return value;

  try {
    const envPath = resolve(__dirname, ".env");
    const content = readFileSync(envPath, "utf-8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (trimmed.startsWith("#") || !trimmed.includes("=")) continue;
      const eqIdx = trimmed.indexOf("=");
      const k = trimmed.slice(0, eqIdx).trim();
      if (k === key) {
        let v = trimmed.slice(eqIdx + 1).trim();
        if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
          v = v.slice(1, -1);
        }
        return v;
      }
    }
  } catch {}

  throw new Error(`Cannot resolve environment variable: ${key}`);
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: loadEnvVar("DATABASE_URL"),
  },
});
