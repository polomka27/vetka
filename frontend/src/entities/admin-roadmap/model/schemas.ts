import { z } from "zod";

// Блок описывает схему валидации формы роадмапа для React Hook Form.
export const adminRoadmapFormSchema = z.object({
  title: z.string().trim().min(1, "Название обязательно").max(255, "Максимум 255 символов"),
  short_description: z.string().trim().min(1, "Краткое описание обязательно").max(500, "Максимум 500 символов"),
  full_description: z.string().trim().default(""),
  category: z.string().trim().min(1, "Категория обязательна").max(100, "Максимум 100 символов"),
  level: z.string().trim().min(1, "Уровень обязателен").max(50, "Максимум 50 символов"),
  is_published: z.boolean().default(false)
});

// Блок описывает схему валидации формы узла роадмапа.
export const adminRoadmapNodeFormSchema = z.object({
  parent_id: z.number().int().nullable(),
  title: z.string().trim().min(1, "Название шага обязательно").max(255, "Максимум 255 символов"),
  description: z.string().trim().default(""),
  content_type: z.string().trim().min(1).max(50, "Максимум 50 символов"),
  position: z.coerce.number().int().min(0, "Позиция должна быть >= 0"),
  is_optional: z.boolean().default(false)
});

export type AdminRoadmapFormSchema = z.infer<typeof adminRoadmapFormSchema>;
export type AdminRoadmapNodeFormSchema = z.infer<typeof adminRoadmapNodeFormSchema>;
