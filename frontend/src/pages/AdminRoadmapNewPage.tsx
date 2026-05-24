import { useNavigate } from "react-router-dom";

import { useCreateAdminRoadmapMutation } from "@/entities/admin-roadmap/api/hooks";
import { AdminRoadmapForm } from "@/features/admin-roadmaps/ui/AdminRoadmapForm";
import { Card, CardContent } from "@/shared/ui/card";
import { PageShell } from "@/shared/ui/page-shell";

// Блок рендерит страницу создания нового роадмапа.
export function AdminRoadmapNewPage() {
  const navigate = useNavigate();
  const createRoadmapMutation = useCreateAdminRoadmapMutation();

  return (
    <PageShell
      title="Новая карта"
      description="Заполни основное — остальное можно добавить позже в редакторе."
    >
      <Card className="max-w-4xl">
        <CardContent className="p-6">
          <AdminRoadmapForm
            submitLabel="Создать карту"
            isSubmitting={createRoadmapMutation.isPending}
            errorMessage={createRoadmapMutation.isError ? createRoadmapMutation.error.message : undefined}
            onSubmit={(values) =>
              createRoadmapMutation.mutate(values, {
                onSuccess: (roadmap) => navigate(`/workshop/roadmaps/${roadmap.id}/edit`)
              })
            }
          />
        </CardContent>
      </Card>
    </PageShell>
  );
}
