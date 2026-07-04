import { randomHex, hashToken } from "../../../shared/helpers/token.helper";
import { hashPassword } from "../../../shared/helpers/password.helper";
import { StaffRepository } from "../gateways/staff.repository";
import { StaffEmailAlreadyExistsError, StaffNotFoundError } from "../errors/staff-errors";
import { EmailService } from "../../../shared/services/email.service";

const INVITE_TOKEN_TTL_MS = 1000 * 60 * 60 * 72;

export class InviteStaffUseCase {
  constructor(
    private staffRepository: StaffRepository,
    private emailService: EmailService,
  ) {}

  async execute(barbershopId: string, email: string, name: string, role: "BARBERSHOP_ADMIN" | "BARBER") {
    const existing = await this.staffRepository.findByEmail(email);
    if (existing) throw new StaffEmailAlreadyExistsError();

    const rawToken = randomHex(32);
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + INVITE_TOKEN_TTL_MS);

    const inviteLink = `${process.env.WEBAPP_URL || "http://localhost:3000"}/accept-invite?token=${rawToken}`;
    await this.emailService.sendInvite(email, inviteLink);

    return { email, role, message: "Convite enviado" };
  }
}
