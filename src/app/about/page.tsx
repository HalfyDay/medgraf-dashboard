"use client";

import AppImage from "@/components/AppImage";

export default function AboutPage() {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <main className="flex-1">
        <div className="mx-auto max-w-[520px] -mt-14 px-4 pb-6 md:-mt-16">
          <div className="relative">
            <section className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#0F86FF] via-[#1492FF] to-[#1CA7FF] px-6 pt-[76px] pb-24 text-white md:pt-[84px]">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 opacity-60"
                style={{
                  background:
                    "radial-gradient(120% 80% at 0% 0%, rgba(255,255,255,.22) 0%, rgba(255,255,255,0) 55%), radial-gradient(110% 70% at 100% 10%, rgba(255,255,255,.16) 0%, rgba(255,255,255,0) 55%)",
                }}
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -right-16 top-10 h-56 w-56 rounded-full bg-white/10 blur-2xl"
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -left-16 bottom-0 h-56 w-56 rounded-full bg-white/10 blur-2xl"
              />

              <div className="relative">
                <div className="text-[13px] font-semibold uppercase tracking-wide text-white/85">
                  О клинике
                </div>
                <h1 className="mt-3 text-[44px] font-extrabold leading-none tracking-tight">
                  Медграфт
                </h1>
              </div>
            </section>

            <section className="relative z-10 -mt-16 rounded-[28px] bg-white p-6 shadow-[0_18px_50px_rgba(14,74,166,0.12)] dark:bg-slate-900">
              <h2 className="text-[28px] font-bold leading-tight text-[#0B0F17] dark:text-slate-100">
                Наша клиника
              </h2>

              <div className="mt-6 grid grid-cols-[78px_1fr] items-center gap-5">
                <AppImage
                  src="/map.svg"
                  alt="Карта"
                  width={78}
                  height={78}
                  priority
                  className="h-auto w-[78px]"
                />

                <p className="text-[17px] leading-[22px] text-[#0B0F17] dark:text-slate-100">
                  Мы с гордостью{" "}
                  <span className="font-semibold text-[#0F86FF] dark:text-sky-400">развиваем</span>{" "}
                  <span className="font-semibold text-[#0F86FF] dark:text-sky-400">качественную</span>{" "}
                  медицину на севере Иркутской области, оказывая свои услуги жителям{" "}
                  <span className="font-semibold text-[#0F86FF] dark:text-sky-400">
                    Братска, Усть-Илимска и Усть-Кута
                  </span>
                  .
                </p>
              </div>

              <div className="mt-7 flex items-start justify-between gap-4">
                <p className="text-[17px] leading-[22px] text-[#0B0F17] dark:text-slate-100">
                  Сегодня наша Клиника — это большой,{" "}
                  <span className="font-semibold text-[#0F86FF] dark:text-sky-400">дружный</span>{" "}
                  <span className="font-semibold text-[#0F86FF] dark:text-sky-400">коллектив</span>{" "}
                  единомышленников и высококвалифицированных специалистов из{" "}
                  <span className="font-semibold text-[#0F86FF] dark:text-sky-400">разных</span>{" "}
                  <span className="font-semibold text-[#0F86FF] dark:text-sky-400">областей медицины</span>
                  .
                </p>

                <div className="shrink-0 w-[105px] text-center">
                  <div className="text-[23px] font-extrabold leading-[0.95] tracking-wide text-[#0F86FF] dark:text-sky-400">
                    БОЛЕЕ
                  </div>
                  <div className="mt-[2px] text-[50px] font-extrabold leading-[0.95] tracking-tight text-[#0F86FF] dark:text-sky-400">
                    150
                  </div>
                  <div className="mt-[1px] text-[13px] font-semibold leading-[0.95] text-[#0F86FF] dark:text-sky-400">
                    сотрудников
                  </div>
                </div>
              </div>

              <div className="mt-8 space-y-4">
                <button
                  type="button"
                  disabled
                  className="w-full rounded-[18px] bg-[#0F86FF] px-6 py-[18px] text-center text-[20px] font-semibold text-white shadow-[0_12px_28px_rgba(15,134,255,0.25)] disabled:opacity-100 disabled:cursor-default"
                >
                  Врачи
                </button>
                <button
                  type="button"
                  disabled
                  className="w-full rounded-[18px] bg-[#0F86FF] px-6 py-[18px] text-center text-[20px] font-semibold text-white shadow-[0_12px_28px_rgba(15,134,255,0.25)] disabled:opacity-100 disabled:cursor-default"
                >
                  Фото клиники
                </button>
              </div>
            </section>
          </div>
        </div>
      </main>

      <div className="h-20 md:h-24" />
    </div>
  );
}
