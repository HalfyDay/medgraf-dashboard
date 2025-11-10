"use client";

import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { postJson } from "@/utils/http";
import { normalizePhone } from "@/utils/phone";

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

const STORAGE_KEY = "medgraf.auth-state.v1";

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [actionPending, setActionPending] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        setStatus("unauthenticated");
        return;
      }

      const parsed: AuthUser = JSON.parse(raw);
      setUserState(parsed);
      setStatus("authenticated");
    } catch (error) {
      console.warn("Не удалось восстановить состояние авторизации:", error);
      window.localStorage.removeItem(STORAGE_KEY);
      setStatus("unauthenticated");
    }
  }, []);

  const persistUser = useCallback((next: AuthUser | null) => {
    setUserState(next);
    setStatus(next ? "authenticated" : "unauthenticated");
    if (typeof window === "undefined") {
      return;
    }
    if (next) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
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
    [persistUser],
  );

  const logout = useCallback(() => {
    persistUser(null);
  }, [persistUser]);

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
