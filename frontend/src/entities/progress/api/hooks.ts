import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { progressApi } from "@/entities/progress/api/progress.api";
import type {
  NodeProgressStatus,
  RoadmapProgressResponse,
  UpdateNodeNoteRequest,
  UpdateNodeStatusRequest
} from "@/entities/progress/model/types";
import { queryKeys } from "@/shared/api/query-keys";

// Блок пересчитывает количество выполненных шагов по node_statuses после оптимистического обновления.
function getDoneNodesCount(nodeStatuses: Record<string, NodeProgressStatus>) {
  return Object.values(nodeStatuses).filter((status) => status === "done").length;
}

// Блок загружает список роадмапов, которые пользователь уже начал проходить.
export function useStartedRoadmapsQuery(enabled = true) {
  return useQuery({
    queryKey: queryKeys.progress.startedRoadmaps,
    queryFn: progressApi.getStartedRoadmaps,
    enabled
  });
}

// Блок загружает прогресс пользователя по выбранному роадмапу.
export function useRoadmapProgressQuery(roadmapSlug: string | undefined, enabled = true) {
  return useQuery({
    queryKey: queryKeys.progress.roadmap(roadmapSlug ?? "unknown"),
    queryFn: () => progressApi.getRoadmapProgress(roadmapSlug as string),
    enabled: Boolean(roadmapSlug) && enabled,
    staleTime: 60_000
  });
}

// Блок обновляет статус узла и инвалидирует связанный прогресс в кэше.
export function useUpdateNodeStatusMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateNodeStatusRequest) => progressApi.updateNodeStatus(payload),
    onMutate: async (variables) => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.progress.roadmap(variables.roadmapSlug)
      });

      const previousProgress = queryClient.getQueryData<RoadmapProgressResponse>(
        queryKeys.progress.roadmap(variables.roadmapSlug)
      );

      if (previousProgress) {
        const nextNodeStatuses = {
          ...previousProgress.node_statuses,
          [String(variables.nodeId)]: variables.status
        };
        const nextDoneNodes = getDoneNodesCount(nextNodeStatuses);

        queryClient.setQueryData<RoadmapProgressResponse>(
          queryKeys.progress.roadmap(variables.roadmapSlug),
          {
            ...previousProgress,
            node_statuses: nextNodeStatuses,
            done_nodes: nextDoneNodes,
            completion_percent:
              previousProgress.total_nodes > 0
                ? Number(((nextDoneNodes / previousProgress.total_nodes) * 100).toFixed(2))
            : 0
          }
        );
      }

      return {
        previousProgress
      };
    },
    onError: (_error, variables, context) => {
      if (context?.previousProgress) {
        queryClient.setQueryData(
          queryKeys.progress.roadmap(variables.roadmapSlug),
          context.previousProgress
        );
      }
    },
    onSuccess: (data, variables) => {
      queryClient.setQueryData<RoadmapProgressResponse>(
        queryKeys.progress.roadmap(variables.roadmapSlug),
        (currentValue) =>
          currentValue
            ? {
                ...currentValue,
                node_statuses: {
                  ...currentValue.node_statuses,
                  [String(variables.nodeId)]: data.status
                }
              }
            : currentValue
      );
      queryClient.invalidateQueries({
        queryKey: queryKeys.progress.startedRoadmaps
      });
    },
    onSettled: (_data, _error, variables) => {
      // Блок после оптимистического апдейта подтягивает каноничное состояние с backend, если сервер обновил связанные поля.
      queryClient.invalidateQueries({
        queryKey: queryKeys.progress.roadmap(variables.roadmapSlug)
      });
    }
  });
}

// Блок сохраняет заметку пользователя по узлу и обновляет summary в кэше.
export function useUpdateNodeNoteMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateNodeNoteRequest) => progressApi.updateNodeNote(payload),
    onMutate: async (variables) => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.progress.roadmap(variables.roadmapSlug)
      });

      const previousProgress = queryClient.getQueryData<RoadmapProgressResponse>(
        queryKeys.progress.roadmap(variables.roadmapSlug)
      );

      if (previousProgress) {
        queryClient.setQueryData<RoadmapProgressResponse>(
          queryKeys.progress.roadmap(variables.roadmapSlug),
          {
            ...previousProgress,
            node_notes: {
              ...previousProgress.node_notes,
              [String(variables.nodeId)]: variables.note
            }
          }
        );
      }

      return { previousProgress };
    },
    onError: (_error, variables, context) => {
      if (context?.previousProgress) {
        queryClient.setQueryData(
          queryKeys.progress.roadmap(variables.roadmapSlug),
          context.previousProgress
        );
      }
    },
    onSuccess: (data, variables) => {
      queryClient.setQueryData<RoadmapProgressResponse>(
        queryKeys.progress.roadmap(variables.roadmapSlug),
        (currentValue) =>
          currentValue
            ? {
                ...currentValue,
                node_notes: {
                  ...currentValue.node_notes,
                  [String(variables.nodeId)]: data.note ?? ""
                }
              }
            : currentValue
      );
    },
    onSettled: (_data, _error, variables) => {
      // Блок перечитывает прогресс после сохранения заметки, чтобы UI не застрял в локальном optimistic-состоянии.
      queryClient.invalidateQueries({
        queryKey: queryKeys.progress.roadmap(variables.roadmapSlug)
      });
    }
  });
}

// Блок экспортирует хук списка начатых роадмапов с более явным именем.
export const useGetStartedRoadmapsQuery = useStartedRoadmapsQuery;

// Блок экспортирует хук загрузки прогресса с более явным именем.
export const useGetRoadmapProgressQuery = useRoadmapProgressQuery;

// Блок экспортирует хук обновления статуса с более явным именем.
export const useUpdateNodeStatus = useUpdateNodeStatusMutation;
export const useUpdateNodeNote = useUpdateNodeNoteMutation;
