"use client";

import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";
import BootSplash from "@/components/BootSplash";
import type { PromoData } from "@/components/PromoSheet";
import type { CheckupData } from "@/components/CheckupsSheet";
import { fetchAppointments, fetchDocuments, type Appointment, type DocumentItem } from "@/utils/api";
import { onec } from "@/app/api/onec";

type Contacts = {
  phone: string;
  siteLabel: string;
  siteUrl: string;
  whatsappUrl: string;
  telegramUrl: string;
};

const DEFAULT_CONTACTS: Contacts = {
  phone: "+7 (3953) 21-64-22",
  siteLabel: "МедГраф.рф",
  siteUrl: "https://медграф.рф",
  whatsappUrl: "https://wa.me/79990000000",
  telegramUrl: "https://t.me/medgraft",
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
  "/whatsapp-icon.svg",
  "/window.svg",
  "/banner_promo_1.svg",
  "/banner_promo_2.svg",
  "/banner_promo_3.svg",
  "/promo-1.png",
  "/promo-2.png",
  "/promo-3.png",
  "/doc1.png",
  "/doc2.png",
  "/doc3.png",
  "/manifest.webmanifest",
  "/sw.js",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

type AppDataContextValue = {
  booting: boolean;
  promos: PromoData[];
  setPromos: React.Dispatch<React.SetStateAction<PromoData[]>>;
  checkups: CheckupData[];
  setCheckups: React.Dispatch<React.SetStateAction<CheckupData[]>>;
  contacts: Contacts;
  setContacts: React.Dispatch<React.SetStateAction<Contacts>>;
  appointments: Appointment[];
  setAppointments: React.Dispatch<React.SetStateAction<Appointment[]>>;
  appointmentsLoading: boolean;
  documents: DocumentItem[];
  setDocuments: React.Dispatch<React.SetStateAction<DocumentItem[]>>;
  documentsLoading: boolean;
  refreshAll: () => Promise<void>;
};

const AppDataContext = createContext<AppDataContextValue | null>(null);

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [booting, setBooting] = useState(true);
  const [promos, setPromos] = useState<PromoData[]>([]);
  const [checkups, setCheckups] = useState<CheckupData[]>([]);
  const [contacts, setContacts] = useState<Contacts>(DEFAULT_CONTACTS);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(true);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [documentsLoading, setDocumentsLoading] = useState(true);

  const prefetchPublicAssets = useCallback(async () => {
    await Promise.all(
      PUBLIC_ASSET_URLS.map(async (url) => {
        try {
          const response = await fetch(url, { cache: "force-cache" });
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }
          // Consume body to ensure the asset is cached.
          await response.blob();
        } catch (error) {
          console.warn("public asset prefetch failed:", url, error);
        }
      }),
    );
  }, []);

  const loadData = useCallback(async () => {
    setAppointmentsLoading(true);
    setDocumentsLoading(true);
    try {
      const [promoItems, checkupItems, contactsData, appointmentItems, documentItems] = await Promise.all([
        onec.promotions.list(),
        onec.checkups.list(),
        onec.contacts.get(),
        fetchAppointments().catch((error) => {
          console.warn("appointments fallback:", error);
          return [] as Appointment[];
        }),
        fetchDocuments().catch((error) => {
          console.warn("documents fallback:", error);
          return [] as DocumentItem[];
        }),
      ]);
      setPromos(promoItems);
      setCheckups(checkupItems);
      setContacts(contactsData);
      setAppointments(appointmentItems);
      setDocuments(documentItems);
    } catch (error) {
      console.warn("app boot fallback:", error);
    } finally {
      setAppointmentsLoading(false);
      setDocumentsLoading(false);
    }
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      await Promise.all([loadData(), prefetchPublicAssets()]);
      if (alive) {
        setBooting(false);
      }
    })();
    return () => {
      alive = false;
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
      setAppointments,
      appointmentsLoading,
      documents,
      setDocuments,
      documentsLoading,
      refreshAll: loadData,
    }),
    [
      appointments,
      appointmentsLoading,
      booting,
      checkups,
      contacts,
      documents,
      documentsLoading,
      loadData,
      promos,
    ],
  );

  return (
    <AppDataContext.Provider value={contextValue}>
      {children}
      <BootSplash visible={booting} />
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

