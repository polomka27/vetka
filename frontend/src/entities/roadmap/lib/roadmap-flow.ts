import dagre from "dagre";
import { Position, type Edge, type Node } from "@xyflow/react";

import type { NodeProgressStatus } from "@/entities/progress/model/types";
import type { RoadmapNode } from "@/entities/roadmap/model/types";

// Блок описывает данные, которые будут переданы в кастомную React Flow-ноду.
export interface RoadmapFlowNodeData extends Record<string, unknown> {
  title: string;
  status: NodeProgressStatus;
  is_current_step: boolean;
  is_on_active_path: boolean;
  is_root?: boolean;
  is_optional?: boolean;
  is_user_selected?: boolean;
  can_connect?: boolean;
}

// Блок описывает тип React Flow-ноды для карты роадмапа.
export type RoadmapFlowNodeModel = Node<RoadmapFlowNodeData, "roadmap">;

// Блок описывает готовый граф карты для повторного использования без повторной сборки.
export interface RoadmapFlowGraph {
  flowNodes: RoadmapFlowNodeModel[];
  flowEdges: Edge[];
  flatNodes: RoadmapNode[];
  currentNodeId: number | null;
}

const ROADMAP_LAYOUT_NODE_WIDTH = 226;
const ROADMAP_LAYOUT_NODE_HEIGHT = 62;

// Блок разворачивает дерево роадмапа в плоский список с сохранением порядка обхода.
export function flattenRoadmapNodes(nodes: RoadmapNode[]): RoadmapNode[] {
  const flatNodes: RoadmapNode[] = [];
  const stack = [...nodes].reverse();

  while (stack.length > 0) {
    const node = stack.pop();
    if (!node) {
      continue;
    }

    flatNodes.push(node);

    if (node.children?.length) {
      // Блок сохраняет preorder-обход дерева без дорогих shift/unshift на больших массивах.
      stack.push(...[...node.children].reverse());
    }
  }

  return flatNodes;
}

// Блок возвращает статус узла с безопасным значением по умолчанию.
export function getRoadmapNodeStatus(node: RoadmapNode): NodeProgressStatus {
  return node.progress_status ?? "not_started";
}

// Блок находит текущий узел пользователя: сначала активный, затем ближайший незавершённый.
export function getCurrentRoadmapNode(nodes: RoadmapNode[]): RoadmapNode | null {
  const inProgressNode = nodes.find((node) => getRoadmapNodeStatus(node) === "in_progress");
  if (inProgressNode) {
    return inProgressNode;
  }

  const nextNode = nodes.find((node) => getRoadmapNodeStatus(node) !== "done");
  if (nextNode) {
    return nextNode;
  }

  return nodes.at(-1) ?? null;
}

// Блок ищет один узел в дереве по идентификатору.
export function findRoadmapNodeById(
  nodes: RoadmapNode[],
  targetId: number | null | undefined
): RoadmapNode | null {
  if (targetId == null) {
    return null;
  }

  for (const node of nodes) {
    if (node.id === targetId) {
      return node;
    }

    const matchedChild = findRoadmapNodeById(node.children ?? [], targetId);
    if (matchedChild) {
      return matchedChild;
    }
  }

  return null;
}

