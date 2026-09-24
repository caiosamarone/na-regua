import { randomHex, hashToken } from "../../../shared/helpers/token.helper";
import { AuthRepository } from "../gateways/auth.repository";
import { EmailService } from "../../../shared/services/email.service";

const MAGIC_LINK_TTL_MS = 1000 * 60 * 15;

export class SendMagicLinkUseCase {
  constructor(
    private authRepository: AuthRepository,
    private emailService: EmailService,
    private frontendUrl: string,
    private mobileMagicLinkUrl: string,
  ) {}

  async execute(email: string, client: "web" | "mobile" = "web") {
    let customer = await this.authRepository.findCustomerByEmail(email);

    if (!customer) {
      customer = await this.authRepository.createCustomer({ email, name: email.split("@")[0] });
    }

    const rawToken = randomHex(32);
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + MAGIC_LINK_TTL_MS);

    await this.authRepository.createMagicLinkToken(
      customer.id,
      tokenHash,
      expiresAt,
    );

    const baseUrl =
      client === "mobile" ? this.mobileMagicLinkUrl : `${this.frontendUrl}/auth/magic-link`;
    const link = `${baseUrl}?token=${rawToken}`;

    await this.emailService.sendMagicLink(customer.email, link);
  }
}
