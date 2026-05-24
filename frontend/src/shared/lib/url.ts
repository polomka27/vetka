// Блок проверяет, что ссылка использует только безопасные внешние протоколы http/https.
export function isSafeHttpUrl(value: string): boolean {
  try {
    const normalizedUrl = new URL(value);
    return normalizedUrl.protocol === "http:" || normalizedUrl.protocol === "https:";
  } catch {
    return false;
  }
}
