"use client";
/* eslint-disable @next/next/no-img-element */

import { useMemo } from "react";
import SheetFrame from "@/components/SheetFrame";
import type { Appointment } from "@/utils/api";

type VisitsSheetProps = {
  open: boolean;
  onClose: () => void;
  appointments: Appointment[];
  onSelect?: (appointment: Appointment) => void;
};

const TITLE = "История посещений";
const SUBTITLE = "Ваши приёмы";
const EMPTY_ACTIVE = "Нет активных приёмов.";
const EMPTY_HISTORY = "Пока нет записей в истории.";

const STATUS_META: Record<
  Appointment["status"],
  { label: string; chipClass: string }
> = {
  planned: {
    label: "Запланирован",
    chipClass: "bg-sky-500/15 text-sky-600 ring-1 ring-sky-500/20",
  },
  completed: {
    label: "Завершён",
    chipClass: "bg-emerald-500/15 text-emerald-600 ring-1 ring-emerald-500/20",
  },
  cancelled: {
    label: "Отменён",
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

export default function VisitsSheet({
  open,
  onClose,
  appointments,
  onSelect,
}: VisitsSheetProps) {
  const { active, history } = useMemo(() => {
    const sorted = [...appointments].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );

    const activeItems = sorted.filter((item) => item.status === "planned");
    const historyItems = sorted
      .filter((item) => item.status !== "planned")
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return { active: activeItems, history: historyItems };
  }, [appointments]);

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
          <img src="/list.svg" alt="" className="h-12 w-12" />
        </span>

        <div className="min-w-0 flex-1 leading-tight">
          <div className="truncate text-[17px] font-semibold">
            {appointment.serviceName}
          </div>
          <div className="mt-0.5 text-[14px] opacity-90">
            {dateLabel} · {timeLabel}
          </div>
          {/* <div className="mt-1 text-[13px] opacity-80">
            {appointment.doctorName} / {appointment.specialty}
          </div> */}
          {/* {appointment.clinic?.name && (
            <div className="mt-1 text-[12.5px] opacity-70">
              {appointment.clinic.name}
              {appointment.clinic.room ? ` · ${appointment.clinic.room}` : ""}
            </div>
          )} */}
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
          <img src="/list_blue.svg" alt="" className="h-12 w-12" />
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
            {dateLabel} · {timeLabel}
          </div>
          {/* <div className="mt-1 text-[13px] text-slate-500">
            {appointment.doctorName} / {appointment.specialty}
          </div>

          {appointment.clinic?.name && (
            <div className="mt-1 text-[12.5px] text-slate-500">
              {appointment.clinic.name}
              {appointment.clinic.room ? ` · ${appointment.clinic.room}` : ""}
            </div>
          )} */}
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
          Активные приёмы
        </h3>
        {active.length === 0 ? (
          <div className="rounded-[18px] bg-slate-100 px-5 py-6 text-center text-[15px] text-slate-600">
            {EMPTY_ACTIVE}
          </div>
        ) : (
          <div className="space-y-3">{active.map(renderActiveCard)}</div>
        )}
      </section>

      <section className="space-y-3">
        <h3 className="px-1 text-[15px] font-semibold uppercase tracking-wide text-slate-500">
          История посещений
        </h3>
        {history.length === 0 ? (
          <div className="rounded-[18px] bg-slate-50 px-5 py-6 text-center text-[15px] text-slate-500">
            {EMPTY_HISTORY}
          </div>
        ) : (
          <div className="space-y-3">
            {history.map((appointment) => renderHistoryCard(appointment))}
          </div>
        )}
      </section>
    </SheetFrame>
  );
}
