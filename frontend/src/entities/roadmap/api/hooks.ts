import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { roadmapsApi } from "@/entities/roadmap/api/roadmaps.api";
import type { RoadmapFilters } from "@/entities/roadmap/model/types";
import { queryKeys } from "@/shared/api/query-keys";

// Блок загружает список роадмапов для каталога.
export function useRoadmapsQuery(filters: RoadmapFilters = {}) {
  return useQuery({
    queryKey: queryKeys.roadmaps.list({
      search: filters.search ?? "",
      category: filters.category ?? "",
      level: filters.level ?? ""
    }),
    queryFn: () => roadmapsApi.getRoadmaps(filters),
    placeholderData: keepPreviousData
  });
}

// Блок загружает один роадмап по slug для детальной страницы.
export function useRoadmapBySlugQuery(slug: string | undefined) {
  return useQuery({
    queryKey: queryKeys.roadmaps.detail(slug ?? "unknown"),
    queryFn: () => roadmapsApi.getRoadmapBySlug(slug as string),
    enabled: Boolean(slug),
    staleTime: 5 * 60_000
  });
}

// Блок экспортирует хук списка роадмапов с более явным именем.
export const useGetRoadmapsQuery = useRoadmapsQuery;

// Блок экспортирует хук детального роадмапа с более явным именем.
export const useGetRoadmapBySlugQuery = useRoadmapBySlugQuery;
