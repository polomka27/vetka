/// <reference types="vite/client" />

// Блок расширяет типы env-переменных для безопасной конфигурации API.
interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
