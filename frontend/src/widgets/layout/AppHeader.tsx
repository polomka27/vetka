import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { LogOut, Menu, MoonStar, SunMedium, X } from "lucide-react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";

import logoImage from "@/vetka_logo_trace.svg";
import { useCurrentUserQuery, useLogoutMutation } from "@/entities/auth/api/hooks";
import { useOutsidePointerDown } from "@/shared/lib/use-outside-pointerdown";
import { useTheme } from "@/shared/theme/ThemeProvider";
import { Button } from "@/shared/ui/button";
import { getAccessToken } from "@/shared/api/token-storage";
import { cn } from "@/shared/lib/utils";

// Блок хранит основной набор ссылок для полной навигации сайта на desktop.
const primaryNavigation = [
  { to: "/roadmaps", label: "Библиотека" },
  { to: "/collection", label: "Коллекция" },
  { to: "/map", label: "Карта" },
  { to: "/workshop/roadmaps", label: "Мастерская" }
];

// Блок хранит только три нижние кнопки phone-навигации, чтобы нижняя панель не переполняла узкий экран.
const mobileBottomNavigation = [
  { to: "/roadmaps", label: "Библиотека" },
  { to: "/map", label: "Карта" },
  { to: "/collection", label: "Коллекция" }
];

// Блок возвращает ссылки, которые должны жить именно в верхнем выпадающем меню на телефоне.
function getMobileMenuNavigation(isAuthenticated: boolean) {
  return isAuthenticated
    ? [
        { to: "/workshop/roadmaps", label: "Мастерская" },
        { to: "/profile", label: "Профиль" }
      ]
    : [{ to: "/workshop/roadmaps", label: "Мастерская" }];
}

// Блок собирает классы ссылок меню для desktop и mobile-версии header.
function getNavLinkClass(isActive: boolean, isMobile = false) {
  return cn(
    "rounded-full text-sm transition-colors",
    isMobile
      ? "flex w-full items-center justify-between px-4 py-3"
      : "px-5 py-2.5",
    isActive
      ? "bg-primary text-primary-foreground shadow-[0_16px_34px_rgba(124,58,237,0.36),inset_0_1px_0_rgba(255,255,255,0.22)]"
      : "text-muted-foreground hover:bg-white/8 hover:text-foreground"
  );
}

// Блок рендерит отдельную мобильную навигацию, чтобы phone-версия не зависела от desktop-header.
function MobileBottomNav({
  navigationItems
}: {
  navigationItems: Array<{ to: string; label: string }>;
}) {
  return (
    <div className="mobile-bottom-nav fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-background/88 px-2 pb-[calc(env(safe-area-inset-bottom)+0.4rem)] pt-1.5 backdrop-blur-2xl md:hidden">
      <div className="mx-auto grid w-full max-w-sm grid-cols-3 gap-1">
        {navigationItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                "flex min-w-0 items-center justify-center rounded-[1rem] px-1.5 py-2.5 text-center text-xs font-medium leading-tight transition-colors",
                isActive ? "bg-primary text-primary-foreground" : "bg-white/5 text-muted-foreground hover:text-foreground"
              )
            }
          >
            <span className="truncate">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </div>
  );
}

