// Блок описывает ресурс, прикреплённый к узлу роадмапа.
export interface Resource {
  id: number;
  title: string;
  url: string;
  resource_type: string;
  position: number;
}

// Блок описывает узел дерева роадмапа.
export interface RoadmapNode {
  id: number;
  roadmap_id: number;
  parent_id: number | null;
  title: string;
  description: string | null;
  content_type: string;
  position: number;
  depth: number;
  canvas_x?: number | null;
  canvas_y?: number | null;
  is_optional: boolean;
  progress_status?: "not_started" | "in_progress" | "done";
  resources?: Resource[];
  children?: RoadmapNode[];
}

// Блок описывает тег роадмапа для детальной страницы.
export interface RoadmapTag {
  id: number;
  name: string;
  slug: string;
}

// Блок описывает фильтры каталога роадмапов.
export interface RoadmapFilters {
  search?: string;
  category?: string;
  level?: string;
}

// Блок описывает краткую карточку роадмапа для списков.
export interface RoadmapSummary {
  id: number;
  slug: string;
  title: string;
  short_description: string;
  category: string;
  level: string;
  steps_count: number;
  author_name?: string;
  is_published?: boolean;
  created_at?: string | null;
  updated_at?: string | null;
}

// Блок описывает детальную модель роадмапа.
export interface RoadmapDetails extends RoadmapSummary {
  full_description: string | null;
  total_steps_count?: number;
  tags?: RoadmapTag[];
  nodes?: RoadmapNode[];
}

// Блок описывает возможные форматы ответа списка роадмапов от backend.
export type RoadmapsResponse = RoadmapSummary[] | { roadmaps: RoadmapSummary[] };

// Блок описывает возможные форматы ответа одного роадмапа от backend.
export type RoadmapBySlugResponse = RoadmapDetails | { roadmap: RoadmapDetails };
