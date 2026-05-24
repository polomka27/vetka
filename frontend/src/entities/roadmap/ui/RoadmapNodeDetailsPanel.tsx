import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BookMarked, Lock, Sparkles, X } from "lucide-react";

import type { NodeProgressStatus } from "@/entities/progress/model/types";
import type { RoadmapNode } from "@/entities/roadmap/model/types";
import { ResourceList } from "@/entities/roadmap/ui/ResourceList";
import { NodeStatusButton } from "@/features/roadmap-progress/ui/NodeStatusButton";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { Textarea } from "@/shared/ui/textarea";
import { cn } from "@/shared/lib/utils";

// Блок описывает пропсы боковой панели выбранной ноды.
interface RoadmapNodeDetailsPanelProps {
  node: RoadmapNode | null;
  roadmapSlug: string;
  isAuthenticated: boolean;
  isUpdating: boolean;
  isSavingNote?: boolean;
  isCurrentNode: boolean;
  note: string;
  onClose: () => void;
  onGuestAction: () => void;
  onNoteSave: (value: string) => void;
  onStatusChange: (payload: { roadmapSlug: string; nodeId: number; status: NodeProgressStatus }) => void;
}

// Блок возвращает визуальные параметры текущего статуса ноды.
function getStatusMeta(status: NodeProgressStatus) {
  if (status === "done") {
    return {
      label: "Пройдено",
      className: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20",
    };
  }

  if (status === "in_progress") {
    return {
      label: "В процессе",
      className: "bg-violet-500/15 text-violet-300 border border-violet-500/20",
    };
  }

  return {
    label: "Не начато",
    className: "bg-white/8 text-muted-foreground border border-white/10",
  };
}

// Блок рендерит правую панель деталей и действий по выбранной ноде.
export function RoadmapNodeDetailsPanel({
  node,
  roadmapSlug,
  isAuthenticated,
  isUpdating,
  isSavingNote = false,
  isCurrentNode,
  note,
  onClose,
  onGuestAction,
  onNoteSave,
  onStatusChange,
}: RoadmapNodeDetailsPanelProps) {
  const [noteDraft, setNoteDraft] = useState(note);
  const [noteSavedAt, setNoteSavedAt] = useState<number | null>(null);

  // Блок синхронизирует textarea с выбранной нодой и актуальной заметкой из backend.
  useEffect(() => {
    setNoteDraft(note);
  }, [note, node?.id]);

  // Блок сбрасывает флаг «Сохранено» при смене ноды.
  useEffect(() => {
    setNoteSavedAt(null);
  }, [node?.id]);

  // Блок скрывает подтверждение сохранения через 3 секунды.
  useEffect(() => {
    if (!noteSavedAt) return;
    const timerId = window.setTimeout(() => setNoteSavedAt(null), 3000);
    return () => window.clearTimeout(timerId);
  }, [noteSavedAt]);

  if (!node) {
    return null;
  }

  const status = node.progress_status ?? "not_started";
  const statusMeta = getStatusMeta(status);

  // Блок обрабатывает смену статуса с проверкой авторизации пользователя.
  const handleStatusChange = (nextStatus: NodeProgressStatus) => {
    if (!isAuthenticated) {
      onGuestAction();
      return;
    }

    onStatusChange({
      roadmapSlug,
      nodeId: node.id,
      status: nextStatus,
    });
  };

  return (
    <Card className="roadmap-side-panel min-w-0 overflow-hidden border-white/10 bg-[linear-gradient(180deg,rgba(102,51,153,0.18),rgba(17,24,39,0.18))] xl:sticky xl:top-32">
      <CardHeader className="border-b border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <Badge className={cn("border-none", statusMeta.className)}>{statusMeta.label}</Badge>
            {isCurrentNode ? (
              <Badge className="gap-1">
                <Sparkles className="h-3.5 w-3.5" />
                Текущий этап
              </Badge>
            ) : null}
            {node.is_optional ? (
              <Badge className="border border-white/10 bg-white/5 text-muted-foreground">
                Необязательный
              </Badge>
            ) : null}
          </div>

          <Button
            aria-label="Закрыть панель шага"
            className="shrink-0"
            onClick={onClose}
            size="sm"
            type="button"
            variant="ghost"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <CardTitle className="text-xl leading-tight sm:text-2xl">{node.title}</CardTitle>
        <CardDescription className="text-sm leading-6">
          {node.description ?? "Описание для этой ноды пока не заполнено."}
        </CardDescription>
      </CardHeader>

      <CardContent className="grid gap-4 pt-0">
        <div className="mt-2 grid gap-2">
          <div className="text-sm font-medium">Статус этапа</div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <NodeStatusButton
              label="Не начато"
              targetStatus="not_started"
              currentStatus={status}
              disabled={isUpdating}
              onClick={() => handleStatusChange("not_started")}
            />
            <NodeStatusButton
              label="В процессе"
              targetStatus="in_progress"
              currentStatus={status}
              disabled={isUpdating}
              onClick={() => handleStatusChange("in_progress")}
            />
            <NodeStatusButton
              label="Пройдено"
              targetStatus="done"
              currentStatus={status}
              disabled={isUpdating}
              onClick={() => handleStatusChange("done")}
            />
          </div>
        </div>

        {!isAuthenticated ? (
          <Button asChild className="w-full" variant="outline">
            <Link to="/login">
              <Lock className="mr-2 h-4 w-4" />
              Войти для сохранения прогресса
            </Link>
          </Button>
        ) : null}

        <ResourceList resources={node.resources ?? []} />

        <div className="grid gap-2 rounded-2xl border border-border/70 bg-background/70 p-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <BookMarked className="h-4 w-4" />
            Заметки
          </div>
          <Textarea
            className="min-h-[132px] border-border/60 bg-card"
            disabled={!isAuthenticated || isSavingNote}
            placeholder={
              isAuthenticated
                ? "Запиши важную мысль, вывод или личный план по этому шагу"
                : "Заметки станут доступны после входа в аккаунт"
            }
            value={noteDraft}
            onChange={(event) => setNoteDraft(event.target.value)}
            onBlur={() => {
              if (noteDraft !== note) {
                onNoteSave(noteDraft);
                setNoteSavedAt(Date.now());
              }
            }}
          />
          {isSavingNote ? (
            <div className="text-xs text-muted-foreground">Сохраняем заметку...</div>
          ) : noteSavedAt ? (
            <div className="text-xs text-emerald-400">Сохранено</div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
