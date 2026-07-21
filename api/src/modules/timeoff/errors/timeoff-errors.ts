import { AppError } from "../../../shared/errors/app-error";

export class TimeOffNotFoundError extends AppError {
  constructor(message = "Período de indisponibilidade não encontrado") {
    super(404, "TIME_OFF_NOT_FOUND", message);
    Object.setPrototypeOf(this, TimeOffNotFoundError.prototype);
  }
}

export class StaffMemberNotFoundError extends AppError {
  constructor(message = "Profissional não encontrado") {
    super(404, "STAFF_MEMBER_NOT_FOUND", message);
    Object.setPrototypeOf(this, StaffMemberNotFoundError.prototype);
  }
}

export class NotYourTimeOffError extends AppError {
  constructor(message = "Você só pode gerenciar seus próprios períodos de indisponibilidade") {
    super(403, "NOT_YOUR_TIME_OFF", message);
    Object.setPrototypeOf(this, NotYourTimeOffError.prototype);
  }
}
