"use client";
import { useEffect, useMemo, useState } from "react";
import SheetFrame, { SectionCard } from "@/components/SheetFrame";
import { getDeferredPrompt, type DeferredPromptEvent } from "@/utils/pwaInstall";
type Notification =
  | { id: string; kind: "install-app"; title: string; text: string; mode: "install" | "hint" }
  | { id: string; kind: "generic" | "appointment" | "document"; title: string; text: string; time: string; unread?: boolean };

type DeferredPromptWindow = Window & {
  __deferredPrompt?: DeferredPromptEvent | null;
};

const DEMO: Notification[] = [
  { id: "n1", kind: "appointment", title: "Напоминание о приёме", text: "Завтра в 10:00 у вас офтальмолог.", time: "09:10", unread: true },
  { id: "n2", kind: "document",   title: "Готов результат",        text: "Доступно новое исследование: МРТ.", time: "08:22" },
];

export default function NotificationsSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isChromeAndroid, setIsChromeAndroid] = useState(false);
  const [bip, setBip] = useState<DeferredPromptEvent | null>(null);
  const [dismissedInstall, setDismissedInstall] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;

    const ua = navigator.userAgent || "";
    const vendor = navigator.vendor || "";
    const android = /android/i.test(ua);
    const ios = /iphone|ipad|ipod/i.test(ua);
    setIsMobile(android || ios);

    const chromeAndroid = android && /Chrome/i.test(ua) && /Google Inc/.test(vendor) && !/OPR|Edg/i.test(ua);
    setIsChromeAndroid(chromeAndroid);

    const nav = navigator as Navigator & { standalone?: boolean };
    const standaloneIOS = nav.standalone === true;
    const mq = "matchMedia" in window ? window.matchMedia("(display-mode: standalone)").matches : false;
    setIsStandalone(standaloneIOS || mq);

    setBip(getDeferredPrompt());

    const onAvail = () => setBip(getDeferredPrompt());
    const onInstalled = () => {
      (window as DeferredPromptWindow).__deferredPrompt = null;
      setBip(null);
      setDismissedInstall(true);
    };
    window.addEventListener("pwa:bip-available", onAvail);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("pwa:bip-available", onAvail);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, [open]);

  const list: Notification[] = useMemo(() => {
    if (!mounted || !open) return [];
    const base = [...DEMO];

    if (dismissedInstall || isStandalone) return base;

    if (isMobile) {
      const canInstallNow =
        !!bip &&
        isChromeAndroid &&
        (window.location.hostname === "localhost" || window.isSecureContext);

      base.unshift({
        id: "install",
        kind: "install-app",
        title: "Установите приложение",
        text: canInstallNow
          ? "Откроется системное окно установки."
          : (iosLike()
              ? "Откройте «Поделиться» → «На экран “Домой”»."
              : "Откройте меню браузера и выберите «Добавить на главный экран»."),
        mode: canInstallNow ? "install" : "hint",
      });
    }
    return base;

    function iosLike() {
      const ua = navigator.userAgent || "";
      return /iphone|ipad|ipod/i.test(ua);
    }
  }, [mounted, open, isMobile, isStandalone, isChromeAndroid, bip, dismissedInstall]);

  async function handleInstall() {
    if (!bip) return;
    try {
      await bip.prompt();
      if (bip.userChoice) {
        await bip.userChoice;
      }
      setDismissedInstall(true);
      setBip(null);
      (window as DeferredPromptWindow).__deferredPrompt = null;
    } catch {
      setDismissedInstall(true);
      setBip(null);
      (window as DeferredPromptWindow).__deferredPrompt = null;
    }
  }

  return (
    <SheetFrame open={open} onClose={onClose} title="Уведомления" iconSrc="/list.svg">
      <SectionCard>
        {mounted && list.length === 0 && (
          <div className="p-4 text-center text-slate-500">Новых уведомлений нет</div>
        )}

        <ul className="divide-y divide-slate-100">
          {list.map((n) => (
            <li key={n.id} className="px-4 py-3">
              {n.kind === "install-app" ? (
                <div className="flex items-start justify-between gap-4">
                  <div className="leading-tight">
                    <div className="text-[16px] font-extrabold text-slate-900">{n.title}</div>
                    <div className="mt-1 text-[13.5px] font-medium text-slate-600">{n.text}</div>
                  </div>

                  {n.mode === "install" ? (
                    <button
                      onClick={handleInstall}
                      className="mt-1 inline-flex h-9 items-center justify-center rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 px-3 text-[13.5px] font-semibold text-white"
                    >
                      Установить
                    </button>
                  ) : (
                    <button
                      onClick={() => setDismissedInstall(true)}
                      className="mt-1 inline-flex h-9 items-center justify-center rounded-xl border border-slate-200 px-3 text-[13.5px] font-semibold text-slate-700"
                    >
                      Понятно
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex items-start justify-between gap-4">
                  <div className="leading-tight">
                    <div className="text-[16px] font-extrabold text-slate-900">
                      {n.title}
                      {n.unread && (
                        <span className="ml-2 inline-block h-1.5 w-1.5 translate-y-[-2px] rounded-full bg-sky-500 align-middle" />
                      )}
                    </div>
                    <div className="mt-1 text-[13.5px] font-medium text-slate-600">{n.text}</div>
                  </div>
                  <div className="mt-0.5 shrink-0 text-[12.5px] font-semibold text-slate-400">
                    {n.time}
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      </SectionCard>
    </SheetFrame>
  );
}
