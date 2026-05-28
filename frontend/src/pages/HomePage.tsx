import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Check, ChevronRight, CircleDashed, Clock3 } from "lucide-react";

import { useCurrentUserQuery } from "@/entities/auth/api/hooks";
import { AppFooter } from "@/widgets/layout/MainLayout";
import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/lib/utils";
import logoImage from "@/vetka_logo_trace.svg";

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

function Reveal({ children, className, delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const { ref, visible } = useReveal();
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(22px)",
        transition: `opacity 420ms ease ${delay}ms, transform 420ms ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

// ─── Mini roadmap demo ─────────────────────────────────────────────────────

type NodeStatus = "done" | "in_progress" | "idle";

const DEMO_STEPS: Array<{ id: number; title: string; status: NodeStatus }> = [
  { id: 1, title: "HTML & CSS",          status: "done"        },
  { id: 2, title: "JavaScript основы",   status: "done"        },
  { id: 3, title: "React",               status: "in_progress" },
  { id: 4, title: "TypeScript",          status: "idle"        },
  { id: 5, title: "Node.js",             status: "idle"        },
];

function NodeIcon({ status }: { status: NodeStatus }) {
  if (status === "done")        return <Check         className="h-3.5 w-3.5 stroke-[2.5]" />;
  if (status === "in_progress") return <Clock3        className="h-3.5 w-3.5 stroke-[2]"   />;
  return                               <CircleDashed  className="h-3.5 w-3.5"               />;
}

function MiniRoadmapDemo({ className }: { className?: string }) {
  const [steps, setSteps] = useState(DEMO_STEPS);

  const toggle = (id: number) =>
    setSteps((prev) =>
      prev.map((s) =>
        s.id !== id ? s : { ...s, status: s.status === "done" ? ("idle" as NodeStatus) : ("done" as NodeStatus) }
      )
    );

  const doneCount = steps.filter((s) => s.status === "done").length;
  const progress   = Math.round((doneCount / steps.length) * 100);

  return (
    <div className={cn("glass-surface rounded-[1.75rem] p-5 sm:p-6", className)}>
      {/* Progress header */}
      <div className="mb-5 space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold">Frontend-разработчик</span>
          <span className="tabular-nums text-muted-foreground">{doneCount} / {steps.length}</span>
        </div>
        <div className="h-2.5 overflow-hidden rounded-full border border-white/10 bg-white/10">
          <div
            className="h-full rounded-full bg-[linear-gradient(90deg,#a855f7_0%,#8b5cf6_55%,#c4b5fd_100%)] shadow-[0_0_18px_rgba(168,85,247,0.6)] transition-[width] duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground">{progress}% пройдено</p>
      </div>

      {/* Steps */}
      <div className="relative">
        <div
          aria-hidden
          className="pointer-events-none absolute left-[1.18rem] top-5 w-px bg-gradient-to-b from-violet-400/50 via-violet-300/20 to-transparent"
          style={{ height: "calc(100% - 2.5rem)" }}
        />
        <div className="space-y-2">
          {steps.map((step) => (
            <button
              key={step.id}
              type="button"
              aria-label={`Отметить «${step.title}»`}
              onClick={() => toggle(step.id)}
              className={cn(
                "relative flex w-full items-center gap-3 rounded-2xl border px-3.5 py-3 text-left text-sm font-semibold leading-snug transition-all duration-200",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
                step.status === "done" && "border-emerald-400/25 bg-emerald-400/[0.05] text-muted-foreground opacity-70",
                step.status === "in_progress" && [
                  "border-violet-400/45 text-white",
                  "bg-[linear-gradient(135deg,rgba(167,139,250,0.72)_0%,rgba(109,40,217,0.82)_100%)]",
                  "shadow-[0_10px_32px_rgba(109,40,217,0.38),inset_0_1px_0_rgba(255,255,255,0.28)]",
                ],
                step.status === "idle" && "border-white/10 bg-white/[0.04] hover:bg-white/[0.07] hover:-translate-y-0.5"
              )}
            >
              <span
                className={cn(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full",
                  step.status === "done"        && "bg-emerald-400/85 text-white shadow-[0_2px_8px_rgba(52,211,153,0.4)]",
                  step.status === "in_progress" && "bg-white/22 text-white",
                  step.status === "idle"        && "bg-white/12 text-white/55"
                )}
              >
                <NodeIcon status={step.status} />
              </span>
              <span className="flex-1">{step.title}</span>
            </button>
          ))}
        </div>
      </div>

      <p className="mt-4 text-center text-xs text-muted-foreground">
        Нажми на шаг — отметь пройденное
      </p>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────

export function HomePage() {
  const currentUserQuery  = useCurrentUserQuery();
  const isAuthenticated   = currentUserQuery.isSuccess && Boolean(currentUserQuery.data?.user);

  return (
    <div className="grid gap-16 sm:gap-20 lg:gap-24">

      {/* ─────────────────────────────────────────────────── 1. HERO ──── */}
      <section className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(300px,440px)] lg:items-center lg:gap-14">

        {/* Left: text */}
        <div className="grid gap-6">
          <div className="flex items-center gap-3">
            <img src={logoImage} alt="Ветка" className="h-8 w-auto opacity-90" />
            <div className="h-px flex-1 bg-gradient-to-r from-border/60 to-transparent" />
          </div>

          <h1 className="font-heading text-4xl font-bold leading-[1.04] tracking-tight sm:text-5xl lg:text-[3.5rem]">
            Учись по правильному
            <br />
            <span className="bg-[linear-gradient(135deg,#a855f7_0%,#7c3aed_52%,#c4b5fd_100%)] bg-clip-text text-transparent">
              маршруту.
            </span>
          </h1>

          <p className="max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
            «Ветка» — интерактивная библиотека дорожных карт знаний и навыков.
          </p>

          <div className="flex flex-wrap gap-3 pt-1">
            <Button asChild size="lg" className="w-full sm:w-auto">
              <Link to={isAuthenticated ? "/roadmaps" : "/register"}>
                {isAuthenticated ? "Открыть библиотеку" : "Попробовать"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          {!isAuthenticated && (
            <p className="text-sm text-muted-foreground">Карты открыты всем, аккаунт нужен только чтобы сохранять прогресс.</p>
          )}
        </div>

        {/* Right: interactive mini-map */}
        <div className="relative">
          <div
            aria-hidden
            className="pointer-events-none absolute -inset-6 rounded-[2.5rem] bg-primary/8 blur-3xl"
          />
          <MiniRoadmapDemo className="relative" />
        </div>
      </section>

      {/* ───────────────────────────────────────────────────── 2. БОЛЬ ── */}
      <Reveal>
        <section>
          <div className="relative overflow-hidden rounded-[1.75rem] border border-white/8 bg-white/[0.025] p-6 sm:p-8 lg:p-10">
            <div
              aria-hidden
              className="pointer-events-none absolute -right-8 top-0 h-48 w-48 translate-x-1/4 -translate-y-1/4 rounded-full bg-violet-500/10 blur-3xl"
            />
            <blockquote className="relative max-w-2xl">
              <p className="font-heading text-2xl font-semibold leading-relaxed sm:text-3xl">
                Туториалов миллион, а порядка — ноль.{" "}
                <span className="font-normal text-muted-foreground">
                  Не очень понятно, с чего начинать и что важно. Учишь-учишь, а прогресса
                  будто и нет. Знакомое чувство.
                </span>
              </p>
            </blockquote>
          </div>
        </section>
      </Reveal>

      {/* ──────────────────────────────────────────── 3. КАК РАБОТАЕТ ── */}
      <Reveal>
        <section className="grid gap-6">
          <h2 className="font-heading text-2xl font-semibold sm:text-3xl">
            Как это работает
          </h2>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.92fr)_minmax(0,0.92fr)]">

            {/* Шаг 1 — широкий, со списком тем */}
            <div className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-6 sm:p-7">
              <span className="font-heading text-5xl font-bold text-primary/20 sm:text-6xl">01</span>
              <h3 className="mt-3 font-heading text-lg font-semibold sm:text-xl">Выбираешь карту.</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Готовые маршруты под разные цели — Python с нуля, фронтенд, Data Science и другие.
              </p>
              <div className="mt-5 space-y-2">
                {["Frontend-разработчик", "Data Science", "DevOps", "UX-дизайн"].map((t) => (
                  <div
                    key={t}
                    className="flex items-center gap-2.5 rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2 text-xs text-muted-foreground"
                  >
                    <ChevronRight className="h-3 w-3 shrink-0 text-primary/50" />
                    {t}
                  </div>
                ))}
              </div>
            </div>

            {/* Шаг 2 — узлы с иконками статусов */}
            <div className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-6 sm:p-7">
              <span className="font-heading text-5xl font-bold text-primary/20 sm:text-6xl">02</span>
              <h3 className="mt-3 font-heading text-lg font-semibold sm:text-xl">Идёшь по шагам.</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                На каждом шаге написано, что освоить и где. Можно оставлять заметки для себя.
              </p>
              <div className="mt-5 space-y-2">
                {[
                  { label: "Переменные и типы", done: true,    current: false },
                  { label: "Функции",           done: true,    current: false },
                  { label: "Классы и ООП",      done: false,   current: true  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className={cn(
                      "flex items-center gap-2.5 rounded-xl border px-3 py-2 text-xs font-medium",
                      item.done    && "border-emerald-400/25 bg-emerald-400/[0.05] text-muted-foreground opacity-75",
                      item.current && [
                        "border-violet-400/45 text-white",
                        "bg-[linear-gradient(135deg,rgba(167,139,250,0.72),rgba(109,40,217,0.82))]",
                      ]
                    )}
                  >
                    <span className={cn(
                      "flex h-5 w-5 shrink-0 items-center justify-center rounded-full",
                      item.done    && "bg-emerald-400/85 text-white",
                      item.current && "bg-white/22 text-white"
                    )}>
                      {item.done
                        ? <Check   className="h-3 w-3 stroke-[2.5]" />
                        : <Clock3  className="h-3 w-3 stroke-[2]"   />
                      }
                    </span>
                    {item.label}
                  </div>
                ))}
              </div>
            </div>

            {/* Шаг 3 — прогресс-бары */}
            <div className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-6 sm:p-7">
              <span className="font-heading text-5xl font-bold text-primary/20 sm:text-6xl">03</span>
              <h3 className="mt-3 font-heading text-lg font-semibold sm:text-xl">Видишь, как растёшь.</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Прогресс сохраняется. Закрыл вкладку, вернулся через неделю — продолжил с того же места.
              </p>
              <div className="mt-5 space-y-3.5">
                {[
                  { label: "Python основы", pct: 72 },
                  { label: "Алгоритмы",     pct: 41 },
                  { label: "Django",         pct: 18 },
                ].map((item) => (
                  <div key={item.label} className="space-y-1.5">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{item.label}</span>
                      <span className="tabular-nums">{item.pct}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full border border-white/10 bg-white/10">
                      <div
                        className="h-full rounded-full bg-[linear-gradient(90deg,#a855f7,#8b5cf6)] shadow-[0_0_10px_rgba(168,85,247,0.5)]"
                        style={{ width: `${item.pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </Reveal>

      {/* ──────────────────────────────────────────── 4. О ПРОЕКТЕ ── */}
      <Reveal>
        <section className="grid gap-5 rounded-[1.75rem] border border-white/10 bg-white/[0.03] p-6 sm:p-8 lg:p-10">
          <div className="max-w-xl space-y-3">
            <h2 className="font-heading text-2xl font-semibold sm:text-3xl">О проекте</h2>
            <p className="text-sm leading-7 text-muted-foreground sm:text-base">
              Кто и зачем делает «Ветку», во что мы верим и куда движемся.
            </p>
            <Button asChild variant="outline" size="lg">
              <Link to="/about">
                Читать
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>
      </Reveal>

      {/* ──────────────────────────────────────────── 5. ФИНАЛЬНЫЙ CTA ── */}
      <Reveal>
        <section className="relative overflow-hidden rounded-[2rem] border border-white/12 bg-[linear-gradient(135deg,rgba(109,40,217,0.22),rgba(76,29,149,0.14))] p-8 sm:p-10 lg:p-12">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-8 -top-8 h-64 w-64 rounded-full bg-primary/14 blur-3xl"
          />
          <div className="relative max-w-xl space-y-3">
            <h2 className="font-heading text-2xl font-semibold leading-tight sm:text-3xl lg:text-4xl">
              {isAuthenticated ? "Продолжи свой маршрут." : "Если интересно — заходи."}
            </h2>
            <p className="text-sm leading-7 text-muted-foreground sm:text-base">
              {isAuthenticated
                ? "Открой библиотеку карт и выбери следующий шаг."
                : "Выбери карту, отметь первый шаг. Дальше будет понятнее."}
            </p>
            <div className="pt-2">
              <Button asChild size="lg">
                <Link to={isAuthenticated ? "/roadmaps" : "/register"}>
                  {isAuthenticated ? "Открыть библиотеку" : "Попробовать"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              {!isAuthenticated && (
                <p className="mt-2 text-xs text-muted-foreground">Через почту или Яндекс. Никаких карт и пробных периодов.</p>
              )}
            </div>
          </div>
        </section>
      </Reveal>

      {/* ─────────────────────────────────────────────────── 7. ФУТЕР ── */}
      <HomeFooter isAuthenticated={isAuthenticated} />

    </div>
  );
}
