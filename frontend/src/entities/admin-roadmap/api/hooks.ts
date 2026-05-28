import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { adminRoadmapsApi } from "@/entities/admin-roadmap/api/adminRoadmaps.api";
import type {
  AdminResourceFormValues,
  AdminRoadmapFormValues,
  AdminRoadmapNodeFormValues
} from "@/entities/admin-roadmap/model/types";
import { queryKeys } from "@/shared/api/query-keys";

// Блок загружает список роадмапов для административной таблицы и позволяет не слать лишний 403-запрос вне админских экранов.
export function useAdminRoadmapsQuery(enabled = true) {
  return useQuery({
    queryKey: queryKeys.admin.roadmaps,
    queryFn: adminRoadmapsApi.getRoadmaps,
    enabled,
    staleTime: 60_000
  });
}

// Блок загружает один роадмап для страницы редактирования.
export function useAdminRoadmapQuery(id: number | undefined) {
  return useQuery({
    queryKey: queryKeys.admin.roadmap(id ?? 0),
    queryFn: () => adminRoadmapsApi.getRoadmap(id as number),
    enabled: Boolean(id),
    staleTime: 60_000
  });
}

// Блок создаёт новый роадмап и обновляет список в админке.
export function useCreateAdminRoadmapMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: AdminRoadmapFormValues) => adminRoadmapsApi.createRoadmap(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.roadmaps });
      // Блок обновляет публичную библиотеку, потому что новая карта может сразу появиться в общем каталоге.
      queryClient.invalidateQueries({ queryKey: queryKeys.roadmaps.all });
    }
  });
}

// Блок обновляет существующий роадмап и инвалидирует кэш списка и деталей.
export function useUpdateAdminRoadmapMutation(id: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: Partial<AdminRoadmapFormValues>) => adminRoadmapsApi.updateRoadmap(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.roadmaps });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.roadmap(id) });
      // Блок синхронизирует публичные данные после редактирования названия, описания или публикации карты.
      queryClient.invalidateQueries({ queryKey: queryKeys.roadmaps.all });
    }
  });
}

// Блок удаляет роадмап из админки.
export function useDeleteAdminRoadmapMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => adminRoadmapsApi.deleteRoadmap(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.roadmaps });
      // Блок убирает удалённую карту из публичного каталога и деталей.
      queryClient.invalidateQueries({ queryKey: queryKeys.roadmaps.all });
    }
  });
}

// Блок создаёт новый узел и обновляет детальную страницу роадмапа.
export function useCreateAdminNodeMutation(roadmapId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: AdminRoadmapNodeFormValues) => adminRoadmapsApi.createNode(roadmapId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.roadmap(roadmapId) });
      // Блок обновляет публичную карту и steps_count после добавления нового шага.
      queryClient.invalidateQueries({ queryKey: queryKeys.roadmaps.all });
    }
  });
}

// Блок обновляет существующий узел и обновляет детальную страницу роадмапа.
export function useUpdateAdminNodeMutation(roadmapId: number, nodeId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: Partial<AdminRoadmapNodeFormValues>) =>
      adminRoadmapsApi.updateNode(nodeId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.roadmap(roadmapId) });
      // Блок обновляет публичную карту после изменений шага в мастерской.
      queryClient.invalidateQueries({ queryKey: queryKeys.roadmaps.all });
    }
  });
}

// Блок обновляет любой шаг по id, когда пользователь связывает шаги прямо на карте.
export function useRelinkAdminNodeMutation(roadmapId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ nodeId, payload }: { nodeId: number; payload: Partial<AdminRoadmapNodeFormValues> }) =>
      adminRoadmapsApi.updateNode(nodeId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.roadmap(roadmapId) });
      // Блок синхронизирует публичную схему после drag-and-drop и смены связей.
      queryClient.invalidateQueries({ queryKey: queryKeys.roadmaps.all });
    }
  });
}

// Блок сохраняет dagre-позиции для всех узлов карты параллельными PATCH-запросами.
export function useAutoLayoutMutation(roadmapId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (updates: Array<{ nodeId: number; canvas_x: number; canvas_y: number }>) =>
      Promise.all(
        updates.map(({ nodeId, canvas_x, canvas_y }) =>
          adminRoadmapsApi.updateNode(nodeId, { canvas_x, canvas_y })
        )
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.roadmap(roadmapId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.roadmaps.all });
    }
  });
}

// Блок удаляет узел и обновляет детальную страницу роадмапа.
export function useDeleteAdminNodeMutation(roadmapId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (nodeId: number) => adminRoadmapsApi.deleteNode(nodeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.roadmap(roadmapId) });
      // Блок обновляет публичные данные после удаления шага из карты.
      queryClient.invalidateQueries({ queryKey: queryKeys.roadmaps.all });
    }
  });
}

// Блок создаёт ресурс для выбранного шага и обновляет детали карты.
export function useCreateAdminResourceMutation(roadmapId: number, nodeId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: AdminResourceFormValues) => adminRoadmapsApi.createResource(nodeId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.roadmap(roadmapId) });
      // Блок обновляет публичную детальную карту после добавления материалов.
      queryClient.invalidateQueries({ queryKey: queryKeys.roadmaps.all });
    }
  });
}

// Блок удаляет ресурс у шага и обновляет детали карты.
export function useDeleteAdminResourceMutation(roadmapId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (resourceId: number) => adminRoadmapsApi.deleteResource(resourceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.roadmap(roadmapId) });
      // Блок обновляет публичную детальную карту после удаления материалов.
      queryClient.invalidateQueries({ queryKey: queryKeys.roadmaps.all });
    }
  });
}
