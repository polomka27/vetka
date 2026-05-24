import { httpClient } from "@/shared/api/http-client";
import type {
  AdminResourceFormValues,
  AdminResourceResponse,
  AdminRoadmapFormValues,
  AdminRoadmapNodeFormValues,
  AdminRoadmapNodeResponse,
  AdminRoadmapResponse,
  AdminRoadmapsResponse
} from "@/entities/admin-roadmap/model/types";

// Блок содержит прямые запросы к административным endpoint'ам роадмапов.
export const adminRoadmapsApi = {
  async getRoadmaps() {
    const response = await httpClient<AdminRoadmapsResponse>("/admin/roadmaps", {
      method: "GET"
    });

    return response.roadmaps;
  },
  async getRoadmap(id: number) {
    const response = await httpClient<AdminRoadmapResponse>(`/admin/roadmaps/${id}`, {
      method: "GET"
    });

    return response.roadmap;
  },
  async createRoadmap(payload: AdminRoadmapFormValues) {
    const response = await httpClient<AdminRoadmapResponse>("/admin/roadmaps", {
      method: "POST",
      body: payload
    });

    return response.roadmap;
  },
  async updateRoadmap(id: number, payload: Partial<AdminRoadmapFormValues>) {
    const response = await httpClient<AdminRoadmapResponse>(`/admin/roadmaps/${id}`, {
      method: "PATCH",
      body: payload
    });

    return response.roadmap;
  },
  deleteRoadmap: (id: number) =>
    httpClient<{ message: string }>(`/admin/roadmaps/${id}`, {
      method: "DELETE"
    }),
  async createNode(roadmapId: number, payload: AdminRoadmapNodeFormValues) {
    const response = await httpClient<AdminRoadmapNodeResponse>(`/admin/roadmaps/${roadmapId}/nodes`, {
      method: "POST",
      body: payload
    });

    return response.node;
  },
  async updateNode(nodeId: number, payload: Partial<AdminRoadmapNodeFormValues>) {
    const response = await httpClient<AdminRoadmapNodeResponse>(`/admin/nodes/${nodeId}`, {
      method: "PATCH",
      body: payload
    });

    return response.node;
  },
  deleteNode: (nodeId: number) =>
    httpClient<{ message: string }>(`/admin/nodes/${nodeId}`, {
      method: "DELETE"
    }),
  async createResource(nodeId: number, payload: AdminResourceFormValues) {
    const response = await httpClient<AdminResourceResponse>(`/admin/nodes/${nodeId}/resources`, {
      method: "POST",
      body: payload
    });

    return response.resource;
  },
  deleteResource: (resourceId: number) =>
    httpClient<{ message: string }>(`/admin/resources/${resourceId}`, {
      method: "DELETE"
    })
};
