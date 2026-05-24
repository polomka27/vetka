const CURRENT_MAP_STORAGE_KEY = "vetka_current_map_slug";

// Блок читает slug последней открытой карты из localStorage.
export function getCurrentMapSlug() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(CURRENT_MAP_STORAGE_KEY);
}

// Блок сохраняет slug последней успешно открытой карты.
export function setCurrentMapSlug(slug: string) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(CURRENT_MAP_STORAGE_KEY, slug);
}

// Блок очищает протухший slug текущей карты, чтобы `/map` не вёл пользователя в удалённый роадмап.
export function clearCurrentMapSlug() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(CURRENT_MAP_STORAGE_KEY);
}
