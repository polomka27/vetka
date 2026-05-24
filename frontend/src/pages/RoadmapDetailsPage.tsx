import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ChevronDown, Layers3 } from "lucide-react";

import { useCurrentUserQuery } from "@/entities/auth/api/hooks";
import {
  useRoadmapProgressQuery,
  useUpdateNodeNoteMutation,
  useUpdateNodeStatusMutation
} from "@/entities/progress/api/hooks";
import type { NodeProgressStatus } from "@/entities/progress/model/types";
import type { RoadmapNode } from "@/entities/roadmap/model/types";
import {
  buildRoadmapFlow,
  findRoadmapNodeById,
} from "@/entities/roadmap/lib/roadmap-flow";
import { RoadmapFlow } from "@/entities/roadmap/ui/RoadmapFlow";
import { RoadmapNodeDetailsPanel } from "@/entities/roadmap/ui/RoadmapNodeDetailsPanel";
import {
  clearCurrentMapSlug,
  getCurrentMapSlug,
  setCurrentMapSlug
} from "@/features/current-map/model/current-map-storage";
import { useSavedRoadmaps } from "@/features/collection/model/saved-roadmaps";
import { ProgressSummary } from "@/features/roadmap-progress/ui/ProgressSummary";
import { useRoadmapBySlugQuery, useRoadmapsQuery } from "@/entities/roadmap/api/hooks";
import { useOutsidePointerDown } from "@/shared/lib/use-outside-pointerdown";
import { ApiError } from "@/shared/api/types";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { StateMessage } from "@/shared/ui/state-message";

// Блок рекурсивно подставляет progress_status в дерево узлов на основе summary из backend.
function applyProgressStatuses(
  nodes: RoadmapNode[],
  nodeStatuses: Record<string, NodeProgressStatus> | undefined
): RoadmapNode[] {
  return nodes.map((node) => ({
    ...node,
    progress_status: nodeStatuses?.[String(node.id)] ?? "not_started",
    children: applyProgressStatuses(node.children ?? [], nodeStatuses)
  }));
}

