// Блок задаёт базовый URL для всех запросов к Flask API.
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api";

// Блок задаёт ключ для хранения access token в localStorage.
export const ACCESS_TOKEN_STORAGE_KEY = "vetka_access_token";
