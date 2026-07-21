import { AppError } from "../../../shared/errors/app-error";

export class SubscriptionNotFoundError extends AppError {
  constructor(message = "Inscrição push não encontrada") {
    super(404, "SUBSCRIPTION_NOT_FOUND", message);
    Object.setPrototypeOf(this, SubscriptionNotFoundError.prototype);
  }
}

export class SubscriptionNotOwnedError extends AppError {
  constructor(message = "Inscrição push não pertence a este cliente") {
    super(403, "SUBSCRIPTION_NOT_OWNED", message);
    Object.setPrototypeOf(this, SubscriptionNotOwnedError.prototype);
  }
}
