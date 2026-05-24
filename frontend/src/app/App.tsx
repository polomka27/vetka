import { AppRouter } from "@/app/router/AppRouter";
import { AppProviders } from "@/app/providers/AppProviders";

// Блок объединяет все глобальные провайдеры и маршрутизацию приложения.
export function App() {
  return (
    <AppProviders>
      <AppRouter />
    </AppProviders>
  );
}
