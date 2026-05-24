import { type FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useRegisterMutation } from "@/entities/auth/api/hooks";
import type { RegisterRequest } from "@/entities/auth/model/types";
import { Button } from "@/shared/ui/button";
import { Card, CardContent } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { PageShell } from "@/shared/ui/page-shell";
import { StateMessage } from "@/shared/ui/state-message";

// Блок рендерит форму регистрации пользователя.
export function RegisterPage() {
  const navigate = useNavigate();
  // Блок хранит локальное состояние формы регистрации.
  const [form, setForm] = useState<RegisterRequest>({
    username: "",
    email: "",
    password: ""
  });
  const registerMutation = useRegisterMutation();

  // Блок отправляет форму регистрации и запускает mutation TanStack Query.
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    registerMutation.mutate({
      username: form.username.trim(),
      email: form.email.trim(),
      password: form.password
    }, {
      onSuccess: () => {
        navigate("/", { replace: true });
      }
    });
  };

  return (
    <PageShell
      title="Создать аккаунт"
      description="Зарегистрируйся, чтобы сохранять понравившиеся карты, отмечать этапы и собирать свою коллекцию."
    >
      <Card className="mx-auto w-full max-w-xl">
        <CardContent className="p-5 sm:p-6">
          <form className="grid gap-4" onSubmit={handleSubmit}>
            <div className="grid gap-2">
              <Label htmlFor="register-username">Никнейм</Label>
              <Input
                id="register-username"
                autoComplete="username"
                required
                minLength={3}
                maxLength={80}
                placeholder="Например, polomka"
                value={form.username}
                onChange={(event) =>
                  setForm((currentForm) => ({
                    ...currentForm,
                    username: event.target.value
                  }))
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="register-email">Электронная почта</Label>
              <Input
                id="register-email"
                type="email"
                autoComplete="email"
                required
                maxLength={255}
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
              <Label htmlFor="register-password">Пароль</Label>
              <Input
                id="register-password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                maxLength={255}
                placeholder="Не короче 8 символов"
                value={form.password}
                onChange={(event) =>
                  setForm((currentForm) => ({
                    ...currentForm,
                    password: event.target.value
                  }))
                }
              />
            </div>

            {registerMutation.isError ? (
              <StateMessage
                title="Ошибка регистрации"
                description={registerMutation.error.message}
                className="rounded-2xl p-4 shadow-none"
              />
            ) : null}

            <Button className="w-full" disabled={registerMutation.isPending} type="submit">
              {registerMutation.isPending ? "Создаём аккаунт..." : "Создать аккаунт"}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Уже есть аккаунт?{" "}
              <Link to="/login" className="text-primary underline-offset-4 hover:underline">
                Войти
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </PageShell>
  );
}
