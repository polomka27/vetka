import type { ReactNode } from "react";

import { cn } from "@/shared/lib/utils";

interface StateMessageProps {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  variant?: "default" | "success" | "error";
}

export function StateMessage({ title, description, action, className, variant = "default" }: StateMessageProps) {
  return (
    <div
      className={cn(
        "min-w-0 rounded-[1.6rem] border p-4 sm:rounded-3xl sm:p-6",
        variant === "success" && "border-emerald-500/25 bg-emerald-500/8 text-emerald-200",
        variant === "error" && "border-red-500/25 bg-red-500/8 text-red-200",
        variant === "default" && "border-border/70 bg-card shadow-soft",
        className
      )}
    >
      <div className={cn("space-y-2", !description && "space-y-0")}>
        <h3 className="break-words text-base font-semibold sm:text-lg">{title}</h3>
        {description ? (
          <p className={cn("break-words text-sm", variant === "default" ? "text-muted-foreground" : "opacity-80")}>
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
