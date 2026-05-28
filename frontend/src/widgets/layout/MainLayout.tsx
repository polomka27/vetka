import { Link2, Send } from "lucide-react";
import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";

import { AppHeader } from "@/widgets/layout/AppHeader";

const SHARE_URL = "https://vetka.app";
const SHARE_TEXT = "Ветка — сервис для роста в нужном направлении. Посмотри!";

export function AppFooter() {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(SHARE_URL).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <footer className="mt-16 border-t border-white/8 pb-2 pt-8">
      <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:justify-between sm:text-left">
        <div>
          <p className="text-sm font-medium text-foreground">Расскажи о нас друзьям</p>
          <p className="mt-0.5 text-xs text-muted-foreground">Помоги другим найти нужное направление</p>
        </div>
        <div className="flex shrink-0 gap-2">
          <a
            href={`https://t.me/share/url?url=${encodeURIComponent(SHARE_URL)}&text=${encodeURIComponent(SHARE_TEXT)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-full border border-white/12 bg-white/6 px-4 py-2 text-sm text-muted-foreground transition-colors hover:border-sky-400/30 hover:bg-sky-400/10 hover:text-sky-300"
          >
            <Send className="h-3.5 w-3.5" />
            Telegram
          </a>
          <a
            href={`https://vk.com/share.php?url=${encodeURIComponent(SHARE_URL)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-full border border-white/12 bg-white/6 px-4 py-2 text-sm text-muted-foreground transition-colors hover:border-blue-400/30 hover:bg-blue-400/10 hover:text-blue-300"
          >
            ВКонтакте
          </a>
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1.5 rounded-full border border-white/12 bg-white/6 px-4 py-2 text-sm text-muted-foreground transition-colors hover:border-violet-400/30 hover:bg-violet-400/10 hover:text-violet-300"
          >
            <Link2 className="h-3.5 w-3.5" />
            {copied ? "Скопировано" : "Ссылка"}
          </button>
        </div>
      </div>
    </footer>
  );
}

const FOOTER_HIDDEN_PATHS = new Set(["/", "/collection"]);

// Блок задаёт общий каркас страниц: шапку, фон и контейнер контента.
export function MainLayout() {
  const location = useLocation();
  const showFooter = !FOOTER_HIDDEN_PATHS.has(location.pathname);

  return (
    <div className="relative isolate min-h-screen w-full overflow-x-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(139,92,246,0.08),transparent_28%),radial-gradient(circle_at_top,rgba(168,85,247,0.24),transparent_36%),radial-gradient(circle_at_bottom_right,rgba(91,33,182,0.24),transparent_28%)]" />
      <div className="pointer-events-none absolute inset-0 -z-10 bg-vetka-grid bg-[size:32px_32px] opacity-20" />
      <div className="pointer-events-none absolute left-1/2 top-[-10rem] -z-10 h-[22rem] w-[40rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(167,139,250,0.26),transparent_62%)] blur-3xl sm:top-[-12rem] sm:h-[26rem] sm:w-[52rem] lg:top-[-14rem] lg:h-[28rem] lg:w-[62rem]" />
      <AppHeader />
      <main className="mx-auto w-full max-w-7xl min-w-0 px-3 pb-[calc(env(safe-area-inset-bottom)+5.25rem)] pt-20 sm:px-5 sm:pb-14 sm:pt-28 lg:px-8 lg:pb-12 lg:pt-32">
        <Outlet />
        {showFooter ? <AppFooter /> : null}
      </main>
    </div>
  );
}
