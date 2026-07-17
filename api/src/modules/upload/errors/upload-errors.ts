import { AppError } from "../../../shared/errors/app-error";

export class InvalidFileTypeError extends AppError {
  constructor(message = "Tipo de arquivo não permitido. Use JPEG, PNG ou WebP.") {
    super(400, "INVALID_FILE_TYPE", message);
  }
}

export class FileTooLargeError extends AppError {
  constructor(message = "Arquivo muito grande. Máximo de 5MB.") {
    super(400, "FILE_TOO_LARGE", message);
  }
}

export class StaffMemberNotFoundError extends AppError {
  constructor(message = "Profissional não encontrado") {
    super(404, "STAFF_MEMBER_NOT_FOUND", message);
  }
}

export class BarbershopNotFoundError extends AppError {
  constructor(message = "Barbearia não encontrada") {
    super(404, "BARBERSHOP_NOT_FOUND", message);
  }
}
