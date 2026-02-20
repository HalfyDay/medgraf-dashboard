"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/providers/AuthProvider";
import { extractPhoneDigits, formatPhoneInput } from "@/utils/phone";
import { useTheme } from "@/providers/ThemeProvider";
import AppImage from "@/components/AppImage";
import ContractsSheet from "@/components/ContractsSheet";
import { fetchContracts, type ContractItem } from "@/utils/api";

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
const CONTRACTS_CACHE_PREFIX = "medgraf.contracts.profile.v1";
const PASSPORT_LAST_DIGITS_CACHE_PREFIX = "medgraf.passportLastDigits.profile.v1";

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";
  const [contractsOpen, setContractsOpen] = useState(false);
  const [contractsLoading, setContractsLoading] = useState(false);
  const [contracts, setContracts] = useState<ContractItem[]>([]);
  const [passportLastDigits, setPassportLastDigits] = useState<string | null>(null);
  const [passportDigitsLoading, setPassportDigitsLoading] = useState(false);

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
        value: passportDigitsLoading ? "..." : passportLastDigits ? `*** ${passportLastDigits}` : "-",
      },
    ],
    [passportDigitsLoading, passportLastDigits, user?.birthDate, user?.email, user?.fullName, user?.medcardNumber, user?.phone],
  );

  useEffect(() => {
    if (!user?.phone) {
      setPassportLastDigits(null);
      setPassportDigitsLoading(false);
      return;
    }

    const cacheKey = `${PASSPORT_LAST_DIGITS_CACHE_PREFIX}:${user?.onecId ?? "self"}`;
    if (typeof window !== "undefined") {
      try {
        const cachedValue = window.sessionStorage.getItem(cacheKey);
        if (cachedValue !== null) {
          setPassportLastDigits(cachedValue || null);
          setPassportDigitsLoading(false);
          return;
        }
      } catch {
        // ignore storage errors and fallback to network
      }
    }

    const controller = new AbortController();
    setPassportDigitsLoading(true);

    fetch("/api/auth/passport-last-digits", {
      method: "GET",
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (res) => {
        const payload = (await res.json().catch(() => null)) as { passportLastDigits?: string | null } | null;
        if (!res.ok) {
          throw new Error("Failed to fetch passport digits");
        }
        const digits = payload?.passportLastDigits ?? null;
        setPassportLastDigits(digits);
        if (typeof window !== "undefined") {
          try {
            window.sessionStorage.setItem(cacheKey, digits ?? "");
          } catch {
            // ignore storage errors
          }
        }
      })
      .catch((error) => {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        console.warn("failed to load passport last digits:", error);
        setPassportLastDigits(null);
      })
      .finally(() => {
        setPassportDigitsLoading(false);
      });

    return () => controller.abort();
  }, [user?.onecId, user?.phone]);

  useEffect(() => {
    if (!contractsOpen) return;
    if (!user?.onecId) {
      setContracts([]);
      return;
    }

    const cacheKey = `${CONTRACTS_CACHE_PREFIX}:${user.onecId}`;
    if (typeof window !== "undefined") {
      try {
        const raw = window.sessionStorage.getItem(cacheKey);
        if (raw) {
          const cached = JSON.parse(raw) as ContractItem[];
          if (Array.isArray(cached)) {
            setContracts(cached);
            setContractsLoading(false);
            return;
          }
        }
      } catch {
        // ignore parse/storage errors and fallback to network
      }
    }

    let cancelled = false;
    setContractsLoading(true);
    fetchContracts(user.onecId)
      .then((items) => {
        if (!cancelled) {
          setContracts(items);
          if (typeof window !== "undefined") {
            try {
              window.sessionStorage.setItem(cacheKey, JSON.stringify(items));
            } catch {
              // ignore storage errors
            }
          }
        }
      })
      .catch((error) => {
        console.warn("failed to load contracts:", error);
        if (!cancelled) {
          setContracts([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setContractsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [contractsOpen, user?.onecId]);

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
                  aria-label="Темная тема"
                  title="Темная тема"
                  onClick={toggleTheme}
                  className={[
                    "relative inline-flex h-8 w-14 items-center overflow-hidden rounded-full transition",
                    isDark ? "bg-sky-500" : "bg-slate-200",
                  ].join(" ")}
                >
                  <span
                    className={[
                      "theme-switch-knob h-6 w-6 rounded-full shadow transition-transform duration-200",
                      isDark ? "translate-x-6" : "translate-x-1",
                    ].join(" ")}
                  />
                </button>
              </div>
            </section>

            <section>
              <button
                type="button"
                onClick={() => setContractsOpen(true)}
                className="w-full rounded-[24px] bg-gradient-to-r from-[#0F86FF] to-[#1CA7FF] px-5 py-4 text-left text-white shadow-[0_18px_40px_rgba(15,134,255,0.25)] transition active:translate-y-[1px]"
              >
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-14 w-14 items-center justify-center rounded-[14px] bg-white/15">
                    <AppImage src="/list.svg" alt="" width={56} height={56} className="h-14 w-14" />
                  </span>
                  <span className="leading-tight">
                    <span className="block text-[19px] font-semibold leading-none">Документы</span>
                    <span className="mt-1 block text-[13px] leading-[1.15] text-[#7DCEFF]">
                      тут хранятся все подписанные вами документы
                    </span>
                  </span>
                </div>
              </button>
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

      <ContractsSheet
        open={contractsOpen}
        onClose={() => setContractsOpen(false)}
        contracts={contracts}
        loading={contractsLoading}
      />

      <div className="h-20 md:h-24" />
    </div>
  );
}


