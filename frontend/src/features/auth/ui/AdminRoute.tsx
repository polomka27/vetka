import { Navigate, Outlet, useLocation } from "react-router-dom";

import { useCurrentUserQuery } from "@/entities/auth/api/hooks";
import { getAccessToken } from "@/shared/api/token-storage";
import { StateMessage } from "@/shared/ui/state-message";

// Блок защищает административные маршруты и пропускает только пользователей с ролью admin.
export function AdminRoute() {
  const location = useLocation();
  const accessToken = getAccessToken();
  const currentUserQuery = useCurrentUserQuery();

  if (!accessToken) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (currentUserQuery.isLoading) {
    return (
      <StateMessage
        title="Проверяем права доступа"
        description="Загружаем профиль администратора."
      />
    );
  }

  if (currentUserQuery.isError || currentUserQuery.data?.user.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
