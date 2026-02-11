"use client";

import { useEffect, useMemo, useState } from "react";
import SheetFrame from "@/components/SheetFrame";
import AppImage from "@/components/AppImage";
import { DOCTOR_AVATAR_PLACEHOLDER, type Appointment } from "@/utils/api";

type VisitsSheetProps = {
  open: boolean;
  onClose: () => void;
  appointments: Appointment[];
  activeAppointments: Appointment[];
  cancelledAppointments: Appointment[];
  onSelect?: (appointment: Appointment) => void;
};

const TITLE = "История посещений";
const SUBTITLE = "Ваши приемы";
const EMPTY_ACTIVE = "Нет действующих приемов.";
const EMPTY_CANCELLED = "Нет отмененных приемов.";
const EMPTY_HISTORY = "Пока нет записей в истории.";
const PAGE_SIZE = 5;

const STATUS_META: Record<
  Appointment["status"],
  { label: string; chipClass: string }
> = {
  planned: {
    label: "Запланирована",
    chipClass: "bg-sky-500/15 text-sky-600 ring-1 ring-sky-500/20",
  },
  confirmed: {
    label: "Подтверждена",
    chipClass: "bg-indigo-500/15 text-indigo-600 ring-1 ring-indigo-500/20",
  },
  completed: {
    label: "Завершена",
    chipClass: "bg-emerald-500/15 text-emerald-600 ring-1 ring-emerald-500/20",
  },
  cancelled: {
    label: "Отменена",
    chipClass: "bg-rose-500/15 text-rose-600 ring-1 ring-rose-500/20",
  },
};

function formatDateTime(dateIso: string) {
  const date = new Date(dateIso);
  const dateLabel = date.toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  const timeLabel = date.toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return { dateLabel, timeLabel };
}

function Pagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (next: number) => void;
}) {
  if (totalPages <= 1) {
    return null;
  }
  const pages = Array.from({ length: totalPages }, (_, index) => index + 1);

  return (
    <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
      <button
        type="button"
        onClick={() => onPageChange(Math.max(1, page - 1))}
        disabled={page <= 1}
        className="rounded-full px-3 py-1.5 text-[13px] font-semibold text-slate-600 ring-1 ring-slate-200 transition disabled:cursor-not-allowed disabled:opacity-40"
      >
        {"Назад"}
      </button>
      {pages.map((value) => (
        <button
          key={value}
          type="button"
          onClick={() => onPageChange(value)}
          className={[
            "h-8 min-w-[32px] rounded-full px-2 text-[13px] font-semibold ring-1 transition",
            value === page
              ? "bg-sky-500 text-white ring-sky-500"
              : "bg-white text-slate-600 ring-slate-200 hover:bg-slate-50",
          ].join(" ")}
        >
          {value}
        </button>
      ))}
      <button
        type="button"
        onClick={() => onPageChange(Math.min(totalPages, page + 1))}
        disabled={page >= totalPages}
        className="rounded-full px-3 py-1.5 text-[13px] font-semibold text-slate-600 ring-1 ring-slate-200 transition disabled:cursor-not-allowed disabled:opacity-40"
      >
        {"Вперед"}
      </button>
    </div>
  );
}

function usePagedList(
  items: Appointment[],
  page: number,
  setPage: (next: number) => void,
) {
  const totalPages = Math.ceil(items.length / PAGE_SIZE);

  useEffect(() => {
    if (totalPages === 0) {
      if (page !== 1) {
        setPage(1);
      }
      return;
    }
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, setPage, totalPages]);

  const normalizedPage = totalPages === 0 ? 1 : Math.min(page, totalPages);
  const start = (normalizedPage - 1) * PAGE_SIZE;
  const pagedItems = items.slice(start, start + PAGE_SIZE);

  return {
    page: normalizedPage,
    totalPages,
    items: pagedItems,
  };
}

