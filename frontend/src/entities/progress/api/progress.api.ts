import { httpClient } from "@/shared/api/http-client";
import type {
  NodeProgress,
  RoadmapProgressResponse,
  StartedRoadmapsResponse,
  UpdateNodeNoteRequest,
  UpdateNodeStatusRequest
} from "@/entities/progress/model/types";

// Блок содержит прямые запросы к endpoint'ам пользовательского прогресса.
export const progressApi = {
  getStartedRoadmaps: () =>
    httpClient<StartedRoadmapsResponse>("/progress/roadmaps", {
      method: "GET"
    }),
  getRoadmapProgress: (roadmapSlug: string) =>
    httpClient<RoadmapProgressResponse>(`/progress/roadmaps/${roadmapSlug}`, {
      method: "GET"
    }),
  updateNodeStatus({ roadmapSlug, nodeId, status }: UpdateNodeStatusRequest) {
    return httpClient<NodeProgress>(`/progress/roadmaps/${roadmapSlug}/nodes/${nodeId}`, {
      method: "PATCH",
      body: { status }
    });
  },
  updateNodeNote({ roadmapSlug, nodeId, note }: UpdateNodeNoteRequest) {
    return httpClient<NodeProgress>(`/progress/roadmaps/${roadmapSlug}/nodes/${nodeId}/note`, {
      method: "PATCH",
      body: { note }
    });
  }
};
