import { useCallback, useEffect, useMemo, useState } from "react";
import { Locate, Maximize2, Minus, Plus } from "lucide-react";
import {
  applyNodeChanges,
  ConnectionLineType,
  type Connection,
  MarkerType,
  type NodeChange,
  type OnNodeDrag,
  Panel,
  ReactFlow,
  type NodeMouseHandler,
  useReactFlow,
} from "@xyflow/react";

import "@xyflow/react/dist/style.css";

import {
  buildRoadmapFlow,
  type RoadmapFlowGraph,
  type RoadmapFlowNodeModel,
} from "@/entities/roadmap/lib/roadmap-flow";
import type { RoadmapNode } from "@/entities/roadmap/model/types";
import { RoadmapFlowNode } from "@/entities/roadmap/ui/RoadmapFlowNode";
import { StateMessage } from "@/shared/ui/state-message";

// Блок описывает пропсы интерактивной карты роадмапа.
interface RoadmapFlowProps {
  nodes: RoadmapNode[];
  graph?: RoadmapFlowGraph;
  selectedNodeId: number | null;
  onSelectNode: (nodeId: number) => void;
  onClearSelection?: () => void;
  title?: string;
  description?: string;
  allowDragging?: boolean;
  allowConnecting?: boolean;
  bare?: boolean;
  onStepDragStop?: (payload: { nodeId: number; x: number; y: number }) => void;
  onConnect?: (params: Connection) => void;
}

function ZoomControls() {
  const { zoomIn, zoomOut, fitView } = useReactFlow();
  const btnCls =
    "flex h-7 w-7 items-center justify-center rounded-lg text-white/65 transition-colors hover:bg-white/12 hover:text-white";
  return (
    <Panel position="bottom-left">
      <div className="flex flex-col gap-0.5 rounded-xl border border-white/15 bg-[rgba(17,10,40,0.72)] p-1 shadow-lg backdrop-blur-md">
        <button type="button" aria-label="Приблизить" className={btnCls} onClick={() => zoomIn({ duration: 200 })}>
          <Plus className="h-3.5 w-3.5" />
        </button>
        <button type="button" aria-label="Отдалить" className={btnCls} onClick={() => zoomOut({ duration: 200 })}>
          <Minus className="h-3.5 w-3.5" />
        </button>
        <button type="button" aria-label="Вписать в экран" className={btnCls} onClick={() => fitView({ duration: 400, padding: 0.24 })}>
          <Maximize2 className="h-3 w-3" />
        </button>
      </div>
    </Panel>
  );
}

function GoToCurrentControl({ nodeId }: { nodeId: string | null }) {
  const { fitView } = useReactFlow();
  if (!nodeId) return null;
  return (
    <Panel position="bottom-right">
      <button
        type="button"
        onClick={() => fitView({ nodes: [{ id: nodeId }], duration: 500, padding: 0.8 })}
        className="flex items-center gap-1.5 rounded-full border border-white/15 bg-[rgba(17,10,40,0.72)] px-3 py-1.5 text-xs text-white/75 shadow-lg backdrop-blur-md transition-colors hover:bg-[rgba(109,40,217,0.45)] hover:text-white"
      >
        <Locate className="h-3.5 w-3.5" />
        Текущий шаг
      </button>
    </Panel>
  );
}

// Блок хранит сопоставление типов React Flow-нод с кастомными React-компонентами.
const nodeTypes = {
  roadmap: RoadmapFlowNode,
};

const ROADMAP_NODE_WIDTH = 226;
const ROADMAP_NODE_HEIGHT = 62;
const ROADMAP_CANVAS_PADDING = 220;
const ROADMAP_MIN_CANVAS_HEIGHT = 420;

// Блок вычисляет нижний порог масштаба на основе фактических размеров карты.
function getMinZoom(nodes: RoadmapFlowNodeModel[]): number {
  if (nodes.length <= 1) return 1.0;

  const bounds = nodes.reduce(
    (acc, node) => ({
      minX: Math.min(acc.minX, node.position.x),
      maxX: Math.max(acc.maxX, node.position.x + ROADMAP_NODE_WIDTH),
      minY: Math.min(acc.minY, node.position.y),
      maxY: Math.max(acc.maxY, node.position.y + ROADMAP_NODE_HEIGHT),
    }),
    { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity }
  );

  const contentSize = Math.max(
    bounds.maxX - bounds.minX,
    bounds.maxY - bounds.minY
  );

  // ~500px → 1.0, ~1000px → 0.86, >1500px → 0.65 (floor)
  return Math.max(0.65, Math.min(1.0, 1200 / (contentSize + 400)));
}

// Блок рассчитывает высоту холста по фактическим координатам шагов, чтобы большая карта не обрезалась контейнером.
function getRoadmapCanvasHeight(nodes: RoadmapFlowNodeModel[]) {
  if (nodes.length === 0) {
    return ROADMAP_MIN_CANVAS_HEIGHT;
  }

  const horizontalBounds = nodes.reduce((accumulator, node) => ({
    minX: Math.min(accumulator.minX, node.position.x),
    maxX: Math.max(accumulator.maxX, node.position.x + ROADMAP_NODE_WIDTH),
  }), {
    minX: Number.POSITIVE_INFINITY,
    maxX: Number.NEGATIVE_INFINITY
  });
  const verticalBounds = nodes.reduce((accumulator, node) => ({
    minY: Math.min(accumulator.minY, node.position.y),
    maxY: Math.max(accumulator.maxY, node.position.y + ROADMAP_NODE_HEIGHT),
  }), {
    minY: Number.POSITIVE_INFINITY,
    maxY: Number.NEGATIVE_INFINITY
  });
  const contentHeight = verticalBounds.maxY - verticalBounds.minY;
  const widthCompensation = Math.max(0, horizontalBounds.maxX - horizontalBounds.minX - 900) * 0.12;

  return Math.max(
    ROADMAP_MIN_CANVAS_HEIGHT,
    Math.ceil(contentHeight + ROADMAP_CANVAS_PADDING + widthCompensation)
  );
}

