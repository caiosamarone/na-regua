import { hashToken } from "../../../shared/helpers/token.helper";
import { AuthRepository } from "../gateways/auth.repository";

export class StaffLogoutUseCase {
  constructor(
    private authRepository: AuthRepository,
  ) {}

  async execute(refreshToken: string, allDevices = false) {
    const tokenHash = hashToken(refreshToken);
    const stored = await this.authRepository.findRefreshTokenByHash(tokenHash);

    if (!stored || stored.revoked) {
      return;
    }

    if (allDevices) {
      await this.authRepository.revokeRefreshTokenFamily(stored.family);
    } else {
      await this.authRepository.revokeRefreshToken(stored.id);
    }
  }
}
