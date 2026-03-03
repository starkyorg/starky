export type WalletAdapterErrorCode =
  | "WALLET_UNAVAILABLE"
  | "CONNECT_FAILED"
  | "DISCONNECT_FAILED"
  | "SIGN_FAILED"
  | "NOT_CONNECTED";

export class WalletAdapterError extends Error {
  code: WalletAdapterErrorCode;

  constructor(code: WalletAdapterErrorCode, message: string, cause?: unknown) {
    super(message);
    this.name = "WalletAdapterError";
    this.code = code;
    if (cause !== undefined) {
      (this as any).cause = cause;
    }
  }
}

export const toWalletAdapterError = (
  error: unknown,
  code: WalletAdapterErrorCode,
  message: string
) => {
  if (error instanceof WalletAdapterError) {
    return error;
  }

  if (
    error &&
    typeof error === "object" &&
    "code" in error &&
    typeof (error as any).code === "string"
  ) {
    return new WalletAdapterError(
      (error as any).code as WalletAdapterErrorCode,
      String((error as any).message || message),
      error
    );
  }

  const reason =
    error && typeof error === "object" && "message" in error
      ? String((error as any).message)
      : message;

  return new WalletAdapterError(code, reason || message, error);
};
