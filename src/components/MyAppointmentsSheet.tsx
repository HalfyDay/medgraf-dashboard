"use client";
/* eslint-disable @next/next/no-img-element */

import { useMemo } from "react";
import SheetFrame from "@/components/SheetFrame";
import type { Appointment } from "@/utils/api";

type MyAppointmentsSheetProps = {
  open: boolean;
  onClose: () => void;
  appointments: Appointment[];
  onSelect: (appointment: Appointment) => void;
};

const TITLE = "\u041c\u043e\u0438 \u0437\u0430\u043f\u0438\u0441\u0438";
const SUBTITLE = "\u0411\u043b\u0438\u0436\u0430\u0439\u0448\u0438\u0435 \u043f\u0440\u0438\u0451\u043c\u044b";
const ZERO_STATE = "\u041f\u043e\u043a\u0430 \u043d\u0435\u0442 \u043d\u0438 \u043e\u0434\u043d\u043e\u0439 \u0437\u0430\u043f\u0438\u0441\u0438. \u041a\u0430\u043a \u0442\u043e\u043b\u044c\u043a\u043e \u0432\u044b \u0437\u0430\u043f\u0438\u0448\u0435\u0442\u0435\u0441\u044c \u043d\u0430 \u043f\u0440\u0438\u0451\u043c, \u043e\u043d \u043f\u043e\u044f\u0432\u0438\u0442\u0441\u044f \u0437\u0434\u0435\u0441\u044c.";
const SECTION_TITLE = "\u0411\u043b\u0438\u0436\u0430\u0439\u0448\u0438\u0435";
const BULLET = "\u00b7";

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

export default function MyAppointmentsSheet({
  open,
  onClose,
  appointments,
  onSelect,
}: MyAppointmentsSheetProps) {
  const planned = useMemo(() => {
    const sorted = [...appointments].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );
    return sorted.filter((a) => a.status === "planned");
  }, [appointments]);

  const renderCard = (appointment: Appointment, accent = true) => {
    const { dateLabel, timeLabel } = formatDateTime(appointment.date);
    const gradient = accent
      ? "from-sky-500 to-blue-600 text-white"
      : "from-slate-100 to-slate-200 text-slate-700";
    const iconBg = accent ? "bg-white/15 text-white" : "bg-white text-slate-600";

    return (
      <button
        key={appointment.id}
        type="button"
        onClick={() => onSelect(appointment)}
        className={[
          "relative flex w-full items-center gap-3 rounded-[20px] bg-gradient-to-r px-4 py-4 text-left shadow-lg ring-1 ring-black/5 transition-transform active:translate-y-[1px]",
          gradient,
        ].join(" ")}
      >
        <span className={`inline-flex h-12 w-12 items-center justify-center rounded-[14px] ${iconBg}`}>
          <img src="/list.svg" alt="" className="h-12 w-12" />
        </span>

        <div className="min-w-0 flex-1 leading-tight">
          <div className="min-w-0">
            <div className="truncate text-[17px] font-semibold">
              {appointment.doctorName} / {appointment.specialty}
            </div>
          </div>
          <div className="mt-1 text-[14px] opacity-90">
            {dateLabel} {BULLET} {timeLabel}
          </div>
          {/* {appointment.clinic?.name && (
            <div className="mt-1 text-[13px] opacity-75">
              {appointment.clinic.name}
              {appointment.clinic.room ? ` ${BULLET} ${appointment.clinic.room}` : ""}
            </div>
          )} */}
        </div>

        <span className="shrink-0">
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            className={accent ? "opacity-90" : "opacity-60"}
            aria-hidden="true"
          >
            <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </button>
    );
  };

  return (
    <SheetFrame
      open={open}
      onClose={onClose}
      title={TITLE}
      subtitle={SUBTITLE}
      iconSrc="/list.svg"
      innerClassName="space-y-4"
    >
      {planned.length === 0 && (
        <div className="rounded-[18px] bg-slate-100/90 px-5 py-6 text-center text-[15px] text-slate-600">
          {ZERO_STATE}
        </div>
      )}

      {planned.length > 0 && (
        <div className="space-y-3">
          <h3 className="px-1 text-[15px] font-semibold uppercase tracking-wide text-slate-500">
            {SECTION_TITLE}
          </h3>
          {planned.map((appointment) => renderCard(appointment, true))}
        </div>
      )}
    </SheetFrame>
  );
}
