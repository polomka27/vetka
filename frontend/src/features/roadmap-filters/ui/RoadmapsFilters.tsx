import { Search } from "lucide-react";

import type { RoadmapFilters } from "@/entities/roadmap/model/types";
import { Button } from "@/shared/ui/button";
import { FilterSelect } from "@/shared/ui/filter-select";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";

// Блок описывает пропсы панели фильтров каталога.
interface RoadmapsFiltersProps {
  filters: RoadmapFilters;
  onChange: (filters: RoadmapFilters) => void;
  onReset: () => void;
  isBusy?: boolean;
}

// Блок хранит статические варианты категорий для MVP-каталога.
const categoryOptions = [
  { value: "", label: "Все категории" },
  { value: "development", label: "Разработка и технологии" },
  { value: "data", label: "Данные и аналитика" },
  { value: "design", label: "Дизайн и продукт" },
  { value: "business", label: "Бизнес и маркетинг" },
  { value: "languages", label: "Языки и коммуникация" },
  { value: "science", label: "Наука и исследование" },
  { value: "management", label: "Управление и карьера" }
];

// Блок хранит статические варианты уровней сложности.
const levelOptions = [
  { value: "", label: "Все уровни" },
  { value: "junior", label: "Junior" },
  { value: "middle", label: "Middle" },
  { value: "senior", label: "Senior" }
];

// Блок рендерит панель поиска и фильтров для страницы каталога.
export function RoadmapsFilters({
  filters,
  onChange,
  onReset,
  isBusy = false
}: RoadmapsFiltersProps) {
  const hasActiveFilters = Boolean(filters.search?.trim() || filters.category || filters.level);

  return (
    <section className="glass-surface relative z-30 grid gap-4 rounded-[1.75rem] p-3.5 sm:gap-5 sm:rounded-3xl sm:p-5">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(0,1.4fr)_220px_220px_auto] xl:items-end xl:gap-5">
        <div className="relative min-w-0 grid gap-2 sm:col-span-2 xl:col-span-1">
          <Label className="sr-only" htmlFor="roadmaps-search">Поиск</Label>
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="roadmaps-search"
            className="pl-11"
            placeholder="Поиск по названию, описанию, автору или теме"
            value={filters.search ?? ""}
            onChange={(event) =>
              onChange({
                ...filters,
                search: event.target.value
              })
            }
          />
        </div>

        <div className="grid gap-2">
          <Label className="sr-only" htmlFor="roadmaps-category">Категория</Label>
          <FilterSelect
            id="roadmaps-category"
            value={filters.category ?? ""}
            options={categoryOptions}
            onChange={(value) =>
              onChange({
                ...filters,
                category: value || undefined
              })
            }
          />
        </div>

        <div className="grid gap-2">
          <Label className="sr-only" htmlFor="roadmaps-level">Уровень</Label>
          <FilterSelect
            id="roadmaps-level"
            value={filters.level ?? ""}
            options={levelOptions}
            onChange={(value) =>
              onChange({
                ...filters,
                level: value || undefined
              })
            }
          />
        </div>

        <div className="flex items-end sm:col-span-2 xl:col-span-1">
          <Button className="w-full sm:w-auto" variant="outline" onClick={onReset} disabled={isBusy || !hasActiveFilters}>
            Сбросить
          </Button>
        </div>
      </div>
    </section>
  );
}
