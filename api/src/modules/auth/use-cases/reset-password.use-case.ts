import { hashToken } from "../../../shared/helpers/token.helper";
import { hashPassword } from "../../../shared/helpers/password.helper";
import { AuthRepository } from "../gateways/auth.repository";
import { OtpInvalidError } from "../errors/auth-errors";

export class ResetPasswordUseCase {
  constructor(
    private authRepository: AuthRepository,
  ) {}

  async execute(email: string, otp: string, newPassword: string) {
    const codeHash = hashToken(otp);
    const stored = await this.authRepository.consumeOtpToken(codeHash);

    if (!stored) {
      throw new OtpInvalidError();
    }

    const staff = await this.authRepository.findStaffByEmail(email);
    if (!staff) {
      throw new OtpInvalidError();
    }

    const passwordHash = await hashPassword(newPassword);

    await this.authRepository.updateStaffPassword(staff.id, passwordHash);
  }
}
