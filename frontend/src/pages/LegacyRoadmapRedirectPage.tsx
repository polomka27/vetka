import { Navigate, useParams } from "react-router-dom";

export function LegacyRoadmapRedirectPage() {
  const { slug } = useParams();

  if (!slug) {
    return <Navigate to="/roadmaps" replace />;
  }

  return <Navigate to={`/map/${slug}`} replace />;
}
