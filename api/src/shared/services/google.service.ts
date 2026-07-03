import { OAuth2Client } from "google-auth-library";
import { env } from "../../config/env";

const client = new OAuth2Client(env.GOOGLE_CLIENT_ID);

export class GoogleAuthService {
  async verifyIdToken(idToken: string) {
    const ticket = await client.verifyIdToken({ idToken, audience: env.GOOGLE_CLIENT_ID });
    const payload = ticket.getPayload();
    if (!payload?.email || payload.email_verified !== true) {
      throw new Error("Email não verificado");
    }
    return {
      sub: payload.sub,
      email: payload.email,
      name: payload.name ?? payload.email.split("@")[0],
    };
  }
}
