import { useCallback } from "react";
import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  type Connection,
  type Edge,
  type EdgeChange,
  type Node,
  type NodeChange,
} from "@xyflow/react";
import { useEdgesState, useNodesState } from "@xyflow/react";

import "@xyflow/react/dist/style.css";

import { PageShell } from "@/shared/ui/page-shell";

// Блок задаёт стартовые demo-узлы для проверки интеграции React Flow.
const initialNodes: Node[] = [
  {
    id: "start",
    position: { x: 80, y: 120 },
    data: { label: "Начало пути" },
    type: "input",
  },
  {
    id: "learn",
    position: { x: 320, y: 120 },
    data: { label: "Изучить основы React Flow" },
  },
  {
    id: "ship",
    position: { x: 580, y: 120 },
    data: { label: "Подключить к ветке" },
    type: "output",
  },
];

// Блок задаёт стартовые demo-связи между узлами.
const initialEdges: Edge[] = [
  { id: "start-learn", source: "start", target: "learn", animated: true },
  { id: "learn-ship", source: "learn", target: "ship" },
];

// Блок рендерит отдельную тестовую страницу с React Flow.
export function ReactFlowDemoPage() {
  const [nodes, setNodes] = useNodesState(initialNodes);
  const [edges, setEdges] = useEdgesState(initialEdges);

  // Блок применяет изменения узлов при перетаскивании и других интеракциях.
  const onNodesChange = useCallback(
    (changes: NodeChange[]) => setNodes((currentNodes) => applyNodeChanges(changes, currentNodes)),
    [setNodes],
  );

  // Блок применяет изменения связей при интеракциях на канвасе.
  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges((currentEdges) => applyEdgeChanges(changes, currentEdges)),
    [setEdges],
  );

  // Блок позволяет добавлять новую связь, если пользователь соединит узлы вручную.
  const onConnect = useCallback(
    (connection: Connection) => setEdges((currentEdges) => addEdge(connection, currentEdges)),
    [setEdges],
  );

  return (
    <PageShell
      badge="React Flow"
      title="Тестовая схема"
      description="Минимальная интеграция React Flow в текущий React + TypeScript + Vite проект."
    >
      <div className="overflow-hidden rounded-3xl border border-border/70 bg-card">
        <div className="h-[560px] w-full">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            fitView
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
          >
            <Background gap={20} size={1} />
            <Controls />
            <MiniMap pannable zoomable />
          </ReactFlow>
        </div>
      </div>
    </PageShell>
  );
}
