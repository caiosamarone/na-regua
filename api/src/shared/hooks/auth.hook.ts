import { FastifyReply, FastifyRequest } from "fastify";
import { AppError } from "../errors/app-error";
import { StaffRole } from "../../generated/prisma/client";

type Role = StaffRole | "CUSTOMER";
type JwtPayload = {
  sub: string;
  role: Role;
  barbershopId?: string | null;
};

export async function authenticate(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    await request.jwtVerify<{
      sub: string;
      role: string;
      barbershopId?: string;
    }>();
  } catch (error) {
    throw new AppError(401, "UNAUTHORIZED", "Token inválido ou ausente");
  }
}

export function requireRole(...allowed: Role[]) {
  return async (request: FastifyRequest) => {
    const payload = request.user as JwtPayload | undefined;
    if (!payload || !allowed.includes(payload.role)) {
      throw new AppError(403, "FORBIDDEN", "Permissão insuficiente");
    }
  };
}

export function getBarbershopIdFromToken(request: FastifyRequest): string {
  const payload = request.user as JwtPayload | undefined;
  if (!payload || !payload.barbershopId) {
    throw new AppError(403, "FORBIDDEN", "Tenant não informado");
  }
  return payload.barbershopId;
}
