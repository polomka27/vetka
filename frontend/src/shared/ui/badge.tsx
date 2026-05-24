import type { HTMLAttributes } from "react";

import { cn } from "@/shared/lib/utils";

// Блок рендерит компактный бейдж для статусов и метаданных.
export function Badge({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "inline-flex max-w-full flex-wrap items-center rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground break-words",
        className
      )}
      {...props}
    />
  );
}
