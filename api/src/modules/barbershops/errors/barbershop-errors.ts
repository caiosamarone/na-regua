import { AppError } from "../../../shared/errors/app-error";

export class BarbershopNotFoundError extends AppError {
  constructor(message = "Barbearia não encontrada") {
    super(404, "BARBERSHOP_NOT_FOUND", message);
  }
}
