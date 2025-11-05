"use client";

import { useMemo } from "react";
import { useAuth } from "@/providers/AuthProvider";
import { extractPhoneDigits, formatPhoneInput } from "@/utils/phone";

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

export default function ProfilePage() {
  const { user, logout } = useAuth();

  const details = useMemo(
    () => [
      {
        label: "ФИО",
        value: user?.fullName || "-",
      },
      {
        label: "Номер телефона",
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
        label: "Последние 3 цифры паспорта",
        value: user?.passportNumber ? `*** ${user.passportNumber}` : "-",
      },
    ],
    [user?.birthDate, user?.email, user?.fullName, user?.passportNumber, user?.phone],
  );

  return (
    <div className="flex min-h-dvh flex-col bg-[#EEF3FF]">
      <main className="flex-1">
        <div className="mx-auto max-w-[420px] px-5 py-10">
          <div className="rounded-[32px] bg-gradient-to-r from-[#0F99FF] via-[#28D07C] to-[#0F99FF] p-[1px] shadow-[0_18px_40px_rgba(40,160,255,0.35)]">
            <div className="rounded-[32px] bg-gradient-to-r from-[#0D7BFF] via-[#20C269] to-[#28D07C] px-6 pt-7 pb-14 text-white">
              <div className="flex -translate-y-2 items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15">
                  <svg
                    width="28"
                    height="28"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="text-white"
                    aria-hidden="true"
                  >
                    <path
                      d="M12 12C9.23858 12 7 9.76142 7 7C7 4.23858 9.23858 2 12 2C14.7614 2 17 4.23858 17 7C17 9.76142 14.7614 12 12 12ZM12 14C16.4183 14 20 15.7909 20 18V19.5C20 20.3284 19.3284 21 18.5 21H5.5C4.67157 21 4 20.3284 4 19.5V18C4 15.7909 7.58172 14 12 14Z"
                      fill="currentColor"
                    />
                  </svg>
                </div>
                <div className="-mt-1">
                  <h1 className="text-2xl font-semibold leading-tight">Обо мне</h1>
                  <p className="mt-1 text-sm text-white/80">
                    Краткая информация профиля пациента
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="-mt-14 space-y-6">
            <section className="relative rounded-[28px] bg-white p-6 shadow-[0_18px_50px_rgba(14,74,166,0.12)]">
              <ul className="divide-y divide-[#E9EDF8]">
                {details.map((item) => (
                  <li key={item.label} className="py-3 first:pt-0 last:pb-0">
                    <div className="text-sm font-bold text-neutral-800">{item.label}</div>
                    <div className="mt-1 text-base font-medium text-neutral-600">{item.value}</div>
                  </li>
                ))}
              </ul>
            </section>

            <section className="relative rounded-[28px] bg-gradient-to-r from-[#0F75FF] to-[#1CB0FF] p-[1px] shadow-[0_18px_40px_rgba(15,117,255,0.3)]">
              <div className="rounded-[28px] bg-gradient-to-r from-[#0F86FF] to-[#1CA7FF] px-6 py-4 text-white">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15">
                    <svg
                      width="26"
                      height="26"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="text-white"
                      aria-hidden="true"
                    >
                      <path
                        d="M7 2C5.89543 2 5 2.89543 5 4V20C5 21.1046 5.89543 22 7 22H17C18.1046 22 19 21.1046 19 20V8.82843C19 8.29799 18.7893 7.78929 18.4142 7.41421L14.5858 3.58579C14.2107 3.21071 13.702 3 13.1716 3H7ZM13 8L13 3.5L18.5 9H14C13.4477 9 13 8.55228 13 8Z"
                        fill="currentColor"
                      />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">Документы</h2>
                    <p className="mt-2 text-sm text-white/80">
                      Тут хранятся все подписанные вами документы и согласия клиники. Обратитесь в регистратуру для получения копий.
                    </p>

                  </div>
                </div>
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
