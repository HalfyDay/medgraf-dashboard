"use client";

import { useEffect, useMemo, useState } from "react";
import AppImage from "@/components/AppImage";
import { DOCTOR_AVATAR_PLACEHOLDER, fetchDoctorsDirectory } from "@/utils/api";
import type { DoctorDirectoryEntry } from "@/types/clinic";
import BookingFlowSheet from "@/components/BookingFlowSheet";
import AboutHero from "@/components/AboutHero";

const formatShortName = (fullName: string) => {
  const parts = fullName
    .split(/\s+/)
    .map((item) => item.trim())
    .filter(Boolean);
  if (parts.length === 0) return fullName;
  const [surname, firstName, middleName] = parts;
  const initial = firstName?.[0] ? `${firstName[0]}.` : "";
  const middle = middleName?.[0] ? `${middleName[0]}.` : "";
  return [surname, initial, middle].filter(Boolean).join(" ");
};

const formatPrice = (value?: number | null) => {
  if (typeof value !== "number" || Number.isNaN(value) || value <= 0) return "—";
  return `${value.toLocaleString("ru-RU", { useGrouping: false })}₽`;
};

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState<DoctorDirectoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    fetchDoctorsDirectory()
      .then((data) => {
        if (!active) return;
        const sorted = [...data].sort((a, b) => a.fullName.localeCompare(b.fullName, "ru"));
        setDoctors(sorted);
      })
      .catch((err) => {
        if (!active) return;
        console.warn("Failed to load doctors", err);
        setError("Не удалось загрузить список врачей.");
        setDoctors([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const list = useMemo(() => doctors, [doctors]);

  const handleOpenBooking = (doctorId: string) => {
    setSelectedDoctorId(doctorId);
    setBookingOpen(true);
  };


  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <main className="flex-1">
        <div className="mx-auto max-w-[520px] -mt-14 px-4 pb-6 md:-mt-16">
          <div className="relative">
            <AboutHero title="Врачи клиники" />

            <section className="relative z-10 -mt-16 rounded-[28px] bg-white p-5 shadow-[0_18px_50px_rgba(14,74,166,0.12)] dark:bg-slate-900">
              {loading && (
                <div className="rounded-2xl bg-slate-100 px-5 py-4 text-center text-sm text-slate-600 dark:bg-slate-800 dark:text-slate-200">
                  Загружаем список врачей…
                </div>
              )}
              {!loading && error && (
                <div className="rounded-2xl bg-rose-50 px-5 py-4 text-center text-sm text-rose-600 dark:bg-rose-900/30 dark:text-rose-200">
                  {error}
                </div>
              )}
              {!loading && !error && list.length === 0 && (
                <div className="rounded-2xl bg-slate-100 px-5 py-4 text-center text-sm text-slate-600 dark:bg-slate-800 dark:text-slate-200">
                  Список врачей пока пуст.
                </div>
              )}

              <div className="space-y-5">
                {list.map((doctor) => {
                  const photo =
                    doctor.photoUrl && doctor.photoUrl.length > 0
                      ? doctor.photoUrl
                      : DOCTOR_AVATAR_PLACEHOLDER;
                  const reviews =
                    typeof doctor.numberComments === "number" ? doctor.numberComments : 0;
                  const education = doctor.institution || "—";
                  const experience =
                    typeof doctor.experience === "number" && doctor.experience > 0
                      ? `${doctor.experience} лет`
                      : "—";
                  const specialty = doctor.specialties?.[0] || "Врач клиники";
                  const services = doctor.services ?? [];
                  const priced = services
                    .map((service) =>
                      typeof service.price === "number" ? service.price : null,
                    )
                    .filter((value): value is number => typeof value === "number");
                  const minPrice =
                    priced.length > 0 ? Math.min(...priced) : undefined;
                  return (
                    <article
                      key={doctor.id}
                      className="rounded-[22px] bg-white p-4 shadow-[0_10px_30px_rgba(15,134,255,0.08)] ring-1 ring-slate-100 dark:bg-slate-900 dark:ring-slate-700"
                    >
                      <div className="flex gap-4">
                        <div className="relative h-[84px] w-[84px] overflow-hidden rounded-[14px] rounded-tr-[25px] rounded-bl-[25px] bg-slate-100 dark:bg-slate-800">
                          <AppImage
                            src={photo}
                            alt={doctor.fullName}
                            width={84}
                            height={84}
                            className="h-full w-full object-cover"
                          />
                          <span
                            className="absolute left-1.5 top-1.5 h-4 w-4 rounded-full"
                            style={{
                              background:
                                "radial-gradient(circle at center, rgba(14,165,233,1) 0 5px, rgba(14,165,233,0.25) 5px 8px)",
                            }}
                          />
                        </div>
                        <div className="min-w-0">
                          <div className="text-[14px] font-semibold text-[#0F86FF]">
                            Медграфт
                          </div>
                          <div className="mt-1 text-[18px] font-bold text-slate-900 dark:text-slate-100">
                            {formatShortName(doctor.fullName)}
                          </div>
                          <div className="mt-1 text-[14px] text-slate-500 dark:text-slate-400">
                            {specialty}
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-[1fr_1.2fr_1fr] overflow-hidden rounded-[18px] border border-slate-100 bg-white text-center text-[13px] text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                        <div className="px-3 py-3 max-[360px]:px-2">
                          <div className="flex items-center justify-center gap-1 text-slate-900 dark:text-slate-100">
                            <AppImage src="/star.svg" alt="" width={16} height={16} className="h-4 w-4 max-[360px]:h-3.5 max-[360px]:w-3.5" />
                            <span className="font-bold truncate max-[360px]:max-w-[50px] max-[360px]:text-[12px]">Отзывы</span>
                          </div>
                          <div className="mt-1 font-semibold text-[#0F86FF]">{reviews}</div>
                        </div>
                        <div className="border-x border-slate-100 px-3 py-3 max-[360px]:px-2 dark:border-slate-800">
                          <div className="flex items-center justify-center gap-1 text-slate-900 dark:text-slate-100">
                            <AppImage src="/verified.svg" alt="" width={16} height={16} className="h-4 w-4 max-[360px]:h-3.5 max-[360px]:w-3.5" />
                            <span className="font-bold truncate max-[360px]:max-w-[58px] max-[360px]:text-[12px]">Образование</span>
                          </div>
                          <div className="mt-1 font-semibold text-[#0F86FF]">{education}</div>
                        </div>
                        <div className="px-3 py-3 max-[360px]:px-2">
                          <div className="flex items-center justify-center gap-1 text-slate-900 dark:text-slate-100">
                            <AppImage src="/briefcase.svg" alt="" width={16} height={16} className="h-4 w-4 max-[360px]:h-3.5 max-[360px]:w-3.5" />
                            <span className="font-bold truncate max-[360px]:max-w-[46px] max-[360px]:text-[12px]">Опыт</span>
                          </div>
                          <div className="mt-1 font-semibold text-[#0F86FF]">{experience}</div>
                        </div>
                      </div>

                      <div className="mt-4 flex items-center justify-between gap-3">
                        <div className="text-[14px] text-slate-500 dark:text-slate-400 text-center">
                          <div className="flex items-center justify-center gap-2 font-semibold text-slate-900 dark:text-slate-100">
                            <AppImage src="/rub.svg" alt="" width={16} height={16} className="h-4 w-4" />
                            <span className="inline max-[360px]:hidden">Цена Приема</span>
                            <span className="hidden max-[360px]:inline">Цена</span>
                          </div>
                          <div className="mt-0.5 text-[#0F86FF]">
                            {formatPrice(minPrice)}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleOpenBooking(doctor.id)}
                          className="rounded-full border border-[#0F86FF] px-6 py-2 text-[15px] font-semibold text-[#0F86FF] transition hover:bg-[#0F86FF] hover:text-white"
                        >
                          Записаться
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          </div>
        </div>
      </main>

      <div className="h-20 md:h-24" />

      <BookingFlowSheet
        open={bookingOpen}
        onClose={() => setBookingOpen(false)}
        onBooked={() => setBookingOpen(false)}
        initialDoctorId={selectedDoctorId}
        skipDoctorStep
      />
    </div>
  );
}
