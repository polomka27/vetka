import { useMemo, useState } from "react";
import { useEffect } from "react";

// Блок задаёт ключ хранения избранных роадмапов в localStorage.
const SAVED_ROADMAPS_STORAGE_KEY = "vetka_saved_roadmaps";
// Блок задаёт имя кастомного события для синхронизации коллекции между разными инстансами хука.
const SAVED_ROADMAPS_UPDATED_EVENT = "vetka:saved-roadmaps-updated";

// Блок читает список сохранённых slug из localStorage.
function readSavedRoadmaps(): string[] {
  if (typeof window === "undefined") {
    return [];
  }

  const rawValue = window.localStorage.getItem(SAVED_ROADMAPS_STORAGE_KEY);
  if (!rawValue) {
    return [];
  }

  try {
    const parsedValue = JSON.parse(rawValue);
    return Array.isArray(parsedValue) ? parsedValue.filter((item) => typeof item === "string") : [];
  } catch {
    return [];
  }
}

// Блок управляет сохранёнными роадмапами пользователя на фронтенде.
export function useSavedRoadmaps() {
  const [savedSlugs, setSavedSlugs] = useState<string[]>(() => readSavedRoadmaps());

  const savedSlugsSet = useMemo(() => new Set(savedSlugs), [savedSlugs]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    // Блок подтягивает актуальную коллекцию из localStorage, когда она изменилась в другой вкладке или компоненте.
    const syncSavedRoadmaps = () => {
      setSavedSlugs(readSavedRoadmaps());
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key && event.key !== SAVED_ROADMAPS_STORAGE_KEY) {
        return;
      }

      syncSavedRoadmaps();
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener(SAVED_ROADMAPS_UPDATED_EVENT, syncSavedRoadmaps);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(SAVED_ROADMAPS_UPDATED_EVENT, syncSavedRoadmaps);
    };
  }, []);

  const toggleSavedRoadmap = (slug: string) => {
    setSavedSlugs((currentSlugs) => {
      const nextValue = currentSlugs.includes(slug)
        ? currentSlugs.filter((savedSlug) => savedSlug !== slug)
        : [...currentSlugs, slug];
      const normalizedValue = Array.from(new Set(nextValue));

      if (typeof window !== "undefined") {
        window.localStorage.setItem(SAVED_ROADMAPS_STORAGE_KEY, JSON.stringify(normalizedValue));
        // Блок синхронизирует коллекцию между экранами в рамках одной вкладки, где событие storage не срабатывает.
        window.dispatchEvent(new Event(SAVED_ROADMAPS_UPDATED_EVENT));
      }

      return normalizedValue;
    });
  };

  return {
    savedSlugs,
    savedSlugsSet,
    toggleSavedRoadmap,
  };
}
