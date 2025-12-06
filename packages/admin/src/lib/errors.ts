import axios from "axios";

// Base error types (composable sum types)
export type NetworkError = { type: "NETWORK"; status: number; message: string };
export type UnauthorizedError = { type: "UNAUTHORIZED"; reason: string };
export type NotFoundError = { type: "NOT_FOUND"; resource: string };
export type ValidationError = {
  type: "VALIDATION";
  field: string;
  message: string;
};
export type ConflictError = {
  type: "CONFLICT";
  resource: string;
  message: string;
};
export type UnknownError = { type: "UNKNOWN"; cause: Error };

// Union of all API errors
export type ApiError =
  | NetworkError
  | UnauthorizedError
  | NotFoundError
  | ValidationError
  | ConflictError
  | UnknownError;

// Constructors
export const NetworkError = (status: number, message: string): NetworkError => ({
  type: "NETWORK",
  status,
  message,
});

export const UnauthorizedError = (reason: string): UnauthorizedError => ({
  type: "UNAUTHORIZED",
  reason,
});

export const NotFoundError = (resource: string): NotFoundError => ({
  type: "NOT_FOUND",
  resource,
});

export const ValidationError = (
  field: string,
  message: string
): ValidationError => ({
  type: "VALIDATION",
  field,
  message,
});

export const ConflictError = (
  resource: string,
  message: string
): ConflictError => ({
  type: "CONFLICT",
  resource,
  message,
});

export const UnknownError = (cause: Error): UnknownError => ({
  type: "UNKNOWN",
  cause,
});

// Parse axios error to typed error
export function parseAxiosError(error: unknown): ApiError {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const message = error.response?.data?.message || error.message;

    if (status === 401) return UnauthorizedError(message);
    if (status === 404) return NotFoundError(message);
    if (status === 409) return ConflictError("resource", message);
    if (status) return NetworkError(status, message);
  }
  return UnknownError(error instanceof Error ? error : new Error(String(error)));
}
