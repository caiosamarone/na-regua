import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [rtExpired, rtRevoked, mlExpired, otpExpired, invExpired] = await Promise.all([
    prisma.refreshToken.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    }),
    prisma.refreshToken.deleteMany({
      where: { revoked: true, createdAt: { lt: thirtyDaysAgo } },
    }),
    prisma.magicLinkToken.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    }),
    prisma.otpToken.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    }),
    prisma.invitationToken.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: new Date() } },
          { consumedAt: { not: null, lt: thirtyDaysAgo } },
        ],
      },
    }),
  ]);

  console.log("Cleanup completed:");
  console.log(`  RefreshToken expired: ${rtExpired.count}`);
  console.log(`  RefreshToken revoked+old: ${rtRevoked.count}`);
  console.log(`  MagicLinkToken expired: ${mlExpired.count}`);
  console.log(`  OtpToken expired: ${otpExpired.count}`);
  console.log(`  InvitationToken expired/consumed: ${invExpired.count}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
