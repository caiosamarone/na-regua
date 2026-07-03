import crypto from "crypto";

export function randomHex(bytesLength = 32): string {
  return crypto.randomBytes(bytesLength).toString("hex");
}

export function hashToken(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}
