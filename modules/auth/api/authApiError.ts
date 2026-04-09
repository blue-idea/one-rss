export class AuthApiError extends Error {
  readonly code: string;
  readonly httpStatus: number;
  readonly details?: Record<string, unknown>;

  constructor(
    message: string,
    code: string,
    httpStatus: number,
    details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "AuthApiError";
    this.code = code;
    this.httpStatus = httpStatus;
    this.details = details;
  }
}
