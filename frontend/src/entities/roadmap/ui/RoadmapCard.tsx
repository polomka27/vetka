import { Star } from "lucide-react";
import { Link } from "react-router-dom";

import type { RoadmapSummary } from "@/entities/roadmap/model/types";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";

interface RoadmapCardProgress {
  completion_percent: number;
  done_nodes: number;
  total_nodes: number;
}

interface RoadmapCardProps {
  roadmap: RoadmapSummary;
  isSaved?: boolean;
  onToggleSaved?: (slug: string) => void;
  progress?: RoadmapCardProgress;
}

export function RoadmapCard({ roadmap, isSaved = false, onToggleSaved, progress }: RoadmapCardProps) {
  return (
    <Card className="group flex h-full min-w-0 flex-col transition-transform duration-300 hover:-translate-y-1">
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-wrap gap-1.5">
            <Badge>{roadmap.category}</Badge>
            <Badge>{roadmap.level}</Badge>
            {roadmap.steps_count > 0 ? <Badge>{roadmap.steps_count} шагов</Badge> : null}
          </div>

          {onToggleSaved ? (
            <button
              aria-label={isSaved ? "Убрать из избранного" : "Добавить в избранное"}
              className="shrink-0 rounded-full border border-white/10 bg-white/5 p-2.5 text-muted-foreground transition-all hover:bg-secondary/60 hover:text-primary"
              type="button"
              onClick={() => onToggleSaved(roadmap.slug)}
            >
              <Star
                className={cn(
                  "h-4 w-4 transition-all",
                  isSaved
                    ? "fill-amber-400 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.7)]"
                    : "text-muted-foreground"
                )}
              />
            </button>
          ) : null}
        </div>

        <div className="min-w-0 space-y-1.5">
          <CardTitle className="line-clamp-2 text-base leading-snug sm:text-lg">{roadmap.title}</CardTitle>
          <CardDescription className="line-clamp-3 text-sm leading-relaxed">{roadmap.short_description}</CardDescription>
        </div>
      </CardHeader>

      <CardContent className="mt-auto grid gap-3 pt-0">
        <div className="text-sm text-muted-foreground">
          <span className="text-foreground/60">Автор: </span>
          <span className="font-medium text-foreground">{roadmap.author_name ?? "ветка"}</span>
        </div>

        <div className="flex items-center justify-between gap-3">
          <Button asChild size="sm" className="w-full sm:w-fit">
            <Link to={`/map/${roadmap.slug}`}>Открыть карту</Link>
          </Button>

          {progress ? (
            <div className="flex shrink-0 items-center gap-2">
              <div className="h-2 w-24 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-[linear-gradient(90deg,#a855f7_0%,#8b5cf6_60%,#c4b5fd_100%)] transition-all duration-300"
                  style={{ width: `${Math.min(100, progress.completion_percent)}%` }}
                />
              </div>
              <span className="text-xs font-semibold tabular-nums text-muted-foreground">
                {Math.round(progress.completion_percent)}%
              </span>
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
