import { AppError } from "../../../shared/errors/app-error";

export class AppointmentNotFoundError extends AppError {
  constructor(message = "Agendamento não encontrado") {
    super(404, "APPOINTMENT_NOT_FOUND", message);
  }
}

export class AppointmentConflictError extends AppError {
  constructor(message = "Conflito de horário") {
    super(409, "APPOINTMENT_CONFLICT", message);
  }
}

export class AppointmentNotActionableError extends AppError {
  constructor(message = "Agendamento não pode ser alterado") {
    super(409, "APPOINTMENT_NOT_ACTIONABLE", message);
  }
}

export class AppointmentNotYetStartedError extends AppError {
  constructor(message = "Agendamento ainda não iniciado") {
    super(400, "APPOINTMENT_NOT_YET_STARTED", message);
  }
}

export class InvalidSlotError extends AppError {
  constructor(message = "Horário não disponível") {
    super(400, "INVALID_SLOT", message);
  }
}

export class BarbershopNotActiveError extends AppError {
  constructor(message = "Barbearia não está ativa") {
    super(400, "BARBERSHOP_NOT_ACTIVE", message);
  }
}
