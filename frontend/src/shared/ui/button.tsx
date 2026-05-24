import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/shared/lib/utils";

// Блок задаёт варианты стилизации кнопки в стиле shadcn/ui.
const buttonVariants = cva(
  "inline-flex min-w-0 items-center justify-center rounded-full text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "border border-white/15 bg-primary/90 text-primary-foreground shadow-[0_18px_38px_rgba(91,33,182,0.35),inset_0_1px_0_rgba(255,255,255,0.22)] backdrop-blur-xl hover:-translate-y-0.5 hover:bg-primary",
        secondary: "border border-white/18 bg-secondary/80 text-secondary-foreground shadow-[0_12px_28px_rgba(91,33,182,0.1),inset_0_1px_0_rgba(255,255,255,0.22)] backdrop-blur-xl hover:bg-secondary",
        outline: "border border-border/80 bg-background/55 shadow-[0_14px_30px_rgba(91,33,182,0.08),inset_0_1px_0_rgba(255,255,255,0.18)] backdrop-blur-xl hover:bg-secondary/75",
        ghost: "hover:bg-white/10 hover:text-foreground"
      },
      size: {
        default: "h-10 px-4 py-2 sm:h-10",
        sm: "h-9 px-3",
        lg: "h-11 px-5 sm:px-6"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);

// Блок описывает типы пропсов для переиспользуемой кнопки.
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

// Блок рендерит кнопку или обёртку через Slot для ссылок и других элементов.
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";

    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  }
);

Button.displayName = "Button";

export { buttonVariants };
