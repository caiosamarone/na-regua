export interface UploadRepository {
  saveBarbershopLogo(barbershopId: string, url: string): Promise<void>;
  saveStaffAvatar(barbershopId: string, staffId: string, url: string): Promise<void>;
  findStaffById(staffId: string): Promise<{ id: string; barbershopId: string | null } | null>;
  findBarbershopById(barbershopId: string): Promise<{ id: string } | null>;
}
