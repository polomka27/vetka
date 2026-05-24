import { Globe2 } from "lucide-react";
import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import {
  adminRoadmapFormSchema,
  type AdminRoadmapFormSchema
} from "@/entities/admin-roadmap/model/schemas";
import type { AdminRoadmapDetails } from "@/entities/admin-roadmap/model/types";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { StateMessage } from "@/shared/ui/state-message";
import { Textarea } from "@/shared/ui/textarea";

// Блок описывает пропсы формы роадмапа для create/edit сценариев.
interface AdminRoadmapFormProps {
  initialValues?: Partial<AdminRoadmapDetails>;
  submitLabel: string;
  isSubmitting?: boolean;
  errorMessage?: string;
  successMessage?: string;
  onSubmit: (values: AdminRoadmapFormSchema) => void;
}

// Блок рендерит форму создания и редактирования карты.
export function AdminRoadmapForm({
  initialValues,
  submitLabel,
  isSubmitting = false,
  errorMessage,
  successMessage,
  onSubmit
}: AdminRoadmapFormProps) {
  const form = useForm<AdminRoadmapFormSchema>({
    resolver: zodResolver(adminRoadmapFormSchema),
    defaultValues: {
      title: initialValues?.title ?? "",
      short_description: initialValues?.short_description ?? "",
      full_description: initialValues?.full_description ?? "",
      category: initialValues?.category ?? "",
      level: initialValues?.level ?? "",
      is_published: initialValues?.is_published ?? false
    }
  });

  // Блок синхронизирует форму с загруженными данными при открытии edit-страницы.
  useEffect(() => {
    form.reset({
      title: initialValues?.title ?? "",
      short_description: initialValues?.short_description ?? "",
      full_description: initialValues?.full_description ?? "",
      category: initialValues?.category ?? "",
      level: initialValues?.level ?? "",
      is_published: initialValues?.is_published ?? false
    });
  }, [form, initialValues]);

  return (
    <form className="grid gap-4" onSubmit={form.handleSubmit(onSubmit)}>
      <div className="grid gap-2">
        <Label htmlFor="roadmap-title">Название</Label>
        <Input id="roadmap-title" {...form.register("title")} />
        {form.formState.errors.title ? (
          <p className="text-sm text-red-600">{form.formState.errors.title.message}</p>
        ) : null}
        <p className="text-sm text-muted-foreground">
          Адрес карты создаётся автоматически по названию.
        </p>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="roadmap-short-description">Краткое описание</Label>
        <Textarea id="roadmap-short-description" {...form.register("short_description")} />
        {form.formState.errors.short_description ? (
          <p className="text-sm text-red-600">{form.formState.errors.short_description.message}</p>
        ) : null}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="roadmap-full-description">Полное описание</Label>
        <Textarea id="roadmap-full-description" {...form.register("full_description")} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="roadmap-category">Категория</Label>
          <Input id="roadmap-category" {...form.register("category")} />
          {form.formState.errors.category ? (
            <p className="text-sm text-red-600">{form.formState.errors.category.message}</p>
          ) : null}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="roadmap-level">Уровень</Label>
          <Input id="roadmap-level" {...form.register("level")} />
          {form.formState.errors.level ? (
            <p className="text-sm text-red-600">{form.formState.errors.level.message}</p>
          ) : null}
        </div>
      </div>

      <label className="glass-surface flex min-w-0 flex-wrap items-start gap-3 rounded-2xl px-4 py-3 sm:flex-nowrap sm:items-center">
        <input type="checkbox" {...form.register("is_published")} className="h-4 w-4 accent-white" />
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/12 text-white">
          <Globe2 className="h-4 w-4" />
        </div>
        <span className="min-w-0 text-sm font-medium">Опубликовать в библиотеке</span>
      </label>

      {errorMessage ? (
        <StateMessage
          title="Не удалось сохранить карту"
          description={errorMessage}
          className="rounded-2xl p-4 shadow-none"
        />
      ) : null}

      {successMessage ? (
        <StateMessage
          title="Изменения сохранены"
          description={successMessage}
          className="rounded-2xl p-4 shadow-none"
        />
      ) : null}

      <Button className="w-full sm:w-fit" disabled={isSubmitting} type="submit">
        {isSubmitting ? "Сохраняем..." : submitLabel}
      </Button>
    </form>
  );
}
