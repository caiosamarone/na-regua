import { randomHex, hashToken } from "../../../shared/helpers/token.helper";
import { comparePasswords } from "../../../shared/helpers/password.helper";
import { AuthRepository } from "../gateways/auth.repository";
import { JwtService } from "../../../shared/services/jwt.service";

import { UnauthorizedError } from "../errors/auth-errors";

const REFRESH_TOKEN_TTL_MS = 1000 * 60 * 60 * 24 * 7;

export class StaffLoginUseCase {
  constructor(
    private authRepository: AuthRepository,
    private jwtService: JwtService,
  ) {}

  async execute(email: string, password: string) {
    const staff = await this.authRepository.findStaffByEmail(email);
    if (!staff || !staff.passwordHash) {
      throw new UnauthorizedError();
    }

    const isValid = await comparePasswords(password, staff.passwordHash);
    if (!isValid) {
      throw new UnauthorizedError();
    }

    const accessToken = this.jwtService.signAccessToken({
      sub: staff.id,
      role: staff.role,
      barbershopId: staff.barbershopId,
    });

    const rawRefresh = randomHex(32);
    const refreshHash = hashToken(rawRefresh);
    const family = randomHex(16);
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);

    await this.authRepository.createRefreshToken({
      tokenHash: refreshHash,
      family,
      staffMemberId: staff.id,
      expiresAt,
    });

    return {
      accessToken,
      refreshToken: rawRefresh,
      staff,
    };
  }
}
