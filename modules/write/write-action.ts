export const OFFLINE_WRITE_BLOCKED_CODE = "OFFLINE_WRITE_BLOCKED";
export const WRITE_FAILED_CODE = "WRITE_FAILED";

export const OFFLINE_WRITE_BLOCKED_MESSAGE = "当前处于离线状态，请联网后重试。";
export const WRITE_FAILED_MESSAGE = "写入失败，请稍后重试。";

export class WriteActionError extends Error {
  readonly code: string;
  readonly cause?: unknown;

  constructor(message: string, code: string, cause?: unknown) {
    super(message);
    this.name = "WriteActionError";
    this.code = code;
    this.cause = cause;
  }
}

export function createOfflineWriteBlockedError() {
  return new WriteActionError(
    OFFLINE_WRITE_BLOCKED_MESSAGE,
    OFFLINE_WRITE_BLOCKED_CODE,
  );
}

export function createWriteFailedError(cause?: unknown) {
  return new WriteActionError(WRITE_FAILED_MESSAGE, WRITE_FAILED_CODE, cause);
}

export function isWriteActionError(error: unknown): error is WriteActionError {
  return error instanceof WriteActionError;
}

export function getWriteActionMessage(error: unknown): string {
  if (isWriteActionError(error)) {
    return error.message;
  }

  return WRITE_FAILED_MESSAGE;
}

export async function guardWriteAction<T>(
  isOnline: boolean,
  action: () => Promise<T> | T,
): Promise<T> {
  if (!isOnline) {
    throw createOfflineWriteBlockedError();
  }

  try {
    return await action();
  } catch (error) {
    if (isWriteActionError(error)) {
      throw error;
    }

    throw createWriteFailedError(error);
  }
}
