import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

import { useOutsidePointerDown } from "@/shared/lib/use-outside-pointerdown";
import { cn } from "@/shared/lib/utils";

interface FilterSelectProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
}

// Блок рендерит кастомный dropdown для выбора значения из фиксированного списка.
export function FilterSelect({ id, value, onChange, options, placeholder }: FilterSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const selectedOption = options.find((option) => option.value === value);
  const displayLabel = selectedOption?.label ?? placeholder ?? options[0]?.label ?? "";

  useOutsidePointerDown(containerRef, () => setIsOpen(false), isOpen);

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
        onClick={() => setIsOpen((v) => !v)}
        className="flex h-11 w-full items-center justify-between gap-3 rounded-full border border-input/80 bg-accent/80 px-4 pr-12 text-left text-sm shadow-[0_14px_32px_rgba(91,33,182,0.08),inset_0_1px_0_rgba(255,255,255,0.22)] outline-none backdrop-blur-xl transition-all focus:border-ring focus:ring-2 focus:ring-ring/20"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span className={cn("truncate", !selectedOption && "text-muted-foreground")}>{displayLabel}</span>
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
                key={option.value || "__placeholder__"}
                type="button"
                className={cn(
                  "flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-sm transition-colors",
                  option.value === "" ? "text-muted-foreground" : "",
                  isSelected ? "bg-primary/12 text-foreground" : "hover:bg-white/10"
                )}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
              >
                <span>{option.label}</span>
                {isSelected && option.value !== "" ? <Check className="h-4 w-4 text-primary" /> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