// Блок рендерит верхнюю навигацию приложения.
export function AppHeader() {
  const navigate = useNavigate();
  const location = useLocation();
  const accessToken = getAccessToken();
  const currentUserQuery = useCurrentUserQuery();
  const logoutMutation = useLogoutMutation();
  const { theme, toggleTheme } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement | null>(null);
  const user = currentUserQuery.data?.user;
  // Блок вычисляет отображаемое имя пользователя с приоритетом nickname из профиля.
  const displayName = user?.profile.nickname || user?.username;
  const isAuthenticated = Boolean(accessToken && user);
  // Блок разделяет desktop-навигацию, phone-нижнюю панель и phone-выпадающее меню, чтобы мобильная версия не перегружалась.
  const navigationItems = primaryNavigation;
  const mobileMenuItems = getMobileMenuNavigation(isAuthenticated);
  const mobileBottomItems = mobileBottomNavigation;
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  // Блок закрывает мобильное меню при клике по любой внешней области сайта.
  useOutsidePointerDown(mobileMenuRef, closeMobileMenu, isMobileMenuOpen);

  useEffect(() => {
    closeMobileMenu();
  }, [location.key]);

  useEffect(() => {
    if (!isMobileMenuOpen) {
      return;
    }

    // Блок блокирует скролл body, пока мобильное меню открыто поверх контента.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isMobileMenuOpen]);

  // Блок выполняет logout одинаково для desktop и mobile-панели.
  const handleLogout = () =>
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        closeMobileMenu();
        navigate("/", { replace: true });
      }
    });

  // Блок не даёт outside-click обработчику перехватывать тап по кнопке menu/X и ломать ожидаемое закрытие dropdown.
  const handleMobileMenuTogglePointerDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
    event.stopPropagation();
  };

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-40 border-b border-white/10 bg-background/56 shadow-[0_12px_40px_rgba(15,10,31,0.18)] backdrop-blur-2xl">
        <div className="mx-auto flex w-full max-w-7xl items-center gap-3 px-3 py-2.5 sm:gap-4 sm:px-6 sm:py-3 lg:grid lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:gap-6 lg:px-8">
          <div className="min-w-0 flex flex-1 items-center gap-2.5 sm:gap-3 lg:justify-self-start">
            <Link to="/" className="flex items-center justify-center">
              <img
                alt="ветка"
                className="h-9 w-auto object-contain sm:h-12"
                src={logoImage}
              />
            </Link>
            <div className="min-w-0">
              <div className="hidden text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground sm:block">личная траектория развития</div>
              <Link to="/" className="block truncate font-heading text-lg font-semibold tracking-tight transition-opacity hover:opacity-80 sm:text-3xl">
                ветка
              </Link>
            </div>
          </div>

          <nav className="glass-surface hidden items-center rounded-full p-1.5 lg:flex lg:justify-self-center">
            {navigationItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => getNavLinkClass(isActive)}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="hidden items-center gap-2 lg:flex lg:justify-self-end">
            <Button
              aria-label={theme === "dark" ? "Переключить на светлую тему" : "Переключить на тёмную тему"}
              onClick={toggleTheme}
              size="sm"
              type="button"
              variant="ghost"
            >
              {theme === "dark" ? <SunMedium className="h-4 w-4" /> : <MoonStar className="h-4 w-4" />}
            </Button>

            <NavLink
              to="/about"
              className={({ isActive }) =>
                cn(
                  "text-sm transition-colors",
                  isActive ? "text-foreground font-medium" : "text-muted-foreground hover:text-foreground"
                )
              }
            >
              О проекте
            </NavLink>

            {isAuthenticated ? (
              <>
                <div className="glass-surface hidden max-w-[14rem] rounded-full px-4 py-2 text-right lg:block">
                  <Link to="/profile" className="block truncate text-sm font-medium transition-opacity hover:opacity-75">
                    {displayName}
                  </Link>
                </div>
                <Button
                  aria-label="Выйти из аккаунта"
                  className="border-red-500/20 bg-red-500/10 text-red-300 hover:bg-red-500/18 hover:text-red-200"
                  disabled={logoutMutation.isPending}
                  onClick={handleLogout}
                  size="sm"
                  variant="outline"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <>
                <Button asChild variant="ghost">
                  <Link to="/login">Вход</Link>
                </Button>
                <Button asChild>
                  <Link to="/register">Регистрация</Link>
                </Button>
              </>
            )}
          </div>

          <div className="flex items-center gap-2 lg:hidden">
            <Button
              aria-label={theme === "dark" ? "Переключить на светлую тему" : "Переключить на тёмную тему"}
              onClick={toggleTheme}
              size="sm"
              type="button"
              variant="ghost"
            >
              {theme === "dark" ? <SunMedium className="h-4 w-4" /> : <MoonStar className="h-4 w-4" />}
            </Button>
            <Button
              aria-controls="mobile-navigation"
              aria-expanded={isMobileMenuOpen}
              aria-label={isMobileMenuOpen ? "Закрыть меню" : "Открыть меню"}
              onClick={() => setIsMobileMenuOpen((currentValue) => !currentValue)}
              onPointerDown={handleMobileMenuTogglePointerDown}
              size="sm"
              type="button"
              variant="outline"
            >
              {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {isMobileMenuOpen ? (
          <>
            <button
              aria-label="Закрыть мобильное меню"
              className="fixed inset-0 top-[4.4rem] z-30 bg-background/36 backdrop-blur-sm sm:top-[4.9rem] lg:hidden"
              onClick={closeMobileMenu}
              type="button"
            />
            <div className="mobile-top-menu absolute inset-x-0 top-full z-40 overflow-x-hidden px-3 pb-3 pt-2.5 lg:hidden sm:px-6 sm:pb-4 sm:pt-3">
              <div className="mx-auto max-w-7xl" ref={mobileMenuRef}>
                <div className="glass-surface mobile-top-menu-panel grid gap-3 rounded-[1.6rem] p-3 sm:rounded-[2rem]">
                  <nav className="grid gap-2" id="mobile-navigation">
                    {mobileMenuItems.map((item) => (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        className={({ isActive }) => getNavLinkClass(isActive, true)}
                      >
                        {item.label}
                      </NavLink>
                    ))}
                  </nav>

                  {isAuthenticated ? (
                    <div className="grid gap-3 rounded-[1.5rem] border border-white/10 bg-white/5 p-3">
                      <div className="min-w-0">
                        <Link to="/profile" className="block truncate text-sm font-semibold">
                          {displayName}
                        </Link>
                        <div className="mt-1 truncate text-xs text-muted-foreground">{user?.email}</div>
                      </div>
                      <NavLink
                        to="/about"
                        className={({ isActive }) =>
                          cn(
                            "rounded-2xl px-4 py-2.5 text-sm transition-colors",
                            isActive ? "bg-primary/12 text-foreground font-medium" : "text-muted-foreground hover:bg-white/8 hover:text-foreground"
                          )
                        }
                        onClick={closeMobileMenu}
                      >
                        О проекте
                      </NavLink>
                      <Button
                        className="w-full border-red-500/20 bg-red-500/10 text-red-300 hover:bg-red-500/18 hover:text-red-200"
                        disabled={logoutMutation.isPending}
                        onClick={handleLogout}
                        type="button"
                        variant="outline"
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        Выйти
                      </Button>
                    </div>
                  ) : (
                    <div className="grid gap-2">
                      <NavLink
                        to="/about"
                        className={({ isActive }) =>
                          cn(
                            "rounded-2xl px-4 py-2.5 text-sm transition-colors",
                            isActive ? "bg-primary/12 text-foreground font-medium" : "text-muted-foreground hover:bg-white/8 hover:text-foreground"
                          )
                        }
                        onClick={closeMobileMenu}
                      >
                        О проекте
                      </NavLink>
                      <div className="grid gap-2 sm:grid-cols-2">
                        <Button asChild className="w-full" variant="ghost">
                          <Link to="/login">Вход</Link>
                        </Button>
                        <Button asChild className="w-full">
                          <Link to="/register">Регистрация</Link>
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        ) : null}
      </header>
      <MobileBottomNav navigationItems={mobileBottomItems} />
    </>
  );
}
