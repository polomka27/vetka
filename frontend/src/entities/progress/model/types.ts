// Блок описывает допустимые статусы прогресса узла из backend.
export type NodeProgressStatus = "not_started" | "in_progress" | "done";

// Блок описывает summary-ответ по прогрессу пользователя в рамках одного роадмапа.
export interface RoadmapProgressResponse {
  roadmap_id: number;
  total_nodes: number;
  done_nodes: number;
  completion_percent: number;
  node_statuses: Record<string, NodeProgressStatus>;
  node_notes: Record<string, string>;
}

// Блок описывает последнюю зафиксированную точку прогресса пользователя в роадмапе.
export interface LastProgressPoint {
  node_id: number;
  node_title: string;
  status: NodeProgressStatus;
  updated_at: string | null;
}

// Блок описывает карточку роадмапа, который пользователь уже начал проходить.
export interface StartedRoadmapProgress {
  roadmap_id: number;
  slug: string;
  title: string;
  short_description: string;
  category: string;
  level: string;
  completion_percent: number;
  total_nodes: number;
  done_nodes: number;
  last_progress_point: LastProgressPoint | null;
}

// Блок описывает ответ backend со списком начатых роадмапов пользователя.
export interface StartedRoadmapsResponse {
  roadmaps: StartedRoadmapProgress[];
}

// Блок описывает запись прогресса пользователя по одному узлу.
export interface NodeProgress {
  id: number;
  user_id: number;
  roadmap_id: number;
  node_id: number;
  status: NodeProgressStatus;
  note?: string | null;
  started_at: string | null;
  completed_at: string | null;
  updated_at: string | null;
}

// Блок описывает payload обновления статуса узла.
export interface UpdateNodeStatusRequest {
  roadmapSlug: string;
  nodeId: number;
  status: NodeProgressStatus;
}

export interface UpdateNodeNoteRequest {
  roadmapSlug: string;
  nodeId: number;
  note: string;
}
