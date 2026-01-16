"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

type Theme = "light" | "dark";
type ThemeContextValue = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
};

const THEME_STORAGE_KEY = "medgraf-theme";
const THEME_COOKIE = "medgraf-theme";
const ThemeContext = createContext<ThemeContextValue | null>(null);

const applyTheme = (theme: Theme) => {
  const root = document.documentElement;
  if (theme === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
  root.style.colorScheme = theme;
};

const readCookieTheme = (): Theme | null => {
  if (typeof document === "undefined") {
    return null;
  }
  const match = document.cookie.match(/(?:^|; )medgraf-theme=([^;]+)/);
  const value = match ? decodeURIComponent(match[1]) : "";
  return value === "dark" || value === "light" ? value : null;
};

const writeCookieTheme = (theme: Theme) => {
  if (typeof document === "undefined") {
    return;
  }
  const maxAge = 60 * 60 * 24 * 365;
  document.cookie = `${THEME_COOKIE}=${theme}; path=/; max-age=${maxAge}`;
};

const getInitialTheme = (): Theme => {
  if (typeof document === "undefined") {
    return "light";
  }
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const cookieTheme = readCookieTheme();
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    const next =
      cookieTheme ??
      (stored === "dark" || stored === "light" ? stored : null) ??
      (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    setThemeState(next);
    applyTheme(next);
    writeCookieTheme(next);
    if (stored !== next) {
      window.localStorage.setItem(THEME_STORAGE_KEY, next);
    }
  }, []);

  const setTheme = (next: Theme) => {
    setThemeState(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(THEME_STORAGE_KEY, next);
    }
    writeCookieTheme(next);
    applyTheme(next);
  };

  const toggleTheme = () => {
    setThemeState((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      if (typeof window !== "undefined") {
        window.localStorage.setItem(THEME_STORAGE_KEY, next);
      }
      writeCookieTheme(next);
      applyTheme(next);
      return next;
    });
  };

  const value = useMemo(() => ({ theme, setTheme, toggleTheme }), [theme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return ctx;
}
