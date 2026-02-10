"use client";

import DocumentsSheet from "@/components/DocumentsSheet";
import DocumentDetailsSheet from "@/components/DocumentDetailsSheet";
import NotificationsSheet from "@/components/NotificationsSheet";
import MyAppointmentsSheet from "@/components/MyAppointmentsSheet";
import AppointmentDetailsSheet from "@/components/AppointmentDetailsSheet";
import VisitsSheet from "@/components/VisitsSheet";
import BookingFlowSheet from "@/components/BookingFlowSheet";
import PromoSuccessOverlay from "@/components/PromoSuccessOverlay";
import { useLayoutEffect, useRef, useState, useEffect, useMemo } from "react";
import PromoSheet, { type PromoData } from "@/components/PromoSheet";
import CheckupsSheet from "@/components/CheckupsSheet";
import AppImage from "@/components/AppImage";
import { DOCTOR_AVATAR_PLACEHOLDER, cancelScheduleAppointment, type Appointment, type DocumentItem } from "@/utils/api";
import type { CheckupData } from "@/types/checkups";
import { useAppData } from "@/providers/AppDataProvider";

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

const SkeletonBlock = ({ className }: { className: string }) => (
  <div className={`animate-pulse bg-slate-200/70 dark:bg-slate-700/60 ${className}`} />
);



