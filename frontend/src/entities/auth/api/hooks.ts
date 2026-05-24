import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { authApi } from "@/entities/auth/api/auth.api";
import type {
  CurrentUserResponse,
  LoginRequest,
  RegisterRequest,
  UpdateProfileRequest
} from "@/entities/auth/model/types";
import { queryKeys } from "@/shared/api/query-keys";
import { clearAccessToken, getAccessToken, setAccessToken } from "@/shared/api/token-storage";

// Блок загружает текущего пользователя по сохранённому JWT токену.
export function useCurrentUserQuery() {
  const hasAccessToken = Boolean(getAccessToken());

  return useQuery({
    queryKey: queryKeys.auth.currentUser,
    queryFn: authApi.getCurrentUser,
    retry: false,
    enabled: hasAccessToken,
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000
  });
}

// Блок выполняет регистрацию, сохраняет токен и кэш пользователя для автоматического входа.
export function useRegisterMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: RegisterRequest) => authApi.register(payload),
    onSuccess: (response) => {
      setAccessToken(response.access_token);
      queryClient.setQueryData(queryKeys.auth.currentUser, { user: response.user });
    }
  });
}

// Блок выполняет логин, сохраняет токен и обновляет кэш текущего пользователя.
export function useLoginMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: LoginRequest) => authApi.login(payload),
    onSuccess: (response) => {
      setAccessToken(response.access_token);
      queryClient.setQueryData(queryKeys.auth.currentUser, { user: response.user });
    }
  });
}

// Блок очищает локальную сессию пользователя и сбрасывает кэш авторизации.
export function useLogoutMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      clearAccessToken();
      return true;
    },
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: queryKeys.auth.all });
      queryClient.removeQueries({ queryKey: queryKeys.progress.all });
      queryClient.removeQueries({ queryKey: queryKeys.admin.all });
      // Блок сбрасывает публичные роадмапы, потому что в detail-кэше могли остаться оптимистические пользовательские статусы.
      queryClient.removeQueries({ queryKey: queryKeys.roadmaps.all });
    }
  });
}

// Блок сохраняет профиль текущего пользователя и синхронизирует кэш с новым состоянием.
export function useUpdateProfileMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateProfileRequest) => authApi.updateProfile(payload),
    onSuccess: (response) => {
      queryClient.setQueryData<CurrentUserResponse>(queryKeys.auth.currentUser, {
        user: response.user
      });
    }
  });
}

// Блок экспортирует хук с более явным именем для текущего пользователя.
export const useGetCurrentUserQuery = useCurrentUserQuery;

// Блок экспортирует хук регистрации с более явным именем.
export const useRegister = useRegisterMutation;

// Блок экспортирует хук логина с более явным именем.
export const useLogin = useLoginMutation;
export const useLogout = useLogoutMutation;
export const useUpdateProfile = useUpdateProfileMutation;
