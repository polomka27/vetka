import type { Resource } from "@/entities/roadmap/model/types";

// Блок описывает узел роадмапа в административной части.
export interface AdminRoadmapNode {
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
  resources?: Resource[];
}

// Блок описывает строку списка роадмапов для админки.
export interface AdminRoadmapListItem {
  id: number;
  slug: string;
  title: string;
  short_description: string;
  category: string;
  level: string;
  is_published: boolean;
  author_id: number;
  updated_at: string | null;
}

// Блок описывает детальную модель роадмапа для формы редактирования.
export interface AdminRoadmapDetails extends AdminRoadmapListItem {
  full_description: string | null;
  created_at: string | null;
  nodes: AdminRoadmapNode[];
}

// Блок описывает форму создания и редактирования роадмапа.
export interface AdminRoadmapFormValues {
  title: string;
  short_description: string;
  full_description: string;
  category: string;
  level: string;
  is_published: boolean;
}

// Блок описывает форму создания и редактирования узла.
export interface AdminRoadmapNodeFormValues {
  parent_id: number | null;
  title: string;
  description: string;
  content_type: string;
  position: number;
  canvas_x?: number | null;
  canvas_y?: number | null;
  is_optional: boolean;
}

export interface AdminResourceFormValues {
  title: string;
  url: string;
  resource_type: string;
  position: number;
}

// Блок описывает ответ backend со списком роадмапов для админки.
export interface AdminRoadmapsResponse {
  roadmaps: AdminRoadmapListItem[];
}

// Блок описывает ответ backend с одной сущностью роадмапа.
export interface AdminRoadmapResponse {
  roadmap: AdminRoadmapDetails;
}

// Блок описывает ответ backend с одной сущностью узла.
export interface AdminRoadmapNodeResponse {
  node: AdminRoadmapNode;
}

export interface AdminResourceResponse {
  resource: Resource;
}
