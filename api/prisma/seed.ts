import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hashPassword } from "../src/shared/helpers/password.helper";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = "super@naregua.app";
  const password = "admin123";

  const existing = await prisma.staffMember.findUnique({ where: { email } });
  if (existing) {
    console.log(`Super admin already exists (${existing.id}), skipping.`);
    return;
  }

  const passwordHash = await hashPassword(password);

  const staff = await prisma.staffMember.create({
    data: {
      email,
      passwordHash,
      name: "Super Admin",
      role: "SUPER_ADMIN",
      barbershopId: null,
      isBookable: false,
      isActive: true,
    },
  });

  console.log(`Super admin created: ${staff.email} (id=${staff.id})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
