import { Link } from "react-router-dom";

import type { NodeProgressStatus } from "@/entities/progress/model/types";
import type { StartedRoadmapProgress } from "@/entities/progress/model/types";
import { ProgressBar } from "@/features/roadmap-progress/ui/ProgressBar";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";

// Блок описывает пропсы карточки прогресса по одному роадмапу.
interface ProfileRoadmapCardProps {
  roadmap: StartedRoadmapProgress;
}

// Блок переводит технический статус backend в читаемую подпись интерфейса.
function getStatusLabel(status: NodeProgressStatus | undefined) {
  if (status === "done") {
    return "Пройдено";
  }

  if (status === "in_progress") {
    return "В процессе";
  }

  return "Не начато";
}

// Блок рендерит карточку начатого пользователем роадмапа.
export function ProfileRoadmapCard({ roadmap }: ProfileRoadmapCardProps) {
  return (
    <Card className="flex min-w-0 h-full flex-col">
      <CardHeader className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Badge>{roadmap.category}</Badge>
          <Badge>{roadmap.level}</Badge>
          <Badge>
            {roadmap.done_nodes}/{roadmap.total_nodes} шагов
          </Badge>
        </div>
        <div className="min-w-0 space-y-2">
          <CardTitle className="line-clamp-2">{roadmap.title}</CardTitle>
          <CardDescription className="line-clamp-3">{roadmap.short_description}</CardDescription>
        </div>
      </CardHeader>

      <CardContent className="mt-auto grid gap-4 pt-0">
        <div className="grid gap-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Прогресс</span>
            <span className="font-medium">{roadmap.completion_percent}%</span>
          </div>
          <ProgressBar value={roadmap.completion_percent} showPercent={false} />
        </div>

        {roadmap.last_progress_point ? (
          <div className="rounded-2xl border border-border/70 bg-background/70 p-3">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">
              Последняя точка прогресса
            </div>
            <div className="mt-1 break-words text-sm font-medium">{roadmap.last_progress_point.node_title}</div>
            <div className="mt-1 text-sm text-muted-foreground">
              Статус: {getStatusLabel(roadmap.last_progress_point.status)}
            </div>
          </div>
        ) : null}

        <Button asChild className="w-full sm:w-fit">
          <Link to={`/map/${roadmap.slug}`}>Продолжить</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
