import { ACCESS_TOKEN_STORAGE_KEY } from "@/shared/api/config";

// Блок читает токен из localStorage, если приложение запущено в браузере.
export function getAccessToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);
}

// Блок сохраняет токен после успешной авторизации пользователя.
export function setAccessToken(token: string): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, token);
}

// Блок удаляет токен, например при logout или невалидной сессии.
export function clearAccessToken(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
}
