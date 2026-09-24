export const queryKeys = {
  barbershopSearch: (params: object) => ['barbershops', 'search', params] as const,
  barbershop: (id: string) => ['barbershops', id] as const,
  slots: (shopId: string, params: { barberId: string; serviceId: string; date: string }) =>
    ['barbershops', shopId, 'slots', params] as const,
  appointment: (id: string) => ['appointments', id] as const,
  myAppointments: ['customers', 'me', 'appointments'] as const,
  shopAppointments: (shopId: string, params: object) => ['barbershops', shopId, 'appointments', params] as const,
  myCommissions: (params: object) => ['staff', 'me', 'commissions', params] as const,
  shopMetrics: (shopId: string, params: object) => ['barbershops', shopId, 'metrics', params] as const,
  staff: (shopId: string) => ['barbershops', shopId, 'staff'] as const,
  services: (shopId: string) => ['barbershops', shopId, 'services', 'all'] as const,
};
