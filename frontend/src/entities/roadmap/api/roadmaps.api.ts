import { httpClient } from "@/shared/api/http-client";
import type {
  RoadmapFilters,
  RoadmapBySlugResponse,
  RoadmapDetails,
  RoadmapsResponse,
  RoadmapSummary
} from "@/entities/roadmap/model/types";

// Блок нормализует ответ backend со списком роадмапов до единого массива.
function normalizeRoadmapsResponse(response: RoadmapsResponse): RoadmapSummary[] {
  return Array.isArray(response) ? response : response.roadmaps;
}

// Блок нормализует ответ backend с одним роадмапом до единого объекта.
function normalizeRoadmapResponse(response: RoadmapBySlugResponse): RoadmapDetails {
  return "roadmap" in response ? response.roadmap : response;
}

// Блок превращает фильтры каталога в query string для backend API.
function buildRoadmapsQueryString(filters: RoadmapFilters): string {
  const searchParams = new URLSearchParams();

  if (filters.search) {
    searchParams.set("search", filters.search);
  }

  if (filters.category) {
    searchParams.set("category", filters.category);
  }

  if (filters.level) {
    searchParams.set("level", filters.level);
  }

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : "";
}

// Блок содержит прямые запросы к roadmap endpoint'ам backend API.
export const roadmapsApi = {
  async getRoadmaps(filters: RoadmapFilters = {}) {
    const response = await httpClient<RoadmapsResponse>(
      `/roadmaps${buildRoadmapsQueryString(filters)}`,
      {
        method: "GET"
      }
    );

    return normalizeRoadmapsResponse(response);
  },
  async getRoadmapBySlug(slug: string) {
    const response = await httpClient<RoadmapBySlugResponse>(`/roadmaps/${slug}`, {
      method: "GET"
    });

    return normalizeRoadmapResponse(response);
  }
};
