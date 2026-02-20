"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useAuth } from "@/providers/AuthProvider";

type Relative = {
  member?: string | null;
  relationship?: string | null;
  memberID?: string | null;
  memberBirthDate?: string | null;
  memberCardNumber?: string | null;
};

type PatientDetails = {
  id?: string | null;
  fullName?: string | null;
  birthDate?: string | null;
  gender?: string | null;
  medcardNumber?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  relatives?: Relative[] | null;
};

const MEDCARD_CACHE_PREFIX = "medcard.v2:";
const MEDCARD_LOADED_PREFIX = "medcard-loaded.v2:";

function formatDate(value?: string | null) {
  if (!value) {
    return "-";
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleDateString("ru-RU");
}

export default function CardPage() {
  const { user, setUser } = useAuth();
  const [patient, setPatient] = useState<PatientDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [switchingId, setSwitchingId] = useState<string | null>(null);
  const [switchNotice, setSwitchNotice] = useState<string | null>(null);

  const patientId = user?.onecId?.trim() || null;

  useEffect(() => {
    if (!patientId) {
      setPatient(null);
      return;
    }

    const cacheKey = `${MEDCARD_CACHE_PREFIX}${patientId}`;
    const loadedKey = `${MEDCARD_LOADED_PREFIX}${patientId}`;

    if (typeof window !== "undefined") {
      const cached = window.sessionStorage.getItem(cacheKey);
      if (cached !== null) {
        try {
          const parsed = JSON.parse(cached) as PatientDetails;
          setPatient(parsed);
        } catch {
          window.sessionStorage.removeItem(cacheKey);
        }
      }

      if (window.sessionStorage.getItem(loadedKey)) {
        setLoading(false);
        return;
      }
    }

    const controller = new AbortController();
    setLoading(true);
    fetch(`/api/patients?patientId=${encodeURIComponent(patientId)}`, {
      method: "GET",
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (res) => {
        const payload = (await res.json().catch(() => null)) as { patient?: PatientDetails | null } | null;
        if (!res.ok) {
          throw new Error("Не удалось получить данные пациента");
        }
        return payload?.patient ?? null;
      })
      .then((data) => {
        setPatient(data);
        if (typeof window !== "undefined") {
          try {
            if (data) {
              window.sessionStorage.setItem(cacheKey, JSON.stringify(data));
            } else {
              window.sessionStorage.removeItem(cacheKey);
            }
            window.sessionStorage.setItem(loadedKey, "1");
          } catch {
            // ignore storage errors
          }
        }
      })
      .catch((error) => {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        console.warn("Ошибка загрузки медкарты:", error);
        setPatient(null);
        if (typeof window !== "undefined") {
          try {
            window.sessionStorage.removeItem(cacheKey);
            window.sessionStorage.setItem(loadedKey, "1");
          } catch {
            // ignore storage errors
          }
        }
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [patientId]);

  const mainInfo = useMemo(
    () => [
      {
        label: "ФИО",
        value: patient?.fullName || user?.fullName || "-",
      },
      {
        label: "Номер телефона",
        value: patient?.phone || user?.phone || "-",
      },
      {
        label: "Почта",
        value: patient?.email || user?.email || "-",
      },
      {
        label: "Номер карты",
        value: patient?.medcardNumber || user?.medcardNumber || "-",
      },
      {
        label: "Дата рождения",
        value: formatDate(patient?.birthDate || user?.birthDate),
      },
    ],
    [patient?.birthDate, patient?.email, patient?.fullName, patient?.medcardNumber, patient?.phone, user?.birthDate, user?.email, user?.fullName, user?.medcardNumber, user?.phone],
  );

  const relatives = useMemo(() => patient?.relatives?.filter(Boolean) ?? [], [patient?.relatives]);

  const handleSwitch = async (relative: Relative) => {
    if (!user || !relative.memberID) {
      return;
    }
    if (user.onecId && user.onecId === relative.memberID) {
      return;
    }
    setSwitchingId(relative.memberID);
    try {
      const res = await fetch("/api/auth/switch-relative", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: user.phone,
          memberId: relative.memberID,
          userId: user.id,
        }),
      });
      const payload = (await res.json().catch(() => null)) as { user?: Partial<typeof user> } | null;
      if (!res.ok || !payload?.user) {
        throw new Error("Не удалось сменить аккаунт");
      }
      setUser({
        ...user,
        ...payload.user,
      });
      setSwitchNotice(relative.member || payload.user.fullName || "Неизвестно");
    } catch (error) {
      console.warn("Ошибка смены аккаунта:", error);
    } finally {
      setSwitchingId(null);
    }
  };

  useEffect(() => {
    if (!switchNotice) return;
    const timeout = window.setTimeout(() => setSwitchNotice(null), 2200);
    return () => window.clearTimeout(timeout);
  }, [switchNotice]);

  return (
    <div className="min-h-dvh flex flex-col bg-background">
      {switchingId && (
        <div className="fixed inset-0 z-[1500] flex items-center justify-center bg-black/35 backdrop-blur-sm">
          <div className="mx-6 w-full max-w-[320px] rounded-3xl bg-white/90 p-6 text-center shadow-xl ring-1 ring-white/40 dark:bg-slate-900/80 dark:ring-slate-800">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-300">
              <svg className="h-6 w-6 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" opacity=".2" />
                <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
            <div className="text-[16px] font-semibold text-slate-900 dark:text-slate-100">
              Переключаем аккаунт
            </div>
            <div className="mt-1 text-[13.5px] text-slate-500 dark:text-slate-400">
              Это займет пару секунд
            </div>
          </div>
        </div>
      )}

      {switchNotice && (
        <div className="fixed inset-x-0 top-16 z-[1501] flex justify-center px-4">
          <div className="rounded-full bg-slate-900/90 px-4 py-2 text-[13.5px] font-semibold text-white shadow-lg">
            Аккаунт переключен: {switchNotice}
          </div>
        </div>
      )}
      <main className="flex-1">
        <div className="mx-auto max-w-[420px] px-5 py-10">
          <div className="rounded-[32px] bg-gradient-to-r from-[#0F99FF] via-[#28D07C] to-[#28D07C] p-[1px] shadow-[0_18px_40px_rgba(40,160,255,0.35)]">
            <div className="rounded-[32px] bg-gradient-to-r from-[#0D7BFF] via-[#20C269] to-[#28D07C] px-6 pt-7 pb-14 text-white">
              <div className="flex items-center gap-4 -translate-y-2">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15">
                  <Image src="/list.svg" alt="" width={48} height={48} className="h-12 w-12" />
                </div>
                <div className="-mt-1">
                  <h1 className="text-2xl font-semibold leading-tight">
                    {"\u041C\u043E\u044F \u043C\u0435\u0434\u043A\u0430\u0440\u0442\u0430"}
                  </h1>
                </div>
              </div>
            </div>
          </div>

          <div className="-mt-14 space-y-6">
            <section className="rounded-[28px] bg-white p-6 shadow-[0_18px_50px_rgba(14,74,166,0.12)]">
              <header className="flex items-center justify-between">
                <div>
                  <p className="text-base font-semibold text-neutral-800">
                    {"\u041C\u0435\u0434\u043A\u0430\u0440\u0442\u0430:"}
                  </p>
                  <ul className="mt-3 space-y-2 text-sm text-neutral-700">
                    {mainInfo.map((item) => (
                      <li key={item.label}>
                        <span className="font-semibold text-neutral-800">
                          {item.label}
                        </span>{" "}
                        <span className="font-medium text-neutral-600">{item.value}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </header>
              <div className="mt-6 h-px w-full bg-[#E9EDF8]" />
              <div className="mt-6 space-y-6">
                {loading && (
                  <p className="text-sm font-medium text-neutral-500">Загружаем данные...</p>
                )}
                {!loading && relatives.length === 0 && (
                  <p className="text-sm font-medium text-neutral-500">Родственники не найдены.</p>
                )}
                {!loading &&
                  relatives.map((relative, index) => (
                    <article key={`${relative.memberID || "relative"}-${index}`}>
                      <div className="flex items-center justify-between gap-3">
                        <h2 className="text-base font-semibold text-neutral-800">
                          {relative.relationship || "Родственник"}
                        </h2>
                        <button
                          type="button"
                          onClick={() => handleSwitch(relative)}
                          disabled={switchingId === relative.memberID}
                          className="rounded-full border border-[#0F86FF]/30 px-3 py-1 text-xs font-semibold text-[#0F86FF] transition hover:border-[#0F86FF] hover:text-[#0C6FD9]"
                        >
                          {switchingId === relative.memberID ? "Входим..." : "Войти как"}
                        </button>
                      </div>
                      <ul className="mt-3 space-y-2 text-sm text-neutral-700">
                        <li>
                          <span className="font-semibold text-neutral-800">ФИО</span>{" "}
                          <span className="font-medium text-neutral-600">
                            {relative.member || "-"}
                          </span>
                        </li>
                        <li>
                          <span className="font-semibold text-neutral-800">Номер карты</span>{" "}
                          <span className="font-medium text-neutral-600">
                            {relative.memberCardNumber || "-"}
                          </span>
                        </li>
                        <li>
                          <span className="font-semibold text-neutral-800">Дата рождения</span>{" "}
                          <span className="font-medium text-neutral-600">
                            {formatDate(relative.memberBirthDate)}
                          </span>
                        </li>
                        <li>
                          <span className="font-semibold text-neutral-800">Родственная связь</span>{" "}
                          <span className="font-medium text-neutral-600">
                            {relative.relationship || "-"}
                          </span>
                        </li>
                      </ul>
                      {index < relatives.length - 1 && (
                        <div className="mt-5 h-px w-full bg-[#E9EDF8]" />
                      )}
                    </article>
                  ))}
              </div>
            </section>
          </div>
        </div>
      </main>

      <div className="h-20 md:h-24" />
    </div>
  );
}
