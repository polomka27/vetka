import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import {
  adminRoadmapNodeFormSchema,
  type AdminRoadmapNodeFormSchema
} from "@/entities/admin-roadmap/model/schemas";
import type { AdminRoadmapNode } from "@/entities/admin-roadmap/model/types";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Textarea } from "@/shared/ui/textarea";

// Блок описывает пропсы формы узла роадмапа.
interface AdminNodeFormProps {
  nodes: AdminRoadmapNode[];
  initialValues?: Partial<AdminRoadmapNode>;
  submitLabel: string;
  isSubmitting?: boolean;
  hideParentField?: boolean;
  onCancel?: () => void;
  onSubmit: (values: AdminRoadmapNodeFormSchema) => void;
}

// Блок собирает всех потомков текущего узла, чтобы форма не предлагала запрещённый перенос в своё поддерево.
function collectDescendantIds(nodes: AdminRoadmapNode[], nodeId: number): Set<number> {
  const descendantIds = new Set<number>();
  const queue = [nodeId];

  while (queue.length > 0) {
    const currentNodeId = queue.shift();
    if (currentNodeId === undefined) {
      continue;
    }

    nodes
      .filter((node) => node.parent_id === currentNodeId)
      .forEach((node) => {
        descendantIds.add(node.id);
        queue.push(node.id);
      });
  }

  return descendantIds;
}

// Блок вычисляет место нового шага внутри выбранного раздела карты.
function getNextPosition(nodes: AdminRoadmapNode[], parentId: number | null, currentNodeId?: number) {
  const siblingPositions = nodes
    .filter((node) => node.parent_id === parentId && node.id !== currentNodeId)
    .map((node) => node.position);

  // Блок выбирает позицию после максимального соседа, чтобы добавление работало даже при "дырках" после удалений.
  return siblingPositions.length > 0 ? Math.max(...siblingPositions) + 1 : 0;
}

// Блок рендерит форму создания и редактирования узла.
export function AdminNodeForm({
  nodes,
  initialValues,
  submitLabel,
  isSubmitting = false,
  hideParentField = false,
  onCancel,
  onSubmit
}: AdminNodeFormProps) {
  const excludedParentIds = initialValues?.id
    ? collectDescendantIds(nodes, initialValues.id)
    : new Set<number>();
  const form = useForm<AdminRoadmapNodeFormSchema>({
    resolver: zodResolver(adminRoadmapNodeFormSchema),
    defaultValues: {
      parent_id: initialValues?.parent_id ?? null,
      title: initialValues?.title ?? "",
      description: initialValues?.description ?? "",
      content_type: initialValues?.content_type ?? "step",
      position: initialValues?.position ?? 0,
      is_optional: initialValues?.is_optional ?? false
    }
  });

  // Блок синхронизирует форму с текущим редактируемым узлом.
  useEffect(() => {
    form.reset({
      parent_id: initialValues?.parent_id ?? null,
      title: initialValues?.title ?? "",
      description: initialValues?.description ?? "",
      content_type: initialValues?.content_type ?? "step",
      position: initialValues?.position ?? 0,
      is_optional: initialValues?.is_optional ?? false
    });
  }, [form, initialValues]);

  const selectedParentId = form.watch("parent_id");
  const initialParentId = initialValues?.parent_id ?? null;
  const initialPosition = initialValues?.position;

  return (
    <form
      className="grid gap-4 rounded-2xl border border-border/70 bg-background/70 p-4"
      onSubmit={form.handleSubmit((values) => {
        const shouldKeepCurrentPosition =
          initialValues?.id !== undefined &&
          values.parent_id === initialParentId &&
          typeof initialPosition === "number";
        const nextPosition = shouldKeepCurrentPosition
          ? initialPosition
          : getNextPosition(nodes, values.parent_id, initialValues?.id);

        // Блок сохраняет текущую позицию шага при обычном редактировании, чтобы узел не прыгал в конец ветки.
        onSubmit({
          ...values,
          content_type: "step",
          position: nextPosition
        });
      })}
    >
      {!hideParentField ? (
        <div className="grid gap-2">
          <Label htmlFor="node-parent">Где разместить шаг</Label>
          <select
            id="node-parent"
            value={selectedParentId ?? ""}
            onChange={(event) => {
              const nextValue = event.target.value;
              const nextParentId = nextValue === "" ? null : Number(nextValue);
              form.setValue("parent_id", nextParentId);
              form.setValue("position", getNextPosition(nodes, nextParentId, initialValues?.id));
            }}
            className="flex h-11 w-full min-w-0 rounded-2xl border border-input bg-background px-4 py-2 text-base outline-none sm:text-sm"
          >
            <option value="">В начале карты</option>
            {nodes
              .filter((node) => node.id !== initialValues?.id && !excludedParentIds.has(node.id))
              .map((node) => (
                <option key={node.id} value={node.id}>
                  {"—".repeat(node.depth)} {node.title}
                </option>
              ))}
          </select>
        </div>
      ) : null}

      <div className="grid gap-2">
        <Label htmlFor="node-title">Название</Label>
        <Input id="node-title" {...form.register("title")} />
        {form.formState.errors.title ? (
          <p className="text-sm text-red-600">{form.formState.errors.title.message}</p>
        ) : null}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="node-description">Описание</Label>
        <Textarea id="node-description" {...form.register("description")} />
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <Button className="w-full sm:w-auto" disabled={isSubmitting} type="submit">
          {isSubmitting ? "Сохраняем..." : submitLabel}
        </Button>
        {onCancel ? (
          <Button className="w-full sm:w-auto" onClick={onCancel} type="button" variant="outline">
            Отмена
          </Button>
        ) : null}
      </div>
    </form>
  );
}
