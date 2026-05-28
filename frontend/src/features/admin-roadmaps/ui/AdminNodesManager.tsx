import { useCallback, useEffect, useMemo, useState } from "react";
import { Wand2 } from "lucide-react";

import {
  useAutoLayoutMutation,
  useCreateAdminNodeMutation,
  useCreateAdminResourceMutation,
  useDeleteAdminNodeMutation,
  useDeleteAdminResourceMutation,
  useRelinkAdminNodeMutation,
  useUpdateAdminNodeMutation
} from "@/entities/admin-roadmap/api/hooks";
import type {
  AdminResourceFormValues,
  AdminRoadmapNode,
  AdminRoadmapNodeFormValues
} from "@/entities/admin-roadmap/model/types";
import type { RoadmapNode } from "@/entities/roadmap/model/types";
import type { Connection } from "@xyflow/react";
import { buildRoadmapFlow, computeAutoLayout, findRoadmapNodeById } from "@/entities/roadmap/lib/roadmap-flow";
import { RoadmapFlow } from "@/entities/roadmap/ui/RoadmapFlow";
import { WorkshopNodePanel } from "@/features/admin-roadmaps/ui/WorkshopNodePanel";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { StateMessage } from "@/shared/ui/state-message";

// Блок описывает пропсы менеджера узлов внутри edit-page.
interface AdminNodesManagerProps {
  roadmapId: number;
  nodes: AdminRoadmapNode[];
}

function buildTree(nodes: AdminRoadmapNode[], parentId: number | null = null): RoadmapNode[] {
  return nodes
    .filter((node) => node.parent_id === parentId)
    .sort((left, right) => left.position - right.position || left.id - right.id)
    .map((node) => ({
      ...node,
      progress_status: "not_started",
      resources: node.resources ?? [],
      children: buildTree(nodes, node.id)
    }));
}

// Блок подбирает понятный текст для текущего действия в мастерской.
function getWorkshopLoadingLabel(params: {
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  isCreatingResource: boolean;
  isDeletingResource: boolean;
  isRelinking: boolean;
  isAutoLayout: boolean;
}) {
  if (params.isAutoLayout) {
    return "Выравниваем схему...";
  }

  if (params.isCreating) {
    return "Добавляем шаг...";
  }

  if (params.isUpdating) {
    return "Сохраняем изменения...";
  }

  if (params.isDeleting) {
    return "Удаляем шаг...";
  }

  if (params.isCreatingResource) {
    return "Добавляем источник...";
  }

  if (params.isDeletingResource) {
    return "Удаляем источник...";
  }

  if (params.isRelinking) {
    return "Обновляем карту...";
  }

  return "Сохраняем изменения...";
}

