import * as React from "react";

import { cn } from "@/shared/lib/utils";

// Блок рендерит многострочное поле ввода для форм и описаний.
export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "min-h-[120px] w-full min-w-0 rounded-2xl border border-input/80 bg-accent/72 px-4 py-3 text-base shadow-[0_10px_24px_rgba(91,33,182,0.05),inset_0_1px_0_rgba(255,255,255,0.24)] outline-none backdrop-blur-xl transition-all placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/20 sm:text-sm",
        className
      )}
      ref={ref}
      {...props}
    />
  );
});

Textarea.displayName = "Textarea";
