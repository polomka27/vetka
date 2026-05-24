import type { PropsWithChildren } from "react";
import { Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";

import { StateMessage } from "@/shared/ui/state-message";
import { ThemeProvider } from "@/shared/theme/ThemeProvider";

// Блок создаёт единый Query Client для всего приложения.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
      refetchOnWindowFocus: false
    }
  }
});

// Блок подключает Router и TanStack Query на уровне всего приложения.
export function AppProviders({ children }: PropsWithChildren) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <BrowserRouter>
          <Suspense
            fallback={
              <div className="mx-auto max-w-7xl px-4 pb-12 pt-8 sm:px-6 lg:px-8">
                <StateMessage
                  title="Загрузка страницы"
                  description="Подготавливаем интерфейс и маршруты приложения."
                />
              </div>
            }
          >
            {children}
          </Suspense>
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
