import { useState } from "react";
import { ChevronDown, ChevronRight, Lock } from "lucide-react";
import { Link } from "react-router-dom";

import type { NodeProgressStatus } from "@/entities/progress/model/types";
import type { RoadmapNode } from "@/entities/roadmap/model/types";
import { ResourceList } from "@/entities/roadmap/ui/ResourceList";
import { NodeStatusButton } from "@/features/roadmap-progress/ui/NodeStatusButton";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/lib/utils";

// Блок описывает пропсы одного узла дерева роадмапа.
interface RoadmapNodeItemProps {
  node: RoadmapNode;
  roadmapSlug: string;
  isAuthenticated: boolean;
  isUpdating: boolean;
  onGuestAction: () => void;
  onStatusChange: (payload: { roadmapSlug: string; nodeId: number; status: NodeProgressStatus }) => void;
}

// Блок приводит статус узла к безопасному значению по умолчанию.
function getNodeStatus(node: RoadmapNode): NodeProgressStatus {
  return node.progress_status ?? "not_started";
}

// Блок возвращает подпись и цвет для отображаемого статуса узла.
function getStatusMeta(status: NodeProgressStatus) {
  if (status === "done") {
    return {
      label: "Пройдено",
      className: "bg-emerald-100 text-emerald-800"
    };
  }

  if (status === "in_progress") {
    return {
      label: "В процессе",
      className: "bg-amber-100 text-amber-800"
    };
  }

  return {
    label: "Не начато",
    className: "bg-slate-100 text-slate-700"
  };
}

// Блок рендерит один узел дерева, его ресурсы и дочерние элементы.
export function RoadmapNodeItem({
  node,
  roadmapSlug,
  isAuthenticated,
  isUpdating,
  onGuestAction,
  onStatusChange
}: RoadmapNodeItemProps) {
  const hasChildren = (node.children?.length ?? 0) > 0;
  const [isExpanded, setIsExpanded] = useState(node.depth < 1);
  const status = getNodeStatus(node);
  const statusMeta = getStatusMeta(status);

  // Блок обрабатывает попытку изменить статус узла с учётом авторизации пользователя.
  const handleStatusChange = (nextStatus: NodeProgressStatus) => {
    if (!isAuthenticated) {
      onGuestAction();
      return;
    }

    onStatusChange({
      roadmapSlug,
      nodeId: node.id,
      status: nextStatus
    });
  };

  return (
    <div className="grid gap-3 rounded-3xl border border-border/70 bg-card p-4 shadow-soft">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          {hasChildren ? (
            <button
              type="button"
              onClick={() => setIsExpanded((currentState) => !currentState)}
              className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-background transition-colors hover:bg-secondary"
              aria-label={isExpanded ? "Свернуть дочерние узлы" : "Развернуть дочерние узлы"}
            >
              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
          ) : (
            <div className="h-8 w-8 shrink-0 rounded-xl border border-dashed border-border/70 bg-background/60" />
          )}

          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-semibold">{node.title}</h3>
              <Badge className={cn("border-none", statusMeta.className)}>{statusMeta.label}</Badge>
              {node.is_optional ? <Badge>Опционально</Badge> : null}
            </div>
            <p className="text-sm text-muted-foreground">
              {node.description ?? "Описание узла пока отсутствует."}
            </p>
          </div>
        </div>

        <div className="text-xs text-muted-foreground">Шаг #{node.position + 1}</div>
      </div>

      <div className="flex flex-wrap gap-2">
        <NodeStatusButton
          label="Не начато"
          targetStatus="not_started"
          currentStatus={status}
          disabled={isUpdating}
          onClick={() => handleStatusChange("not_started")}
        />
        <NodeStatusButton
          label="В процессе"
          targetStatus="in_progress"
          currentStatus={status}
          disabled={isUpdating}
          onClick={() => handleStatusChange("in_progress")}
        />
        <NodeStatusButton
          label="Пройдено"
          targetStatus="done"
          currentStatus={status}
          disabled={isUpdating}
          onClick={() => handleStatusChange("done")}
        />

        {!isAuthenticated ? (
          <Button asChild size="sm" variant="ghost">
            <Link to="/login">
              <Lock className="mr-2 h-4 w-4" />
              Войти для сохранения прогресса
            </Link>
          </Button>
        ) : null}
      </div>

      <ResourceList resources={node.resources ?? []} />

      {hasChildren && isExpanded ? (
        <div className="ml-3 border-l border-border/70 pl-4">
          <div className="grid gap-3">
            {node.children?.map((childNode) => (
              <RoadmapNodeItem
                key={childNode.id}
                node={childNode}
                roadmapSlug={roadmapSlug}
                isAuthenticated={isAuthenticated}
                isUpdating={isUpdating}
                onGuestAction={onGuestAction}
                onStatusChange={onStatusChange}
              />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
