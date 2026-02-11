"use client";

import Link from "next/link";
import AppImage from "@/components/AppImage";
import AboutHero from "@/components/AboutHero";

export default function AboutPage() {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <main className="flex-1">
        <div className="mx-auto max-w-[520px] -mt-14 px-4 pb-6 md:-mt-16">
          <div className="relative">
            <AboutHero title="Медграфт" />

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

                <p className="min-w-0 text-[15px] leading-[20px] text-[#0B0F17] dark:text-slate-100 sm:text-[17px] sm:leading-[22px]">
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

              <div className="mt-7 flex items-start justify-between gap-3">
                <p className="min-w-0 text-[15px] leading-[20px] text-[#0B0F17] dark:text-slate-100 sm:text-[17px] sm:leading-[22px]">
                  Сегодня наша Клиника — это большой,{" "}
                  <span className="font-semibold text-[#0F86FF] dark:text-sky-400">дружный</span>{" "}
                  <span className="font-semibold text-[#0F86FF] dark:text-sky-400">коллектив</span>{" "}
                  единомышленников и высококвалифицированных специалистов из{" "}
                  <span className="font-semibold text-[#0F86FF] dark:text-sky-400">разных</span>{" "}
                  <span className="font-semibold text-[#0F86FF] dark:text-sky-400">областей медицины</span>
                  .
                </p>

                <div className="w-[72px] shrink-0 sm:w-[90px]">
                  <AppImage
                    src="/150.svg"
                    alt="Более 150 сотрудников"
                    width={90}
                    height={75}
                    className="h-auto w-full object-contain"
                  />
                </div>
              </div>

              <div className="mt-8 space-y-4">
                <Link
                  href="/about/doctors"
                  className="block w-full rounded-[18px] bg-[#0F86FF] px-6 py-[18px] text-center text-[20px] font-semibold text-white shadow-[0_12px_28px_rgba(15,134,255,0.25)]"
                >
                  Врачи
                </Link>
                <Link
                  href="/about/gallery"
                  className="block w-full rounded-[18px] bg-[#0F86FF] px-6 py-[18px] text-center text-[20px] font-semibold text-white shadow-[0_12px_28px_rgba(15,134,255,0.25)]"
                >
                  Фото клиники
                </Link>
              </div>
            </section>
          </div>
        </div>
      </main>

      <div className="h-20 md:h-24" />
    </div>
  );
}
