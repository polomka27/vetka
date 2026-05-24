import { useDeferredValue, useMemo, useState } from "react";

import { useRoadmapsQuery } from "@/entities/roadmap/api/hooks";
import type { RoadmapFilters } from "@/entities/roadmap/model/types";
import { RoadmapCard } from "@/entities/roadmap/ui/RoadmapCard";
import { useSavedRoadmaps } from "@/features/collection/model/saved-roadmaps";
import { RoadmapsFilters } from "@/features/roadmap-filters/ui/RoadmapsFilters";
import { Button } from "@/shared/ui/button";
import { PageShell } from "@/shared/ui/page-shell";
import { RoadmapCardSkeleton } from "@/shared/ui/skeleton";
import { StateMessage } from "@/shared/ui/state-message";

const categoryGroups: Record<string, string[]> = {
  development: ["backend", "frontend", "devops", "database", "mobile", "qa", "programming", "software"],
  data: ["data", "analytics", "analysis", "sql", "database", "ai", "ml"],
  design: ["design", "ui", "ux", "product", "research"],
  business: ["marketing", "sales", "finance", "business", "growth"],
  languages: ["language", "english", "communication", "writing"],
  science: ["science", "research", "biology", "chemistry", "physics"],
  management: ["management", "career", "leadership", "hr", "operations"]
};

// Блок хранит стартовые значения фильтров каталога.
const initialFilters: RoadmapFilters = {
  search: "",
  category: undefined,
  level: undefined
};

// Блок удаляет пустые строки из фильтров перед отправкой в API.
function normalizeFilters(filters: RoadmapFilters): RoadmapFilters {
  return {
    search: filters.search?.trim() || undefined,
    category: filters.category || undefined,
    level: filters.level || undefined
  };
}

// Блок проверяет, удовлетворяет ли роадмап всем активным условиям поиска и фильтрации.
function matchesFilters(roadmap: {
  title: string;
  short_description: string;
  category: string;
  level: string;
  author_name?: string;
}, filters: RoadmapFilters) {
  const normalizedSearch = filters.search?.trim().toLowerCase();
  const searchTerms = normalizedSearch ? normalizedSearch.split(/\s+/).filter(Boolean) : [];
  const searchableText = [
    roadmap.title,
    roadmap.short_description,
    roadmap.category,
    roadmap.level,
    roadmap.author_name ?? ""
  ]
    .join(" ")
    .replace(/[_-]+/g, " ")
    .toLowerCase();

  const searchMatches = searchTerms.every((term) => searchableText.includes(term));
  const selectedGroup = filters.category ? categoryGroups[filters.category] ?? [filters.category] : [];
  const categoryMatches = filters.category
    ? selectedGroup.some((token) => searchableText.includes(token.toLowerCase()))
    : true;
  const levelMatches = filters.level ? roadmap.level.toLowerCase() === filters.level.toLowerCase() : true;

  return searchMatches && categoryMatches && levelMatches;
}

// Блок рендерит страницу списка опубликованных роадмапов.
export function RoadmapsPage() {
  const [filters, setFilters] = useState<RoadmapFilters>(initialFilters);
  const deferredSearch = useDeferredValue(filters.search ?? "");
  const { savedSlugsSet, toggleSavedRoadmap } = useSavedRoadmaps();

  // Блок откладывает поисковый запрос, чтобы не дёргать API на каждый символ слишком агрессивно.
  const queryFilters = useMemo(
    () =>
      normalizeFilters({
        ...filters,
        search: deferredSearch
      }),
    [deferredSearch, filters]
  );
  // Блок выносит часть фильтрации на backend, чтобы каталог не грузил все карты при поиске и выборе уровня.
  const apiFilters = useMemo(
    () => ({
      search: queryFilters.search,
      level: queryFilters.level
    }),
    [queryFilters.level, queryFilters.search]
  );

  const roadmapsQuery = useRoadmapsQuery(apiFilters);
  const filteredRoadmaps = useMemo(
    () => (roadmapsQuery.data ?? []).filter((roadmap) => matchesFilters(roadmap, queryFilters)),
    [queryFilters, roadmapsQuery.data]
  );

  // Блок вычисляет, применены ли какие-либо фильтры для корректного empty-state текста.
  const hasActiveFilters = Boolean(queryFilters.search || queryFilters.category || queryFilters.level);

  return (
    <PageShell
      title="Библиотека"
      description="Карты по теме, уровню и автору"
    >
      <RoadmapsFilters
        filters={filters}
        onChange={setFilters}
        onReset={() => setFilters(initialFilters)}
        isBusy={roadmapsQuery.isFetching}
      />

      <div className="relative z-0 space-y-0.5">
        <h2 className="font-heading text-2xl font-semibold">
          {queryFilters.search ? "Результаты поиска" : "Все карты"}
        </h2>
        {roadmapsQuery.isSuccess && filteredRoadmaps.length > 0 ? (
          <p className="text-sm text-muted-foreground">
            {filteredRoadmaps.length} {
              filteredRoadmaps.length % 10 === 1 && filteredRoadmaps.length % 100 !== 11
                ? "карта"
                : filteredRoadmaps.length % 10 >= 2 && filteredRoadmaps.length % 10 <= 4 && (filteredRoadmaps.length % 100 < 10 || filteredRoadmaps.length % 100 >= 20)
                  ? "карты"
                  : "карт"
            }
          </p>
        ) : null}
      </div>

      {roadmapsQuery.isLoading ? (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <RoadmapCardSkeleton key={i} />
          ))}
        </section>
      ) : null}

      {roadmapsQuery.isError ? (
        <StateMessage
          title="Не удалось загрузить карты"
          description={roadmapsQuery.error.message}
          action={
            <Button onClick={() => roadmapsQuery.refetch()} variant="outline">
              Повторить запрос
            </Button>
          }
        />
      ) : null}

      {roadmapsQuery.isSuccess && filteredRoadmaps.length > 0 ? (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredRoadmaps.map((roadmap) => (
            <RoadmapCard
              key={roadmap.id}
              isSaved={savedSlugsSet.has(roadmap.slug)}
              onToggleSaved={toggleSavedRoadmap}
              roadmap={roadmap}
            />
          ))}
        </section>
      ) : null}

      {roadmapsQuery.isSuccess && filteredRoadmaps.length === 0 ? (
        <StateMessage
          title={hasActiveFilters ? "Ничего не нашлось" : "Карт пока нет"}
          description={
            hasActiveFilters
              ? "Попробуй изменить запрос или сбрось фильтры."
              : "Скоро здесь появятся карты."
          }
          action={
            hasActiveFilters ? (
              <Button onClick={() => setFilters(initialFilters)} variant="outline">
                Сбросить фильтры
              </Button>
            ) : undefined
          }
        />
      ) : null}
    </PageShell>
  );
}
