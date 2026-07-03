import { hashToken, randomHex } from "../../../shared/helpers/token.helper";
import { AuthRepository } from "../gateways/auth.repository";
import { JwtService } from "../../../shared/services/jwt.service";
import { MagicLinkInvalidError } from "../errors/auth-errors";

const REFRESH_TOKEN_TTL_MS = 1000 * 60 * 60 * 24 * 7;

export class VerifyMagicLinkUseCase {
  constructor(
    private authRepository: AuthRepository,
    private jwtService: JwtService,
  ) {}

  async execute(token: string) {
    const tokenHash = hashToken(token);
    const stored = await this.authRepository.consumeMagicLinkToken(tokenHash);

    if (!stored) {
      throw new MagicLinkInvalidError();
    }

    const customer = await this.authRepository.findCustomerById(stored.customerId);

    if (!customer) {
      throw new MagicLinkInvalidError();
    }

    const accessToken = this.jwtService.signAccessToken({
      sub: customer.id,
      role: "CUSTOMER",
    });

    const rawRefresh = randomHex(32);
    const refreshHash = hashToken(rawRefresh);
    const family = randomHex(16);
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);

    await this.authRepository.createRefreshToken({
      tokenHash: refreshHash,
      family,
      customerId: customer.id,
      expiresAt,
    });

    return {
      accessToken,
      refreshToken: rawRefresh,
      customer,
    };
  }
}
