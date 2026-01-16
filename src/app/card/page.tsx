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

  const patientId = user?.onecId?.trim() || null;

  useEffect(() => {
    if (!patientId) {
      setPatient(null);
      return;
    }

    if (typeof window !== "undefined") {
      const cached = window.sessionStorage.getItem(`medcard:${patientId}`);
      if (cached) {
        try {
          const parsed = JSON.parse(cached) as PatientDetails;
          setPatient(parsed);
          return;
        } catch {
          window.sessionStorage.removeItem(`medcard:${patientId}`);
        }
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
        if (typeof window !== "undefined" && data) {
          window.sessionStorage.setItem(`medcard:${patientId}`, JSON.stringify(data));
        }
      })
      .catch((error) => {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        console.warn("Ошибка загрузки медкарты:", error);
        setPatient(null);
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
    } catch (error) {
      console.warn("Ошибка смены аккаунта:", error);
    } finally {
      setSwitchingId(null);
    }
  };

  return (
    <div className="min-h-dvh flex flex-col bg-background">
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
                <button
                  type="button"
                  className="flex h-10 w-10 items-center justify-center text-[#0F86FF] transition hover:text-[#0C6FD9]"
                  aria-label="\u0421\u043A\u0430\u0447\u0430\u0442\u044C \u043C\u0435\u0434\u043A\u0430\u0440\u0442\u0443"
                >
                  <Image src="/download.svg" alt="" width={20} height={20} className="h-5 w-5" />
                </button>
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
