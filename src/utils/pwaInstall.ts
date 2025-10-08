let deferred: any = null;

export function getDeferredPrompt(): any | null {
  if (typeof window === "undefined") return null;
  return (window as any).__deferredPrompt ?? null;
}


export function initPWAInstallListener() {
  if (typeof window === "undefined") return;
  if ((window as any).__pwaInit) return; // не дублировать
  (window as any).__pwaInit = true;

  window.addEventListener("beforeinstallprompt", (e: any) => {
    e.preventDefault();
    deferred = e;
    window.dispatchEvent(new CustomEvent("pwa:bip-available"));
  });
}
