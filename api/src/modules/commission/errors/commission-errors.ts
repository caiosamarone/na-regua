import { AppError } from "../../../shared/errors/app-error";

export class CommissionAlreadyExistsError extends AppError {
  constructor(message = "Comissão já calculada para este agendamento") {
    super(409, "COMMISSION_ALREADY_EXISTS", message);
    Object.setPrototypeOf(this, CommissionAlreadyExistsError.prototype);
  }
}

export class CommissionAlreadyPaidError extends AppError {
  constructor(message = "Comissão já foi paga") {
    super(409, "COMMISSION_ALREADY_PAID", message);
    Object.setPrototypeOf(this, CommissionAlreadyPaidError.prototype);
  }
}

export class CommissionEntryNotFoundError extends AppError {
  constructor(message = "Entrada de comissão não encontrada") {
    super(404, "COMMISSION_ENTRY_NOT_FOUND", message);
    Object.setPrototypeOf(this, CommissionEntryNotFoundError.prototype);
  }
}

export class NoPendingCommissionsError extends AppError {
  constructor(message = "Nenhuma comissão pendente para pagar") {
    super(404, "NO_PENDING_COMMISSIONS", message);
    Object.setPrototypeOf(this, NoPendingCommissionsError.prototype);
  }
}

export class StaffNotFoundError extends AppError {
  constructor(message = "Profissional não encontrado") {
    super(404, "STAFF_NOT_FOUND", message);
    Object.setPrototypeOf(this, StaffNotFoundError.prototype);
  }
}

export class InvalidPayInputError extends AppError {
  constructor(message = "Informe staffMemberId ou payAll: true") {
    super(400, "INVALID_PAY_INPUT", message);
    Object.setPrototypeOf(this, InvalidPayInputError.prototype);
  }
}
