"use client";

import { useMemo } from "react";
import { useAuth } from "@/providers/AuthProvider";
import { extractPhoneDigits, formatPhoneInput } from "@/utils/phone";
import { useTheme } from "@/providers/ThemeProvider";
import AppImage from "@/components/AppImage";

function formatDate(value?: string | null) {
  if (!value) {
    return "-";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleDateString("ru-RU");
}

const POLICY_URL = "/files/politics.pdf";

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  const details = useMemo(
    () => [
      {
        label: "ФИО",
        value: user?.fullName || "-",
      },
      {
        label: "Телефон",
        value: user?.phone ? formatPhoneInput(extractPhoneDigits(user.phone)) : "-",
      },
      {
        label: "Дата рождения",
        value: formatDate(user?.birthDate),
      },
      {
        label: "E-mail",
        value: user?.email || "-",
      },
      {
        label: "Номер медкарты",
        value: user?.medcardNumber || "-",
      },
      {
        label: "Последние 3 цифры номера паспорта",
        value: user?.passportNumber ? `*** ${user.passportNumber}` : "-",
      },
    ],
    [user?.birthDate, user?.email, user?.fullName, user?.medcardNumber, user?.passportNumber, user?.phone],
  );

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <main className="flex-1">
        <div className="mx-auto max-w-[420px] px-5 py-10">
          <div className="rounded-[32px] bg-gradient-to-r from-[#0F99FF] via-[#28D07C] to-[#28D07C] p-[1px] shadow-[0_18px_40px_rgba(40,160,255,0.35)]">
            <div className="rounded-[32px] bg-gradient-to-r from-[#0D7BFF] via-[#20C269] to-[#28D07C] px-6 pt-7 pb-14 text-white">
              <div className="flex -translate-y-2 items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15">
                  <AppImage
                    src="/profile_man.svg"
                    alt=""
                    width={48}
                    height={48}
                    className="h-12 w-12 object-contain"
                  />
                </div>
                <div className="-mt-1">
                  <h1 className="text-2xl font-semibold leading-tight">Профиль</h1>
                </div>
              </div>
            </div>
          </div>

          <div className="-mt-14 space-y-6">
            <section className="relative rounded-[28px] bg-white p-6 shadow-[0_18px_50px_rgba(14,74,166,0.12)]">
              <ul className="divide-y divide-slate-100">
                {details.map((item) => (
                  <li key={item.label} className="py-3 first:pt-0 last:pb-0">
                    <div className="text-sm font-bold text-neutral-800">{item.label}</div>
                    <div className="mt-1 text-base font-medium text-neutral-600">{item.value}</div>
                  </li>
                ))}
              </ul>
              <div className="mt-4 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                <a
                  href={POLICY_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-sky-600 hover:underline"
                >
                  Политика обработки персональных данных (PDF)
                </a>
              </div>
            </section>

            <section className="rounded-[28px] bg-white p-6 shadow-[0_18px_50px_rgba(14,74,166,0.12)]">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-sm font-bold text-neutral-800">Темная тема</div>
                  <div className="mt-1 text-sm text-neutral-600">
                    Переключите оформление приложения
                  </div>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={isDark}
                  onClick={toggleTheme}
                  className={[
                    "relative inline-flex h-8 w-14 items-center rounded-full transition",
                    isDark ? "bg-sky-500" : "bg-slate-200",
                  ].join(" ")}
                >
                  <span
                    className={[
                      "theme-switch-knob h-6 w-6 translate-x-1 rounded-full shadow transition",
                      isDark ? "translate-x-7" : "",
                    ].join(" ")}
                  />
                </button>
              </div>
            </section>

            <section className="rounded-[28px] bg-white p-6 shadow-[0_18px_50px_rgba(14,74,166,0.12)]">
              <button
                type="button"
                onClick={logout}
                className="w-full rounded-2xl bg-gradient-to-r from-[#0F86FF] to-[#1CA7FF] px-6 py-3 text-base font-semibold text-white shadow-[0_10px_24px_rgba(15,134,255,0.25)] transition hover:brightness-110 focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#78C7FF]"
              >
                Выйти из аккаунта
              </button>
            </section>
          </div>
        </div>
      </main>

      <div className="h-20 md:h-24" />
    </div>
  );
}
