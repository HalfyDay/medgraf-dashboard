"use client";
/* eslint-disable @next/next/no-img-element */

type BootSplashProps = {
  visible: boolean;
};

export default function BootSplash({ visible }: BootSplashProps) {
  return (
    <div
      aria-hidden={!visible}
      className={`fixed inset-0 z-[2000] transition-opacity duration-400 ${
        visible ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      }`}
    >
      <div className="absolute inset-0 bg-white/60 backdrop-blur supports-[backdrop-filter]:bg-white/40" />

      <div className="relative z-10 flex h-full w-full items-center justify-center p-6">
        <div className="w-full max-w-[360px] rounded-3xl bg-white/60 p-8 text-center shadow-xl backdrop-blur-md ring-1 ring-white/30 supports-[backdrop-filter]:bg-white/40">
          <div className="mx-auto mb-4 grid place-items-center">
            <img
              src="/logo.svg"
              alt="MedGraf"
              className="h-10 w-10"
              width={40}
              height={40}
              decoding="async"
            />
          </div>

          <div className="text-[24px] font-semibold text-slate-900">Добро пожаловать!</div>
          <div className="mt-1 text-[16px] text-slate-500">
            Загружаем данные и интерфейс, это займёт всего пару секунд.
          </div>

          <div className="mt-6 flex items-center justify-center gap-2 text-sky-600">
            <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" opacity=".2" />
              <path
                d="M21 12a9 9 0 0 0-9-9"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
            <span className="text-[15.5px]">Подготовка приложения…</span>
          </div>
        </div>
      </div>
    </div>
  );
}
