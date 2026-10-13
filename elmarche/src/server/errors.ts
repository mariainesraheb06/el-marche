import { apiError, type ApiErrorCode } from "@/lib/api/http";

export class ServiceError extends Error {
  readonly code: ApiErrorCode;

  constructor(code: ApiErrorCode, message: string) {
    super(message);
    this.name = "ServiceError";
    this.code = code;
  }
}

export function errorResponse(error: unknown) {
  if (error instanceof ServiceError) return apiError(error.code, error.message);
  return apiError("internal_error", "Une erreur est survenue. Réessayez plus tard.");
}