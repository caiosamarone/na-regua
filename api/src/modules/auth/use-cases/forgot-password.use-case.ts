import { hashToken } from "../../../shared/helpers/token.helper";
import { AuthRepository } from "../gateways/auth.repository";
import { EmailService } from "../../../shared/services/email.service";

const OTP_TTL_MS = 1000 * 60 * 15;

function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export class ForgotPasswordUseCase {
  constructor(
    private authRepository: AuthRepository,
    private emailService: EmailService,
  ) {}

  async execute(email: string) {
    const staff = await this.authRepository.findStaffByEmail(email);

    if (!staff) {
      return;
    }

    const code = generateOtp();
    const codeHash = hashToken(code);
    const expiresAt = new Date(Date.now() + OTP_TTL_MS);

    await this.authRepository.createOtpToken({
      codeHash,
      staffMemberId: staff.id,
      expiresAt,
    });

    await this.emailService.sendOtp(staff.email, code);
  }
}
