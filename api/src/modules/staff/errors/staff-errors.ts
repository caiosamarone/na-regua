import { AppError } from "../../../shared/errors/app-error";

export class StaffNotFoundError extends AppError {
  constructor(message = "Profissional não encontrado") {
    super(404, "STAFF_NOT_FOUND", message);
  }
}

export class StaffHasFutureBookingsError extends AppError {
  constructor(
    appointments: Array<{ id: string; startTime: string; customerId: string }>,
    message = "Staff member has future appointments",
  ) {
    super(409, "STAFF_HAS_FUTURE_BOOKINGS", message, { appointments });
  }
}

export class StaffEmailAlreadyExistsError extends AppError {
  constructor(message = "Email já cadastrado para um membro da equipe") {
    super(409, "EMAIL_ALREADY_EXISTS", message);
  }
}

export class StaffIsNotActive extends AppError {
  constructor(message = "Membro não está ativo") {
    super(409, "STAFF_IS_INACTIVE", message);
  }
}
