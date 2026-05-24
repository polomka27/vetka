import { Navigate, Outlet, useLocation } from "react-router-dom";

import { useCurrentUserQuery } from "@/entities/auth/api/hooks";
import { getAccessToken } from "@/shared/api/token-storage";
import { StateMessage } from "@/shared/ui/state-message";

// Блок защищает дочерние маршруты и пускает на них только авторизованных пользователей.
export function ProtectedRoute() {
  const location = useLocation();
  const accessToken = getAccessToken();
  const currentUserQuery = useCurrentUserQuery();

  if (!accessToken) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (currentUserQuery.isLoading) {
    return (
      <StateMessage
        title="Проверяем доступ"
        description="Загружаем текущую пользовательскую сессию."
      />
    );
  }

  if (currentUserQuery.isError || !currentUserQuery.data?.user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}
