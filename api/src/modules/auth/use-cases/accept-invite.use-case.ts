import { hashToken } from "../../../shared/helpers/token.helper";
import { hashPassword } from "../../../shared/helpers/password.helper";
import { AuthRepository } from "../gateways/auth.repository";
import { InvitationInvalidError } from "../errors/auth-errors";

export class AcceptInviteUseCase {
  constructor(
    private authRepository: AuthRepository,
  ) {}

  async execute(token: string, name: string, password: string) {
    const tokenHash = hashToken(token);
    const invitation = await this.authRepository.consumeInvitationToken(tokenHash);

    if (!invitation) {
      throw new InvitationInvalidError();
    }

    const passwordHash = await hashPassword(password);

    await this.authRepository.createStaffFromInvitation({
      email: invitation.email,
      name,
      passwordHash,
      barbershopId: invitation.barbershopId,
      role: invitation.role,
    });
  }
}
