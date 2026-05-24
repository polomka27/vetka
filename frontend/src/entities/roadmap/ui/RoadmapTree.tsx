import type { NodeProgressStatus } from "@/entities/progress/model/types";
import type { RoadmapNode } from "@/entities/roadmap/model/types";
import { RoadmapNodeItem } from "@/entities/roadmap/ui/RoadmapNodeItem";
import { StateMessage } from "@/shared/ui/state-message";

// Блок описывает пропсы дерева узлов роадмапа.
interface RoadmapTreeProps {
  nodes: RoadmapNode[];
  roadmapSlug: string;
  isAuthenticated: boolean;
  isUpdating: boolean;
  onGuestAction: () => void;
  onStatusChange: (payload: { roadmapSlug: string; nodeId: number; status: NodeProgressStatus }) => void;
}

// Блок рендерит вложенное дерево узлов роадмапа.
export function RoadmapTree({
  nodes,
  roadmapSlug,
  isAuthenticated,
  isUpdating,
  onGuestAction,
  onStatusChange
}: RoadmapTreeProps) {
  if (nodes.length === 0) {
    return (
      <StateMessage
        title="Дерево узлов пока пустое"
        description="Backend ещё не вернул узлы для этого роадмапа."
      />
    );
  }

  return (
    <section className="grid gap-4">
      {nodes.map((node) => (
        <RoadmapNodeItem
          key={node.id}
          node={node}
          roadmapSlug={roadmapSlug}
          isAuthenticated={isAuthenticated}
          isUpdating={isUpdating}
          onGuestAction={onGuestAction}
          onStatusChange={onStatusChange}
        />
      ))}
    </section>
  );
}
