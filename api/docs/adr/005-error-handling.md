# API ADR 005: Error Handling

## Status

Accepted

## Context

Consistent error format across the API for predictable frontend handling.

## Decision

### Success Format
```json
{ "data": { ... } }
```

### Error Format
```json
{
  "error": "Human-readable message",
  "code": "ERROR_CODE",
  "details": {}
}
```

### Error Codes
| HTTP | Code | Usage |
|------|------|-------|
| 400 | `VALIDATION_ERROR` | Zod validation failures (field-level in `details`) |
| 401 | `UNAUTHORIZED` | Missing/invalid/expired token |
| 403 | `FORBIDDEN` | Valid token but insufficient role |
| 404 | `NOT_FOUND` | Resource not found |
| 409 | `APPOINTMENT_CONFLICT` | Double-booking |
| 409 | `EMAIL_ALREADY_EXISTS` | Duplicate email |
| 429 | `RATE_LIMIT_EXCEEDED` | Rate limit hit |
| 500 | `INTERNAL_ERROR` | Unexpected error (message suppressed in production) |

### Implementation
- Custom `AppError` class with `statusCode`, `code`, `details`
- Global Fastify error handler catches all errors
- Zod errors are mapped to `VALIDATION_ERROR` with fields

## Consequences
- Frontend switches on `code` for programmatic handling
- Stack traces never exposed to clients in production
