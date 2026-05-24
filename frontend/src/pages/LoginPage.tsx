import { type FormEvent, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { useLoginMutation } from "@/entities/auth/api/hooks";
import type { LoginRequest } from "@/entities/auth/model/types";
import { Button } from "@/shared/ui/button";
import { Card, CardContent } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { PageShell } from "@/shared/ui/page-shell";
import { StateMessage } from "@/shared/ui/state-message";

// Блок рендерит форму входа пользователя.
export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  // Блок хранит локальное состояние полей формы логина.
  const [form, setForm] = useState<LoginRequest>({
    email: "",
    password: ""
  });
  const loginMutation = useLoginMutation();
  // Блок по умолчанию возвращает пользователя на главную, где теперь собран полноценный onboarding-hero.
  const redirectTo = typeof location.state?.from === "string" ? location.state.from : "/";

  // Блок отправляет форму логина и запускает mutation TanStack Query.
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    loginMutation.mutate({
      email: form.email.trim(),
      password: form.password
    }, {
      onSuccess: () => {
        navigate(redirectTo, { replace: true });
      }
    });
  };

  return (
    <PageShell
      title="Вход"
      description="Войди в аккаунт, чтобы сохранять прогресс, собирать коллекцию и работать со своими картами."
    >
      <Card className="mx-auto w-full max-w-xl">
        <CardContent className="p-5 sm:p-6">
          <form className="grid gap-4" onSubmit={handleSubmit}>
            <div className="grid gap-2">
              <Label htmlFor="login-email">Электронная почта</Label>
              <Input
                id="login-email"
                type="email"
                autoComplete="email"
                required
                placeholder="name@example.com"
                value={form.email}
                onChange={(event) =>
                  setForm((currentForm) => ({
                    ...currentForm,
                    email: event.target.value
                  }))
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="login-password">Пароль</Label>
              <Input
                id="login-password"
                type="password"
                autoComplete="current-password"
                required
                placeholder="Твой пароль"
                value={form.password}
                onChange={(event) =>
                  setForm((currentForm) => ({
                    ...currentForm,
                    password: event.target.value
                  }))
                }
              />
            </div>

            {loginMutation.isError ? (
              <StateMessage
                title="Ошибка входа"
                description={loginMutation.error.message}
                className="rounded-2xl p-4 shadow-none"
              />
            ) : null}

            <Button className="w-full" disabled={loginMutation.isPending} type="submit">
              {loginMutation.isPending ? "Выполняем вход..." : "Войти"}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Нет аккаунта?{" "}
              <Link to="/register" className="text-primary underline-offset-4 hover:underline">
                Зарегистрироваться
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </PageShell>
  );
}
