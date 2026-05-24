import { BookOpen, Link2 } from "lucide-react";

import type { Resource } from "@/entities/roadmap/model/types";
import { isSafeHttpUrl } from "@/shared/lib/url";

function getUrlDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

// Блок описывает пропсы списка ресурсов узла.
interface ResourceListProps {
  resources: Resource[];
}

// Блок рендерит список ресурсов, прикреплённых к узлу роадмапа.
export function ResourceList({ resources }: ResourceListProps) {
  if (resources.length === 0) {
    return null;
  }

  return (
    <div className="grid gap-2 rounded-2xl border border-border/70 bg-background/70 p-3">
      <div className="flex items-center gap-2 text-sm font-medium">
        <BookOpen className="h-4 w-4" />
        Источники
      </div>

      <div className="grid gap-2">
        {resources.map((resource) => {
          const isClickable = isSafeHttpUrl(resource.url);

          if (!isClickable) {
            return (
              <div
                key={resource.id}
                className="flex flex-col items-start gap-2 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-sm sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="truncate font-medium">{resource.title}</div>
                  <div className="break-all text-xs text-amber-200/80">Небезопасная ссылка скрыта</div>
                </div>
                <Link2 className="h-4 w-4 shrink-0 text-amber-200/80" />
              </div>
            );
          }

          return (
            <a
              key={resource.id}
              href={resource.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-start gap-2 rounded-2xl border border-border/60 bg-card px-3 py-2 text-sm transition-colors hover:bg-secondary/60 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <div className="truncate font-medium">{resource.title}</div>
                <div className="truncate text-xs text-muted-foreground">{getUrlDomain(resource.url)}</div>
              </div>
              <Link2 className="h-4 w-4 shrink-0 text-muted-foreground" />
            </a>
          );
        })}
      </div>
    </div>
  );
}
