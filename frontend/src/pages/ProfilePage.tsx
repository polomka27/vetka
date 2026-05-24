import { useMemo, useState } from "react";
import { Award, ImagePlus, Link as LinkIcon } from "lucide-react";

import { useAdminRoadmapsQuery } from "@/entities/admin-roadmap/api/hooks";
import {
  useCurrentUserQuery,
  useUpdateProfileMutation
} from "@/entities/auth/api/hooks";
import { useStartedRoadmapsQuery } from "@/entities/progress/api/hooks";
import {
  serializeEditableProfile,
  useEditableProfile
} from "@/features/profile/model/profile-storage";
import { ProfileRoadmapCard } from "@/features/profile/ui/ProfileRoadmapCard";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { PageShell } from "@/shared/ui/page-shell";
import { StateMessage } from "@/shared/ui/state-message";
import { Textarea } from "@/shared/ui/textarea";

export function ProfilePage() {
  const currentUserQuery = useCurrentUserQuery();
  const user = currentUserQuery.data?.user;
  const authorRoadmapsQuery = useAdminRoadmapsQuery(Boolean(user));
  const updateProfileMutation = useUpdateProfileMutation();
  const startedRoadmapsQuery = useStartedRoadmapsQuery(Boolean(user));
  const { profile, isDirty, resetProfile, updateProfile } = useEditableProfile(user?.profile);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | undefined>();
  const [avatarUploadError, setAvatarUploadError] = useState<string | undefined>();

  const publishedMapsCount = useMemo(
    () => (authorRoadmapsQuery.data ?? []).filter((r) => r.is_published).length,
    [authorRoadmapsQuery.data]
  );

  const applyDraft = (next: typeof profile) => {
    setSaveSuccessMessage(undefined);
    setAvatarUploadError(undefined);
    updateProfile(next);
  };

  const handleAvatarUpload = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => applyDraft({ ...profile, avatarUrl: String(reader.result ?? "") });
    reader.onerror = () => setAvatarUploadError("Не удалось прочитать изображение. Попробуй другой файл.");
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    setSaveSuccessMessage(undefined);
    setAvatarUploadError(undefined);
    updateProfileMutation.mutate(serializeEditableProfile(profile), {
      onSuccess: () => setSaveSuccessMessage("Профиль сохранён."),
    });
  };

  return (
    <PageShell title="Профиль">
      {currentUserQuery.isLoading ? (
        <StateMessage title="Загрузка" description="Получаем данные профиля." />
      ) : null}

      {currentUserQuery.isError ? (
        <StateMessage
          variant="error"
          title="Не удалось загрузить профиль"
          description={currentUserQuery.error.message}
          action={
            <Button onClick={() => currentUserQuery.refetch()} variant="outline">
              Повторить
            </Button>
          }
        />
      ) : null}

      {currentUserQuery.isSuccess ? (
        <div className="grid gap-5 sm:gap-6">

          {/* Аватар + базовая инфо */}
          <div className="grid gap-5 lg:grid-cols-[minmax(240px,280px)_minmax(0,1fr)]">

            <Card className="min-w-0">
              <CardContent className="grid gap-5 p-5 sm:p-6">
                <div className="flex flex-col items-center gap-4 text-center">
                  {profile.avatarUrl ? (
                    <img
                      alt={profile.nickname || user?.username || "Профиль"}
                      className="h-24 w-24 rounded-[24px] object-cover ring-2 ring-border/60 sm:h-28 sm:w-28"
                      src={profile.avatarUrl}
                    />
                  ) : (
                    <div className="flex h-24 w-24 items-center justify-center rounded-[24px] bg-primary/15 font-heading text-3xl font-semibold text-primary sm:h-28 sm:w-28">
                      {(profile.nickname || user?.username || "V").slice(0, 1).toUpperCase()}
                    </div>
                  )}

                  <div>
                    <div className="font-heading text-xl font-semibold">
                      {profile.nickname || user?.username}
                    </div>
                    <div className="mt-0.5 text-sm text-muted-foreground">
                      {profile.profession || "Профессия не указана"}
                    </div>
                  </div>

                  <label className="w-full cursor-pointer">
                    <input
                      accept="image/*"
                      className="hidden"
                      type="file"
                      onChange={(e) => handleAvatarUpload(e.target.files?.[0])}
                    />
                    <Button asChild={false} className="w-full" size="sm" type="button" variant="outline">
                      <span>
                        <ImagePlus className="mr-2 inline h-4 w-4" />
                        {profile.avatarUrl ? "Обновить фото" : "Добавить фото"}
                      </span>
                    </Button>
                  </label>
                </div>

                {publishedMapsCount > 0 ? (
                  <div className="flex flex-wrap justify-center gap-2">
                    <Badge className="gap-1 text-xs">
                      <Award className="h-3 w-3" />
                      Автор · {publishedMapsCount}
                    </Badge>
                  </div>
                ) : null}

                {profile.bio ? (
                  <p className="text-center text-sm leading-6 text-muted-foreground">{profile.bio}</p>
                ) : null}

                {profile.socialLinks ? (
                  <div className="flex items-center justify-center gap-1.5 text-sm text-primary">
                    <LinkIcon className="h-3.5 w-3.5 shrink-0" />
                    <span className="break-all">{profile.socialLinks}</span>
                  </div>
                ) : null}
              </CardContent>
            </Card>

            {/* Форма редактирования */}
            <Card className="min-w-0">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Редактировать профиль</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="nickname">Никнейм</Label>
                  <Input
                    id="nickname"
                    autoComplete="off"
                    value={profile.nickname}
                    onChange={(e) => applyDraft({ ...profile, nickname: e.target.value })}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="profession">Профессия</Label>
                  <Input
                    id="profession"
                    autoComplete="off"
                    value={profile.profession}
                    onChange={(e) => applyDraft({ ...profile, profession: e.target.value })}
                  />
                </div>

                <div className="grid gap-2 sm:col-span-2">
                  <Label htmlFor="social">Ссылки</Label>
                  <Input
                    id="social"
                    autoComplete="off"
                    placeholder="telegram / github / сайт"
                    value={profile.socialLinks}
                    onChange={(e) => applyDraft({ ...profile, socialLinks: e.target.value })}
                  />
                </div>

                <div className="grid gap-2 sm:col-span-2">
                  <Label htmlFor="bio">О себе</Label>
                  <Textarea
                    id="bio"
                    autoComplete="off"
                    value={profile.bio}
                    onChange={(e) => applyDraft({ ...profile, bio: e.target.value })}
                  />
                </div>

                {avatarUploadError ? (
                  <StateMessage
                    variant="error"
                    title="Ошибка загрузки фото"
                    description={avatarUploadError}
                    className="rounded-2xl p-4 shadow-none sm:col-span-2"
                  />
                ) : null}

                {updateProfileMutation.isError ? (
                  <StateMessage
                    variant="error"
                    title="Не удалось сохранить"
                    description={updateProfileMutation.error.message}
                    className="rounded-2xl p-4 shadow-none sm:col-span-2"
                  />
                ) : null}

                {saveSuccessMessage ? (
                  <StateMessage
                    variant="success"
                    title={saveSuccessMessage}
                    className="rounded-2xl p-4 shadow-none sm:col-span-2"
                  />
                ) : null}

                <div className="flex flex-wrap gap-2 sm:col-span-2">
                  <Button
                    className="w-full sm:w-auto"
                    disabled={!isDirty || updateProfileMutation.isPending}
                    type="button"
                    onClick={handleSave}
                  >
                    {updateProfileMutation.isPending ? "Сохраняем..." : "Сохранить"}
                  </Button>
                  <Button
                    className="w-full sm:w-auto"
                    disabled={!isDirty || updateProfileMutation.isPending}
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setSaveSuccessMessage(undefined);
                      setAvatarUploadError(undefined);
                      resetProfile();
                    }}
                  >
                    Сбросить
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Прогресс */}
          <Card className="min-w-0">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Начатые карты</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {startedRoadmapsQuery.isLoading ? (
                <StateMessage title="Загружаем прогресс..." />
              ) : null}

              {startedRoadmapsQuery.isError ? (
                <StateMessage
                  variant="error"
                  title="Не удалось загрузить прогресс"
                  description={startedRoadmapsQuery.error.message}
                  action={
                    <Button onClick={() => startedRoadmapsQuery.refetch()} variant="outline">
                      Повторить
                    </Button>
                  }
                />
              ) : null}

              {startedRoadmapsQuery.isSuccess && startedRoadmapsQuery.data.roadmaps.length === 0 ? (
                <StateMessage
                  title="Прогресс пока пуст"
                  description="Начни любую карту из библиотеки — она появится здесь."
                />
              ) : null}

              {startedRoadmapsQuery.isSuccess && startedRoadmapsQuery.data.roadmaps.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {startedRoadmapsQuery.data.roadmaps.map((roadmap) => (
                    <ProfileRoadmapCard key={roadmap.roadmap_id} roadmap={roadmap} />
                  ))}
                </div>
              ) : null}
            </CardContent>
          </Card>

        </div>
      ) : null}
    </PageShell>
  );
}
