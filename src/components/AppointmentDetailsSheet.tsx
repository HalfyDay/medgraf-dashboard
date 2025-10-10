"use client";
/* eslint-disable @next/next/no-img-element */

import SheetFrame, { SectionCard } from "@/components/SheetFrame";
import type { Appointment } from "@/utils/api";

type AppointmentDetailsSheetProps = {
  open: boolean;
  onClose: () => void;
  appointment: Appointment | null;
  onCancel?: (appointment: Appointment) => void;
};

function formatDate(dateIso: string) {
  return new Date(dateIso).toLocaleDateString("ru-RU", {
    weekday: "short",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function formatTime(dateIso: string) {
  return new Date(dateIso).toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AppointmentDetailsSheet({
  open,
  onClose,
  appointment,
  onCancel,
}: AppointmentDetailsSheetProps) {
  if (!appointment) {
    return null;
  }

  const isPlanned = appointment.status === "planned";
  const dateLabel = formatDate(appointment.date);
  const timeLabel = formatTime(appointment.date);
  const clinic = appointment.clinic;

  return (
    <SheetFrame
      open={open}
      onClose={onClose}
      title="Детали записи"
      subtitle={appointment.serviceName}
      iconSrc="/list.svg"
    >
      <h2 className="px-1 mb-3 text-[20px] font-semibold text-slate-900">Информация о приёме</h2>

      <SectionCard>
        <ul className="divide-y divide-slate-100">
          <li className="px-4 py-2.5">
            <div className="flex items-center justify-between gap-4">
              <div className="leading-tight">
                <div className="text-[14px] text-slate-600">Дата</div>
                <div className="mt-1 text-[17px] font-semibold text-slate-900">
                  {dateLabel}
                </div>
              </div>
              <img src="/date.svg" alt="" className="h-7 w-7 shrink-0 opacity-70" />
            </div>
          </li>

          <li className="px-4 py-2.5">
            <div className="flex items-center justify-between gap-4">
              <div className="leading-tight">
                <div className="text-[14px] text-slate-600">Время</div>
                <div className="mt-1 text-[17px] font-semibold text-slate-900">
                  {timeLabel}
                </div>
              </div>
              <img src="/time.svg" alt="" className="h-7 w-7 shrink-0 opacity-70" />
            </div>
          </li>

          {clinic?.name && (
            <li className="px-4 py-2.5">
              <div className="flex items-center justify-between gap-4">
                <div className="leading-tight">
                  <div className="text-[17px] font-semibold text-slate-900">
                    {clinic.name}
                  </div>
                  {(clinic.city || clinic.address) && (
                    <div className="mt-1 text-[15px] font-medium text-slate-600">
                      {[clinic.city, clinic.address].filter(Boolean).join(", ")}
                    </div>
                  )}
                  {clinic.room && (
                    <div className="mt-1 text-[13px] font-medium text-slate-500">
                      {clinic.room}
                    </div>
                  )}
                </div>
                <img src="/clinic.svg" alt="" className="h-7 w-7 shrink-0 opacity-70" />
              </div>
            </li>
          )}

          {appointment.conclusion && (
            <li className="px-4 py-2.5">
              <div className="flex items-center justify-between gap-4">
                <div className="leading-tight">
                  <div className="text-[17px] font-semibold text-slate-900">
                    {appointment.conclusion}
                  </div>
                  {appointment.recommendations && (
                    <div className="mt-1 text-[13px] text-slate-600">
                      {appointment.recommendations}
                    </div>
                  )}
                </div>
                <img src="/list.svg" alt="" className="h-7 w-7 shrink-0 opacity-70" />
              </div>
            </li>
          )}
        </ul>
      </SectionCard>

      <div className="mx-1 mt-4 flex items-center justify-between gap-3 rounded-[18px] bg-white px-4 py-3 shadow-md ring-1 ring-slate-100">
        <div className="flex items-center gap-3">
          <img
            src={appointment.doctorAvatar || "/doc1.png"}
            alt=""
            className="h-11 w-11 rounded-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "/doc1.png";
            }}
          />
          <div className="leading-tight">
            <div className="text-[16px] font-bold text-slate-900">{appointment.doctorName}</div>
            <div className="text-[13px] text-slate-600">{appointment.specialty}</div>
          </div>
        </div>
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-sky-500/10 text-sky-600" title="Проверенный специалист">
          <img src="/verified.svg" alt="" className="h-4.5 w-4.5" />
        </span>
      </div>

      {appointment.recommendations && !appointment.conclusion && (
        <div className="mx-1 mt-4 rounded-[18px] bg-slate-50 px-4 py-3 text-[14.5px] text-slate-600">
          {appointment.recommendations}
        </div>
      )}

      {onCancel && (
        <button
          type="button"
          onClick={() => onCancel(appointment)}
          disabled={!isPlanned}
          className={[
            "mt-5 w-full rounded-[18px] px-6 py-4 text-center text-[16px] font-semibold shadow-md ring-1 transition-all active:translate-y-[1px]",
            isPlanned
              ? "bg-gradient-to-r from-sky-500 to-blue-600 text-white ring-sky-200 hover:from-sky-500/90 hover:to-blue-600/90"
              : "cursor-not-allowed bg-slate-100 text-slate-400 ring-slate-200",
          ].join(" ")}
        >
          {isPlanned ? "Отменить запись" : "Запись уже закрыта"}
        </button>
      )}
    </SheetFrame>
  );
}
