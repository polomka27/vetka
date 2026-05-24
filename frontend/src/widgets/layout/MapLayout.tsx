import { Outlet } from "react-router-dom";

import { AppHeader } from "@/widgets/layout/AppHeader";

// Блок задаёт полноэкранный каркас страницы карты: карта занимает весь экран без прокрутки.
export function MapLayout() {
  return (
    <div className="relative isolate flex h-dvh flex-col overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(139,92,246,0.08),transparent_28%),radial-gradient(circle_at_top,rgba(168,85,247,0.24),transparent_36%),radial-gradient(circle_at_bottom_right,rgba(91,33,182,0.24),transparent_28%)]" />
      <div className="pointer-events-none absolute inset-0 -z-10 bg-vetka-grid bg-[size:32px_32px] opacity-20" />
      <div className="pointer-events-none absolute left-1/2 top-[-10rem] -z-10 h-[22rem] w-[40rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(167,139,250,0.26),transparent_62%)] blur-3xl sm:top-[-12rem] sm:h-[26rem] sm:w-[52rem] lg:top-[-14rem] lg:h-[28rem] lg:w-[62rem]" />
      <AppHeader />
      <main className="flex flex-1 flex-col overflow-y-auto pt-20 sm:pt-28 lg:pt-32">
        <Outlet />
      </main>
    </div>
  );
}
