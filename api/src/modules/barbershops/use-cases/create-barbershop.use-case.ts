import { randomHex, hashToken } from "../../../shared/helpers/token.helper";
import { BarbershopRepository } from "../gateways/barbershop.repository";
import { SlugAlreadyExistsError } from "../errors/barbershop-errors";
import { geocodeAddress } from "../helpers/geocoding.helper";
import { EmailService } from "../../../shared/services/email.service";
import type { CreateBarbershopInput } from "../gateways/barbershop.repository";

const INVITE_TOKEN_TTL_MS = 1000 * 60 * 60 * 72; // 72 hours

export class CreateBarbershopUseCase {
  constructor(
    private barbershopRepository: BarbershopRepository,
    private emailService: EmailService,
  ) {}

  async execute(input: CreateBarbershopInput & { adminEmail: string }) {
    const { adminEmail, ...barbershopData } = input;

    const existing = await this.barbershopRepository.findBySlug(barbershopData.slug);
    if (existing) throw new SlugAlreadyExistsError();

    let lat = barbershopData.latitude;
    let lng = barbershopData.longitude;

    if (lat == null || lng == null) {
      const geo = await geocodeAddress(`${barbershopData.address}, ${barbershopData.neighborhood}, ${barbershopData.city}, ${barbershopData.state}`);
      if (geo) {
        lat = geo.lat;
        lng = geo.lng;
      }
    }

    const barbershop = await this.barbershopRepository.create({
      ...barbershopData,
      latitude: lat ?? null,
      longitude: lng ?? null,
    });

    const rawToken = randomHex(32);
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + INVITE_TOKEN_TTL_MS);

    await this.barbershopRepository.createInvitationToken(
      adminEmail,
      barbershop.id,
      "BARBERSHOP_ADMIN",
      tokenHash,
      expiresAt,
    );

    const inviteLink = `${process.env.WEBAPP_URL || "http://localhost:3000"}/accept-invite?token=${rawToken}`;
    await this.emailService.sendInvite(adminEmail, inviteLink);

    return barbershop;
  }
}
