import { Pencil, Plus, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";

import type {
  AdminResourceFormValues,
  AdminRoadmapNode,
  AdminRoadmapNodeFormValues
} from "@/entities/admin-roadmap/model/types";
import { AdminNodeForm } from "@/features/admin-roadmaps/ui/AdminNodeForm";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { isSafeHttpUrl } from "@/shared/lib/url";
import { StateMessage } from "@/shared/ui/state-message";

interface WorkshopNodePanelProps {
  nodes: AdminRoadmapNode[];
  selectedNode?: AdminRoadmapNode | null;
  mode: "idle" | "create-root" | "create-child" | "edit";
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  createError?: string;
  updateError?: string;
  deleteError?: string;
  connectError?: string;
  resourceError?: string;
  resourceDeleteError?: string;
  isCreatingResource: boolean;
  isDeletingResource: boolean;
  onStartCreateRoot: () => void;
  onStartCreateChild: () => void;
  onStartEdit: () => void;
  onClose: () => void;
  onDelete: () => void;
  onCreateResource: (values: AdminResourceFormValues, options?: { onSuccess?: () => void }) => void;
  onDeleteResource: (resourceId: number) => void;
  onCancel: () => void;
  onCreate: (values: AdminRoadmapNodeFormValues) => void;
  onUpdate: (values: AdminRoadmapNodeFormValues) => void;
}

function getDefaultPosition(nodes: AdminRoadmapNode[], parentId: number | null) {
  const siblingPositions = nodes
    .filter((node) => node.parent_id === parentId)
    .map((node) => node.position);

  // Блок добавляет новый шаг после последнего соседа, а не по их количеству, чтобы не ловить conflict после удалений.
  return siblingPositions.length > 0 ? Math.max(...siblingPositions) + 1 : 0;
}

function getNextResourcePosition(selectedNode: AdminRoadmapNode | null | undefined) {
  const resourcePositions = (selectedNode?.resources ?? []).map((resource) => resource.position);

  // Блок подбирает следующую позицию ресурса после максимальной существующей.
  return resourcePositions.length > 0 ? Math.max(...resourcePositions) + 1 : 0;
}

export function WorkshopNodePanel({
  nodes,
  selectedNode,
  mode,
  isCreating,
  isUpdating,
  isDeleting,
  createError,
  updateError,
  deleteError,
  connectError,
  resourceError,
  resourceDeleteError,
  isCreatingResource,
  isDeletingResource,
  onStartCreateRoot,
  onStartCreateChild,
  onStartEdit,
  onClose,
  onDelete,
  onCreateResource,
  onDeleteResource,
  onCancel,
  onCreate,
  onUpdate
}: WorkshopNodePanelProps) {
  const [resourceForm, setResourceForm] = useState<AdminResourceFormValues>({
    title: "",
    url: "",
    resource_type: "material",
    position: 0
  });
  const [clientResourceError, setClientResourceError] = useState<string | undefined>();

  useEffect(() => {
    setResourceForm({
      title: "",
      url: "",
      resource_type: "material",
      position: getNextResourcePosition(selectedNode)
    });
    setClientResourceError(undefined);
  }, [selectedNode?.id, selectedNode?.resources?.length]);

  // Блок валидирует ресурс на клиенте, чтобы не сбрасывать введённые данные на предсказуемых 400-ошибках.
  const validateResourceForm = (values: AdminResourceFormValues): string | undefined => {
    if (!values.title.trim()) {
      return "Название ресурса обязательно.";
    }

    if (!values.url.trim()) {
      return "Ссылка обязательна.";
    }

    if (!isSafeHttpUrl(values.url.trim())) {
      return "Ссылка должна начинаться с http:// или https://.";
    }

    if (!Number.isInteger(values.position) || values.position < 0) {
      return "Не удалось определить место для нового материала.";
    }

    return undefined;
  };

  const createRootDefaults: Partial<AdminRoadmapNode> = {
    parent_id: null,
    position: getDefaultPosition(nodes, null),
    content_type: "step",
    is_optional: false
  };

  const createChildDefaults: Partial<AdminRoadmapNode> | undefined = selectedNode
    ? {
        parent_id: selectedNode.id,
        position: getDefaultPosition(nodes, selectedNode.id),
        content_type: "step",
        is_optional: false
      }
    : undefined;

  if (mode === "create-root") {
    return (
      <Card className="roadmap-side-panel w-full max-w-full min-w-0 overflow-hidden xl:sticky xl:top-28">
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-2">
              <CardTitle>Новый шаг</CardTitle>
              <CardDescription>Добавь первый шаг в карту. Он появится на схеме автоматически.</CardDescription>
            </div>
            <Button aria-label="Закрыть панель" onClick={onClose} size="sm" type="button" variant="ghost">
              <X className="h-5 w-5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <AdminNodeForm
            nodes={nodes}
            initialValues={createRootDefaults}
            submitLabel="Добавить шаг"
            isSubmitting={isCreating}
            onCancel={onCancel}
            onSubmit={onCreate}
          />
          {createError ? (
            <StateMessage
              title="Не удалось добавить шаг"
              description={createError}
              className="mt-4 rounded-2xl p-4 shadow-none"
            />
          ) : null}
        </CardContent>
      </Card>
    );
  }

  if (mode === "create-child" && selectedNode && createChildDefaults) {
    return (
      <Card className="roadmap-side-panel w-full max-w-full min-w-0 overflow-hidden xl:sticky xl:top-28">
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-2">
              <CardTitle>Новый шаг</CardTitle>
              <CardDescription>Шаг появится после «{selectedNode.title}».</CardDescription>
            </div>
            <Button aria-label="Закрыть панель" onClick={onClose} size="sm" type="button" variant="ghost">
              <X className="h-5 w-5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <AdminNodeForm
            nodes={nodes}
            initialValues={createChildDefaults}
            submitLabel="Добавить шаг"
            isSubmitting={isCreating}
            hideParentField
            onCancel={onCancel}
            onSubmit={onCreate}
          />
          {createError ? (
            <StateMessage
              title="Не удалось добавить шаг"
              description={createError}
              className="mt-4 rounded-2xl p-4 shadow-none"
            />
          ) : null}
        </CardContent>
      </Card>
    );
  }

  if (mode === "edit" && selectedNode) {
    return (
      <Card className="roadmap-side-panel w-full max-w-full min-w-0 overflow-hidden xl:sticky xl:top-28">
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-2">
              <CardTitle>Редактирование шага</CardTitle>
              <CardDescription>Выбери шаг и редактируй его справа.</CardDescription>
            </div>
            <Button aria-label="Закрыть панель" onClick={onClose} size="sm" type="button" variant="ghost">
              <X className="h-5 w-5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <AdminNodeForm
            nodes={nodes}
            initialValues={selectedNode}
            submitLabel="Сохранить шаг"
            isSubmitting={isUpdating}
            onCancel={onCancel}
            onSubmit={onUpdate}
          />
          {updateError ? (
            <StateMessage
              title="Не удалось сохранить шаг"
              description={updateError}
              className="mt-4 rounded-2xl p-4 shadow-none"
            />
          ) : null}
        </CardContent>
      </Card>
    );
  }

  if (!selectedNode) {
    if (nodes.length === 0) {
      return (
        <Card className="roadmap-side-panel w-full max-w-full min-w-0 overflow-hidden xl:sticky xl:top-28">
          <CardHeader>
            <CardTitle>Начни карту</CardTitle>
            <CardDescription>Первый шаг создаётся справа, а потом уже можно добавлять дочерние шаги из редактирования.</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <Button className="w-full" onClick={onStartCreateRoot} type="button">
              <Plus className="mr-2 h-4 w-4" />
              Добавить первый шаг
            </Button>
          </CardContent>
        </Card>
      );
    }

    return null;
  }

  return (
    <Card className="roadmap-side-panel w-full max-w-full min-w-0 overflow-hidden xl:sticky xl:top-28">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-3">
            <div className="flex flex-wrap gap-2">
              <Badge>{selectedNode.parent_id ? "Продолжение раздела" : "Основной шаг"}</Badge>
            </div>
            <div className="space-y-2">
              <CardTitle>{selectedNode.title}</CardTitle>
              <CardDescription>
                {selectedNode.description?.trim() || "Добавь описание, чтобы пользователю было понятнее, зачем нужен этот шаг."}
              </CardDescription>
            </div>
          </div>
          <Button aria-label="Закрыть панель" onClick={onClose} size="sm" type="button" variant="ghost">
            <X className="h-5 w-5" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="grid gap-3 pt-0">
        {/* Блок даёт быстрый и понятный способ добавить дочерний шаг прямо из правой панели. */}
        <Button className="w-full sm:w-auto" onClick={onStartCreateChild} type="button">
          <Plus className="mr-2 h-4 w-4" />
          Добавить дочерний шаг
        </Button>
        <Button className="w-full sm:w-auto" onClick={onStartEdit} type="button">
          <Pencil className="mr-2 h-4 w-4" />
          Изменить шаг
        </Button>
        <Button className="w-full sm:w-auto" onClick={onDelete} disabled={isDeleting} type="button" variant="outline">
          <Trash2 className="mr-2 h-4 w-4" />
          Удалить шаг
        </Button>

        <div className="grid gap-3 rounded-2xl border border-border/60 bg-white/[0.03] p-4">
          <div className="text-sm font-medium">Источники</div>

          <div className="grid gap-2">
            {(selectedNode.resources ?? []).map((resource) => (
              <div
                key={resource.id}
                className="flex flex-col items-start gap-3 rounded-2xl border border-border/60 bg-background/60 px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="truncate font-medium text-foreground">{resource.title}</div>
                  <div className="break-all text-xs text-muted-foreground">{resource.url}</div>
                </div>
                <Button
                  aria-label="Удалить ресурс"
                  disabled={isDeletingResource}
                  onClick={() => onDeleteResource(resource.id)}
                  size="sm"
                  type="button"
                  variant="ghost"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          <div className="grid gap-3 rounded-2xl border border-border/60 bg-background/50 p-3">
            <div className="grid gap-2">
              <Label htmlFor="resource-title">Название источника</Label>
              <Input
                id="resource-title"
                value={resourceForm.title}
                onChange={(event) =>
                  setResourceForm((currentValue) => {
                    setClientResourceError(undefined);
                    return {
                      ...currentValue,
                      title: event.target.value
                    };
                  })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="resource-url">Ссылка</Label>
              <Input
                id="resource-url"
                value={resourceForm.url}
                onChange={(event) =>
                  setResourceForm((currentValue) => {
                    setClientResourceError(undefined);
                    return {
                      ...currentValue,
                      url: event.target.value
                    };
                  })
                }
              />
            </div>
            <Button
              className="w-full"
              disabled={isCreatingResource}
              type="button"
              onClick={() => {
                const validationError = validateResourceForm(resourceForm);
                if (validationError) {
                  setClientResourceError(validationError);
                  return;
                }

                setClientResourceError(undefined);
                onCreateResource(resourceForm, {
                  onSuccess: () => {
                    // Блок очищает форму только после успешного ответа сервера, чтобы не терять введённые данные на ошибке.
                    setResourceForm({
                      title: "",
                      url: "",
                      resource_type: "material",
                      position: getNextResourcePosition(selectedNode)
                    });
                  }
                });
              }}
            >
              Добавить источник
            </Button>
          </div>
        </div>

        {deleteError ? (
          <StateMessage
            title="Не удалось удалить шаг"
            description={deleteError}
            className="rounded-2xl p-4 shadow-none"
          />
        ) : null}

        {connectError ? (
          <StateMessage
            title="Не удалось связать шаги"
            description={connectError}
            className="rounded-2xl p-4 shadow-none"
          />
        ) : null}

        {resourceError ? (
          <StateMessage
            title="Не удалось добавить ресурс"
            description={resourceError}
            className="rounded-2xl p-4 shadow-none"
          />
        ) : null}

        {clientResourceError ? (
          <StateMessage
            title="Проверь форму ресурса"
            description={clientResourceError}
            className="rounded-2xl p-4 shadow-none"
          />
        ) : null}

        {resourceDeleteError ? (
          <StateMessage
            title="Не удалось удалить ресурс"
            description={resourceDeleteError}
            className="rounded-2xl p-4 shadow-none"
          />
        ) : null}
      </CardContent>
    </Card>
  );
}
