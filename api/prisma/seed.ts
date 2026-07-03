import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hashPassword } from "../src/shared/helpers/password.helper";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const existingSuper = await prisma.staffMember.findUnique({
    where: { email: "super@naregua.app" },
  });
  if (existingSuper) {
    console.log("Seed already run, skipping.");
    return;
  }

  const hash = await hashPassword("admin123");

  // ── Super Admin ──────────────────────────────────────────────
  await prisma.staffMember.create({
    data: {
      email: "super@naregua.app",
      passwordHash: hash,
      name: "Super Admin",
      role: "SUPER_ADMIN",
      barbershopId: null,
      isBookable: false,
      isActive: true,
    },
  });
  console.log("Super admin created: super@naregua.app / admin123");

  // ── Barbershop 1 — Barbearia do Zé ─────────────────────────
  const shop1 = await prisma.barbershop.create({
    data: {
      name: "Barbearia do Zé",
      slug: "barbearia-do-ze",
      address: "Rua Augusta, 1500",
      cep: "01304-001",
      neighborhood: "Consolação",
      city: "São Paulo",
      state: "SP",
      timezone: "America/Sao_Paulo",
      phone: "(11) 99999-0001",
      active: true,
      operatingHours: {
        create: [
          { dayOfWeek: 1, startTime: "08:00", endTime: "12:00" },
          { dayOfWeek: 1, startTime: "13:00", endTime: "18:00" },
          { dayOfWeek: 2, startTime: "08:00", endTime: "12:00" },
          { dayOfWeek: 2, startTime: "13:00", endTime: "18:00" },
          { dayOfWeek: 3, startTime: "08:00", endTime: "12:00" },
          { dayOfWeek: 3, startTime: "13:00", endTime: "18:00" },
          { dayOfWeek: 4, startTime: "08:00", endTime: "12:00" },
          { dayOfWeek: 4, startTime: "13:00", endTime: "18:00" },
          { dayOfWeek: 5, startTime: "08:00", endTime: "12:00" },
          { dayOfWeek: 5, startTime: "13:00", endTime: "17:00" },
          { dayOfWeek: 6, startTime: "08:00", endTime: "13:00" },
        ],
      },
      services: {
        create: [
          { name: "Corte Masculino", durationMinutes: 30, price: 45 },
          { name: "Barba", durationMinutes: 20, price: 25 },
          { name: "Corte + Barba", durationMinutes: 45, price: 60 },
          { name: "Hidratação Capilar", durationMinutes: 40, price: 50 },
        ],
      },
    },
    include: { services: true },
  });
  console.log(`Barbershop created: ${shop1.slug}`);

  // ── Barbershop 2 — Studio Corte & Arte ─────────────────────
  const shop2 = await prisma.barbershop.create({
    data: {
      name: "Studio Corte & Arte",
      slug: "studio-corte-arte",
      address: "Av. Paulista, 1000",
      cep: "01310-100",
      neighborhood: "Bela Vista",
      city: "São Paulo",
      state: "SP",
      timezone: "America/Sao_Paulo",
      phone: "(11) 99999-0002",
      active: true,
      operatingHours: {
        create: [
          { dayOfWeek: 1, startTime: "09:00", endTime: "13:00" },
          { dayOfWeek: 1, startTime: "14:00", endTime: "19:00" },
          { dayOfWeek: 2, startTime: "09:00", endTime: "13:00" },
          { dayOfWeek: 2, startTime: "14:00", endTime: "19:00" },
          { dayOfWeek: 3, startTime: "09:00", endTime: "13:00" },
          { dayOfWeek: 3, startTime: "14:00", endTime: "19:00" },
          { dayOfWeek: 4, startTime: "09:00", endTime: "13:00" },
          { dayOfWeek: 4, startTime: "14:00", endTime: "19:00" },
          { dayOfWeek: 5, startTime: "09:00", endTime: "13:00" },
          { dayOfWeek: 5, startTime: "14:00", endTime: "18:00" },
          { dayOfWeek: 6, startTime: "08:00", endTime: "14:00" },
        ],
      },
      services: {
        create: [
          { name: "Corte Degradê", durationMinutes: 40, price: 55 },
          { name: "Barba Tradicional", durationMinutes: 25, price: 30 },
          {
            name: "Corte + Barba + Hidratação",
            durationMinutes: 60,
            price: 80,
          },
          { name: "Design de Sobrancelha", durationMinutes: 15, price: 20 },
        ],
      },
    },
    include: { services: true },
  });
  console.log(`Barbershop created: ${shop2.slug}`);

  // ── Staff ────────────────────────────────────────────────────
  // Barbershop 1
  const staff1Shop1 = await prisma.staffMember.create({
    data: {
      email: "ze@barbearia.com",
      passwordHash: hash,
      name: "Zé Barbeiro",
      role: "BARBERSHOP_ADMIN",
      barbershopId: shop1.id,
      isBookable: true,
      isActive: true,
    },
  });
  const staff2Shop1 = await prisma.staffMember.create({
    data: {
      email: "carlos@barbearia.com",
      passwordHash: hash,
      name: "Carlos Tesoura",
      role: "BARBER",
      barbershopId: shop1.id,
      isBookable: true,
      isActive: true,
    },
  });

  // Barbershop 2
  const staff1Shop2 = await prisma.staffMember.create({
    data: {
      email: "admin@corteearte.com",
      passwordHash: hash,
      name: "Mestre André",
      role: "BARBERSHOP_ADMIN",
      barbershopId: shop2.id,
      isBookable: true,
      isActive: true,
    },
  });
  const staff2Shop2 = await prisma.staffMember.create({
    data: {
      email: "junior@corteearte.com",
      passwordHash: hash,
      name: "Júnior Navalha",
      role: "BARBER",
      barbershopId: shop2.id,
      isBookable: true,
      isActive: true,
    },
  });
  console.log("Staff created: 4 barbers (2 per shop)");

  // ── Customers ────────────────────────────────────────────────
  const [c1, c2, c3, c4] = await Promise.all([
    prisma.customer.create({
      data: { email: "joao@email.com", name: "João Silva" },
    }),
    prisma.customer.create({
      data: { email: "maria@email.com", name: "Maria Santos" },
    }),
    prisma.customer.create({
      data: { email: "pedro@email.com", name: "Pedro Oliveira" },
    }),
    prisma.customer.create({
      data: { email: "ana@email.com", name: "Ana Costa" },
    }),
  ]);
  console.log("Customers created: 4 users");

  // ── Future appointments (for testing) ────────────────────────
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(10, 0, 0, 0);

  await prisma.appointment.create({
    data: {
      barbershopId: shop1.id,
      customerId: c1.id,
      barberId: staff1Shop1.id,
      serviceId: shop1.services[0].id,
      serviceName: "Corte Masculino",
      priceAtBooking: 45,
      durationAtBooking: 30,
      startTime: tomorrow,
      endTime: new Date(tomorrow.getTime() + 30 * 60 * 1000),
      status: "BOOKED",
    },
  });

  const dayAfterTomorrow = new Date(tomorrow);
  dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);
  dayAfterTomorrow.setHours(14, 30, 0, 0);

  await prisma.appointment.create({
    data: {
      barbershopId: shop2.id,
      customerId: c2.id,
      barberId: staff1Shop2.id,
      serviceId: shop2.services[0].id,
      serviceName: "Corte Degradê",
      priceAtBooking: 55,
      durationAtBooking: 40,
      startTime: dayAfterTomorrow,
      endTime: new Date(dayAfterTomorrow.getTime() + 40 * 60 * 1000),
      status: "BOOKED",
    },
  });

  console.log("Appointments created: 2 future bookings");
  console.log("\n✅ Seed completed!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