// Блок рендерит визуальный редактор шагов карты в мастерской.
export function AdminNodesManager({ roadmapId, nodes }: AdminNodesManagerProps) {
  const [selectedNodeId, setSelectedNodeId] = useState<number | null>(null);
  const [panelMode, setPanelMode] = useState<"idle" | "create-root" | "create-child" | "edit">("idle");
  const createNodeMutation = useCreateAdminNodeMutation(roadmapId);
  const deleteNodeMutation = useDeleteAdminNodeMutation(roadmapId);
  const relinkNodeMutation = useRelinkAdminNodeMutation(roadmapId);
  const autoLayoutMutation = useAutoLayoutMutation(roadmapId);
  const sortedNodes = useMemo(() => [...nodes].sort((left, right) => {
    if (left.depth !== right.depth) {
      return left.depth - right.depth;
    }

    if (left.position !== right.position) {
      return left.position - right.position;
    }

    return left.id - right.id;
  }), [nodes]);
  const treeNodes = useMemo(() => buildTree(sortedNodes), [sortedNodes]);
  const flowGraph = useMemo(() => buildRoadmapFlow(treeNodes), [treeNodes]);
  const selectedNode = useMemo(
    () => sortedNodes.find((node) => node.id === selectedNodeId) ?? null,
    [selectedNodeId, sortedNodes]
  );
  const selectedTreeNode = useMemo(
    () => findRoadmapNodeById(treeNodes, selectedNodeId),
    [selectedNodeId, treeNodes]
  );

  // Блок автоматически открывает создание первого шага, если карта ещё пустая.
  useEffect(() => {
    if (sortedNodes.length === 0) {
      setPanelMode("create-root");
      setSelectedNodeId(null);
    }
  }, [sortedNodes.length]);

  // Блок полностью закрывает правую панель и снимает текущий выбор шага.
  const resetPanel = () => {
    setSelectedNodeId(null);
    setPanelMode("idle");
  };

  const handleCreate = (values: AdminRoadmapNodeFormValues) => {
    const parentFlowNode = selectedNode
      ? flowGraph.flowNodes.find((node) => Number(node.id) === selectedNode.id)
      : null;
    const childDraftPosition = panelMode === "create-child" && parentFlowNode
      ? {
          // Блок ставит новый дочерний шаг сразу над родительским, чтобы схема не прыгала после создания.
          canvas_x: Number(parentFlowNode.position.x.toFixed(2)),
          canvas_y: Number((parentFlowNode.position.y - 172).toFixed(2))
        }
      : {};

    createNodeMutation.mutate({
      ...values,
      ...childDraftPosition
    }, {
      onSuccess: (createdNode) => {
        setSelectedNodeId(createdNode.id);
        setPanelMode("idle");
      }
    });
  };

  const updateNodeMutation = useUpdateAdminNodeMutation(roadmapId, selectedNodeId ?? 0);
  const createResourceMutation = useCreateAdminResourceMutation(roadmapId, selectedNodeId ?? 0);
  const deleteResourceMutation = useDeleteAdminResourceMutation(roadmapId);

  const submitUpdate = (values: AdminRoadmapNodeFormValues) => {
    if (!selectedNode) {
      return;
    }

    updateNodeMutation.mutate(values, {
      onSuccess: () => {
        setPanelMode("idle");
      }
    });
  };

  const handleDelete = () => {
    if (!selectedNode) {
      return;
    }

    deleteNodeMutation.mutate(selectedNode.id, {
      onSuccess: () => {
        setSelectedNodeId(null);
        setPanelMode("idle");
      }
    });
  };

  const handleCreateResource = (
    values: AdminResourceFormValues,
    options?: { onSuccess?: () => void }
  ) => {
    if (!selectedNode) {
      return;
    }

    createResourceMutation.mutate(values, {
      onSuccess: () => {
        // Блок позволяет правой панели очистить форму только после подтверждённого создания ресурса.
        options?.onSuccess?.();
      }
    });
  };

  const handleDeleteResource = (resourceId: number) => {
    deleteResourceMutation.mutate(resourceId);
  };

  // Блок сбрасывает ручные позиции и укладывает все шаги по dagre-алгоритму.
  const handleAutoLayout = () => {
    const positions = computeAutoLayout(treeNodes);
    const updates = sortedNodes
      .map((node) => {
        const pos = positions.get(node.id);
        return pos ? { nodeId: node.id, canvas_x: pos.x, canvas_y: pos.y } : null;
      })
      .filter((u): u is { nodeId: number; canvas_x: number; canvas_y: number } => u !== null);
    autoLayoutMutation.mutate(updates);
  };

  // Блок связывает два шага при drag-to-connect на холсте редактора.
  const handleConnect = useCallback((params: Connection) => {
    if (!params.source || !params.target) {
      return;
    }

    relinkNodeMutation.mutate({
      nodeId: Number(params.target),
      payload: { parent_id: Number(params.source) }
    });
  }, [relinkNodeMutation]);

  // Блок сохраняет новое положение шага после ручного перетаскивания по карте.
  const handleStepDragStop = ({ nodeId, x, y }: { nodeId: number; x: number; y: number }) => {
    relinkNodeMutation.mutate({
      nodeId,
      payload: {
        canvas_x: Number(x.toFixed(2)),
        canvas_y: Number(y.toFixed(2))
      }
    });
  };

  const isWorkshopMutating = (
    createNodeMutation.isPending ||
    updateNodeMutation.isPending ||
    deleteNodeMutation.isPending ||
    createResourceMutation.isPending ||
    deleteResourceMutation.isPending ||
    relinkNodeMutation.isPending ||
    autoLayoutMutation.isPending
  );
  const workshopLoadingLabel = getWorkshopLoadingLabel({
    isCreating: createNodeMutation.isPending,
    isUpdating: updateNodeMutation.isPending,
    isDeleting: deleteNodeMutation.isPending,
    isCreatingResource: createResourceMutation.isPending,
    isDeletingResource: deleteResourceMutation.isPending,
    isRelinking: relinkNodeMutation.isPending,
    isAutoLayout: autoLayoutMutation.isPending
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2">
            <CardTitle>Карта</CardTitle>
            <CardDescription>Выбери шаг и редактируй его справа.</CardDescription>
          </div>
          <Button
            disabled={isWorkshopMutating || sortedNodes.length === 0}
            onClick={handleAutoLayout}
            size="sm"
            type="button"
            variant="outline"
          >
            <Wand2 className="mr-2 h-4 w-4" />
            Выровнять
          </Button>
        </div>
      </CardHeader>
      <CardContent className="grid gap-6 pt-0">
        <div className="relative">
          {/* Блок показывает единое состояние загрузки для всех действий пользователя в мастерской. */}
          {isWorkshopMutating ? (
            <div className="absolute inset-0 z-20 flex items-center justify-center rounded-[1.75rem] bg-background/70 backdrop-blur-sm">
              <div className="flex items-center gap-3 rounded-2xl border border-border/70 bg-card/95 px-4 py-3 shadow-soft">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary/25 border-t-primary" />
                <span className="text-sm font-medium text-foreground">{workshopLoadingLabel}</span>
              </div>
            </div>
          ) : null}

          <div className={selectedNode || panelMode !== "idle" ? "grid gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,380px)]" : "grid gap-4"}>
            <div className="min-w-0 grid gap-4">
              {sortedNodes.length > 0 ? (
                <RoadmapFlow
                  graph={flowGraph}
                  nodes={treeNodes}
                  title="Карта"
                  description=""
                  allowDragging
                  allowConnecting
                  onConnect={handleConnect}
                  onStepDragStop={handleStepDragStop}
                  selectedNodeId={selectedTreeNode?.id ?? selectedNodeId}
                  onClearSelection={resetPanel}
                  onSelectNode={(nodeId) => {
                    setSelectedNodeId(nodeId);
                    setPanelMode("idle");
                  }}
                />
              ) : (
                <StateMessage
                  title="Карта пока пуста"
                  description="Создай первый шаг справа, и карта сразу появится в редакторе."
                />
              )}
            </div>

            <WorkshopNodePanel
              nodes={sortedNodes}
              selectedNode={selectedNode}
              mode={panelMode}
              isCreating={createNodeMutation.isPending}
              isUpdating={updateNodeMutation.isPending}
              isDeleting={deleteNodeMutation.isPending}
              createError={createNodeMutation.isError ? createNodeMutation.error.message : undefined}
              updateError={updateNodeMutation.isError ? updateNodeMutation.error.message : undefined}
              deleteError={deleteNodeMutation.isError ? deleteNodeMutation.error.message : undefined}
              connectError={relinkNodeMutation.isError ? relinkNodeMutation.error.message : undefined}
              resourceError={createResourceMutation.isError ? createResourceMutation.error.message : undefined}
              resourceDeleteError={deleteResourceMutation.isError ? deleteResourceMutation.error.message : undefined}
              onStartCreateRoot={() => {
                setSelectedNodeId(null);
                setPanelMode("create-root");
              }}
              onStartCreateChild={() => setPanelMode("create-child")}
              onStartEdit={() => setPanelMode("edit")}
              onClose={resetPanel}
              onDelete={handleDelete}
              onCreateResource={handleCreateResource}
              onDeleteResource={handleDeleteResource}
              onCancel={resetPanel}
              onCreate={handleCreate}
              onUpdate={submitUpdate}
              isCreatingResource={createResourceMutation.isPending}
              isDeletingResource={deleteResourceMutation.isPending}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
