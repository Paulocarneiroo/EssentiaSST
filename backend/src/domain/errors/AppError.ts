export class AppError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(message: string, status = 500, code = 'AppError') {
    super(message);
    this.name = code;
    this.status = status;
    this.code = code;
  }
}

export class NotFoundError extends AppError {
  constructor(message: string) {
    super(message, 404, 'NotFound');
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, 'ValidationError');
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, 'Conflict');
  }
}
