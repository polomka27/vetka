import { Navigate } from "react-router-dom";

import { getCurrentMapSlug } from "@/features/current-map/model/current-map-storage";

export function CurrentMapPage() {
  const currentMapSlug = getCurrentMapSlug();

  if (!currentMapSlug) {
    return <Navigate to="/roadmaps" replace />;
  }

  return <Navigate to={`/map/${currentMapSlug}`} replace />;
}
