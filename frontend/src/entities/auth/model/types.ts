// Блок описывает пользователя, приходящего из backend API.
export interface UserProfile {
  nickname: string;
  profession: string;
  social_links: string;
  bio: string;
  avatar_url: string;
}

// Блок описывает пользователя, приходящего из backend API.
export interface User {
  id: number;
  username: string;
  email: string;
  role: "user" | "admin";
  profile: UserProfile;
  created_at: string | null;
}

// Блок описывает payload регистрации пользователя.
export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

// Блок описывает payload логина пользователя.
export interface LoginRequest {
  email: string;
  password: string;
}

// Блок описывает ответ backend после успешной регистрации (включает токен для автоматического входа).
export interface RegisterResponse {
  access_token: string;
  token_type: string;
  user: User;
}

// Блок описывает ответ backend после успешного логина.
export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: User;
}

// Блок описывает ответ backend для endpoint /api/auth/me.
export interface CurrentUserResponse {
  user: User;
}

// Блок описывает payload обновления профиля текущего пользователя.
export interface UpdateProfileRequest {
  nickname: string;
  profession: string;
  social_links: string;
  bio: string;
  avatar_url: string;
}

// Блок описывает ответ backend после сохранения профиля.
export interface UpdateProfileResponse {
  user: User;
}
