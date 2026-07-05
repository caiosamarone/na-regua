import { AppError } from "../../../shared/errors/app-error";

export class ServiceNotFoundError extends AppError {
  constructor(message = "Serviço não encontrado") {
    super(404, "SERVICE_NOT_FOUND", message);
  }
}
