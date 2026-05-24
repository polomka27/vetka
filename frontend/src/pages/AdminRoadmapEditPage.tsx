import { useState } from "react";
import { useParams } from "react-router-dom";

import {
  useAdminRoadmapQuery,
  useUpdateAdminRoadmapMutation
} from "@/entities/admin-roadmap/api/hooks";
import { AdminNodesManager } from "@/features/admin-roadmaps/ui/AdminNodesManager";
import { AdminRoadmapForm } from "@/features/admin-roadmaps/ui/AdminRoadmapForm";
import { Card, CardContent } from "@/shared/ui/card";
import { PageShell } from "@/shared/ui/page-shell";
import { StateMessage } from "@/shared/ui/state-message";
import { Button } from "@/shared/ui/button";

// Блок рендерит страницу редактирования существующего роадмапа.
export function AdminRoadmapEditPage() {
  const { id } = useParams();
  const roadmapId = Number(id);
  const [successMessage, setSuccessMessage] = useState<string | undefined>();
  const roadmapQuery = useAdminRoadmapQuery(Number.isNaN(roadmapId) ? undefined : roadmapId);
  const updateRoadmapMutation = useUpdateAdminRoadmapMutation(roadmapId);

  if (Number.isNaN(roadmapId)) {
    return (
      <PageShell
        title="Некорректный идентификатор"
        description="Адрес страницы содержит неверный идентификатор карты."
      >
        <StateMessage
          title="Карта не найдена"
          description="Проверь адрес страницы и открой нужную карту из мастерской."
        />
      </PageShell>
    );
  }

  return (
    <PageShell title="Редактирование карты">
      {roadmapQuery.isLoading ? (
        <StateMessage
          title="Загрузка карты"
          description="Открываем данные карты и материалы для редактирования."
        />
      ) : null}

      {roadmapQuery.isError ? (
        <StateMessage
          title="Не удалось загрузить карту"
          description={roadmapQuery.error.message}
          action={
            <Button onClick={() => roadmapQuery.refetch()} variant="outline">
              Повторить запрос
            </Button>
          }
        />
      ) : null}

      {roadmapQuery.isSuccess ? (
        <>
          <Card className="max-w-4xl">
            <CardContent className="p-6">
              <AdminRoadmapForm
                initialValues={roadmapQuery.data}
                submitLabel="Сохранить изменения"
                isSubmitting={updateRoadmapMutation.isPending}
                errorMessage={
                  updateRoadmapMutation.isError ? updateRoadmapMutation.error.message : undefined
                }
                successMessage={successMessage}
                onSubmit={(values) => {
                  setSuccessMessage(undefined);
                  updateRoadmapMutation.mutate(values, {
                    onSuccess: () => {
                      setSuccessMessage("Изменения карты успешно сохранены.");
                    }
                  });
                }}
              />
            </CardContent>
          </Card>

          <AdminNodesManager roadmapId={roadmapId} nodes={roadmapQuery.data.nodes} />
        </>
      ) : null}
    </PageShell>
  );
}
