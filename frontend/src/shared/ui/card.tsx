import type { HTMLAttributes } from "react";

import { cn } from "@/shared/lib/utils";

// Блок рендерит универсальную карточку-контейнер.
export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "glass-surface min-w-0 rounded-[1.75rem] text-card-foreground sm:rounded-3xl",
        className
      )}
      {...props}
    />
  );
}

// Блок рендерит шапку карточки.
export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("min-w-0 space-y-2 p-4 sm:p-6", className)} {...props} />;
}

// Блок рендерит заголовок карточки.
export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={cn("min-w-0 text-lg font-semibold tracking-tight sm:text-xl", className)} {...props} />;
}

// Блок рендерит вспомогательный текст карточки.
export function CardDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("min-w-0 text-sm text-muted-foreground", className)} {...props} />;
}

// Блок рендерит основное тело карточки.
export function CardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("min-w-0 p-4 pt-0 sm:p-6 sm:pt-0", className)} {...props} />;
}
