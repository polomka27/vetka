import { useEffect, useMemo, useState } from "react";

import type { UpdateProfileRequest, UserProfile } from "@/entities/auth/model/types";

// Блок задаёт форму редактируемого профиля в UI-слое.
export interface EditableProfile {
  nickname: string;
  profession: string;
  socialLinks: string;
  bio: string;
  avatarUrl: string;
}

// Блок хранит пустой профиль для новых пользователей без заполненных данных.
const emptyProfile: EditableProfile = {
  nickname: "",
  profession: "",
  socialLinks: "",
  bio: "",
  avatarUrl: ""
};

// Блок преобразует профиль из API в удобную для формы frontend-модель.
export function buildEditableProfile(sourceProfile: UserProfile | undefined): EditableProfile {
  return {
    nickname: sourceProfile?.nickname ?? "",
    profession: sourceProfile?.profession ?? "",
    socialLinks: sourceProfile?.social_links ?? "",
    bio: sourceProfile?.bio ?? "",
    avatarUrl: sourceProfile?.avatar_url ?? ""
  };
}

// Блок собирает payload для backend из draft-состояния формы.
export function serializeEditableProfile(profile: EditableProfile): UpdateProfileRequest {
  return {
    nickname: profile.nickname.trim(),
    profession: profile.profession.trim(),
    social_links: profile.socialLinks.trim(),
    bio: profile.bio.trim(),
    avatar_url: profile.avatarUrl.trim()
  };
}

// Блок сравнивает два состояния профиля, чтобы определить наличие несохранённых изменений.
function areProfilesEqual(leftProfile: EditableProfile, rightProfile: EditableProfile): boolean {
  return (
    leftProfile.nickname === rightProfile.nickname &&
    leftProfile.profession === rightProfile.profession &&
    leftProfile.socialLinks === rightProfile.socialLinks &&
    leftProfile.bio === rightProfile.bio &&
    leftProfile.avatarUrl === rightProfile.avatarUrl
  );
}

// Блок даёт странице draft-профиль, признак dirty-state и сброс к данным из backend.
export function useEditableProfile(sourceProfile: UserProfile | undefined) {
  const initialProfile = useMemo(
    () => buildEditableProfile(sourceProfile),
    [
      sourceProfile?.avatar_url,
      sourceProfile?.bio,
      sourceProfile?.nickname,
      sourceProfile?.profession,
      sourceProfile?.social_links
    ]
  );
  const [profile, setProfile] = useState<EditableProfile>(initialProfile);

  useEffect(() => {
    setProfile(initialProfile);
  }, [initialProfile]);

  return {
    profile,
    initialProfile,
    isDirty: !areProfilesEqual(profile, initialProfile),
    resetProfile: () => setProfile(initialProfile),
    updateProfile: (nextProfile: EditableProfile) => setProfile(nextProfile)
  };
}

// Блок экспортирует пустой профиль для локальных fallback-сценариев интерфейса.
export const EMPTY_EDITABLE_PROFILE = emptyProfile;
