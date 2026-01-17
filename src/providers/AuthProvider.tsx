"use client";

import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { postJson } from "@/utils/http";
import { normalizePhone } from "@/utils/phone";
import { AUTH_STORAGE_KEY } from "@/constants/auth";
import { useTheme } from "@/providers/ThemeProvider";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

export type AuthUser = {
  id: number;
  phone: string;
  fullName?: string | null;
  birthDate?: string | null;
  email?: string | null;
  passportSeries?: string | null;
  passportNumber?: string | null;
  passportIssuedBy?: string | null;
  passportIssueDate?: string | null;
  onecId?: string | null;
  medcardNumber?: string | null;
  gender?: string | null;
};

type AuthResult =
  | { success: true; user: AuthUser }
  | { success: false; error: string };

type AuthContextValue = {
  user: AuthUser | null;
  status: AuthStatus;
  actionPending: boolean;
  login: (phone: string, password: string) => Promise<AuthResult>;
  logout: () => void;
  setUser: (next: AuthUser | null) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);
const THEME_BY_USER_KEY = "medgraf-theme-by-user";
const SESSION_TTL_MS = 30 * 60 * 1000;

type StoredAuthPayload = {
  user: AuthUser;
  expiresAt: number;
};

const readThemeMap = (): Record<string, "light" | "dark"> => {
  if (typeof window === "undefined") {
    return {};
  }
  try {
    const raw = window.localStorage.getItem(THEME_BY_USER_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, "light" | "dark">;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
};

const writeThemeMap = (map: Record<string, "light" | "dark">) => {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(THEME_BY_USER_KEY, JSON.stringify(map));
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [actionPending, setActionPending] = useState(false);
  const [sessionExpiresAt, setSessionExpiresAt] = useState<number | null>(null);
  const logoutTimerRef = useRef<number | null>(null);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
      if (!raw) {
        setStatus("unauthenticated");
        return;
      }

      const parsed = JSON.parse(raw) as StoredAuthPayload | AuthUser;
      if ("user" in parsed && "expiresAt" in parsed) {
        if (parsed.expiresAt <= Date.now()) {
          window.localStorage.removeItem(AUTH_STORAGE_KEY);
          setStatus("unauthenticated");
          return;
        }
        setUserState(parsed.user);
        setSessionExpiresAt(parsed.expiresAt);
        setStatus("authenticated");
        return;
      }

      const legacyUser = parsed as AuthUser;
      const expiresAt = Date.now() + SESSION_TTL_MS;
      setUserState(legacyUser);
      setSessionExpiresAt(expiresAt);
      setStatus("authenticated");
      window.localStorage.setItem(
        AUTH_STORAGE_KEY,
        JSON.stringify({ user: legacyUser, expiresAt }),
      );
    } catch (error) {
      console.warn("Не удалось восстановить состояние авторизации:", error);
      window.localStorage.removeItem(AUTH_STORAGE_KEY);
      setStatus("unauthenticated");
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!sessionExpiresAt || status !== "authenticated") return;

    if (logoutTimerRef.current) {
      window.clearTimeout(logoutTimerRef.current);
    }

    const delay = Math.max(0, sessionExpiresAt - Date.now());
    logoutTimerRef.current = window.setTimeout(() => {
      setTheme("light");
      setUserState(null);
      setSessionExpiresAt(null);
      setStatus("unauthenticated");
      window.localStorage.removeItem(AUTH_STORAGE_KEY);
    }, delay);

    return () => {
      if (logoutTimerRef.current) {
        window.clearTimeout(logoutTimerRef.current);
      }
    };
  }, [sessionExpiresAt, setTheme, status]);

  useEffect(() => {
    if (!user || status !== "authenticated" || typeof window === "undefined") {
      return;
    }
    const userKey = user.id ? String(user.id) : user.phone;
    if (!userKey) return;
    const map = readThemeMap();
    if (map[userKey] === theme) return;
    map[userKey] = theme;
    writeThemeMap(map);
  }, [status, theme, user]);

  useEffect(() => {
    if (!user || status !== "authenticated" || typeof window === "undefined") {
      return;
    }
    const userKey = user.id ? String(user.id) : user.phone;
    if (!userKey) return;
    const map = readThemeMap();
    const stored = map[userKey];
    if (stored && stored !== theme) {
      setTheme(stored);
    }
  }, [setTheme, status, theme, user]);

  const persistUser = useCallback((next: AuthUser | null) => {
    setUserState(next);
    setStatus(next ? "authenticated" : "unauthenticated");
    if (typeof window === "undefined") {
      return;
    }
    if (next) {
      const expiresAt = Date.now() + SESSION_TTL_MS;
      setSessionExpiresAt(expiresAt);
      window.localStorage.setItem(
        AUTH_STORAGE_KEY,
        JSON.stringify({ user: next, expiresAt }),
      );
    } else {
      setSessionExpiresAt(null);
      window.localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  }, []);

  const login = useCallback(
    async (phone: string, password: string): Promise<AuthResult> => {
      const cleanedPhone = normalizePhone(phone);
      setActionPending(true);
      try {
        const result = await postJson<{ user: AuthUser }>("/api/auth/login", {
          phone: cleanedPhone,
          password,
        });
        persistUser(result.user);
        const userKey = result.user.id ? String(result.user.id) : result.user.phone;
        const map = readThemeMap();
        const nextTheme = (userKey && map[userKey]) ? map[userKey] : "light";
        if (nextTheme !== theme) {
          setTheme(nextTheme);
        }
        return { success: true, user: result.user };
      } catch (error) {
        console.warn("Авторизация не удалась:", error);
        persistUser(null);
        const message = error instanceof Error ? error.message : "Не удалось войти";
        return { success: false, error: message };
      } finally {
        setActionPending(false);
      }
    },
    [persistUser, setTheme, theme],
  );

  const logout = useCallback(() => {
    persistUser(null);
    setTheme("light");
  }, [persistUser, setTheme]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      status,
      actionPending,
      login,
      logout,
      setUser: persistUser,
    }),
    [actionPending, login, logout, persistUser, status, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth должен вызываться внутри AuthProvider");
  }
  return ctx;
}
