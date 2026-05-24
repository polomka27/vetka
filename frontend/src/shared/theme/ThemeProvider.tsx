import { createContext, useContext, useEffect, useMemo, useState, type PropsWithChildren } from "react";

// Блок описывает допустимые значения темы интерфейса.
type ThemeMode = "light" | "dark";

// Блок задаёт ключ для хранения выбранной темы в localStorage.
const THEME_STORAGE_KEY = "vetka_theme_mode";

// Блок описывает публичный контракт theme context для переключения темы.
interface ThemeContextValue {
  theme: ThemeMode;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

// Блок определяет стартовую тему из localStorage или, по умолчанию, включает тёмную тему.
function getInitialTheme(): ThemeMode {
  if (typeof window === "undefined") {
    return "dark";
  }

  const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (savedTheme === "light" || savedTheme === "dark") {
    return savedTheme;
  }

  return "dark";
}

// Блок управляет выбранной темой и синхронизирует её с DOM.
export function ThemeProvider({ children }: PropsWithChildren) {
  const [theme, setTheme] = useState<ThemeMode>(getInitialTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  useEffect(() => {
    // Блок синхронизирует тему между вкладками, чтобы интерфейс не расходился в открытых окнах.
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== THEME_STORAGE_KEY) {
        return;
      }

      if (event.newValue === "light" || event.newValue === "dark") {
        setTheme(event.newValue);
      }
    };

    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      toggleTheme: () => {
        setTheme((currentTheme) => (currentTheme === "dark" ? "light" : "dark"));
      }
    }),
    [theme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

// Блок предоставляет удобный доступ к текущей теме из компонентов интерфейса.
export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme должен использоваться внутри ThemeProvider.");
  }

  return context;
}
