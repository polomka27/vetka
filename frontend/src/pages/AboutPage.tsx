import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

import { useCurrentUserQuery } from "@/entities/auth/api/hooks";
import { Button } from "@/shared/ui/button";

// ─── Scroll reveal ─────────────────────────────────────────────────────────

function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) { setVisible(true); obs.disconnect(); }
      },
      { threshold: 0.08 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, visible };
}

function Reveal({ children, className }: { children: ReactNode; className?: string }) {
  const { ref, visible } = useReveal();
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(22px)",
        transition: "opacity 420ms ease, transform 420ms ease",
      }}
    >
      {children}
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────

export function AboutPage() {
  const currentUserQuery = useCurrentUserQuery();
  const isAuthenticated = currentUserQuery.isSuccess && Boolean(currentUserQuery.data?.user);

  return (
    <div className="grid gap-12 sm:gap-16">

      {/* ─────────────────────────────────────────────── 1. ЗАГОЛОВОК ── */}
      <section>
        <h1 className="font-heading text-3xl font-bold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
          Зачем мы делаем «Ветку»
        </h1>
      </section>

      {/* ──────────────────────────────────────────────── 2. ИСТОРИЯ ── */}
      <Reveal>
        <section className="max-w-2xl">
          <p className="text-base leading-8 text-muted-foreground sm:text-lg">
            Мы сами проходили через это: десятки вкладок, курсы по цене подержанной машины
            и полное непонимание, в каком порядке всё учить. «Ветка» родилась из простой
            мысли — обучению не хватает не контента, а карты местности.
          </p>
        </section>
      </Reveal>

      {/* ─────────────────────────────────────── 3. ЧТО ТАКОЕ «ВЕТКА» ── */}
      <Reveal>
        <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.03] p-6 sm:p-8 lg:p-10">
          <h2 className="font-heading text-xl font-semibold sm:text-2xl">Что такое «Ветка»</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
            Библиотека интерактивных дорожных карт. Каждая карта — пошаговый маршрут навыка
            или профессии. Отмечаешь шаги, ведёшь заметки, видишь прогресс. Скоро — сможешь
            собирать и публиковать свои карты.
          </p>
        </section>
      </Reveal>

      {/* ──────────────────────────────────────────── 4. ВО ЧТО ВЕРИМ ── */}
      <Reveal>
        <section className="grid gap-5">
          <h2 className="font-heading text-xl font-semibold sm:text-2xl">Во что мы верим</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              {
                title: "Структура важнее объёма",
                text:  "Знать порядок ценнее, чем иметь доступ ко всему сразу.",
              },
              {
                title: "Прогресс должен быть виден",
                text:  "Иначе мотивация тает. Нужно видеть, что движешься — даже если медленно.",
              },
              {
                title: "Учиться можно дёшево",
                text:  "Дорого ≠ эффективно. Большинство нужных материалов уже существует — их надо выстроить в порядок.",
              },
              {
                title: "Открыто без барьеров",
                text:  "Любую карту можно смотреть без регистрации. Аккаунт нужен только чтобы сохранять прогресс.",
              },
            ].map((p) => (
              <div
                key={p.title}
                className="rounded-[1.5rem] border border-border/60 bg-white/[0.03] p-5 sm:p-6"
              >
                <div className="font-heading text-sm font-semibold sm:text-base">{p.title}</div>
                <div className="mt-2 text-sm leading-6 text-muted-foreground">{p.text}</div>
              </div>
            ))}
          </div>
        </section>
      </Reveal>

      {/* ──────────────────────────────────────── 5. КУДА ДВИЖЕМСЯ ── */}
      <Reveal>
        <section className="max-w-2xl space-y-3">
          <h2 className="font-heading text-xl font-semibold sm:text-2xl">Куда движемся</h2>
          <p className="text-sm leading-7 text-muted-foreground sm:text-base">
            Сейчас «Ветка» — библиотека готовых карт. Следующий шаг: маркетплейс, где
            маршруты создают сами пользователи, а лучшие поднимаются в топ. Строим это
            постепенно — без обещаний дат.
          </p>
        </section>
      </Reveal>

      {/* ───────────────────────────────────────────────── 6. КОМАНДА ── */}
      <Reveal>
        <section className="grid gap-5">
          <h2 className="font-heading text-xl font-semibold sm:text-2xl">Команда</h2>
          <div className="flex flex-wrap gap-3">
            {[
              { initial: "О", name: "Орхан", role: "Продукт, стратегия, исследования" },
              { initial: "Г", name: "Глеб",  role: "Разработка"                        },
            ].map((m) => (
              <div
                key={m.name}
                className="flex items-center gap-3 rounded-[1.25rem] border border-white/10 bg-white/[0.03] px-4 py-3"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 font-heading text-sm font-semibold text-primary">
                  {m.initial}
                </div>
                <div>
                  <div className="text-sm font-semibold">{m.name}</div>
                  <div className="text-xs text-muted-foreground">{m.role}</div>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">Небольшая команда, делаем честно.</p>
        </section>
      </Reveal>

      {/* ──────────────────────────────────────────────────── 7. CTA ── */}
      <Reveal>
        <section className="flex flex-wrap gap-3">
          {!isAuthenticated ? (
            <Button asChild size="lg">
              <Link to="/register">
                Зарегистрироваться
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          ) : (
            <Button asChild size="lg">
              <Link to="/roadmaps">
                Открыть библиотеку
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          )}
          <Button asChild size="lg" variant="outline">
            <a href="mailto:prodbysilentstill@gmail.com">Написать нам</a>
          </Button>
        </section>
      </Reveal>

    </div>
  );
}
