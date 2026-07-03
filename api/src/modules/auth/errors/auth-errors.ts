import { AppError } from "../../../shared/errors/app-error";

export class UnauthorizedError extends AppError {
  constructor(message = "Credenciais inválidas") {
    super(401, "UNAUTHORIZED", message);
  }
}

export class EmailAlreadyExistsError extends AppError {
  constructor(message = "Email já cadastrado") {
    super(409, "EMAIL_ALREADY_EXISTS", message);
  }
}

export class MagicLinkInvalidError extends AppError {
  constructor(message = "Magic link inválido ou expirado") {
    super(401, "MAGIC_LINK_INVALID", message);
  }
}

export class InvitationInvalidError extends AppError {
  constructor(message = "Convite inválido ou expirado") {
    super(401, "INVITATION_INVALID", message);
  }
}

export class OtpInvalidError extends AppError {
  constructor(message = "OTP inválido ou expirado") {
    super(400, "OTP_INVALID", message);
  }
}