// Блок строит узлы и связи для React Flow на основе дерева роадмапа.
export function buildRoadmapFlow(nodes: RoadmapNode[]): RoadmapFlowGraph {
  const flatNodes = flattenRoadmapNodes(nodes);
  const currentNodeId = getCurrentRoadmapNode(flatNodes)?.id ?? null;
  // Блок собирает быстрый индекс по id, чтобы не искать один и тот же узел линейным проходом много раз.
  const nodesById = new Map(flatNodes.map((node) => [node.id, node]));
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({
    rankdir: "TB",
    ranksep: 80,
    nodesep: 42,
    edgesep: 28,
    marginx: 36,
    marginy: 36,
    ranker: "tight-tree",
  });

  const activePathIds = new Set<number>();

  if (currentNodeId !== null) {
    let cursor = nodesById.get(currentNodeId) ?? null;

    while (cursor) {
      activePathIds.add(cursor.id);
      cursor = cursor.parent_id
        ? (nodesById.get(cursor.parent_id) ?? null)
        : null;
    }
  }

  const flowNodes: RoadmapFlowNodeModel[] = flatNodes.map((node) => {
    dagreGraph.setNode(String(node.id), {
      width: ROADMAP_LAYOUT_NODE_WIDTH,
      height: ROADMAP_LAYOUT_NODE_HEIGHT,
    });
    const isOnActivePath = activePathIds.has(node.id);

    return {
      id: String(node.id),
      type: "roadmap",
      position: { x: 0, y: 0 },
      sourcePosition: Position.Bottom,
      targetPosition: Position.Top,
      data: {
        title: node.title,
        status: getRoadmapNodeStatus(node),
        is_current_step: node.id === currentNodeId,
        is_on_active_path: isOnActivePath,
        is_root: node.parent_id === null,
        is_optional: node.is_optional,
      },
    };
  });

  const flowEdges: Edge[] = flatNodes
    .filter((node) => node.parent_id !== null)
    .map((node) => {
      dagreGraph.setEdge(String(node.parent_id), String(node.id));

      const isActiveEdge = activePathIds.has(node.id) && activePathIds.has(node.parent_id as number);
      const status = getRoadmapNodeStatus(node);

      return {
        id: `edge-${node.parent_id}-${node.id}`,
        source: String(node.parent_id),
        target: String(node.id),
        animated: isActiveEdge && status !== "done",
        style: {
          strokeWidth: node.is_optional ? 2 : 3,
          stroke: status === "done"
            ? "rgba(52,211,153,0.72)"
            : isActiveEdge
              ? "rgba(139,92,246,0.92)"
              : "rgba(139,92,246,0.50)",
          strokeDasharray: node.is_optional ? "6 4" : "0",
        },
      };
    });

  dagre.layout(dagreGraph);

  const positionedNodes = flowNodes.map((node) => {
    const layoutNode = dagreGraph.node(node.id);
    const sourceNode = nodesById.get(Number(node.id));

    return {
      ...node,
      position: {
        // Блок сохраняет ручное положение шага, если редактор уже выставил его на холсте.
        x: typeof sourceNode?.canvas_x === "number"
          ? Number(sourceNode.canvas_x)
          : layoutNode.x - ROADMAP_LAYOUT_NODE_WIDTH / 2,
        // Блок использует ручную Y-координату только если она сохранена на backend.
        y: typeof sourceNode?.canvas_y === "number"
          ? Number(sourceNode.canvas_y)
          : layoutNode.y - ROADMAP_LAYOUT_NODE_HEIGHT / 2,
      },
    };
  });

  return {
    flowNodes: positionedNodes,
    flowEdges,
    flatNodes,
    currentNodeId,
  };
}

// Блок рассчитывает dagre-позиции для всех узлов без учёта ручных смещений — для кнопки авто-выравнивания.
export function computeAutoLayout(nodes: RoadmapNode[]): Map<number, { x: number; y: number }> {
  const flatNodes = flattenRoadmapNodes(nodes);
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({
    rankdir: "TB",
    ranksep: 80,
    nodesep: 42,
    edgesep: 28,
    marginx: 36,
    marginy: 36,
    ranker: "tight-tree",
  });

  for (const node of flatNodes) {
    dagreGraph.setNode(String(node.id), {
      width: ROADMAP_LAYOUT_NODE_WIDTH,
      height: ROADMAP_LAYOUT_NODE_HEIGHT,
    });
  }

  for (const node of flatNodes) {
    if (node.parent_id !== null) {
      dagreGraph.setEdge(String(node.parent_id), String(node.id));
    }
  }

  dagre.layout(dagreGraph);

  const positionMap = new Map<number, { x: number; y: number }>();
  for (const node of flatNodes) {
    const layoutNode = dagreGraph.node(String(node.id));
    positionMap.set(node.id, {
      x: Number((layoutNode.x - ROADMAP_LAYOUT_NODE_WIDTH / 2).toFixed(2)),
      y: Number((layoutNode.y - ROADMAP_LAYOUT_NODE_HEIGHT / 2).toFixed(2)),
    });
  }

  return positionMap;
}
