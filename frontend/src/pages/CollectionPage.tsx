import { Link } from "react-router-dom";

import { useRoadmapsQuery } from "@/entities/roadmap/api/hooks";
import { RoadmapCard } from "@/entities/roadmap/ui/RoadmapCard";
import { useSavedRoadmaps } from "@/features/collection/model/saved-roadmaps";
import { Button } from "@/shared/ui/button";
import { PageShell } from "@/shared/ui/page-shell";
import { RoadmapCardSkeleton } from "@/shared/ui/skeleton";
import { StateMessage } from "@/shared/ui/state-message";

export function CollectionPage() {
  const libraryRoadmapsQuery = useRoadmapsQuery();
  const { savedSlugsSet, toggleSavedRoadmap } = useSavedRoadmaps();

  const savedRoadmaps = (libraryRoadmapsQuery.data ?? []).filter((roadmap) => savedSlugsSet.has(roadmap.slug));
  const isLoading = libraryRoadmapsQuery.isLoading;
  const isError = libraryRoadmapsQuery.isError;
  const errorMessage = libraryRoadmapsQuery.error?.message ?? "Не удалось загрузить коллекцию.";

  return (
    <PageShell title={savedRoadmaps.length > 0 ? `Моя коллекция · ${savedRoadmaps.length}` : "Моя коллекция"}>
      {isLoading ? (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <RoadmapCardSkeleton key={i} />
          ))}
        </section>
      ) : null}

      {isError ? (
        <StateMessage
          title="Не удалось загрузить коллекцию"
          description={errorMessage}
          action={
            <Button onClick={() => libraryRoadmapsQuery.refetch()} variant="outline">
              Повторить запрос
            </Button>
          }
        />
      ) : null}

      {!isLoading && !isError && savedRoadmaps.length === 0 ? (
        <StateMessage
          title="Коллекция пока пуста"
          description="Открой библиотеку и добавляй карты звёздочкой — они появятся здесь."
          action={
            <Button asChild>
              <Link to="/roadmaps">Открыть библиотеку</Link>
            </Button>
          }
        />
      ) : null}

      {savedRoadmaps.length > 0 ? (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {savedRoadmaps.map((roadmap) => (
            <RoadmapCard
              key={roadmap.id}
              isSaved={savedSlugsSet.has(roadmap.slug)}
              onToggleSaved={toggleSavedRoadmap}
              roadmap={roadmap}
            />
          ))}
        </section>
      ) : null}
    </PageShell>
  );
}
