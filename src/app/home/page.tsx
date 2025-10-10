"use client";
/* eslint-disable @next/next/no-img-element */

import DocumentsSheet from "@/components/DocumentsSheet";
import DocumentDetailsSheet from "@/components/DocumentDetailsSheet";
import NotificationsSheet from "@/components/NotificationsSheet";
import MyAppointmentsSheet from "@/components/MyAppointmentsSheet";
import AppointmentDetailsSheet from "@/components/AppointmentDetailsSheet";
import VisitsSheet from "@/components/VisitsSheet";
import PromoSuccessOverlay from "@/components/PromoSuccessOverlay";
import { useLayoutEffect, useRef, useState, useEffect, useMemo } from "react";
import PromoSheet, { type PromoData } from "@/components/PromoSheet";
import CheckupsSheet, { type CheckupData } from "@/components/CheckupsSheet";
import { fetchAppointments, type Appointment, fetchDocuments, type DocumentItem } from "@/utils/api";
import { onec } from "@/app/api/onec";

function BootSplash({ visible }: { visible: boolean }) {
  return (
    <div
      aria-hidden={!visible}
      className={[
        "fixed inset-0 z-[2000] transition-opacity duration-400",
        visible ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
      ].join(" ")}
    >
      {/* Фон: стекло как у хедера */}
      <div className="absolute inset-0 bg-white/60 backdrop-blur supports-[backdrop-filter]:bg-white/40" />

      {/* Центрированная карточка с логотипом/спиннером */}
      <div className="relative z-10 flex h-full w-full items-center justify-center p-6">
        <div className="w-full max-w-[360px] rounded-3xl bg-white/60 backdrop-blur-md supports-[backdrop-filter]:bg-white/40 shadow-xl ring-1 ring-white/30 p-8 text-center">
          <div className="mx-auto mb-4 grid place-items-center">
           <img
             src="/logo.svg"
             alt="Медграфт"
             className="h-10 w-10"
             width={40}
             height={40}
             decoding="async"
           />
          </div>

          <div className="text-[24px] font-semibold text-slate-900">Медграфт</div>
          <div className="mt-1 text-[16px] text-slate-500">загружаем персональные данные…</div>

          <div className="mt-6 flex items-center justify-center gap-2 text-sky-600">
            <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" opacity=".2"/>
              <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <span className="text-[15.5px]">Подключение…</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function formatTileDate(dateIso: string) {
  const raw = new Date(dateIso).toLocaleDateString("ru-RU", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const cleaned = raw.replace(/\./g, "");
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

function formatTileTime(dateIso: string) {
  return new Date(dateIso).toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  });
}


export default function HomePage() {
  // ✅ хук теперь внутри компонента
  const [docsOpen, setDocsOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [showAllCheckups, setShowAllCheckups] = useState(false);
  const gridRef = useRef<HTMLDivElement | null>(null);
  const [heights, setHeights] = useState({ collapsed: 0, expanded: 0 });
  const [checkupOpen, setCheckupOpen] = useState(false);
  const [activeCheckup, setActiveCheckup] = useState<CheckupData | null>(null);
  const [promos, setPromos] = useState<PromoData[]>([]);
  const [checkups, setCheckups] = useState<CheckupData[]>([]);
  const [booting, setBooting] = useState(true);
  const promoImageCache = useRef<Set<string>>(new Set());

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(true);
  const [myAppointmentsOpen, setMyAppointmentsOpen] = useState(false);
  const [visitsOpen, setVisitsOpen] = useState(false);
  const [appointmentDetailsOpen, setAppointmentDetailsOpen] = useState(false);
  const [activeAppointment, setActiveAppointment] = useState<Appointment | null>(null);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [documentsLoading, setDocumentsLoading] = useState(true);
  const [documentDetailsOpen, setDocumentDetailsOpen] = useState(false);
  const [activeDocument, setActiveDocument] = useState<DocumentItem | null>(null);
  const [cancelOverlayOpen, setCancelOverlayOpen] = useState(false);
  const cancelOverlayTimerRef = useRef<number | null>(null);

  const [contacts, setContacts] = useState({
    phone: "+7 (3953) 21-64-22",
    siteLabel: "медграфт.рф",
    siteUrl: "https://медграфт.рф",
    whatsappUrl: "https://wa.me/79990000000",
    telegramUrl: "https://t.me/medgraft",
  });

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [pr, ch, c, ap, docsData] = await Promise.all([
          onec.promotions.list(),
          onec.checkups.list(),
          onec.contacts.get(),
          fetchAppointments().catch((err) => {
            console.warn("appointments fallback:", err);
            return [] as Appointment[];
          }),
          fetchDocuments().catch((err) => {
            console.warn("documents fallback:", err);
            return [] as DocumentItem[];
          }),
        ]);
        if (!alive) return;
        setPromos(pr);
        setCheckups(ch);
        setContacts(c);
        setAppointments(ap);
        setDocuments(docsData);
      } catch (e) {
        console.warn("onec fallback:", e);
      } finally {
        if (alive) {
          setBooting(false);
          setAppointmentsLoading(false);
          setDocumentsLoading(false);
        }
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const upcomingAppointment = useMemo(() => {
    if (!appointments.length) return null;
    const planned = appointments.filter((item) => item.status === "planned");
    if (!planned.length) return null;
    return planned.reduce((nearest, item) => {
      const itemTs = new Date(item.date).getTime();
      const nearestTs = new Date(nearest.date).getTime();
      return itemTs < nearestTs ? item : nearest;
    });
  }, [appointments]);

  const upcomingDateLabel = upcomingAppointment ? formatTileDate(upcomingAppointment.date) : "—";
  const upcomingTimeLabel = upcomingAppointment ? formatTileTime(upcomingAppointment.date) : "—";
  const upcomingDoctorName = upcomingAppointment?.doctorName ?? "Пока нет записи";
  const upcomingDoctorSpecialty =
    upcomingAppointment?.specialty ?? "Запишитесь на приём, чтобы мы показали детали";
  const upcomingDoctorAvatar = upcomingAppointment?.doctorAvatar ?? "/doc1.png";
  const hasActiveAppointments = appointments.some((item) => item.status === "planned");
  const showMyRecordCard = !appointmentsLoading && hasActiveAppointments;

  const handleOpenMyRecord = () => {
    setMyAppointmentsOpen(true);
  };

  const handleOpenVisits = () => {
    setVisitsOpen(true);
  };

  const handleSelectAppointment = (appointment: Appointment) => {
    setActiveAppointment(appointment);
    setAppointmentDetailsOpen(true);
    setMyAppointmentsOpen(false);
    setVisitsOpen(false);
  };

  const handleCancelAppointment = (appointment: Appointment) => {
    if (appointment.status !== "planned") return;
    setAppointments((prev) =>
      prev.map((item) => (item.id === appointment.id ? { ...item, status: "cancelled" } : item)),
    );
    setActiveAppointment((prev) =>
      prev && prev.id === appointment.id ? { ...prev, status: "cancelled" } : prev,
    );
    setAppointmentDetailsOpen(false);
    setCancelOverlayOpen(false);
    if (cancelOverlayTimerRef.current) {
      window.clearTimeout(cancelOverlayTimerRef.current);
    }
    cancelOverlayTimerRef.current = window.setTimeout(() => {
      setCancelOverlayOpen(true);
      cancelOverlayTimerRef.current = null;
    }, 60);
  };

  const handleCloseAppointmentDetails = () => {
    setAppointmentDetailsOpen(false);
    setActiveAppointment(null);
  };

  const handleSelectDocument = (document: DocumentItem) => {
    setActiveDocument(document);
    setDocumentDetailsOpen(true);
    setDocsOpen(false);
  };

  const handleCloseDocumentDetails = () => {
    setDocumentDetailsOpen(false);
    setActiveDocument(null);
  };

  useEffect(() => {
    if (!promos.length) return;
    const cache = promoImageCache.current;

    promos.forEach((promo) => {
      [promo.cardImage, promo.banner].forEach((src) => {
        if (!src) return;
        if (cache.has(src)) return;
        const img = new Image();
        img.decoding = "async";
        img.src = src;
        cache.add(src);
      });
    });
  }, [promos]);

  useEffect(() => {
    return () => {
      if (cancelOverlayTimerRef.current) {
        window.clearTimeout(cancelOverlayTimerRef.current);
        cancelOverlayTimerRef.current = null;
      }
    };
  }, []);
  // авто-подгон заголовков
  const baseTitlePx = 16;
  const minTitlePx  = 12;
  const titleRefs = useRef<Array<HTMLDivElement | null>>([]);
  titleRefs.current = Array.from({ length: checkups.length }, (_, k) => titleRefs.current[k] ?? null);

  const [promoOpen, setPromoOpen] = useState(false);
  const [activePromo, setActivePromo] = useState<PromoData | null>(null);


  useLayoutEffect(() => {
    const measureGridHeights = () => {
      const grid = gridRef.current;
      if (!grid) return;
      const items = Array.from(grid.children) as HTMLElement[];
      const top = grid.getBoundingClientRect().top;

      let collapsedMax = 0;
      items.slice(0, 4).forEach((el) => {
        const r = el.getBoundingClientRect();
        collapsedMax = Math.max(collapsedMax, r.bottom - top);
      });

      setHeights({
        collapsed: Math.ceil(collapsedMax),
        expanded: grid.scrollHeight,
      });
    };

    // ⬇️ НОВОЕ: подгоняем размер текста ОТДЕЛЬНО для каждой карточки
    const fitTitlesPerCard = () => {
      titleRefs.current.forEach((el) => {
        if (!el) return;

        // контейнер карточки
        const card = el.closest("a") as HTMLElement | null;
        const container = card ?? (el.parentElement as HTMLElement);
        if (!container) return;

        // доступная ширина = clientWidth - горизонтальные padding
        const cs = getComputedStyle(container);
        const available =
          container.clientWidth -
          parseFloat(cs.paddingLeft || "0") -
          parseFloat(cs.paddingRight || "0") -
          2; // маленький запас

        if (available <= 0) {
          el.style.fontSize = `${minTitlePx}px`;
          return;
        }

        // создаём скрытый "пробник" вне потока, чтобы измерять без ограничений
        const probe = el.cloneNode(true) as HTMLElement;
        probe.style.position = "absolute";
        probe.style.visibility = "hidden";
        probe.style.left = "-9999px";
        probe.style.whiteSpace = "nowrap";
        probe.style.maxWidth = "none";
        probe.style.overflow = "visible";
        probe.style.textOverflow = "clip";
        probe.style.fontSize = `${baseTitlePx}px`;
        document.body.appendChild(probe);

        // если помещается в базовом — оставляем базовый
        if (probe.scrollWidth <= available) {
          el.style.fontSize = `${baseTitlePx}px`;
          document.body.removeChild(probe);
          return;
        }

        // бинарный поиск подходящего размера [min, base]
        let lo = minTitlePx;
        let hi = baseTitlePx;
        let best = lo;

        for (let it = 0; it < 12; it++) {
          const mid = (lo + hi) / 2;
          probe.style.fontSize = `${mid}px`;
          const needed = probe.scrollWidth;

          if (needed <= available) {
            best = mid;
            lo = mid; // пробуем больше
          } else {
            hi = mid; // нужно меньше
          }
        }

        // применяем найденный размер
        el.style.fontSize = `${Math.max(minTitlePx, Math.round(best * 10) / 10)}px`;
        document.body.removeChild(probe);
      });
    };

    const run = () => {
      measureGridHeights();
      fitTitlesPerCard(); // ⬅️ вызов
    };

    run();
    const ro = new ResizeObserver(run);
    if (gridRef.current) ro.observe(gridRef.current);
    window.addEventListener("resize", run);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", run);
    };
  }, [showAllCheckups, checkups.length]);


  return (
    <main className="min-h-dvh bg-[#F7FAFF]">
      <BootSplash visible={booting} />
      {/* <Header onNotificationsClick={() => setNotifOpen(true)} /> */}


      <div className="mx-auto max-w-[520px] px-4 pb-28 pt-4 text-[16px]">
        {/* Акции */}
        <section>
          {promos.length > 0 && (
            <div className="no-scrollbar flex gap-3 overflow-x-auto pb-1">
              {promos.map((p, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => { setActivePromo(p); setPromoOpen(true); }}
                  className="shrink-0 overflow-hidden rounded-[20px] ring-1 ring-black/5 focus:outline-none active:translate-y-[1px]"
                  style={{ width: 195, height: 183 }}
                  aria-label={`Открыть акцию: ${p.title}`}
                >
                  <img src={p.cardImage} alt={p.title} className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </section>


        {/* CTA */}
        <section className="mt-4">
          <button
            href="/booking"
            className="block w-full rounded-[18px] bg-gradient-to-r from-sky-500 to-blue-600 px-6 py-4 text-center text-[21px] font-semibold text-white shadow-md active:translate-y-[1px]"
          >
            Записаться на приём
          </button>
        </section>

        {/* Моя запись */}
        {showMyRecordCard && (
          <section
            className="mt-5 rounded-[22px] bg-gradient-to-br from-sky-400 to-blue-500 p-4 text-white shadow-lg transition-transform active:translate-y-[1px] cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
            role="button"
            tabIndex={0}
            onClick={handleOpenMyRecord}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                handleOpenMyRecord();
              }
            }}
            aria-label="Открыть список моих записей"
          >
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <div className="text-[19px] font-semibold">Моя запись</div>
              </div>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="shrink-0 opacity-90">
                <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-[18px] bg-white/18 p-3 ring-1 ring-white/20 backdrop-blur-[2px]">
                <div className="mb-1 flex items-center gap-2 text-[13px] opacity-90">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M7 3v3M17 3v3M4 9h16M5 21h14a2 2 0 0 0 2-2V8H3v11a2 2 0 0 0 2 2Z" stroke="currentColor" strokeWidth="1.6"/>
                  </svg>
                  Дата
                </div>
                <div className="text-[16px] font-semibold">{upcomingDateLabel}</div>
              </div>

              <div className="rounded-[18px] bg-white/18 p-3 ring-1 ring-white/20 backdrop-blur-[2px]">
                <div className="mb-1 flex items-center gap-2 text-[13px] opacity-90">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6"/>
                  </svg>
                  Время
                </div>
                <div className="text-[16px] font-semibold">{upcomingTimeLabel}</div>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between rounded-[18px] bg-white/95 p-3 text-slate-800 ring-1 ring-white/30">
              <div className="flex items-center gap-3">
                <img
                  src={upcomingDoctorAvatar}
                  alt=""
                  className="h-10 w-10 rounded-full border border-slate-200 object-cover"
                  onError={(event) => {
                    (event.currentTarget as HTMLImageElement).src = "/doc1.png";
                  }}
                />
                <div className="min-w-0 leading-tight">
                  <div className="truncate text-[16px] font-semibold">{upcomingDoctorName}</div>
                  <div className="mt-0.5 text-[12.5px] text-slate-500">
                    {upcomingDoctorSpecialty}
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ЧЕКАПЫ */}
        <section className="mt-6 bg-inherit">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[21px] font-semibold text-slate-900">Чекапы</h2>

            <button
              type="button"
              aria-expanded={showAllCheckups}
              onClick={() => setShowAllCheckups((v) => !v)}
              className="group inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[14.5px] font-medium text-slate-700 hover:bg-slate-100 active:scale-[.98] transition"
            >
              <span>Все</span>
              <svg
                className={`h-[18px] w-[18px] transition-transform duration-300 ${showAllCheckups ? "rotate-180" : ""}`}
                viewBox="0 0 24 24" fill="none"
              >
                <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>

          <div
            ref={gridRef}
            className="grid grid-cols-2 gap-3 overflow-hidden bg-transparent"
            style={{
             maxHeight:
               heights.collapsed > 0
                 ? (showAllCheckups ? heights.expanded : heights.collapsed)
                 : undefined, // пока не измерили — не ограничиваем
              transition: !booting && heights.collapsed > 0 ? "max-height 400ms cubic-bezier(.2,.8,.2,1)" : undefined,
              WebkitBackfaceVisibility: "hidden",
              backfaceVisibility: "hidden",
            }}
          >
            {checkups.map((c, i) => {
              const hiddenWhileCollapsed = i >= 4 && !showAllCheckups;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => { setActiveCheckup(c as unknown as CheckupData); setCheckupOpen(true); }}
                  className={[
                    "relative overflow-hidden rounded-[20px] bg-gradient-to-br p-4 text-left text-white",
                    "ring-1 ring-white/10",
                    "transition-transform duration-300 will-change-transform",
                    "hover:-translate-y-[2px] active:translate-y-0 active:scale-[.99]",
                    c.bg,
                    hiddenWhileCollapsed ? "opacity-0 translate-y-2 pointer-events-none" : "opacity-100 translate-y-0",
                    "transition-opacity duration-300",
                  ].join(" ")}
                  style={{ aspectRatio: "173.5 / 90" }}
                  aria-label={`Открыть чекап: ${c.title}`}
                >
                  <div
                    className="pointer-events-none absolute inset-0"
                    style={{ background:
                      "radial-gradient(110% 55% at 0% 0%, rgba(255,255,255,.15) 0%, rgba(255,255,255,0) 60%)"
                    }}
                  />
                  <div className="mb-2 opacity-95 text-white/90">
                    {c.icon === "mrt" && (
                      <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                        <rect x="3" y="6" width="18" height="12" rx="3" stroke="currentColor" strokeWidth="1.8"/>
                        <path d="M7 10h10M7 14h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                      </svg>
                    )}
                    {c.icon === "stetho" && (
                      <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                        <path d="M6 6v5a5 5 0 1 0 10 0V6M6 6h2M16 6h2M18 14a2 2 0 1 0 0-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                    {c.icon === "eye" && (
                      <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                        <path d="M2 12s4-6 10-6 10 6 10 6-4 6-10 6-10-6-10-6Z" stroke="currentColor" strokeWidth="1.8"/>
                        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8"/>
                      </svg>
                    )}
                    {c.icon === "balloon" && (
                      <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                        <path d="M12 3c3 0 5 2.2 5 5s-2 7-5 7-5-4.2-5-7 2-5 5-5Z" stroke="currentColor" strokeWidth="1.8"/>
                        <path d="M12 15c0 2-1 3-3 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                      </svg>
                    )}
                    {c.icon === "heart" && (
                      <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                        <path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2 4 4 0 0 1 7 2c0 5.5-7 10-7 10Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                    {c.icon === "leaf" && (
                      <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                        <path d="M4 14c3-6 8-8 16-8-1 8-3 13-9 14-4 .5-7-2-7-6Z" stroke="currentColor" strokeWidth="1.8"/>
                        <path d="M10 10c0 4 1 6 4 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                      </svg>
                    )}
                    {c.icon === "ear" && (
                      <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                        <path d="M16 15c0 2-1.5 4-4 4s-4-2-4-4V9a4 4 0 1 1 8 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                    {c.icon === "bone" && (
                      <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                        <path d="M5 9a2.5 2.5 0 1 1 3-3l8 8a2.5 2.5 0 1 1-3 3l-8-8Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>

                  <div
                    ref={(el) => (titleRefs.current[i] = el)}
                    className="font-semibold leading-tight overflow-hidden text-ellipsis whitespace-nowrap"
                  >
                    {c.title}
                  </div>
                  <div className="mt-0.5 text-[13.5px] leading-5 text-white/85 drop-shadow-[0_1px_0_rgba(0,0,0,.25)]">
                    {c.sub}
                  </div>
                </button>
              );
            })}
          </div>
        </section>



        {/* Кнопки */}
        <section className="mt-5 space-y-3">
          <button
            onClick={handleOpenVisits}
            className="block w-full rounded-[18px] bg-gradient-to-r from-sky-500 to-blue-600 px-6 py-4 text-center text-[21px] font-semibold text-white shadow-md active:translate-y-[1px]"
          >
            Мои приёмы
          </button>
          <button
            onClick={() => setDocsOpen(true)}
            className="block w-full rounded-[18px] bg-white px-6 py-4 text-center text-[21px] font-semibold text-sky-700 shadow-md ring-1 ring-sky-100 active:translate-y-[1px]"
          >
            Мои исследования
          </button>
        </section>

        {/* Контакты */}
        <section className="mt-6" id="contacts">
          <h2 className="mb-3 text-[20px] font-semibold text-slate-900">Контакты</h2>

          <div className="relative">
            {/* Карта (картинка) */}
            <a
              href="https://yandex.ru/maps/-/CLuL7Jmp"
              target="_blank"
              rel="noopener noreferrer"
              className="block overflow-hidden rounded-[22px]"
              aria-label="Открыть карту"
            >
              {/* Контейнер ниже задаёт финальную высоту превью; всё что не влезло — обрежется СНИЗУ */}
              <div className="relative h-[260px] sm:h-[300px]">
                {/*
                  ВАЖНО: object-[center_top] прижимает картинку к ВЕРХУ,
                  поэтому лишняя часть обрежется именно снизу.
                  Можно чуть увеличить исходную высоту, чтобы дать «запас» для обрезки.
                */}
                <img
                  src="/map.png"
                  alt="Медграфт на карте"
                  className="absolute inset-0 h-[300px] w-full object-cover object-[center_top]"
                />
              </div>
            </a>

            {/* Белая карточка поверх карты */}
            <div className="pointer-events-none absolute left-1/2 bottom-4 w-[92%] -translate-x-1/2">
              <div className="mx-auto flex items-center justify-between gap-4 rounded-[22px] bg-white/95 p-4 shadow-xl ring-1 ring-slate-100 backdrop-blur">
                <div className="flex min-w-0 items-center gap-3">
                  {/* ⬇️ заменили контейнер с фоном на сам маркер */}
                  <img
                    src="/hospital.svg"
                    alt=""
                    className="h-12 w-12 shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="truncate text-[18px] font-semibold text-slate-900">Медграфт</div>
                    <div className="truncate text-[14px] text-slate-500">Братск, Россия</div>
                  </div>
                </div>
                <a
                  href="https://yandex.ru/maps/-/CLuL7Jmp"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="pointer-events-auto shrink-0 text-[15px] font-semibold text-sky-600 hover:underline"
                >
                  На карте
                </a>
              </div>
            </div>
          </div>

          <div className="h-8" />

          <div className="grid gap-3 [grid-template-columns:minmax(0,1fr)_auto] max-[340px]:gap-2">
            {/* ЛЕВАЯ колонка */}
            <div className="min-w-0 space-y-3 pr-1 self-start">
              <a href={`tel:${contacts.phone.replace(/[^\d+]/g, "")}`} className="flex items-start gap-2.5">
                <span className="mt-0.5 inline-flex h-7 w-7 items-center justify-center rounded-full bg-sky-50 ring-1 ring-sky-100">
                  <img src="/phone.svg" alt="" className="h-4.5 w-4.5" />
                </span>
                <span className="text-[16px] font-bold text-slate-900">
                  {contacts.phone}
                </span>
              </a>

              {/* АДРЕС: теперь без truncate, можно переносить строки */}
              <div className="flex items-start gap-2.5 min-w-0">
                <span className="mt-0.5 inline-flex h-7 w-7 items-center justify-center rounded-full bg-sky-50 ring-1 ring-sky-100">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path d="M12 22s7-5.33 7-12a7 7 0 1 0-14 0c0 6.67 7 12 7 12Z" stroke="currentColor" strokeWidth="1.6"/>
                    <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="1.6"/>
                  </svg>
                </span>
                <div className="min-w-0 leading-tight">
                  <span className="block text-[15px] font-bold text-slate-900 whitespace-normal">
                    Ул. Крупской 58
                  </span>
                  <span className="block text-[14px] font-normal text-slate-600">
                    Г. Братск
                  </span>
                </div>
              </div>
            </div>

            {/* ПРАВАЯ колонка — одна строка, не влияет на ширину адреса слева */}
            <div className="pl-1 self-start">
              <div className="flex items-start gap-2.5 whitespace-nowrap">
                <span className="mt-0.5 inline-flex h-7 w-7 items-center justify-center rounded-full bg-sky-50 ring-1 ring-sky-100">
                  <img src="/globe.svg" alt="" className="h-4.5 w-4.5" />
                </span>
                <a
                  href={contacts.siteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[16px] font-bold text-slate-900 underline-offset-2 hover:underline"
                >
                  {contacts.siteLabel}
                </a>
              </div>
            </div>
          </div>
        </section>
      </div>

      <VisitsSheet
        open={visitsOpen}
        onClose={() => setVisitsOpen(false)}
        appointments={appointments}
        onSelect={handleSelectAppointment}
      />
      <MyAppointmentsSheet
        open={myAppointmentsOpen}
        onClose={() => setMyAppointmentsOpen(false)}
        appointments={appointments}
        onSelect={handleSelectAppointment}
      />
      <AppointmentDetailsSheet
        open={appointmentDetailsOpen}
        onClose={handleCloseAppointmentDetails}
        appointment={activeAppointment}
        onCancel={handleCancelAppointment}
      />
      <CheckupsSheet open={checkupOpen} onClose={() => setCheckupOpen(false)} checkup={activeCheckup} />
      <PromoSheet open={promoOpen} onClose={() => setPromoOpen(false)} promo={activePromo} />
      <NotificationsSheet open={notifOpen} onClose={() => setNotifOpen(false)} />
      <DocumentsSheet
        open={docsOpen}
        onClose={() => setDocsOpen(false)}
        documents={documents}
        loading={documentsLoading}
        onSelect={handleSelectDocument}
      />
      <DocumentDetailsSheet
        open={documentDetailsOpen}
        onClose={handleCloseDocumentDetails}
        document={activeDocument}
      />
      <PromoSuccessOverlay
        open={cancelOverlayOpen}
        onClose={() => setCancelOverlayOpen(false)}
        titleLines={["Спасибо!", "Ваша запись отменена"]}
        subtitle="Будем ждать вас снова."
        icon="sad"
      />
      {/* <BottomNav /> */}
    </main>
  );
}
