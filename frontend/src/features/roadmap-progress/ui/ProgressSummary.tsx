import type { RoadmapProgressResponse } from "@/entities/progress/model/types";
import type { RoadmapNode } from "@/entities/roadmap/model/types";
import { ProgressBar } from "@/features/roadmap-progress/ui/ProgressBar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";

// Блок приводит статус узла к безопасному значению по умолчанию.
function getNodeStatus(node: RoadmapNode) {
  return node.progress_status ?? "not_started";
}

// Блок разворачивает дерево узлов в плоский список для вычисления общей статистики.
function flattenNodes(nodes: RoadmapNode[]): RoadmapNode[] {
  return nodes.flatMap((node) => [node, ...flattenNodes(node.children ?? [])]);
}

// Блок считает статусы одним проходом, чтобы не гонять несколько фильтров по одному и тому же списку.
function getProgressCounts(nodes: RoadmapNode[]) {
  return nodes.reduce(
    (accumulator, node) => {
      const status = getNodeStatus(node);

      if (status === "done") {
        accumulator.done += 1;
      } else if (status === "in_progress") {
        accumulator.inProgress += 1;
      }

      return accumulator;
    },
    {
      done: 0,
      inProgress: 0
    }
  );
}

// Блок описывает пропсы сводки прогресса по роадмапу.
interface ProgressSummaryProps {
  nodes: RoadmapNode[];
  isAuthenticated: boolean;
  progressSummary?: RoadmapProgressResponse;
  currentNodeTitle?: string | null;
}

// Блок рендерит агрегированную сводку статусов по всем узлам роадмапа.
export function ProgressSummary({
  nodes,
  isAuthenticated,
  progressSummary,
  currentNodeTitle,
}: ProgressSummaryProps) {
  const flatNodes = flattenNodes(nodes);
  const progressCounts = getProgressCounts(flatNodes);
  const total = progressSummary?.total_nodes ?? flatNodes.length;
  const done =
    progressSummary?.done_nodes ??
    progressCounts.done;
  const inProgress = progressCounts.inProgress;
  const completionPercent =
    progressSummary?.completion_percent ?? (total > 0 ? Math.round((done / total) * 100) : 0);

  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle>Прогресс по карте</CardTitle>
        <CardDescription>
          {isAuthenticated
            ? "Актуальный прогресс по шагам этой карты."
            : "Гостевой режим: прогресс станет доступен после входа в аккаунт."}
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 pt-0">
        <ProgressBar value={completionPercent} />

        <div className="grid grid-cols-3 divide-x divide-white/8 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
          <div className="px-3 py-3 text-center">
            <div className="text-2xl font-bold leading-none">{total}</div>
            <div className="mt-1 text-xs text-muted-foreground">шагов</div>
          </div>
          <div className="px-3 py-3 text-center">
            <div className="text-2xl font-bold leading-none text-emerald-400">{done}</div>
            <div className="mt-1 text-xs text-muted-foreground">пройдено</div>
          </div>
          <div className="px-3 py-3 text-center">
            <div className="text-2xl font-bold leading-none text-violet-400">{inProgress}</div>
            <div className="mt-1 text-xs text-muted-foreground">в процессе</div>
          </div>
        </div>

        {completionPercent >= 100 && total > 0 ? (
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/8 p-3 text-sm font-medium text-emerald-400">
            Карта пройдена — отличная работа!
          </div>
        ) : currentNodeTitle ? (
          <div className="rounded-2xl border border-border/70 bg-background/70 p-3 text-sm">
            <span className="text-muted-foreground">Текущий шаг: </span>
            <span className="font-medium text-foreground">{currentNodeTitle}</span>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
