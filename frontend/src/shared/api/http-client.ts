import { API_BASE_URL } from "@/shared/api/config";
import { clearAccessToken, getAccessToken } from "@/shared/api/token-storage";
import { ApiError, type ApiErrorPayload } from "@/shared/api/types";

const DEFAULT_REQUEST_TIMEOUT_MS = 15_000;

// Блок описывает доступные опции HTTP-клиента поверх стандартного fetch.
interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  timeoutMs?: number;
}

// Блок пытается распарсить JSON-ответ и безопасно обрабатывает пустое тело.
async function parseResponseBody(response: Response): Promise<unknown | null> {
  const contentType = response.headers.get("content-type") ?? "";

  if (!contentType.includes("application/json")) {
    return null;
  }

  try {
    return await response.json();
  } catch {
    return null;
  }
}

// Блок определяет, нужно ли сериализовать тело запроса как JSON.
function isFormDataBody(body: unknown): body is FormData {
  return typeof FormData !== "undefined" && body instanceof FormData;
}

// Блок формирует заголовки запроса и добавляет Authorization при наличии токена.
function buildHeaders(initHeaders?: HeadersInit, body?: unknown): Headers {
  const headers = new Headers(initHeaders);
  const accessToken = getAccessToken();
  const hasJsonBody = body !== undefined && !isFormDataBody(body);

  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }

  if (hasJsonBody && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (accessToken && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  return headers;
}

// Блок приводит тело запроса к формату, который ожидает fetch.
function buildRequestBody(body: unknown): BodyInit | undefined {
  if (body === undefined) {
    return undefined;
  }

  if (isFormDataBody(body)) {
    return body;
  }

  return JSON.stringify(body);
}

// Блок объединяет внешний abort signal с таймаутом запроса, чтобы сетевые зависания не висели бесконечно.
function createRequestSignal(
  externalSignal: AbortSignal | null | undefined,
  timeoutMs: number
): {
  signal: AbortSignal;
  didTimeout: () => boolean;
  cleanup: () => void;
} {
  const controller = new AbortController();
  let didTimeout = false;
  const abortFromExternalSignal = () => controller.abort();
  const timeoutId = setTimeout(() => {
    didTimeout = true;
    controller.abort();
  }, timeoutMs);

  if (externalSignal) {
    if (externalSignal.aborted) {
      controller.abort();
    } else {
      externalSignal.addEventListener("abort", abortFromExternalSignal, { once: true });
    }
  }

  return {
    signal: controller.signal,
    didTimeout: () => didTimeout,
    cleanup: () => {
      clearTimeout(timeoutId);

      if (externalSignal) {
        externalSignal.removeEventListener("abort", abortFromExternalSignal);
      }
    }
  };
}

// Блок выполняет HTTP-запрос и приводит ошибки backend к единому типу ApiError.
export async function httpClient<TResponse>(
  path: string,
  {
    body,
    headers: initHeaders,
    timeoutMs = DEFAULT_REQUEST_TIMEOUT_MS,
    signal: externalSignal,
    ...options
  }: RequestOptions = {}
): Promise<TResponse> {
  const requestSignal = createRequestSignal(externalSignal, timeoutMs);
  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      signal: requestSignal.signal,
      headers: buildHeaders(initHeaders, body),
      body: buildRequestBody(body)
    });
  } catch (error) {
    requestSignal.cleanup();

    if (requestSignal.didTimeout()) {
      throw new ApiError("Превышено время ожидания ответа от API.", 408, "request_timeout");
    }

    if (error instanceof TypeError) {
      // Блок добавляет адрес API в текст ошибки, чтобы сразу было видно, куда именно пытался подключиться frontend.
      throw new ApiError(`Не удалось подключиться к API: ${API_BASE_URL}`, 503, "network_error");
    }

    throw error;
  }

  const responseBody = await parseResponseBody(response);
  requestSignal.cleanup();

  if (!response.ok) {
    const apiError = responseBody as ApiErrorPayload | null;
    const message = apiError?.error?.message ?? "Ошибка запроса к API.";
    const code = apiError?.error?.code ?? "request_failed";

    if (
      response.status === 401 &&
      ["token_expired", "invalid_token", "user_not_found"].includes(code)
    ) {
      clearAccessToken();
    }

    throw new ApiError(message, response.status, code);
  }

  return responseBody as TResponse;
}
