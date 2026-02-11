"use client";

import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import BootSplash from "@/components/BootSplash";
import type { PromoData } from "@/components/PromoSheet";
import type { CheckupData } from "@/types/checkups";
import {
  fetchAppointments,
  fetchCheckups,
  fetchDocuments,
  fetchDoctors,
  fetchScheduleAppointments,
  fetchServices,
  type Appointment,
  type Doctor,
  type DocumentItem,
} from "@/utils/api";
import type { ServiceDirectoryEntry } from "@/types/clinic";
import { onec } from "@/app/api/onec";
import { useAuth } from "@/providers/AuthProvider";

type Contacts = {
  phone: string;
  siteLabel: string;
  siteUrl: string;
};

const DEFAULT_CONTACTS: Contacts = {
  phone: "+7 (3953) 21-64-22",
  siteLabel: "медграфт.рф",
  siteUrl: "https://медграфт.рф",
};

const PUBLIC_ASSET_URLS: string[] = [
  "/logo.svg",
  "/clinic.svg",
  "/date.svg",
  "/doctor.svg",
  "/download.svg",
  "/file.svg",
  "/globe.svg",
  "/highlighted_button.svg",
  "/highlighted_main.svg",
  "/highlighted_profile.svg",
  "/highlighted_records.svg",
  "/hospital.svg",
  "/list.svg",
  "/list_blue.svg",
  "/location.svg",
  "/main.svg",
  "/map.png",
  "/new_notifications.svg",
  "/note.svg",
  "/notifications.svg",
  "/notifications_active.svg",
  "/phone.svg",
  "/profile.svg",
  "/records.svg",
  "/sadness.svg",
  "/telegram-icon.svg",
  "/time.svg",
  "/verified.svg",
  "/manifest.webmanifest",
  "/sw.js",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

const PROMOS_CACHE_KEY = "medgraf.promos.v1";
const PROMOS_CACHE_TTL_MS = 15 * 60 * 1000;
const CHECKUPS_CACHE_KEY = "medgraf.checkups.v3";
const LEGACY_CHECKUPS_CACHE_KEY = "medgraf.checkups.v2";
const CONTACTS_CACHE_KEY = "medgraf.contacts.v1";
const PENDING_APPOINTMENTS_KEY = "medgraf.pendingAppointments.v1";
const PENDING_APPOINTMENTS_TTL_MS = 15 * 60 * 1000;
const MEDCARD_CACHE_PREFIX = "medcard:";
const MEDCARD_LOADED_PREFIX = "medcard-loaded:";

type TimedSessionCache<T> = {
  value: T;
  cachedAt: number;
};

type AppDataContextValue = {
  booting: boolean;
  promos: PromoData[];
  setPromos: React.Dispatch<React.SetStateAction<PromoData[]>>;
  checkups: CheckupData[];
  setCheckups: React.Dispatch<React.SetStateAction<CheckupData[]>>;
  contacts: Contacts;
  setContacts: React.Dispatch<React.SetStateAction<Contacts>>;
  appointments: Appointment[];
  activeAppointments: Appointment[];
  cancelledAppointments: Appointment[];
  setAppointments: React.Dispatch<React.SetStateAction<Appointment[]>>;
  setActiveAppointments: React.Dispatch<React.SetStateAction<Appointment[]>>;
  setCancelledAppointments: React.Dispatch<React.SetStateAction<Appointment[]>>;
  appointmentsLoading: boolean;
  documents: DocumentItem[];
  setDocuments: React.Dispatch<React.SetStateAction<DocumentItem[]>>;
  documentsLoading: boolean;
  addPendingAppointment: (appointment: Appointment) => void;
  refreshAll: () => Promise<void>;
};

const AppDataContext = createContext<AppDataContextValue | null>(null);

export function AppDataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [booting, setBooting] = useState(true);
  const [skipBootSplash, setSkipBootSplash] = useState(false);
  const [promos, setPromos] = useState<PromoData[]>([]);
  const [checkups, setCheckups] = useState<CheckupData[]>([]);
  const [contacts, setContacts] = useState<Contacts>(DEFAULT_CONTACTS);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [activeAppointments, setActiveAppointments] = useState<Appointment[]>([]);
  const [cancelledAppointments, setCancelledAppointments] = useState<Appointment[]>([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(true);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [documentsLoading, setDocumentsLoading] = useState(true);
  const loadInFlightRef = useRef<Promise<void> | null>(null);
  const loadGenerationRef = useRef(0);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    window.sessionStorage.removeItem(LEGACY_CHECKUPS_CACHE_KEY);
    const flag = window.sessionStorage.getItem("medgraf.skipBootSplash");
    if (flag) {
      window.sessionStorage.removeItem("medgraf.skipBootSplash");
      setSkipBootSplash(true);
    }
  }, []);

  const readSessionCache = useCallback(<T,>(key: string): T | null => {
    if (typeof window === "undefined") {
      return null;
    }
    try {
      const raw = window.sessionStorage.getItem(key);
      if (!raw) return null;
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }, []);

  const writeSessionCache = useCallback((key: string, value: unknown) => {
    if (typeof window === "undefined") {
      return;
    }
    try {
      window.sessionStorage.setItem(key, JSON.stringify(value));
    } catch {
      // ignore storage errors
    }
  }, []);

  const readTimedSessionCache = useCallback(
    <T,>(key: string, ttlMs: number): T | null => {
      if (typeof window === "undefined") {
        return null;
      }
      try {
        const raw = window.sessionStorage.getItem(key);
        if (!raw) return null;
        const parsed = JSON.parse(raw) as TimedSessionCache<T> | null;
        if (!parsed || typeof parsed !== "object") {
          return null;
        }
        if (!("cachedAt" in parsed) || !("value" in parsed)) {
          // Legacy cache format without timestamp.
          window.sessionStorage.removeItem(key);
          return null;
        }
        const cachedAt = Number(parsed.cachedAt);
        if (!Number.isFinite(cachedAt) || Date.now() - cachedAt > ttlMs) {
          window.sessionStorage.removeItem(key);
          return null;
        }
        return parsed.value as T;
      } catch {
        return null;
      }
    },
    [],
  );

  const writeTimedSessionCache = useCallback((key: string, value: unknown) => {
    writeSessionCache(key, {
      value,
      cachedAt: Date.now(),
    });
  }, [writeSessionCache]);

  const normalizeAppointmentKey = useCallback((appointment: Appointment) => {
    const safeDate = appointment.date || "";
    const safeDoctor = appointment.doctorName || "";
    const safeService = appointment.serviceName || "";
    return `${safeDate}|${safeDoctor}|${safeService}`;
  }, []);

  const addPendingAppointment = useCallback(
    (appointment: Appointment) => {
      const cached = readSessionCache<Array<{ appointment: Appointment; createdAt: number }>>(
        PENDING_APPOINTMENTS_KEY,
      ) ?? [];
      const key = normalizeAppointmentKey(appointment);
      const filtered = cached.filter((entry) => normalizeAppointmentKey(entry.appointment) !== key);
      const next = [{ appointment, createdAt: Date.now() }, ...filtered];
      writeSessionCache(PENDING_APPOINTMENTS_KEY, next);
    },
    [normalizeAppointmentKey, readSessionCache, writeSessionCache],
  );

  const mergePendingAppointments = useCallback(
    (appointments: Appointment[]) => {
      const cached =
        readSessionCache<Array<{ appointment: Appointment; createdAt: number }>>(
          PENDING_APPOINTMENTS_KEY,
        ) ?? [];
      if (!cached.length) {
        return appointments;
      }

      const now = Date.now();
      const fresh = cached.filter((entry) => now - entry.createdAt <= PENDING_APPOINTMENTS_TTL_MS);
      const liveKeys = new Set(appointments.map(normalizeAppointmentKey));
      const keep: Array<{ appointment: Appointment; createdAt: number }> = [];
      const pendingToMerge: Appointment[] = [];

      for (const entry of fresh) {
        const key = normalizeAppointmentKey(entry.appointment);
        if (liveKeys.has(key)) {
          continue;
        }
        keep.push(entry);
        pendingToMerge.push(entry.appointment);
      }

      if (keep.length !== cached.length) {
        writeSessionCache(PENDING_APPOINTMENTS_KEY, keep);
      }

      if (!pendingToMerge.length) {
        return appointments;
      }

      const merged = [...pendingToMerge, ...appointments];
      merged.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      return merged;
    },
    [normalizeAppointmentKey, readSessionCache, writeSessionCache],
  );

  const prefetchImages = useCallback(async (urls: string[]) => {
    if (typeof window === "undefined") {
      return;
    }
    const unique = Array.from(new Set(urls.filter(Boolean)));
    const queue = [...unique];
    const MAX_CONCURRENT = 6;
    const worker = async () => {
      while (queue.length) {
        const src = queue.shift();
        if (!src) break;
        await new Promise<void>((resolve) => {
          const img = new Image();
          img.decoding = "async";
          img.onload = () => resolve();
          img.onerror = () => resolve();
          img.src = src;
        });
      }
    };
    await Promise.all(Array.from({ length: Math.min(MAX_CONCURRENT, queue.length) }, () => worker()));
  }, []);

  const prefetchPublicAssets = useCallback(async () => {
    if (typeof navigator !== "undefined") {
      const nav = navigator as Navigator & {
        connection?: { saveData?: boolean; effectiveType?: string };
        deviceMemory?: number;
      };
      const connection = nav.connection;
      const deviceMemory = nav.deviceMemory;
      if (connection?.saveData) {
        return;
      }
      if (connection?.effectiveType && ["slow-2g", "2g"].includes(connection.effectiveType)) {
        return;
      }
      if (typeof deviceMemory === "number" && deviceMemory <= 1) {
        return;
      }
    }

    const queue = [...PUBLIC_ASSET_URLS];
    const MAX_CONCURRENT_PREFETCH = 4;

    const worker = async () => {
      while (queue.length) {
        const url = queue.shift();
        if (!url) break;

        try {
          const response = await fetch(url, { cache: "force-cache" });
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }
          await response.blob();
        } catch (error) {
          console.warn("public asset prefetch failed:", url, error);
        }
      }
    };

    const tasks = Array.from(
      { length: Math.min(MAX_CONCURRENT_PREFETCH, queue.length) },
      () => worker(),
    );

    await Promise.all(tasks);
  }, []);

  const loadData = useCallback(async () => {
    if (loadInFlightRef.current) {
      return loadInFlightRef.current;
    }
    const generation = ++loadGenerationRef.current;
    const isStale = () => loadGenerationRef.current !== generation;
    const task = (async () => {
      setAppointmentsLoading(true);
      setDocumentsLoading(true);
      const patientId = user?.onecId?.toString().trim() || null;
      try {
        const promosPromise = (async () => {
          const cached = readTimedSessionCache<PromoData[]>(PROMOS_CACHE_KEY, PROMOS_CACHE_TTL_MS);
          if (cached !== null) {
            return cached;
          }
          const list = await onec.promotions.list();
          writeTimedSessionCache(PROMOS_CACHE_KEY, list);
          return list;
        })();
        const checkupsPromise = (async () => {
          const cached = readSessionCache<CheckupData[]>(CHECKUPS_CACHE_KEY);
          if (cached !== null) {
            const hasIconField = cached.some((item) =>
              Object.prototype.hasOwnProperty.call(item, "icon"),
            );
            if (hasIconField) {
              return cached;
            }
          }
          try {
            const list = await fetchCheckups();
            writeSessionCache(CHECKUPS_CACHE_KEY, list);
            return list;
          } catch (error) {
            console.warn("checkups fallback:", error);
            return [] as CheckupData[];
          }
        })();
        const contactsPromise = (async () => {
          const cached = readSessionCache<Contacts>(CONTACTS_CACHE_KEY);
          if (cached !== null) {
            return cached;
          }
          const value = await onec.contacts.get();
          writeSessionCache(CONTACTS_CACHE_KEY, value);
          return value;
        })();

        const appointmentsPromise = patientId
          ? fetchAppointments(patientId).catch((error) => {
              console.warn("appointments fallback:", error);
              return [] as Appointment[];
            })
          : Promise.resolve([] as Appointment[]);
        const activeAppointmentsPromise = patientId
          ? fetchScheduleAppointments({ patientId, status: "1" }).catch((error) => {
              console.warn("active appointments fallback:", error);
              return [] as Appointment[];
            })
          : Promise.resolve([] as Appointment[]);
        const cancelledAppointmentsPromise = patientId
          ? fetchScheduleAppointments({ patientId, status: "3" }).catch((error) => {
              console.warn("cancelled appointments fallback:", error);
              return [] as Appointment[];
            })
          : Promise.resolve([] as Appointment[]);
        const documentsPromise = patientId
          ? fetchDocuments(patientId).catch((error) => {
              console.warn("documents fallback:", error);
              return [] as DocumentItem[];
            })
          : Promise.resolve([] as DocumentItem[]);
        const doctorsPromise = fetchDoctors().catch((error) => {
          console.warn("doctors fallback:", error);
          return [] as Doctor[];
        });
        const servicesPromise = fetchServices().catch((error) => {
          console.warn("services fallback:", error);
          return [] as ServiceDirectoryEntry[];
        });
        const medcardPromise = (async () => {
          if (!patientId || typeof window === "undefined") {
            return null;
          }
          const cacheKey = `${MEDCARD_CACHE_PREFIX}${patientId}`;
          const loadedKey = `${MEDCARD_LOADED_PREFIX}${patientId}`;
          const cached = readSessionCache<Record<string, unknown>>(cacheKey);
          if (cached) {
            return cached;
          }
          if (window.sessionStorage.getItem(loadedKey)) {
            return null;
          }
          try {
            const res = await fetch(`/api/patients?patientId=${encodeURIComponent(patientId)}`, {
              method: "GET",
              cache: "no-store",
            });
            const payload = (await res.json().catch(() => null)) as { patient?: Record<string, unknown> | null } | null;
            if (!res.ok) {
              window.sessionStorage.setItem(loadedKey, "1");
              return null;
            }
            if (payload?.patient) {
              writeSessionCache(cacheKey, payload.patient);
            }
            window.sessionStorage.setItem(loadedKey, "1");
            return payload?.patient ?? null;
          } catch {
            window.sessionStorage.setItem(loadedKey, "1");
            return null;
          }
        })();

        const [
          promoItems,
          checkupItems,
          contactsData,
          appointmentItems,
          activeItems,
          cancelledItems,
          documentItems,
          doctors,
          services,
          medcard,
        ] = await Promise.all([
          promosPromise,
          checkupsPromise,
          contactsPromise,
          appointmentsPromise,
          activeAppointmentsPromise,
          cancelledAppointmentsPromise,
          documentsPromise,
          doctorsPromise,
          servicesPromise,
          medcardPromise,
        ]);
        if (isStale()) {
          return;
        }
        const mergedActiveItems = mergePendingAppointments(activeItems);
        setPromos(promoItems);
        setCheckups(checkupItems);
        setContacts({ ...DEFAULT_CONTACTS, ...contactsData });
        setAppointments(appointmentItems);
        setActiveAppointments(mergedActiveItems);
        setCancelledAppointments(cancelledItems);
        setDocuments(documentItems);

        void services;
        void medcard;
        await prefetchImages([
          ...promoItems.flatMap((promo) => [promo.cardImage, promo.banner || promo.cardImage]),
          ...doctors.map((doctor) => doctor.photoUrl).filter(Boolean),
        ]);
      } catch (error) {
        console.warn("app boot fallback:", error);
      } finally {
        if (!isStale()) {
          setAppointmentsLoading(false);
          setDocumentsLoading(false);
        }
      }
    })();

    loadInFlightRef.current = task;
    try {
      return await task;
    } finally {
      loadInFlightRef.current = null;
    }
  }, [
    mergePendingAppointments,
    prefetchImages,
    readSessionCache,
    readTimedSessionCache,
    user?.onecId,
    writeSessionCache,
    writeTimedSessionCache,
  ]);

  useEffect(() => {
    let alive = true;
    const MIN_VISIBLE_MS = 350;
    const MAX_WAIT_MS = 6000;
    const createSleep = (ms: number) => {
      let timeoutId: number;
      const promise = new Promise<void>((resolve) => {
        timeoutId = window.setTimeout(() => resolve(), ms);
      });
      return {
        promise,
        cancel: () => window.clearTimeout(timeoutId),
      };
    };
    let cancelMinDelay: (() => void) | null = null;
    let cancelTimeout: (() => void) | null = null;

    const run = async () => {
      const minDelay = createSleep(MIN_VISIBLE_MS);
      cancelMinDelay = minDelay.cancel;
      const loadPromise = loadData().catch((error) => {
        console.warn("app boot loadData failed:", error);
      });
      const timeout = createSleep(MAX_WAIT_MS);
      cancelTimeout = timeout.cancel;

      await Promise.race([loadPromise, timeout.promise]);
      await minDelay.promise;

      if (!alive) {
        return;
      }

      setBooting(false);

      loadPromise.finally(() => {
        if (!alive) {
          return;
        }

        const triggerPrefetch = () =>
          prefetchPublicAssets().catch((error) => console.warn("public asset prefetch failed:", error));

        if (typeof window !== "undefined") {
          const idle = (window as typeof window & { requestIdleCallback?: (cb: () => void, opts?: { timeout?: number }) => number }).requestIdleCallback;
          if (typeof idle === "function") {
            idle(
              () => {
                if (!alive) {
                  return;
                }
                triggerPrefetch();
              },
              { timeout: 2000 },
            );
          } else {
            window.setTimeout(() => {
              if (!alive) {
                return;
              }
              triggerPrefetch();
            }, 400);
          }
        } else {
          triggerPrefetch();
        }
      });

      timeout.cancel();
      minDelay.cancel();
    };

    run();

    return () => {
      alive = false;
      cancelMinDelay?.();
      cancelTimeout?.();
    };
  }, [loadData, prefetchPublicAssets]);

  const contextValue = useMemo<AppDataContextValue>(
    () => ({
      booting,
      promos,
      setPromos,
      checkups,
      setCheckups,
      contacts,
      setContacts,
      appointments,
      activeAppointments,
      cancelledAppointments,
      setAppointments,
      setActiveAppointments,
      setCancelledAppointments,
      appointmentsLoading,
      documents,
      setDocuments,
      documentsLoading,
      addPendingAppointment,
      refreshAll: loadData,
    }),
    [
      appointments,
      activeAppointments,
      cancelledAppointments,
      appointmentsLoading,
      setActiveAppointments,
      setCancelledAppointments,
      booting,
      checkups,
      contacts,
      documents,
      documentsLoading,
      addPendingAppointment,
      loadData,
      promos,
    ],
  );

  return (
    <AppDataContext.Provider value={contextValue}>
      {children}
      <BootSplash visible={booting && !skipBootSplash} />
    </AppDataContext.Provider>
  );
}

export function useAppData() {
  const ctx = useContext(AppDataContext);
  if (!ctx) {
    throw new Error("useAppData must be used within AppDataProvider");
  }
  return ctx;
}
