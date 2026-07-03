import bcrypt from "bcryptjs";

const SALT_ROUNDS = 10;

export async function hashPassword(raw: string): Promise<string> {
  return bcrypt.hash(raw, SALT_ROUNDS);
}

export async function comparePasswords(raw: string, hashed: string): Promise<boolean> {
  return bcrypt.compare(raw, hashed);
}
