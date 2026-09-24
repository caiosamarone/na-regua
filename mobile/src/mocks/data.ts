// Fake data from the "Na Régua App" design (Claude Design), shaped like the API responses.
import type { OperatingHour, StaffRole } from '@/types/api';

export const MOCK_TZ = 'America/Sao_Paulo';
export const HOME_SHOP_ID = 'shop-1';

export const SHOPS = [
  { id: 'shop-1', name: 'Barbearia do Zé', address: 'R. Harmonia, 412', neighborhood: 'Vila Madalena', km: 0.4 },
  { id: 'shop-2', name: 'Navalha & Cia', address: 'R. Aspicuelta, 88', neighborhood: 'Vila Madalena', km: 0.8 },
  { id: 'shop-3', name: 'Studio Corte Fino', address: 'R. Fradique Coutinho, 1020', neighborhood: 'Pinheiros', km: 1.6 },
  { id: 'shop-4', name: 'Old Town Barber', address: 'R. dos Pinheiros, 540', neighborhood: 'Pinheiros', km: 2.4 },
  { id: 'shop-5', name: 'Barbearia Central', address: 'R. Teodoro Sampaio, 700', neighborhood: 'Pinheiros', km: 2.9 },
  { id: 'shop-6', name: 'Dom Bigode', address: 'Av. Pompeia, 310', neighborhood: 'Pompeia', km: 3.8 },
  { id: 'shop-7', name: 'Casa do Barbeiro', address: 'R. Augusta, 2100', neighborhood: 'Jardins', km: 4.6 },
  { id: 'shop-8', name: 'Régua Alta', address: 'R. Vergueiro, 900', neighborhood: 'Liberdade', km: 6.2 },
];

export type MockStaff = {
  id: string;
  name: string;
  email: string;
  role: StaffRole;
  isBookable: boolean;
  isActive: boolean;
  commissionPercent: number | null;
};

// Every shop shares this team, services and hours (same simplification as the design).
export const STAFF: MockStaff[] = [
  { id: 'staff-ze', name: 'Zé Barbeiro', email: 'ze@barbearia.com', role: 'BARBERSHOP_ADMIN', isBookable: true, isActive: true, commissionPercent: null },
  { id: 'staff-carlos', name: 'Carlos Tesoura', email: 'carlos@barbearia.com', role: 'BARBER', isBookable: true, isActive: true, commissionPercent: 40 },
  { id: 'staff-rafa', name: 'Rafa Lima', email: 'rafa@barbearia.com', role: 'BARBER', isBookable: true, isActive: true, commissionPercent: 40 },
  { id: 'staff-diego', name: 'Diego Souza', email: 'diego@barbearia.com', role: 'BARBER', isBookable: false, isActive: true, commissionPercent: 35 },
];

export const SUPER_ADMIN = { id: 'staff-super', name: 'Super Admin', email: 'super@naregua.app' };
export const DEMO_PASSWORD = 'admin123';

export const SERVICES = [
  { id: 'svc-1', name: 'Corte Masculino', durationMinutes: 30, price: 45, isActive: true },
  { id: 'svc-2', name: 'Barba', durationMinutes: 20, price: 25, isActive: true },
  { id: 'svc-3', name: 'Corte + Barba', durationMinutes: 45, price: 60, isActive: true },
  { id: 'svc-4', name: 'Hidratação Capilar', durationMinutes: 40, price: 50, isActive: true },
  { id: 'svc-5', name: 'Design de Sobrancelha', durationMinutes: 15, price: 20, isActive: false },
];

const weekday = (dayOfWeek: number, ...intervals: [string, string][]) =>
  intervals.map(([startTime, endTime]) => ({ dayOfWeek, startTime, endTime }));

export const HOURS: OperatingHour[] = [
  ...[1, 2, 3, 4].flatMap((d) => weekday(d, ['08:00', '12:00'], ['13:00', '18:00'])),
  ...weekday(5, ['08:00', '12:00'], ['13:00', '17:00']),
  ...weekday(6, ['08:00', '13:00']),
];

export const GOOGLE_ACCOUNTS = [
  { id: 'cust-joao', name: 'João Silva', email: 'joao.silva@gmail.com' },
  { id: 'cust-maria', name: 'Maria Santos', email: 'maria.santos@gmail.com' },
];

export const CLIENT_NAMES = [
  'Pedro Oliveira',
  'Lucas Pereira',
  'Bruno Alves',
  'Thiago Rocha',
  'Felipe Costa',
  'Gabriel Nunes',
  'Rafael Dias',
  'Marcos Lima',
  'André Souza',
];
