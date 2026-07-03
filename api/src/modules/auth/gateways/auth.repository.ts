import {
  Customer,
  InvitationRole,
  MagicLinkToken,
  OtpToken,
  RefreshToken,
  StaffMember,
} from "../../../generated/prisma/client";

export type CreateRefreshTokenInput = {
  tokenHash: string;
  family: string;
  staffMemberId?: string;
  customerId?: string;
  expiresAt: Date;
};

export interface AuthRepository {
  findStaffByEmail(email: string): Promise<StaffMember | null>;
  findCustomerByEmail(email: string): Promise<Customer | null>;
  createRefreshToken(payload: CreateRefreshTokenInput): Promise<RefreshToken>;
  findRefreshTokenByHash(tokenHash: string): Promise<RefreshToken | null>;
  revokeRefreshToken(id: string): Promise<void>;
  revokeRefreshTokenFamily(family: string): Promise<void>;
  createMagicLinkToken(
    customerId: string,
    tokenHash: string,
    expiresAt: Date,
  ): Promise<MagicLinkToken>;
  consumeMagicLinkToken(tokenHash: string): Promise<MagicLinkToken | null>;
  createOtpToken(input: {
    codeHash: string;
    staffMemberId?: string;
    customerId?: string;
    expiresAt: Date;
  }): Promise<OtpToken>;
  consumeOtpToken(codeHash: string): Promise<OtpToken | null>;
  createInvitationToken(
    email: string,
    barbershopId: string,
    role: InvitationRole,
    tokenHash: string,
    expiresAt: Date,
  ): Promise<void>;
  consumeInvitationToken(tokenHash: string): Promise<{
    email: string;
    barbershopId: string;
    role: InvitationRole;
  } | null>;
  createCustomer(input: {
    email: string;
    name: string;
    googleId?: string;
  }): Promise<Customer>;
  linkGoogleAccount(customerId: string, googleId: string): Promise<void>;
  updateStaffPassword(staffId: string, passwordHash: string): Promise<void>;
  findInvitationByToken(tokenHash: string): Promise<InvitationRole | null>;
  createStaffFromInvitation(input: {
    email: string;
    name: string;
    passwordHash: string;
    barbershopId: string;
    role: InvitationRole;
  }): Promise<StaffMember>;
}
