import { AppError } from "../../../shared/errors/app-error";

export class BarbershopNotFoundError extends AppError {
  constructor(message = "Barbearia não encontrada") {
    super(404, "BARBERSHOP_NOT_FOUND", message);
  }
}

export class BarberNotFoundError extends AppError {
  constructor(message = "Profissional não encontrado") {
    super(404, "BARBER_NOT_FOUND", message);
  }
}

export class SlugAlreadyExistsError extends AppError {
  constructor(message = "Slug já está em uso") {
    super(409, "SLUG_ALREADY_EXISTS", message);
  }
}

export class OperatingHoursOverlapError extends AppError {
  constructor(message = "Horários operacionais não podem se sobrepor no mesmo dia") {
    super(400, "OPERATING_HOURS_OVERLAP", message);
  }
}
