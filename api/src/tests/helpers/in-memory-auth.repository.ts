import type {
  AuthRepository,
  CreateRefreshTokenInput,
} from "../../modules/auth/gateways/auth.repository";
import type {
  Customer,
  InvitationRole,
  MagicLinkToken,
  OtpToken,
  RefreshToken,
  StaffMember,
} from "../../generated/prisma/client";

type StoredStaff = StaffMember | { passwordHash: string | null };
type StoredCustomer = Omit<Customer, "appointments" | "refreshTokens" | "magicLinks" | "otpTokens">;
type StoredRefresh = Omit<RefreshToken, "staffMember" | "customer">;
type StoredMagicLink = Omit<MagicLinkToken, "customer">;
type StoredOtp = Omit<OtpToken, "customer" | "staffMember">;

export class InMemoryAuthRepository implements AuthRepository {
  staff: StoredStaff[] = [];
  customers: StoredCustomer[] = [];
  refreshTokens: StoredRefresh[] = [];
  magicLinkTokens: StoredMagicLink[] = [];
  otpTokens: StoredOtp[] = [];
  invitationTokens: Array<{
    tokenHash: string;
    email: string;
    barbershopId: string;
    role: InvitationRole;
    expiresAt: Date;
    consumedAt: Date | null;
    createdAt: Date;
  }> = [];

  reset(): void {
    this.staff = [];
    this.customers = [];
    this.refreshTokens = [];
    this.magicLinkTokens = [];
    this.otpTokens = [];
    this.invitationTokens = [];
  }

  async findStaffByEmail(email: string) {
    const s = this.staff.find((s) => (s as StaffMember).email === email);
    return s ? (s as StaffMember) : null;
  }

  async findCustomerByEmail(email: string) {
    return this.customers.find((c) => c.email === email) ?? null;
  }

  async findCustomerById(id: string) {
    return this.customers.find((c) => c.id === id) ?? null;
  }

  async createRefreshToken(payload: CreateRefreshTokenInput) {
    const token = {
      ...payload,
      id: `rt-${this.refreshTokens.length + 1}`,
      revoked: false,
      createdAt: new Date(),
    } as unknown as RefreshToken;
    this.refreshTokens.push(token as StoredRefresh);
    return token;
  }

  async findRefreshTokenByHash(tokenHash: string) {
    return (this.refreshTokens.find((t) => t.tokenHash === tokenHash) as RefreshToken) ?? null;
  }

  async revokeRefreshToken(id: string) {
    const tok = this.refreshTokens.find((t) => t.id === id);
    if (tok) tok.revoked = true;
  }

  async revokeRefreshTokenFamily(family: string) {
    for (const t of this.refreshTokens) {
      if (t.family === family) t.revoked = true;
    }
  }

  async createMagicLinkToken(customerId: string, tokenHash: string, expiresAt: Date) {
    const tok: StoredMagicLink = {
      id: `ml-${this.magicLinkTokens.length + 1}`,
      tokenHash,
      customerId,
      expiresAt,
      consumedAt: null,
      createdAt: new Date(),
    };
    this.magicLinkTokens.push(tok);
    return tok as unknown as MagicLinkToken;
  }

  async consumeMagicLinkToken(tokenHash: string) {
    const tok = this.magicLinkTokens.find((t) => t.tokenHash === tokenHash);
    if (!tok || tok.consumedAt || tok.expiresAt < new Date()) return null;
    tok.consumedAt = new Date();
    return tok as unknown as MagicLinkToken;
  }

  async createOtpToken(input: { codeHash: string; staffMemberId?: string; customerId?: string; expiresAt: Date }) {
    const tok = {
      id: `otp-${this.otpTokens.length + 1}`,
      ...input,
      consumedAt: null,
      createdAt: new Date(),
    } as StoredOtp;
    this.otpTokens.push(tok);
    return tok as unknown as OtpToken;
  }

  async consumeOtpToken(codeHash: string) {
    const tok = this.otpTokens.find((t) => t.codeHash === codeHash && !t.consumedAt);
    if (!tok || tok.expiresAt < new Date()) return null;
    tok.consumedAt = new Date();
    return tok as unknown as OtpToken;
  }

  async createInvitationToken(
    email: string,
    barbershopId: string,
    role: InvitationRole,
    tokenHash: string,
    expiresAt: Date,
  ) {
    this.invitationTokens.push({
      tokenHash,
      email,
      barbershopId,
      role,
      expiresAt,
      consumedAt: null,
      createdAt: new Date(),
    });
  }

  async consumeInvitationToken(tokenHash: string) {
    const tok = this.invitationTokens.find((t) => t.tokenHash === tokenHash);
    if (!tok || tok.consumedAt || tok.expiresAt < new Date()) return null;
    tok.consumedAt = new Date();
    return { email: tok.email, barbershopId: tok.barbershopId, role: tok.role };
  }

  async createCustomer(input: { email: string; name: string; googleId?: string }) {
    const c = {
      id: `cust-${this.customers.length + 1}`,
      email: input.email,
      name: input.name,
      googleId: input.googleId ?? null,
      avatarUrl: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as unknown as StoredCustomer;
    this.customers.push(c);
    return { ...c, appointments: [], refreshTokens: [], magicLinks: [], otpTokens: [] } as unknown as Customer;
  }

  async linkGoogleAccount(customerId: string, googleId: string) {
    const c = this.customers.find((c) => c.id === customerId);
    if (c) c.googleId = googleId;
  }

  async updateStaffPassword(staffId: string, passwordHash: string) {
    const s = this.staff.find((s) => (s as StaffMember).id === staffId);
    if (s) (s as StaffMember).passwordHash = passwordHash;
  }

  async findInvitationByToken(tokenHash: string) {
    const tok = this.invitationTokens.find((t) => t.tokenHash === tokenHash);
    if (!tok || tok.consumedAt || tok.expiresAt < new Date()) return null;
    return tok.role;
  }

  async createStaffFromInvitation(input: {
    email: string;
    name: string;
    passwordHash: string;
    barbershopId: string;
    role: InvitationRole;
  }) {
    const s = {
      id: `staff-${this.staff.length + 1}`,
      barbershopId: input.barbershopId,
      email: input.email,
      passwordHash: input.passwordHash,
      name: input.name,
      role: ["BARBERSHOP_ADMIN", "BARBER"].includes(input.role) ? input.role : "BARBER",
      isBookable: true,
      isActive: true,
      avatarUrl: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as unknown as StaffMember;
    this.staff.push(s);
    return { ...s, barbershop: null, appointments: [], refreshTokens: [], otpTokens: [] } as unknown as StaffMember;
  }
}
