import { useState } from "react";
import { Check, Globe, Pencil, Plus, Trash2, X } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import {
  useAdminRoadmapsQuery,
  useDeleteAdminRoadmapMutation
} from "@/entities/admin-roadmap/api/hooks";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { PageShell } from "@/shared/ui/page-shell";
import { RoadmapCardSkeleton } from "@/shared/ui/skeleton";
import { StateMessage } from "@/shared/ui/state-message";
import { cn } from "@/shared/lib/utils";

export function AdminRoadmapsPage() {
  const navigate = useNavigate();
  const roadmapsQuery = useAdminRoadmapsQuery();
  const deleteRoadmapMutation = useDeleteAdminRoadmapMutation();
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  const handleDelete = (id: number) => {
    deleteRoadmapMutation.mutate(id, {
      onSuccess: () => setConfirmDeleteId(null),
    });
  };

  return (
    <PageShell
      title="Мои карты"
      description="Твои карты — черновики и опубликованные."
    >
      <div className="flex justify-start">
        <Button asChild className="w-full sm:w-auto">
          <Link to="/workshop/roadmaps/new">
            <Plus className="mr-2 h-4 w-4" />
            Новая карта
          </Link>
        </Button>
      </div>

      {roadmapsQuery.isLoading ? (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <RoadmapCardSkeleton key={i} />
          ))}
        </section>
      ) : null}

      {roadmapsQuery.isError ? (
        <StateMessage
          variant="error"
          title="Не удалось загрузить карты"
          description={roadmapsQuery.error.message}
          action={
            <Button onClick={() => roadmapsQuery.refetch()} variant="outline">
              Повторить запрос
            </Button>
          }
        />
      ) : null}

      {roadmapsQuery.isSuccess && roadmapsQuery.data.length === 0 ? (
        <StateMessage
          title="Карт пока нет"
          description="Нажми «Новая карта» и начни с названия."
          action={
            <Button asChild>
              <Link to="/workshop/roadmaps/new">
                <Plus className="mr-2 h-4 w-4" />
                Создать карту
              </Link>
            </Button>
          }
        />
      ) : null}

      {roadmapsQuery.isSuccess && roadmapsQuery.data.length > 0 ? (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {roadmapsQuery.data.map((roadmap) => (
            <Card key={roadmap.id} className="group flex h-full min-w-0 flex-col">
              <CardHeader className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 flex-wrap gap-2">
                    <Badge>{roadmap.category}</Badge>
                    <Badge>{roadmap.level}</Badge>
                    <Badge
                      className={cn(
                        "gap-1",
                        roadmap.is_published
                          ? "bg-emerald-500/12 text-emerald-400"
                          : "bg-white/8 text-muted-foreground"
                      )}
                    >
                      {roadmap.is_published ? (
                        <>
                          <Globe className="h-3 w-3" />
                          В библиотеке
                        </>
                      ) : (
                        "Черновик"
                      )}
                    </Badge>
                  </div>

                  <div className="flex shrink-0 items-center gap-1">
                    <Button
                      aria-label="Редактировать карту"
                      onClick={() => navigate(`/workshop/roadmaps/${roadmap.id}/edit`)}
                      size="sm"
                      type="button"
                      variant="ghost"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>

                    {confirmDeleteId === roadmap.id ? (
                      <div className="flex items-center gap-1">
                        <Button
                          aria-label="Подтвердить удаление"
                          disabled={deleteRoadmapMutation.isPending}
                          onClick={() => handleDelete(roadmap.id)}
                          size="sm"
                          type="button"
                          variant="ghost"
                          className="text-red-400 hover:text-red-300"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          aria-label="Отменить удаление"
                          onClick={() => setConfirmDeleteId(null)}
                          size="sm"
                          type="button"
                          variant="ghost"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <Button
                        aria-label="Удалить карту"
                        onClick={() => setConfirmDeleteId(roadmap.id)}
                        size="sm"
                        type="button"
                        variant="ghost"
                        className="text-muted-foreground hover:text-red-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>

                <div className="min-w-0 space-y-1.5">
                  <CardTitle className="line-clamp-2">{roadmap.title}</CardTitle>
                  <CardDescription className="line-clamp-3">{roadmap.short_description}</CardDescription>
                </div>
              </CardHeader>

              <CardContent className="mt-auto pt-0">
                <Button asChild className="w-full sm:w-auto" size="sm">
                  <Link to={`/workshop/roadmaps/${roadmap.id}/edit`}>Открыть редактор</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </section>
      ) : null}

      {deleteRoadmapMutation.isError ? (
        <StateMessage
          variant="error"
          title="Не удалось удалить карту"
          description={deleteRoadmapMutation.error.message}
        />
      ) : null}
    </PageShell>
  );
}
