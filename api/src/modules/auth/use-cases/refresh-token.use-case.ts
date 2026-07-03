import { randomHex, hashToken } from "../../../shared/helpers/token.helper";
import { AuthRepository } from "../gateways/auth.repository";
import { JwtService } from "../../../shared/services/jwt.service";
import { RefreshTokenInvalidError } from "../errors/auth-errors";

const REFRESH_TOKEN_TTL_MS = 1000 * 60 * 60 * 24 * 7;

export class RefreshTokenUseCase {
  constructor(
    private authRepository: AuthRepository,
    private jwtService: JwtService,
  ) {}

  async execute(refreshToken: string) {
    const tokenHash = hashToken(refreshToken);
    const stored = await this.authRepository.findRefreshTokenByHash(tokenHash);

    if (!stored) {
      throw new RefreshTokenInvalidError();
    }

    if (stored.revoked) {
      await this.authRepository.revokeRefreshTokenFamily(stored.family);
      throw new RefreshTokenInvalidError(
        "Refresh token reutilizado — todas as sessões foram invalidadas",
      );
    }

    await this.authRepository.revokeRefreshToken(stored.id);

    const rawRefresh = randomHex(32);
    const newHash = hashToken(rawRefresh);
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);

    const newToken = await this.authRepository.createRefreshToken({
      tokenHash: newHash,
      family: stored.family,
      staffMemberId: stored.staffMemberId ?? undefined,
      customerId: stored.customerId ?? undefined,
      expiresAt,
    });

    let payload: { sub: string; role: string; barbershopId?: string | null };

    if (newToken.staffMemberId) {
      const staff = await this.authRepository.findStaffById(newToken.staffMemberId);
      if (!staff) throw new RefreshTokenInvalidError();
      payload = {
        sub: staff.id,
        role: staff.role,
        barbershopId: staff.barbershopId,
      };
    } else {
      payload = {
        sub: newToken.customerId!,
        role: "CUSTOMER",
      };
    }

    const accessToken = this.jwtService.signAccessToken(payload);

    return {
      accessToken,
      refreshToken: rawRefresh,
    };
  }
}
