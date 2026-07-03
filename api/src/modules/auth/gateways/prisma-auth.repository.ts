import { prisma } from "../../../config/prisma";
import {
  InvitationRole,
  MagicLinkToken,
} from "../../../generated/prisma/client";
import type {
  AuthRepository,
  CreateRefreshTokenInput,
} from "./auth.repository";

export class PrismaAuthRepository implements AuthRepository {
  async findStaffByEmail(email: string) {
    return prisma.staffMember.findUnique({ where: { email } });
  }

  async findStaffById(id: string) {
    return prisma.staffMember.findUnique({ where: { id } });
  }

  async findCustomerByEmail(email: string) {
    return prisma.customer.findUnique({ where: { email } });
  }

  async findCustomerById(id: string) {
    return prisma.customer.findUnique({ where: { id } });
  }

  async createRefreshToken(payload: CreateRefreshTokenInput) {
    return prisma.refreshToken.create({ data: payload });
  }

  async findRefreshTokenByHash(tokenHash: string) {
    return prisma.refreshToken.findUnique({ where: { tokenHash } });
  }

  async revokeRefreshToken(id: string) {
    await prisma.refreshToken.update({
      where: { id },
      data: { revoked: true },
    });
  }

  async revokeRefreshTokenFamily(family: string) {
    await prisma.refreshToken.updateMany({
      where: { family },
      data: { revoked: true },
    });
  }

  async createMagicLinkToken(
    customerId: string,
    tokenHash: string,
    expiresAt: Date,
  ) {
    return prisma.magicLinkToken.create({
      data: { customerId, tokenHash, expiresAt },
    });
  }

  async consumeMagicLinkToken(
    tokenHash: string,
  ): Promise<MagicLinkToken | null> {
    const token = await prisma.magicLinkToken.findUnique({
      where: { tokenHash },
    });
    if (!token || token.consumedAt || token.expiresAt < new Date()) {
      return null;
    }
    await prisma.magicLinkToken.update({
      where: { tokenHash },
      data: { consumedAt: new Date() },
    });
    return token;
  }

  async createOtpToken(input: {
    codeHash: string;
    staffMemberId?: string;
    customerId?: string;
    expiresAt: Date;
  }) {
    return prisma.otpToken.create({ data: input });
  }

  async consumeOtpToken(codeHash: string) {
    const token = await prisma.otpToken.findFirst({
      where: { codeHash, consumedAt: null },
    });
    if (!token) return null;
    if (token.expiresAt < new Date()) return null;
    await prisma.otpToken.update({
      where: { id: token.id },
      data: { consumedAt: new Date() },
    });
    return token;
  }

  async createInvitationToken(
    email: string,
    barbershopId: string,
    role: InvitationRole,
    tokenHash: string,
    expiresAt: Date,
  ) {
    await prisma.invitationToken.create({
      data: { email, barbershopId, role, tokenHash, expiresAt },
    });
  }

  async consumeInvitationToken(tokenHash: string) {
    const token = await prisma.invitationToken.findUnique({
      where: { tokenHash },
    });
    if (!token || token.consumedAt || token.expiresAt < new Date()) {
      return null;
    }
    await prisma.invitationToken.update({
      where: { tokenHash },
      data: { consumedAt: new Date() },
    });
    return {
      email: token.email,
      barbershopId: token.barbershopId,
      role: token.role,
    };
  }

  async findInvitationByToken(tokenHash: string) {
    const token = await prisma.invitationToken.findUnique({
      where: { tokenHash },
    });
    if (!token || token.consumedAt || token.expiresAt < new Date()) {
      return null;
    }
    return token.role;
  }

  async createCustomer(input: {
    email: string;
    name: string;
    googleId?: string;
  }) {
    return prisma.customer.create({ data: input });
  }

  async linkGoogleAccount(customerId: string, googleId: string) {
    await prisma.customer.update({
      where: { id: customerId },
      data: { googleId },
    });
  }

  async updateStaffPassword(staffId: string, passwordHash: string) {
    await prisma.staffMember.update({
      where: { id: staffId },
      data: { passwordHash },
    });
  }

  async createStaffFromInvitation(input: {
    email: string;
    name: string;
    passwordHash: string;
    barbershopId: string;
    role: InvitationRole;
  }) {
    return prisma.staffMember.create({ data: input });
  }
}
