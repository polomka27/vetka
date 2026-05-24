// Блок описывает стандартную ошибку API, которую возвращает backend.
export interface ApiErrorPayload {
  error: {
    code: string;
    message: string;
  };
}

// Блок описывает ошибку HTTP-клиента с кодом статуса и текстом backend.
export class ApiError extends Error {
  status: number;
  code: string;

  constructor(message: string, status: number, code = "unknown_error") {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}
