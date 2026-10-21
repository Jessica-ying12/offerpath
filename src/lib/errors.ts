export class AppError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "AppError";
    this.status = status;
  }
}

export function errorMessage(error: unknown): string {
  if (error instanceof AppError) return error.message;
  if (error instanceof Error) return error.message;
  return "操作失败，请稍后重试";
}

export function errorStatus(error: unknown): number {
  return error instanceof AppError ? error.status : 500;
}
