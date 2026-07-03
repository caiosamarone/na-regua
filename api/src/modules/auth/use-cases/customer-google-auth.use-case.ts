import { AuthRepository } from "../gateways/auth.repository";
import { JwtService } from "../../../shared/services/jwt.service";
import { GoogleAuthService } from "../../../shared/services/google.service";
import { randomHex, hashToken } from "../../../shared/helpers/token.helper";

const REFRESH_TOKEN_TTL_MS = 1000 * 60 * 60 * 24 * 7;

export class CustomerGoogleAuthUseCase {
  constructor(
    private repository: AuthRepository,
    private jwtService: JwtService,
    private googleService: GoogleAuthService,
  ) {}

  async execute(idToken: string) {
    const googlePayload = await this.googleService.verifyIdToken(idToken);
    let customer = await this.repository.findCustomerByEmail(
      googlePayload.email,
    );
    if (!customer) {
      customer = await this.repository.createCustomer({
        email: googlePayload.email,
        name: googlePayload.name,
      });
      await this.repository.linkGoogleAccount(customer.id, googlePayload.email);
    }

    const accessToken = this.jwtService.signAccessToken({
      sub: customer.id,
      role: "CUSTOMER",
    });

    const rawRefresh = randomHex(32);
    const refreshHash = hashToken(rawRefresh);
    const family = randomHex(16);
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);

    await this.repository.createRefreshToken({
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
