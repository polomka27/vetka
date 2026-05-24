import { lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import { ProtectedRoute } from "@/features/auth/ui/ProtectedRoute";
import { MainLayout } from "@/widgets/layout/MainLayout";
import { MapLayout } from "@/widgets/layout/MapLayout";

const HomePage = lazy(() => import("@/pages/HomePage").then((module) => ({ default: module.HomePage })));
const ReactFlowDemoPage = lazy(() =>
  import("@/pages/ReactFlowDemoPage").then((module) => ({ default: module.ReactFlowDemoPage }))
);
const RoadmapsPage = lazy(() =>
  import("@/pages/RoadmapsPage").then((module) => ({ default: module.RoadmapsPage }))
);
const LegacyRoadmapRedirectPage = lazy(() =>
  import("@/pages/LegacyRoadmapRedirectPage").then((module) => ({ default: module.LegacyRoadmapRedirectPage }))
);
const RoadmapDetailsPage = lazy(() =>
  import("@/pages/RoadmapDetailsPage").then((module) => ({ default: module.RoadmapDetailsPage }))
);
const LoginPage = lazy(() => import("@/pages/LoginPage").then((module) => ({ default: module.LoginPage })));
const RegisterPage = lazy(() =>
  import("@/pages/RegisterPage").then((module) => ({ default: module.RegisterPage }))
);
const ProfilePage = lazy(() =>
  import("@/pages/ProfilePage").then((module) => ({ default: module.ProfilePage }))
);
const CollectionPage = lazy(() =>
  import("@/pages/CollectionPage").then((module) => ({ default: module.CollectionPage }))
);
const CurrentMapPage = lazy(() =>
  import("@/pages/CurrentMapPage").then((module) => ({ default: module.CurrentMapPage }))
);
const AdminRoadmapsPage = lazy(() =>
  import("@/pages/AdminRoadmapsPage").then((module) => ({ default: module.AdminRoadmapsPage }))
);
const AdminRoadmapNewPage = lazy(() =>
  import("@/pages/AdminRoadmapNewPage").then((module) => ({ default: module.AdminRoadmapNewPage }))
);
const AdminRoadmapEditPage = lazy(() =>
  import("@/pages/AdminRoadmapEditPage").then((module) => ({ default: module.AdminRoadmapEditPage }))
);
const AboutPage = lazy(() =>
  import("@/pages/AboutPage").then((module) => ({ default: module.AboutPage }))
);

// Блок описывает все основные маршруты MVP-приложения.
export function AppRouter() {
  return (
    <Routes>
      <Route element={<MapLayout />}>
        {/* Блок оставляет детальную карту публичной, чтобы гость мог изучать структуру без входа. */}
        <Route path="/map/:slug" element={<RoadmapDetailsPage />} />
      </Route>
      <Route element={<MainLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/roadmaps" element={<RoadmapsPage />} />
        {/* Блок оставляет страницу просмотра карты публичной, потому что она поддерживает гостевой режим. */}
        <Route path="/roadmaps/:slug" element={<LegacyRoadmapRedirectPage />} />
        {/* Блок оставляет локальную коллекцию публичной, потому что она живёт в localStorage и не требует backend-авторизации. */}
        <Route path="/collection" element={<CollectionPage />} />
        {/* Блок делает redirect на текущую карту публичным, потому что он опирается только на localStorage и публичную страницу карты. */}
        <Route path="/map" element={<CurrentMapPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/flow-test" element={<ReactFlowDemoPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/workshop/roadmaps" element={<AdminRoadmapsPage />} />
          <Route path="/workshop/roadmaps/new" element={<AdminRoadmapNewPage />} />
          <Route path="/workshop/roadmaps/:id/edit" element={<AdminRoadmapEditPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
