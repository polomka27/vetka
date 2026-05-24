import { httpClient } from "@/shared/api/http-client";
import type {
  CurrentUserResponse,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  UpdateProfileRequest,
  UpdateProfileResponse
} from "@/entities/auth/model/types";

// Блок содержит прямые запросы к auth endpoint'ам backend API.
export const authApi = {
  register: (payload: RegisterRequest) =>
    httpClient<RegisterResponse>("/auth/register", {
      method: "POST",
      body: payload
    }),
  login: (payload: LoginRequest) =>
    httpClient<LoginResponse>("/auth/login", {
      method: "POST",
      body: payload
    }),
  getCurrentUser: () =>
    httpClient<CurrentUserResponse>("/auth/me", {
      method: "GET"
    }),
  updateProfile: (payload: UpdateProfileRequest) =>
    httpClient<UpdateProfileResponse>("/auth/me/profile", {
      method: "PATCH",
      body: payload
    })
};
