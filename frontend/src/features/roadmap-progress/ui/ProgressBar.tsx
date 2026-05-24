import { cn } from "@/shared/lib/utils";

// Блок описывает пропсы простого прогресс-бара для роадмапа.
interface ProgressBarProps {
  value: number;
  className?: string;
}

// Блок рендерит визуальный индикатор процента завершения роадмапа.
export function ProgressBar({ value, className }: ProgressBarProps) {
  const normalizedValue = Math.max(0, Math.min(100, value));

  return (
    <div
      className={cn(
        "h-3 overflow-hidden rounded-full border border-white/10 bg-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]",
        className
      )}
    >
      <div
        className="h-full rounded-full bg-[linear-gradient(90deg,#a855f7_0%,#8b5cf6_45%,#ffffff_100%)] shadow-[0_0_22px_rgba(168,85,247,0.65)] transition-all duration-300"
        style={{ width: `${normalizedValue}%` }}
      />
    </div>
  );
}