// Блок рендерит детальную страницу одного роадмапа по slug.
export function RoadmapDetailsPage() {
  const { slug } = useParams();
  const roadmapQuery = useRoadmapBySlugQuery(slug);
  const currentUserQuery = useCurrentUserQuery();
  const updateStatusMutation = useUpdateNodeStatusMutation();
  const updateNoteMutation = useUpdateNodeNoteMutation();
  const [showGuestCta, setShowGuestCta] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<number | null>(null);
  const [isCollectionOpen, setIsCollectionOpen] = useState(false);
  const collectionDropdownRef = useRef<HTMLDivElement | null>(null);
  const selectedStepPanelRef = useRef<HTMLDivElement | null>(null);
  const autoSelectedSlugRef = useRef<string | null>(null);
  const { savedSlugsSet } = useSavedRoadmaps();
  const roadmapsQuery = useRoadmapsQuery();

  const isAuthenticated = currentUserQuery.isSuccess && Boolean(currentUserQuery.data?.user);
  const progressQuery = useRoadmapProgressQuery(slug, isAuthenticated);

  const nodes = useMemo(
    () => applyProgressStatuses(roadmapQuery.data?.nodes ?? [], progressQuery.data?.node_statuses),
    [progressQuery.data?.node_statuses, roadmapQuery.data?.nodes]
  );
  const flowGraph = useMemo(() => buildRoadmapFlow(nodes), [nodes]);
  const selectedNode = useMemo(() => findRoadmapNodeById(nodes, selectedNodeId), [nodes, selectedNodeId]);
  const collectionMaps = useMemo(
    () =>
      (roadmapsQuery.data ?? []).filter(
        (roadmap) => savedSlugsSet.has(roadmap.slug) && roadmap.slug !== slug
      ),
    [roadmapsQuery.data, savedSlugsSet, slug]
  );

  useEffect(() => {
    if (slug && roadmapQuery.isSuccess) {
      setCurrentMapSlug(slug);
    }
  }, [roadmapQuery.isSuccess, slug]);

  useEffect(() => {
    if (!(roadmapQuery.error instanceof ApiError) || roadmapQuery.error.status !== 404 || !slug) {
      return;
    }
    if (getCurrentMapSlug() === slug) {
      clearCurrentMapSlug();
    }
  }, [roadmapQuery.error, slug]);

  // Авто-открытие текущего шага при первой загрузке карты.
  useEffect(() => {
    if (flowGraph.currentNodeId !== null && slug && autoSelectedSlugRef.current !== slug) {
      autoSelectedSlugRef.current = slug;
      setSelectedNodeId(flowGraph.currentNodeId);
    }
  }, [flowGraph.currentNodeId, slug]);

  // Escape закрывает панель деталей.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedNodeId(null);
        setShowGuestCta(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!selectedNodeId || typeof window === "undefined" || window.innerWidth >= 1024) {
      return;
    }
    const frameId = window.requestAnimationFrame(() => {
      selectedStepPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    return () => { window.cancelAnimationFrame(frameId); };
  }, [selectedNodeId]);

  useOutsidePointerDown(collectionDropdownRef, () => setIsCollectionOpen(false), isCollectionOpen);

  const handleStatusChange = (payload: {
    roadmapSlug: string;
    nodeId: number;
    status: NodeProgressStatus;
  }) => {
    updateStatusMutation.mutate(payload);
  };

  return (
    <section className="page-shell-entrance grid min-w-0 gap-4 px-3 pb-12 sm:gap-6 sm:px-5 sm:pb-16 lg:px-8 lg:pb-20">
      <Card className="min-w-0 md:border md:border-white/10">
        <CardHeader className="gap-4 border-b border-border/60 bg-white/[0.03] p-4 sm:p-6 lg:p-8">
          <div className="space-y-3">
            <CardTitle className="text-2xl leading-tight sm:text-3xl lg:text-4xl">
              {roadmapQuery.data?.title ?? `Карта: ${slug ?? "unknown"}`}
            </CardTitle>
            <CardDescription className="max-w-2xl text-sm leading-6 sm:text-base">
              {roadmapQuery.data?.short_description ??
                "Здесь появятся шаги, описание разделов, полезные материалы и твой прогресс."}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="grid min-w-0 gap-4 p-4 sm:gap-5 sm:p-6 lg:gap-6 lg:p-8">
          {roadmapQuery.isLoading ? (
            <StateMessage
              title="Загрузка карты"
              description="Получаем описание карты и дерево её шагов."
            />
          ) : null}

          {roadmapQuery.isError ? (
            <StateMessage
              title="Не удалось загрузить карту"
              description={roadmapQuery.error.message}
              action={
                <Button onClick={() => roadmapQuery.refetch()} variant="outline">
                  Повторить запрос
                </Button>
              }
            />
          ) : null}

          {roadmapQuery.isSuccess ? (
            <>
              <div className="grid gap-5 lg:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.7fr)]">
                <div className="min-w-0 grid gap-4">
                  <div className="relative w-full sm:w-fit" ref={collectionDropdownRef}>
                    <Button
                      aria-expanded={isCollectionOpen}
                      aria-label="Открыть список карт из коллекции"
                      className="h-10 w-full justify-between rounded-2xl border-white/12 bg-white/6 px-3 sm:w-auto"
                      onClick={() => setIsCollectionOpen((v) => !v)}
                      type="button"
                      variant="outline"
                    >
                      <Layers3 className="mr-2 h-4 w-4" />
                      <span className="text-sm">Коллекция</span>
                      <ChevronDown
                        className={`ml-2 h-4 w-4 transition-transform ${isCollectionOpen ? "rotate-180" : ""}`}
                      />
                    </Button>

                    {isCollectionOpen ? (
                      <div className="glass-surface absolute left-0 top-[calc(100%+0.75rem)] z-20 grid w-full gap-2 rounded-[1.6rem] p-2 shadow-[0_24px_60px_rgba(15,10,31,0.32)] sm:min-w-[320px] sm:w-auto">
                        {collectionMaps.length > 0 ? (
                          collectionMaps.map((roadmap) => (
                            <Link
                              key={roadmap.id}
                              className="flex items-center justify-between rounded-2xl px-4 py-3 text-sm transition-colors hover:bg-white/10"
                              to={`/map/${roadmap.slug}`}
                            >
                              <div className="min-w-0">
                                <div className="truncate font-medium text-foreground">{roadmap.title}</div>
                                <div className="truncate text-xs text-muted-foreground">{roadmap.author_name ?? "ветка"}</div>
                              </div>
                              <span className="ml-3 shrink-0 text-xs text-muted-foreground">{roadmap.level}</span>
                            </Link>
                          ))
                        ) : (
                          <div className="grid gap-1 rounded-2xl px-4 py-3">
                            <div className="text-sm text-muted-foreground">В коллекции пока нет других карт.</div>
                            <Link
                              className="text-xs text-primary hover:underline"
                              to="/roadmaps"
                              onClick={() => setIsCollectionOpen(false)}
                            >
                              Открыть библиотеку
                            </Link>
                          </div>
                        )}
                      </div>
                    ) : null}
                  </div>

                  <Card className="min-w-0">
                    <CardContent className="p-4 sm:p-5">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                        <span className="text-sm font-medium text-foreground">
                          {roadmapQuery.data.author_name ?? "ветка"}
                        </span>
                        <div className="h-3.5 w-px bg-border/60" />
                        <div className="flex flex-wrap gap-1.5">
                          <Badge>{roadmapQuery.data.category}</Badge>
                          <Badge>{roadmapQuery.data.level}</Badge>
                          {(roadmapQuery.data.tags ?? []).map((tag) => (
                            <Badge key={tag.id}>{tag.name}</Badge>
                          ))}
                        </div>
                      </div>
                      {roadmapQuery.data.full_description &&
                       roadmapQuery.data.full_description !== roadmapQuery.data.short_description ? (
                        <p className="mt-3 text-sm leading-6 text-muted-foreground">
                          {roadmapQuery.data.full_description}
                        </p>
                      ) : null}
                    </CardContent>
                  </Card>
                </div>

                <ProgressSummary
                  nodes={nodes}
                  currentNodeTitle={findRoadmapNodeById(nodes, flowGraph.currentNodeId)?.title ?? null}
                  isAuthenticated={isAuthenticated}
                  progressSummary={progressQuery.data}
                />
              </div>

              {progressQuery.isError && isAuthenticated ? (
                <StateMessage
                  title="Не удалось загрузить прогресс"
                  description={progressQuery.error.message}
                />
              ) : null}

              {showGuestCta ? (
                <StateMessage
                  title="Войди, чтобы сохранять прогресс"
                  description="Гости могут просматривать структуру карты, но изменение статусов доступно только авторизованным пользователям."
                  action={
                    <Button asChild>
                      <Link to="/login">Перейти ко входу</Link>
                    </Button>
                  }
                />
              ) : null}

              {updateStatusMutation.isError ? (
                <StateMessage
                  title="Не удалось обновить статус"
                  description={updateStatusMutation.error.message}
                />
              ) : null}

              <div
                className={
                  selectedNode
                    ? "grid gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,360px)]"
                    : "grid gap-4"
                }
              >
                <div className="sticky top-20 h-[calc(100dvh-5rem)] sm:top-28 sm:h-[calc(100dvh-7rem)] lg:top-32 lg:h-[calc(100dvh-8rem)]">
                  <RoadmapFlow
                    bare
                    graph={flowGraph}
                    nodes={nodes}
                    selectedNodeId={selectedNodeId}
                    onClearSelection={() => { setSelectedNodeId(null); setShowGuestCta(false); }}
                    onSelectNode={(id) => setSelectedNodeId((prev) => (prev === id ? null : id))}
                  />
                </div>

                {selectedNode ? (
                  <div ref={selectedStepPanelRef}>
                    <RoadmapNodeDetailsPanel
                      node={selectedNode}
                      roadmapSlug={slug ?? ""}
                      isAuthenticated={isAuthenticated}
                      isCurrentNode={selectedNode?.id === flowGraph.currentNodeId}
                      isUpdating={updateStatusMutation.isPending}
                      isSavingNote={updateNoteMutation.isPending}
                      note={progressQuery.data?.node_notes?.[String(selectedNode.id)] ?? ""}
                      onClose={() => { setSelectedNodeId(null); setShowGuestCta(false); }}
                      onGuestAction={() => setShowGuestCta(true)}
                      onNoteSave={(value) => {
                        if (!selectedNode || !slug || !isAuthenticated) {
                          if (!isAuthenticated) setShowGuestCta(true);
                          return;
                        }
                        updateNoteMutation.mutate({ roadmapSlug: slug, nodeId: selectedNode.id, note: value });
                      }}
                      onStatusChange={handleStatusChange}
                    />
                  </div>
                ) : null}
              </div>
            </>
          ) : null}
        </CardContent>
      </Card>
    </section>
  );
}
