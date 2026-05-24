import type { LabelHTMLAttributes } from "react";

import { cn } from "@/shared/lib/utils";

// Блок рендерит подпись поля формы.
export function Label({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("text-sm font-medium text-foreground", className)} {...props} />;
}
