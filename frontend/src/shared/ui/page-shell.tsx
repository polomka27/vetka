import type { ReactNode } from "react";

import { Badge } from "@/shared/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";

// Блок описывает пропсы для универсального шаблона страницы.
interface PageShellProps {
  badge?: string;
  title: string;
  description?: string;
  children?: ReactNode;
}

// Блок рендерит единый визуальный шаблон для основных страниц интерфейса.
export function PageShell({ badge, title, description, children }: PageShellProps) {
  return (
    <section className="page-shell-entrance grid min-w-0 gap-4 sm:gap-6">
      <Card className="min-w-0 overflow-hidden md:border md:border-white/10">
        <CardHeader className="gap-4 border-b border-border/60 bg-white/[0.03] p-4 sm:p-6 lg:p-8">
          {badge ? <Badge>{badge}</Badge> : null}
          <div className="space-y-3">
            <CardTitle className="text-2xl leading-tight sm:text-3xl lg:text-4xl">{title}</CardTitle>
            {description ? (
              <CardDescription className="max-w-2xl text-sm leading-6 sm:text-base">{description}</CardDescription>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="grid min-w-0 gap-4 p-4 sm:gap-5 sm:p-6 lg:gap-6 lg:p-8">{children}</CardContent>
      </Card>
    </section>
  );
}
