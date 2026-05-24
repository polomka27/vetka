import type { ButtonHTMLAttributes } from "react";
import { CheckCircle2, CircleDashed, Clock3 } from "lucide-react";

import type { NodeProgressStatus } from "@/entities/progress/model/types";
import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/lib/utils";

// Блок описывает пропсы кнопки смены статуса узла.
interface NodeStatusButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  targetStatus: NodeProgressStatus;
  currentStatus: NodeProgressStatus;
}

// Блок рендерит кнопку установки одного конкретного статуса узла.
export function NodeStatusButton({
  label,
  targetStatus,
  currentStatus,
  ...props
}: NodeStatusButtonProps) {
  const isActive = currentStatus === targetStatus;
  const Icon =
    targetStatus === "done" ? CheckCircle2 : targetStatus === "in_progress" ? Clock3 : CircleDashed;

  return (
    <Button
      size="sm"
      variant="outline"
      type="button"
      aria-pressed={isActive}
      className={cn(
        // Блок выравнивает размеры кнопок статусов в правой панели независимо от длины текста.
        "h-full min-h-11 w-full justify-center gap-2 rounded-full border-white/12 bg-white/5 px-3 text-center text-xs leading-tight text-muted-foreground backdrop-blur-xl",
        isActive
          ? "border-transparent bg-[linear-gradient(135deg,rgba(168,85,247,0.95),rgba(79,70,229,0.92))] text-white shadow-[0_14px_32px_rgba(109,40,217,0.34)]"
          : "hover:border-white/20 hover:bg-white/10 hover:text-foreground"
      )}
      {...props}
    >
      {/* Блок задаёт одинаковый размер иконки во всех трёх статусных кнопках. */}
      <Icon className="h-4 w-4 shrink-0" />
      {label}
    </Button>
  );
}
