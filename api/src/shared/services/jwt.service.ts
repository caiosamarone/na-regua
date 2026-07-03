import jwt from "jsonwebtoken";
import { env } from "../../config/env";

const ACCESS_TOKEN_TTL = "30m";

export class JwtService {
  signAccessToken(payload: object): string {
    return jwt.sign(payload, env.JWT_SECRET, { expiresIn: ACCESS_TOKEN_TTL });
  }

  verifyAccessToken<T = object>(token: string): T {
    return jwt.verify(token, env.JWT_SECRET) as T;
  }
}
