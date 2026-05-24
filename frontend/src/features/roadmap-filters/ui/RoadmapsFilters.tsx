import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Search } from "lucide-react";

import type { RoadmapFilters } from "@/entities/roadmap/model/types";
import { useOutsidePointerDown } from "@/shared/lib/use-outside-pointerdown";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { cn } from "@/shared/lib/utils";

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

// Блок рендерит кастомный dropdown с более аккуратным выпадающим списком.
function FilterSelect({
  value,
  onChange,
  options,
  id
}: {
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  id: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const selectedOption = options.find((option) => option.value === value) ?? options[0];

  // Блок закрывает dropdown по клику или тапу на любую внешнюю часть страницы.
  useOutsidePointerDown(containerRef, () => setIsOpen(false), isOpen);

  // Блок закрывает dropdown по нажатию Escape.
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setIsOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen]);

  return (
    <div className="relative w-full" ref={containerRef}>
      <button
        id={id}
        type="button"
        onClick={() => setIsOpen((currentValue) => !currentValue)}
        className={cn(
          "flex h-11 w-full items-center justify-between gap-3 rounded-full border border-input/80 bg-accent/80 px-4 pr-12 text-left text-sm shadow-[0_14px_32px_rgba(91,33,182,0.08),inset_0_1px_0_rgba(255,255,255,0.22)] outline-none backdrop-blur-xl transition-all focus:border-ring focus:ring-2 focus:ring-ring/20"
        )}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span className="truncate">{selectedOption.label}</span>
        <ChevronDown
          className={cn(
            "pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-transform",
            isOpen ? "rotate-180" : ""
          )}
        />
      </button>

      {isOpen ? (
        <div
          className="glass-surface absolute left-0 right-0 top-[calc(100%+0.5rem)] z-20 max-h-[min(18rem,calc(100svh-12rem))] overflow-y-auto rounded-[1.6rem] p-2"
          role="listbox"
        >
          {options.map((option) => {
            const isSelected = option.value === value;

            return (
              <button
                key={option.value || "all"}
                type="button"
                className={cn(
                  "flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-sm transition-colors",
                  isSelected ? "bg-primary/12 text-foreground" : "hover:bg-white/10"
                )}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
              >
                <span>{option.label}</span>
                {isSelected ? <Check className="h-4 w-4 text-primary" /> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

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
