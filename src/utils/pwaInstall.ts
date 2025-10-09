"use client";

export type DeferredPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice?: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type DeferredPromptWindow = Window & {
  __deferredPrompt?: DeferredPromptEvent | null;
  __pwaInit?: boolean;
};

const getWindow = (): DeferredPromptWindow => window as DeferredPromptWindow;

export function getDeferredPrompt(): DeferredPromptEvent | null {
  if (typeof window === "undefined") return null;
  return getWindow().__deferredPrompt ?? null;
}

export function initPWAInstallListener() {
  if (typeof window === "undefined") return;
  const win = getWindow();
  if (win.__pwaInit) return;
  win.__pwaInit = true;

  win.addEventListener("beforeinstallprompt", (event: DeferredPromptEvent) => {
    event.preventDefault();
    win.__deferredPrompt = event;
    win.dispatchEvent(new CustomEvent("pwa:bip-available"));
  });

  win.addEventListener("appinstalled", () => {
    win.__deferredPrompt = null;
  });
}