// Блок рендерит интерактивную карту роадмапа в стиле whiteboard.
export function RoadmapFlow({
  nodes,
  graph,
  selectedNodeId,
  onSelectNode,
  onClearSelection,
  title = "Карта",
  description = "Нажми на шаг, чтобы открыть детали.",
  allowDragging = false,
  allowConnecting = false,
  bare = false,
  onStepDragStop,
  onConnect
}: RoadmapFlowProps) {
  const { flowNodes, flowEdges, currentNodeId } = useMemo(() => graph ?? buildRoadmapFlow(nodes), [graph, nodes]);
  const [displayNodes, setDisplayNodes] = useState(flowNodes);
  const canvasHeight = useMemo(() => getRoadmapCanvasHeight(displayNodes), [displayNodes]);
  const minZoom = useMemo(() => getMinZoom(displayNodes), [displayNodes]);
  const selectedNodeIdAsString = selectedNodeId !== null ? String(selectedNodeId) : null;
  const renderedNodes = useMemo(
    () =>
      displayNodes.map((node) => {
        const isSelected = selectedNodeIdAsString === node.id;

        return {
          ...node,
          selected: isSelected,
          data: {
            ...node.data,
            is_user_selected: isSelected,
            can_connect: allowConnecting,
          }
        };
      }),
    [displayNodes, selectedNodeIdAsString, allowConnecting]
  );

  // Блок синхронизирует локальное положение шагов с входным графом после загрузки или сохранения.
  useEffect(() => {
    setDisplayNodes(flowNodes);
  }, [flowNodes]);

  // Блок обрабатывает выбор ноды и синхронизирует его с внешней панелью деталей.
  const handleNodeClick = useCallback<NodeMouseHandler<RoadmapFlowNodeModel>>(
    (_event, node) => {
      onSelectNode(Number(node.id));
    },
    [onSelectNode]
  );

  // Блок позволяет редактору карты локально двигать шаги до момента сохранения на backend.
  const handleNodesChange = useCallback((changes: NodeChange<RoadmapFlowNodeModel>[]) => {
    if (!allowDragging) {
      return;
    }

    setDisplayNodes((currentNodes) => applyNodeChanges(changes, currentNodes));
  }, [allowDragging]);

  // Блок сохраняет итоговые координаты шага после перетаскивания в редакторе.
  const handleNodeDragStop = useCallback<OnNodeDrag<RoadmapFlowNodeModel>>(
    (_event, node) => {
      if (!allowDragging || !onStepDragStop) {
        return;
      }

      onStepDragStop({
        nodeId: Number(node.id),
        x: node.position.x,
        y: node.position.y
      });
    },
    [allowDragging, onStepDragStop]
  );

  if (flowNodes.length === 0) {
    return (
      <StateMessage
        title="Карта пока пуста"
        description="Автор ещё не добавил шаги. Вернись позже или выбери другую карту из библиотеки."
      />
    );
  }

  const canvas = (
    <div
      className={bare ? "roadmap-flow-canvas h-full w-full" : "roadmap-flow-canvas min-h-[360px] w-full sm:min-h-[420px]"}
      style={bare ? undefined : { height: `${canvasHeight}px` }}
    >
      <ReactFlow
        fitView
        fitViewOptions={{ padding: 0.24, minZoom: minZoom }}
        edges={flowEdges}
        nodes={renderedNodes}
        defaultEdgeOptions={{
          // Блок возвращает привычные мягкие линии между шагами на карте.
          type: "smoothstep",
          markerEnd: {
            type: MarkerType.ArrowClosed
          }
        }}
        connectionLineType={ConnectionLineType.SmoothStep}
        nodeTypes={nodeTypes}
        nodesDraggable={allowDragging}
        onlyRenderVisibleElements
        onNodesChange={handleNodesChange}
        onNodeDragStop={handleNodeDragStop}
        onNodeClick={handleNodeClick}
        onConnect={onConnect}
        onPaneClick={onClearSelection}
        panOnDrag
        panOnScroll={false}
        selectionOnDrag={false}
        zoomOnDoubleClick={false}
        minZoom={minZoom}
        maxZoom={1.35}
        proOptions={{ hideAttribution: true }}
      >
        <ZoomControls />
        <GoToCurrentControl nodeId={currentNodeId !== null ? String(currentNodeId) : null} />
      </ReactFlow>
    </div>
  );

  if (bare) {
    return canvas;
  }

  return (
    <div className="glass-surface min-w-0 overflow-hidden rounded-[1.75rem] sm:rounded-3xl">
      <div className="border-b border-white/10 px-4 py-3 sm:px-5">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm font-medium">{title}</div>
          {description ? <div className="text-xs text-muted-foreground">{description}</div> : null}
        </div>
      </div>
      {canvas}
    </div>
  );
}