export default function VisitsSheet({
  open,
  onClose,
  appointments,
  activeAppointments,
  cancelledAppointments,
  onSelect,
}: VisitsSheetProps) {
  const [activePage, setActivePage] = useState(1);
  const [historyPage, setHistoryPage] = useState(1);
  const [cancelledPage, setCancelledPage] = useState(1);

  const { active, cancelled, history } = useMemo(() => {
    const sortedActive = [...activeAppointments].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );
    const sortedCancelled = [...cancelledAppointments].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
    const historyItems = appointments
      .filter((item) => item.status === "completed")
      .sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );

    return { active: sortedActive, cancelled: sortedCancelled, history: historyItems };
  }, [activeAppointments, cancelledAppointments, appointments]);

  const activePaged = usePagedList(active, activePage, setActivePage);
  const historyPaged = usePagedList(history, historyPage, setHistoryPage);
  const cancelledPaged = usePagedList(cancelled, cancelledPage, setCancelledPage);

  const handleSelect = (appointment: Appointment) => {
    if (!onSelect) return;
    onSelect(appointment);
  };

  const renderActiveCard = (appointment: Appointment) => {
    const { dateLabel, timeLabel } = formatDateTime(appointment.date);

    return (
      <button
        key={`active-${appointment.id}`}
        type="button"
        onClick={() => handleSelect(appointment)}
        className="relative flex w-full items-center gap-3 rounded-[20px] bg-gradient-to-r from-sky-500 to-blue-600 px-4 py-4 text-left text-white shadow-lg ring-1 ring-black/5 transition-transform active:translate-y-[1px]"
      >
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-[14px] bg-white/15">
          <AppImage
            src={appointment.doctorAvatar || DOCTOR_AVATAR_PLACEHOLDER}
            fallbackSrc={DOCTOR_AVATAR_PLACEHOLDER}
            alt=""
            width={48}
            height={48}
            className="h-12 w-12 rounded-[12px] object-cover"
          />
        </span>

        <div className="min-w-0 flex-1 leading-tight">
          <div className="truncate text-[17px] font-semibold">
            {appointment.serviceName}
          </div>
          <div className="mt-0.5 text-[14px] opacity-90">
            {dateLabel} {"·"} {timeLabel}
          </div>
        </div>

        <span className="shrink-0 opacity-90">
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M9 6l6 6-6 6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </button>
    );
  };

  const renderHistoryCard = (appointment: Appointment) => {
    const { dateLabel, timeLabel } = formatDateTime(appointment.date);
    const statusMeta = STATUS_META[appointment.status];
    const Component = onSelect ? "button" : "div";

    return (
      <Component
        key={`history-${appointment.id}`}
        {...(onSelect
          ? {
              type: "button",
              onClick: () => handleSelect(appointment),
            }
          : undefined)}
        className={[
          "flex w-full items-start gap-3 rounded-[18px] bg-white px-4 py-4 text-left shadow-sm ring-1 ring-slate-200 transition-transform",
          onSelect ? "active:translate-y-[1px]" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <span className="mt-0.5 inline-flex h-12 w-12 items-center justify-center rounded-[14px] bg-slate-100 text-slate-500">
          <AppImage
            src={appointment.doctorAvatar || DOCTOR_AVATAR_PLACEHOLDER}
            fallbackSrc={DOCTOR_AVATAR_PLACEHOLDER}
            alt=""
            width={48}
            height={48}
            className="h-12 w-12 rounded-[12px] object-cover"
          />
        </span>

        <div className="min-w-0 flex-1 leading-tight text-slate-800">
          <div className="flex flex-wrap items-center gap-2">
            <div className="truncate text-[16px] font-semibold">
              {appointment.serviceName}
            </div>
            <span
              className={[
                "inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-[12px] font-semibold leading-none",
                statusMeta.chipClass,
              ].join(" ")}
            >
              {statusMeta.label}
            </span>
          </div>

          <div className="mt-1 text-[13.5px] text-slate-600">
            {dateLabel} {"·"} {timeLabel}
          </div>
        </div>
      </Component>
    );
  };

  return (
    <SheetFrame
      open={open}
      onClose={onClose}
      title={TITLE}
      subtitle={SUBTITLE}
      iconSrc="/list.svg"
      innerClassName="space-y-6"
    >
      <section className="space-y-3">
        <h3 className="px-1 text-[15px] font-semibold uppercase tracking-wide text-slate-500">
          {"Действующие приемы"}
        </h3>
        {active.length === 0 ? (
          <div className="rounded-[18px] bg-slate-100 px-5 py-6 text-center text-[15px] text-slate-600">
            {EMPTY_ACTIVE}
          </div>
        ) : (
          <>
            <div className="space-y-3">{activePaged.items.map(renderActiveCard)}</div>
            <Pagination
              page={activePaged.page}
              totalPages={activePaged.totalPages}
              onPageChange={setActivePage}
            />
          </>
        )}
      </section>

      <section className="space-y-3">
        <h3 className="px-1 text-[15px] font-semibold uppercase tracking-wide text-slate-500">
          {"История посещений"}
        </h3>
        {history.length === 0 ? (
          <div className="rounded-[18px] bg-slate-50 px-5 py-6 text-center text-[15px] text-slate-500">
            {EMPTY_HISTORY}
          </div>
        ) : (
          <>
            <div className="space-y-3">{historyPaged.items.map(renderHistoryCard)}</div>
            <Pagination
              page={historyPaged.page}
              totalPages={historyPaged.totalPages}
              onPageChange={setHistoryPage}
            />
          </>
        )}
      </section>

      <section className="space-y-3">
        <h3 className="px-1 text-[15px] font-semibold uppercase tracking-wide text-slate-500">
          {"Отмененные"}
        </h3>
        {cancelled.length === 0 ? (
          <div className="rounded-[18px] bg-slate-50 px-5 py-6 text-center text-[15px] text-slate-500">
            {EMPTY_CANCELLED}
          </div>
        ) : (
          <>
            <div className="space-y-3">{cancelledPaged.items.map(renderHistoryCard)}</div>
            <Pagination
              page={cancelledPaged.page}
              totalPages={cancelledPaged.totalPages}
              onPageChange={setCancelledPage}
            />
          </>
        )}
      </section>
    </SheetFrame>
  );
}
