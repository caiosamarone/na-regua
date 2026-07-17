export interface TopBarbershopRow {
  barbershopId: string;
  barbershopName: string;
  appointmentCount: number;
  revenue: number;
}

export interface TopServiceRow {
  serviceName: string;
  bookingCount: number;
  revenue: number;
}

export interface TopBarberRow {
  barberId: string;
  appointmentCount: number;
  revenue: number;
}

export interface BusiestDayRow {
  date: string;
  appointmentCount: number;
}

export interface BarberAvgPerDay {
  totalAppointments: number;
  daysInPeriod: number;
  avgPerDay: number;
}

export interface MetricsRepository {
  getActiveBarbershopsCount(): Promise<number>;
  getGlobalTotalRevenue(from: Date, to: Date): Promise<number>;
  getGlobalTotalDone(from: Date, to: Date): Promise<number>;
  getGlobalTotalCancelled(from: Date, to: Date): Promise<number>;
  getTopBarbershops(from: Date, to: Date): Promise<TopBarbershopRow[]>;

  getBarbershopRevenue(barbershopId: string, from: Date, to: Date): Promise<number>;
  getTopServices(barbershopId: string, from: Date, to: Date): Promise<TopServiceRow[]>;
  getTopBarbers(barbershopId: string, from: Date, to: Date): Promise<TopBarberRow[]>;
  getBusiestDays(barbershopId: string, from: Date, to: Date): Promise<BusiestDayRow[]>;

  getBarberTotalDone(barberId: string, from: Date, to: Date): Promise<number>;
  getBarberRevenue(barberId: string, from: Date, to: Date): Promise<number>;
  getBarberTopServices(barberId: string, from: Date, to: Date): Promise<TopServiceRow[]>;
  getBarberAvgPerDay(barberId: string, from: Date, to: Date): Promise<BarberAvgPerDay>;
}