export default function HomePage() {
  const {
    booting,
    promos,
    checkups,
    contacts,
    appointments,
    setAppointments,
    activeAppointments,
    cancelledAppointments,
    setActiveAppointments,
    setCancelledAppointments,
    appointmentsLoading,
    documents,
    documentsLoading,
    addPendingAppointment,
  } = useAppData();

  // ✅ хук теперь внутри компонента
  const [docsOpen, setDocsOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [showAllCheckups, setShowAllCheckups] = useState(false);
  const gridWrapperRef = useRef<HTMLDivElement | null>(null);
  const gridRef = useRef<HTMLDivElement | null>(null);
  const [heights, setHeights] = useState({ collapsed: 0, expanded: 0 });
  const [checkupOpen, setCheckupOpen] = useState(false);
  const [activeCheckup, setActiveCheckup] = useState<CheckupData | null>(null);
  const mediaImageCache = useRef<Set<string>>(new Set());
  const [myAppointmentsOpen, setMyAppointmentsOpen] = useState(false);
  const [visitsOpen, setVisitsOpen] = useState(false);
  const [appointmentDetailsOpen, setAppointmentDetailsOpen] = useState(false);
  const [activeAppointment, setActiveAppointment] = useState<Appointment | null>(null);
  const [documentDetailsOpen, setDocumentDetailsOpen] = useState(false);
  const [activeDocument, setActiveDocument] = useState<DocumentItem | null>(null);
  const [cancelOverlayOpen, setCancelOverlayOpen] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const cancelOverlayTimerRef = useRef<number | null>(null);
  const [bookingFlowOpen, setBookingFlowOpen] = useState(false);
  const [bookingSuccessOpen, setBookingSuccessOpen] = useState(false);
  const [recentBooking, setRecentBooking] = useState<Appointment | null>(null);

  const upcomingAppointment = useMemo(() => {
    if (!activeAppointments.length) return null;
    const planned = activeAppointments.filter((item) => item.status === "planned");
    if (!planned.length) return null;
    return planned.reduce((nearest, item) => {
      const itemTs = new Date(item.date).getTime();
      const nearestTs = new Date(nearest.date).getTime();
      return itemTs < nearestTs ? item : nearest;
    });
  }, [activeAppointments]);

  const upcomingDateLabel = upcomingAppointment ? formatTileDate(upcomingAppointment.date) : "—";
  const upcomingTimeLabel = upcomingAppointment ? formatTileTime(upcomingAppointment.date) : "—";
  const upcomingDoctorName = upcomingAppointment?.doctorName ?? "Клиника МедГрафт";
  const upcomingDoctorSpecialty =
    upcomingAppointment?.specialty ?? "Запишитесь на приём, чтобы мы показали детали";
  const upcomingDoctorAvatar = upcomingAppointment?.doctorAvatar || DOCTOR_AVATAR_PLACEHOLDER;
  const hasActiveAppointments = activeAppointments.some((item) => item.status === "planned");
  const showMyRecordCard = !appointmentsLoading && hasActiveAppointments;
  const showMyRecordSkeleton = (booting || appointmentsLoading) && !hasActiveAppointments;
  const showCheckupsSkeleton = checkups.length === 0;
  const showPromosSkeleton = promos.length === 0;
  const bookingSuccessSubtitle = useMemo(() => {
    if (!recentBooking) {
      return "За 24 часа до записи мы свяжемся с вами для подтверждения приёма.";
    }
    const bookingDate = new Date(recentBooking.date);
    const dateLabel = bookingDate.toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    const timeLabel = bookingDate.toLocaleTimeString("ru-RU", {
      hour: "2-digit",
      minute: "2-digit",
    });
    return `Вы записаны на ${dateLabel} в ${timeLabel}. За 24 часа до приёма мы свяжемся с вами для подтверждения.`;
  }, [recentBooking]);

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

  const handleCancelAppointment = async (appointment: Appointment) => {
    if (appointment.status !== "planned" || cancelLoading) return;
    setCancelLoading(true);
    try {
      await cancelScheduleAppointment(appointment.id);
      setAppointments((prev) =>
        prev.map((item) => (item.id === appointment.id ? { ...item, status: "cancelled" } : item)),
      );
      setActiveAppointments((prev) => prev.filter((item) => item.id !== appointment.id));
      setCancelledAppointments((prev) => [{ ...appointment, status: "cancelled" }, ...prev]);
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
    } catch (error) {
      console.warn("cancel appointment failed:", error);
    } finally {
      setCancelLoading(false);
    }
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

  const handleOpenBooking = () => {
    setBookingFlowOpen(true);
  };

  const handleBookingBooked = (appointment: Appointment) => {
    setAppointments((prev) => {
      const next = [...prev, appointment];
      return next.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    });
    setActiveAppointments((prev) => {
      const next = [...prev, appointment];
      return next.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    });
    addPendingAppointment(appointment);
    setRecentBooking(appointment);
    setBookingSuccessOpen(true);
  };

  const handleCloseBookingSuccess = () => {
    setBookingSuccessOpen(false);
    setRecentBooking(null);
  };

  useEffect(() => {
    if (!promos.length) return;
    const cache = mediaImageCache.current;

    promos.forEach((promo) => {
      [promo.cardImage, promo.banner || promo.cardImage].forEach((src) => {
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
    if (!checkups.length) return;
    const cache = mediaImageCache.current;

    checkups.forEach((checkup) => {
      const src = checkup.image;
      if (!src) return;
      if (cache.has(src)) return;
      const img = new Image();
      img.decoding = "async";
      img.src = src;
      cache.add(src);
    });
  }, [checkups]);

  useEffect(() => {
    return () => {
      if (cancelOverlayTimerRef.current) {
        window.clearTimeout(cancelOverlayTimerRef.current);
        cancelOverlayTimerRef.current = null;
      }
    };
  }, []);
  // авто-подгон заголовков
  const [promoOpen, setPromoOpen] = useState(false);
  const [activePromo, setActivePromo] = useState<PromoData | null>(null);


  useLayoutEffect(() => {
    const measureGridHeights = () => {
      const grid = gridRef.current;
      if (!grid) return;
      const items = Array.from(grid.children) as HTMLElement[];

      if (!items.length) {
        setHeights((prev) => (prev.collapsed === 0 && prev.expanded === 0 ? prev : { collapsed: 0, expanded: 0 }));
        return;
      }

      const top = grid.getBoundingClientRect().top;
      let collapsedMax = 0;
      items.slice(0, 4).forEach((el) => {
        const rect = el.getBoundingClientRect();
        collapsedMax = Math.max(collapsedMax, rect.bottom - top);
      });

      const expandedHeight = grid.scrollHeight;
      const collapsedHeight = Math.ceil(collapsedMax || expandedHeight);

      setHeights((prev) => {
        if (prev.collapsed === collapsedHeight && prev.expanded === expandedHeight) {
          return prev;
        }
        return { collapsed: collapsedHeight, expanded: expandedHeight };
      });
    };

    let rafId = 0;
    const scheduleMeasurement = () => {
      if (rafId) {
        window.cancelAnimationFrame(rafId);
      }
      rafId = window.requestAnimationFrame(() => {
        measureGridHeights();
      });
    };

    scheduleMeasurement();

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(() => scheduleMeasurement());
      const grid = gridRef.current;
      if (grid) {
        ro.observe(grid);
      }
    }

    window.addEventListener("resize", scheduleMeasurement);

    if (typeof document !== "undefined") {
      const fontSet = document.fonts;
      if (fontSet) {
        fontSet.ready.then(() => scheduleMeasurement()).catch(() => {});
      }
    }

    return () => {
      if (rafId) {
        window.cancelAnimationFrame(rafId);
      }
      if (ro) {
        ro.disconnect();
      }
      window.removeEventListener("resize", scheduleMeasurement);
    };
  }, [showAllCheckups, checkups.length]);

  const primaryActionButton =
    "block w-full rounded-[18px] bg-gradient-to-r from-sky-500 to-blue-600 px-6 py-4 text-center text-[21px] font-semibold text-white shadow-md active:translate-y-[1px]";

  return (
    <main className="min-h-dvh bg-background">
      {/* <Header onNotificationsClick={() => setNotifOpen(true)} /> */}


      <div className="mx-auto max-w-[520px] px-4 pb-28 pt-4 text-[16px]">
        {/* Акции */}
        <section>
          {promos.length > 0 ? (
            <div className="no-scrollbar flex gap-3 overflow-x-auto pb-1">
              {promos.map((p, i) => (
                <button
                  key={p.id ?? i}
                  type="button"
                  onClick={() => { setActivePromo(p); setPromoOpen(true); }}
                  className="shrink-0 overflow-hidden rounded-[20px] ring-1 ring-black/5 focus:outline-none active:translate-y-[1px]"
                  style={{ width: 195, height: 183 }}
                  aria-label={`Открыть акцию: ${p.title}`}
                >
                  <AppImage
                    src={p.cardImage}
                    alt={p.title}
                    width={195}
                    height={183}
                    unoptimized
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          ) : showPromosSkeleton ? (
            <div className="no-scrollbar flex gap-3 overflow-x-auto pb-1">
              {[0, 1, 2].map((idx) => (
                <SkeletonBlock
                  key={idx}
                  className="h-[183px] w-[195px] shrink-0 rounded-[20px]"
                />
              ))}
            </div>
          ) : null}
        </section>


        {/* CTA */}
        <section className="mt-4">
          <button
            type="button"
            onClick={handleOpenBooking}
            className={primaryActionButton}
          >
            Записаться на приём
          </button>
        </section>

        {/* Моя запись */}
        {showMyRecordSkeleton ? (
          <section className="mt-5 rounded-[22px] bg-gradient-to-br from-sky-400 to-blue-500 p-4 text-white shadow-lg">
            <div className="mb-3 flex items-center justify-between gap-3">
              <SkeletonBlock className="h-[18px] w-[120px] rounded-[8px] bg-white/30 dark:bg-white/10" />
              <SkeletonBlock className="h-[18px] w-[18px] rounded-full bg-white/30 dark:bg-white/10" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-[18px] bg-white/18 p-3 ring-1 ring-white/20">
                <SkeletonBlock className="h-[12px] w-[60px] rounded-[6px] bg-white/30 dark:bg-white/10" />
                <SkeletonBlock className="mt-2 h-[16px] w-[90px] rounded-[6px] bg-white/30 dark:bg-white/10" />
              </div>
              <div className="rounded-[18px] bg-white/18 p-3 ring-1 ring-white/20">
                <SkeletonBlock className="h-[12px] w-[60px] rounded-[6px] bg-white/30 dark:bg-white/10" />
                <SkeletonBlock className="mt-2 h-[16px] w-[90px] rounded-[6px] bg-white/30 dark:bg-white/10" />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-3 rounded-[18px] bg-white/95 p-3 ring-1 ring-white/30 dark:bg-slate-900/70 dark:ring-white/10">
              <SkeletonBlock className="h-10 w-10 rounded-full dark:bg-white/10" />
              <div className="min-w-0 flex-1">
                <SkeletonBlock className="h-[14px] w-[140px] rounded-[6px] dark:bg-white/10" />
                <SkeletonBlock className="mt-2 h-[12px] w-[200px] rounded-[6px] dark:bg-white/10" />
              </div>
            </div>
          </section>
        ) : showMyRecordCard ? (
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
                <div className="text-[14px] font-semibold leading-tight whitespace-nowrap min-[360px]:text-[16px]">{upcomingDateLabel}</div>
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

            <div className="mt-3 flex items-center justify-between rounded-[18px] bg-white/95 p-3 text-slate-800 ring-1 ring-white/30 dark:bg-slate-900/80 dark:text-slate-100 dark:ring-slate-700/60">
              <div className="flex items-center gap-3">
                <AppImage
                  src={upcomingDoctorAvatar}
                  fallbackSrc={DOCTOR_AVATAR_PLACEHOLDER}
                  alt=""
                  width={40}
                  height={40}
                  className="h-10 w-10 rounded-full border border-slate-200 object-cover dark:border-slate-700"
                />
                <div className="min-w-0 leading-tight">
                  <div className="truncate text-[16px] font-semibold">{upcomingDoctorName}</div>
                  <div className="mt-0.5 text-[12.5px] text-slate-500 dark:text-slate-400">
                    {upcomingDoctorSpecialty}
                  </div>
                </div>
              </div>
            </div>
          </section>
        ) : null}

        {/* ЧЕКАПЫ */}
        <section className="mt-6 bg-inherit">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[21px] font-semibold text-slate-900">Чекапы</h2>

            <button
              type="button"
              aria-expanded={showAllCheckups ? "true" : "false"}
              onClick={() => setShowAllCheckups((v) => !v)}
              disabled={showCheckupsSkeleton}
              className={`group inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[14.5px] font-medium text-slate-700 transition ${
                showCheckupsSkeleton ? "opacity-60" : "hover:bg-slate-100 active:scale-[.98]"
              }`}
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
            ref={gridWrapperRef}
            className="relative overflow-hidden"
            style={{
              maxHeight:
                heights.collapsed > 0
                  ? (showAllCheckups ? heights.expanded : heights.collapsed)
                 : undefined, // пока не измерили — не ограничиваем
              transition: !booting && heights.collapsed > 0 ? "max-height 400ms cubic-bezier(.2,.8,.2,1)" : undefined,
              willChange: heights.collapsed > 0 ? "max-height" : undefined,
            }}
          >
            <div
              ref={gridRef}
              className="grid grid-cols-2 gap-3 bg-transparent"
              style={{
                WebkitBackfaceVisibility: "hidden",
                backfaceVisibility: "hidden",
              }}
            >
            {showCheckupsSkeleton ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={`checkup-skeleton-${i}`}
                  className="relative min-h-[120px] overflow-hidden rounded-[20px] bg-slate-200/70 p-4 ring-1 ring-white/10 dark:bg-slate-700/50"
                >
                  <SkeletonBlock className="h-9 w-9 rounded-lg" />
                  <SkeletonBlock className="mt-3 h-[14px] w-[80%] rounded-[6px]" />
                  <SkeletonBlock className="mt-2 h-[12px] w-[60%] rounded-[6px]" />
                </div>
              ))
            ) : (
              checkups.map((c, i) => {
                const hiddenWhileCollapsed = i >= 4 && !showAllCheckups;
                return (
                  <button
                    data-checkup-card
                    key={c.id}
                    type="button"
                    aria-hidden={hiddenWhileCollapsed ? "true" : "false"}
                    tabIndex={hiddenWhileCollapsed ? -1 : 0}
                    onClick={() => { setActiveCheckup(c); setCheckupOpen(true); }}
                    className={[
                      "relative overflow-hidden rounded-[20px] bg-gradient-to-br p-4 text-left text-white",
                      "min-h-[120px]",
                      "ring-1 ring-white/10",
                      "transition-transform duration-300 will-change-transform",
                      "hover:-translate-y-[2px] active:translate-y-0 active:scale-[.99]",
                      c.bg,
                      hiddenWhileCollapsed ? "opacity-0 translate-y-2 pointer-events-none" : "opacity-100 translate-y-0",
                      "transition-opacity duration-300",
                    ].join(" ")}
                    aria-label={`Открыть чекап: ${c.title}`}
                  >
                    <div
                      className="pointer-events-none absolute inset-0"
                      style={{ background:
                        "radial-gradient(110% 55% at 0% 0%, rgba(255,255,255,.15) 0%, rgba(255,255,255,0) 60%)"
                      }}
                    />
                    {c.image && (
                      <AppImage
                        src={c.image}
                        alt=""
                        width={36}
                        height={36}
                        unoptimized
                        className="mb-2 h-9 w-9 rounded-lg object-cover shadow-sm ring-1 ring-white/40"
                      />
                    )}

                    <div className="text-[16px] font-semibold leading-tight whitespace-normal break-words">
                      {c.title}
                    </div>
                  </button>
                );
              })
            )}
          </div>
          </div>
        </section>



        {/* Кнопки */}
        <section className="mt-5 space-y-3">
          <button
            onClick={handleOpenVisits}
            className={primaryActionButton}
          >
            Мои приёмы
          </button>
          <button
            onClick={() => setDocsOpen(true)}
            className={primaryActionButton}
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
                <AppImage
                  src="/map.png"
                  alt="Медграфт на карте"
                  fill
                  sizes="100vw"
                  priority
                  unoptimized
                  className="absolute inset-0 object-cover object-[center_top]"
                />
              </div>
            </a>

            {/* Белая карточка поверх карты */}
            <div className="pointer-events-none absolute left-1/2 bottom-4 w-[92%] -translate-x-1/2">
              <div className="mx-auto flex items-center justify-between gap-4 rounded-[22px] bg-white/95 p-4 shadow-xl ring-1 ring-slate-100 backdrop-blur dark:bg-slate-900/90 dark:ring-slate-800 dark:shadow-[0_12px_30px_rgba(0,0,0,0.45)]">
                <div className="flex min-w-0 items-center gap-3">
                  {/* ⬇️ заменили контейнер с фоном на сам маркер */}
                  <AppImage
                    src="/hospital.svg"
                    alt=""
                    width={48}
                    height={48}
                    className="h-12 w-12 shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="truncate text-[18px] font-semibold text-slate-900 dark:text-slate-100">Медграфт</div>
                    <div className="truncate text-[14px] text-slate-500 dark:text-slate-400">Братск, Россия</div>
                  </div>
                </div>
                <a
                  href="https://yandex.ru/maps/-/CLuL7Jmp"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="pointer-events-auto shrink-0 text-[15px] font-semibold text-sky-600 hover:underline dark:text-sky-400"
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
              <a href={`tel:${contacts.phone.replace(/[^\d+]/g, "")}`} className="flex items-center gap-2.5">
                <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sky-50 ring-1 ring-sky-100 dark:bg-slate-800 dark:ring-slate-700">
                  <AppImage src="/phone.svg" alt="" width={16} height={16} className="h-4 w-4" />
                </span>
                <span className="text-[14px] font-bold leading-tight whitespace-nowrap text-slate-900 min-[360px]:text-[16px]">
                  {contacts.phone}
                </span>
              </a>

              {/* АДРЕС: теперь без truncate, можно переносить строки */}
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sky-50 ring-1 ring-sky-100 dark:bg-slate-800 dark:ring-slate-700">
                  <AppImage src="/location.svg" alt="" width={16} height={16} className="h-4 w-4" />
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
              <div className="flex items-center gap-2.5 whitespace-nowrap">
                <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sky-50 ring-1 ring-sky-100 dark:bg-slate-800 dark:ring-slate-700">
                  <AppImage src="/globe.svg" alt="" width={16} height={16} className="h-4 w-4" />
                </span>
                <a
                  href={contacts.siteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[14px] font-bold leading-tight whitespace-nowrap text-slate-900 underline-offset-2 hover:underline min-[360px]:text-[16px]"
                >
                  {contacts.siteLabel}
                </a>
              </div>
            </div>
          </div>
        </section>
      </div>

      <BookingFlowSheet
        open={bookingFlowOpen}
        onClose={() => setBookingFlowOpen(false)}
        onBooked={handleBookingBooked}
      />
      <VisitsSheet
        open={visitsOpen}
        onClose={() => setVisitsOpen(false)}
        appointments={appointments}
        activeAppointments={activeAppointments}
        cancelledAppointments={cancelledAppointments}
        onSelect={handleSelectAppointment}
      />
      <MyAppointmentsSheet
        open={myAppointmentsOpen}
        onClose={() => setMyAppointmentsOpen(false)}
        appointments={activeAppointments}
        onSelect={handleSelectAppointment}
      />
      <AppointmentDetailsSheet
        open={appointmentDetailsOpen}
        onClose={handleCloseAppointmentDetails}
        appointment={activeAppointment}
        onCancel={handleCancelAppointment}
        cancelLoading={cancelLoading}
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
        open={bookingSuccessOpen}
        onClose={handleCloseBookingSuccess}
        titleLines={["Спасибо!", "Вы записались"]}
        subtitle={bookingSuccessSubtitle}
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
