// src/components/Header.tsx
"use client";

import { useEffect, useState } from "react";
import { onec } from "@/app/api/onec";

type HeaderProps = {
  onNotificationsClick?: () => void;
  hasUnread?: boolean;
  userName?: string;
};

export default function Header({
  onNotificationsClick,
  hasUnread = false,
  userName,
}: HeaderProps) {
  const [loading, setLoading] = useState(!userName);
  const [apiName, setApiName] = useState<string | null>(null);

  useEffect(() => {
    if (userName) return;
    let alive = true;
    (async () => {
      try {
        const u = await onec.user.get();
        if (!alive) return;
        setApiName(u?.fullName || null);
      } catch {
        // игнорируем
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [userName]);

  const title = userName ?? apiName ?? "";

  return (
    <header className="fixed inset-x-0 top-0 z-[1000] bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 pointer-events-auto">
      <div className="mx-auto max-w-[520px] px-4 py-3">
        <div className="relative flex items-center justify-between">
          {/* ЛОГО */}
          <div className="relative z-10 flex h-10 w-10 items-center justify-start">
            <img src="/logo.svg" alt="МедГрафт" className="h-7 w-auto" />
          </div>

          {/* Имя пользователя */}
          <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none">
            {loading ? (
              <span
                aria-hidden
                className="h-[20px] w-[180px] rounded-full bg-white/50 backdrop-blur-sm supports-[backdrop-filter]:bg-white/30 animate-pulse pointer-events-none"
              />
            ) : (
              <div className="truncate text-[17px] font-semibold text-slate-900 pointer-events-none">
                {title || "—"}
              </div>
            )}
          </div>

          {/* Уведомления */}
          <div className="relative z-10 flex h-10 w-10 items-center justify-end">
            <button
              aria-label="Уведомления"
              onClick={onNotificationsClick}
              className="inline-flex h-10 w-10 items-center justify-center"
            >
              <img
                src={hasUnread ? "/new_notifications.svg" : "/notifications.svg"}
                alt="Уведомления"
                className="h-15 w-15"
              />
            </button>
          </div>
        </div>
      </div>
      <div className="h-px w-full bg-slate-100" />
    </header>
  );
}
