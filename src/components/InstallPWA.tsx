"use client";
import { useEffect, useState } from "react";
import { type DeferredPromptEvent } from "@/utils/pwaInstall";

export default function InstallPWA() {
  const [mounted, setMounted] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<DeferredPromptEvent | null>(null);
  const [show, setShow] = useState(false);

  const [isMobile, setIsMobile] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    setMounted(true);
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const ua = navigator.userAgent || "";
    const ios = /iphone|ipad|ipod/i.test(ua);
    const android = /android/i.test(ua);
    setIsIOS(ios);
    setIsAndroid(android);
    setIsMobile(ios || android);

    const nav = navigator as Navigator & { standalone?: boolean };
    const standaloneIOS = nav.standalone === true;
    const mq = "matchMedia" in window ? window.matchMedia("(display-mode: standalone)").matches : false;
    setIsStandalone(standaloneIOS || mq);
  }, [mounted]);

  // BIP + фоллбэк
  useEffect(() => {
    if (!mounted || !isMobile || isStandalone) return;

    let fallbackTimer: ReturnType<typeof window.setTimeout> | undefined;

    const onBIP = (e: DeferredPromptEvent) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShow(true);             // показать с кнопкой «Установить»
      if (fallbackTimer) window.clearTimeout(fallbackTimer);
    };

    window.addEventListener("beforeinstallprompt", onBIP as EventListener);

    // ФОЛЛБЭК: на Android через 3 сек. показать подсказку, если BIP не пришёл
    if (isAndroid) {
      fallbackTimer = window.setTimeout(() => {
        if (!deferredPrompt) setShow(true);  // покажем карточку с инструкцией
      }, 3000);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", onBIP as EventListener);
      if (fallbackTimer) window.clearTimeout(fallbackTimer);
    };
  }, [mounted, isMobile, isAndroid, isStandalone, deferredPrompt]);

  if (!mounted || !isMobile || isStandalone || !show) return null;

  const androidHasPrompt = isAndroid && !!deferredPrompt;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[100] mx-auto w-full max-w-[520px] px-4 pb-4">
      <div className="flex items-center justify-between gap-3 rounded-2xl bg-white p-3 shadow-xl ring-1 ring-slate-200">
        <div className="text-[14.5px] leading-snug text-slate-800">
          {isIOS
            ? "Добавьте приложение: Поделиться → На экран «Домой»"
            : androidHasPrompt
              ? "Установить «МедГрафт» как приложение?"
              : "Добавьте приложение: Меню ⋮ → «Добавить на главный экран»"}
        </div>

        {!isIOS && (
          <button
            className="rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 px-3 py-2 text-[14px] font-semibold text-white"
            onClick={async () => {
              if (deferredPrompt) {
                await deferredPrompt.prompt();
                setDeferredPrompt(null);
                setShow(false);
              } else {
                // Нет BIP: мягко скрываем, пользователь воспользуется подсказкой
                setShow(false);
              }
            }}
          >
            {androidHasPrompt ? "Установить" : "Понятно"}
          </button>
        )}

        <button
          className="rounded-xl px-3 py-2 text-[14px] font-medium text-slate-600 hover:bg-slate-50"
          onClick={() => setShow(false)}
        >
          Позже
        </button>
      </div>
    </div>
  );
}
