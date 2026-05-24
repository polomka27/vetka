import { Star } from "lucide-react";
import { Link } from "react-router-dom";

import type { RoadmapSummary } from "@/entities/roadmap/model/types";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";

interface RoadmapCardProps {
  roadmap: RoadmapSummary;
  isSaved?: boolean;
  onToggleSaved?: (slug: string) => void;
}

export function RoadmapCard({ roadmap, isSaved = false, onToggleSaved }: RoadmapCardProps) {
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
              aria-label={isSaved ? "Убрать из коллекции" : "Добавить в коллекцию"}
              className="shrink-0 rounded-full border border-white/10 bg-white/5 p-1.5 text-muted-foreground transition-all hover:bg-secondary/60 hover:text-primary"
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
        <Button asChild size="sm" className="w-full sm:w-fit">
          <Link to={`/map/${roadmap.slug}`}>Открыть карту</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
