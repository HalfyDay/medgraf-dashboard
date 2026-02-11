"use client";

import SheetFrame, { SectionCard } from "@/components/SheetFrame";
import AppImage from "@/components/AppImage";
import { DOCTOR_AVATAR_PLACEHOLDER, type Appointment } from "@/utils/api";

type AppointmentDetailsSheetProps = {
  open: boolean;
  onClose: () => void;
  appointment: Appointment | null;
  onCancel?: (appointment: Appointment) => void;
  cancelLoading?: boolean;
};

const CLINIC_NAME = "МедГрафт";
const CLINIC_CITY = "г.Братск";
const CLINIC_ADDRESS = "улица Крупской, 58";
const DOWNLOAD_LABEL = "Скачать";


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
  cancelLoading = false,
}: AppointmentDetailsSheetProps) {
  if (!appointment) {
    return null;
  }

  const isPlanned = appointment.status === "planned";
  const isCancelling = Boolean(cancelLoading);
  const canCancel = isPlanned && !isCancelling;
  const dateLabel = formatDate(appointment.date);
  const timeLabel = formatTime(appointment.date);
  const clinicName = appointment.clinic?.name || CLINIC_NAME;
  const clinicRoom = appointment.clinic?.room;
  const downloadUrl =
    appointment.id
      ? `/api/documents/${encodeURIComponent(appointment.id)}?type=appointment`
      : appointment.documentUrl || null;
  const canDownload = appointment.status === "completed" && downloadUrl;

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
              <AppImage src="/note.svg" alt="" width={28} height={28} className="h-7 w-7 shrink-0 opacity-70" />
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
              <AppImage src="/time.svg" alt="" width={28} height={28} className="h-7 w-7 shrink-0 opacity-70" />
            </div>
          </li>

          <li className="px-4 py-2.5">
            <div className="flex items-center justify-between gap-4">
              <div className="leading-tight">
                <div className="text-[17px] font-semibold text-slate-900">
                  {clinicName}
                </div>
                <div className="mt-1 text-[15px] font-medium text-slate-600">
                  {[CLINIC_CITY, CLINIC_ADDRESS].filter(Boolean).join(", ")}
                </div>
                {clinicRoom && (
                  <div className="mt-1 text-[13px] font-medium text-slate-500">
                    {clinicRoom}
                  </div>
                )}
              </div>
              <AppImage src="/clinic.svg" alt="" width={28} height={28} className="h-7 w-7 shrink-0 opacity-70" />
            </div>
          </li>

          {canDownload && (
            <li className="px-4 py-2.5">
              <div className="flex items-center justify-between gap-4">
                <div className="leading-tight">
                  <div className="text-[14px] text-slate-600">Описание</div>
                  <div className="mt-1 text-[17px] font-semibold text-slate-900">Файл приёма (PDF)</div>
                </div>
                <a
                  href={downloadUrl ?? undefined}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-7 w-7 items-center justify-center text-sky-600 transition hover:opacity-80"
                  aria-label={DOWNLOAD_LABEL}
                >
                  <AppImage src="/download.svg" alt="" width={28} height={28} className="h-7 w-7 shrink-0" />
                </a>
              </div>
            </li>
          )}
        </ul>
      </SectionCard>

      <div className="mx-1 mt-4 flex items-center justify-between gap-3 rounded-[18px] bg-white px-4 py-3 shadow-md ring-1 ring-slate-100">
        <div className="flex items-center gap-3">
          <AppImage
            src={appointment.doctorAvatar || DOCTOR_AVATAR_PLACEHOLDER}
            fallbackSrc={DOCTOR_AVATAR_PLACEHOLDER}
            alt=""
            width={44}
            height={44}
            className="h-11 w-11 rounded-full object-cover"
          />
          <div className="leading-tight">
            <div className="text-[16px] font-bold text-slate-900">{appointment.doctorName}</div>
            <div className="text-[13px] text-slate-600">{appointment.specialty}</div>
          </div>
        </div>
        <span className="inline-flex h-7 w-7 shrink-0 basis-7 items-center justify-center rounded-full bg-sky-500/10 text-sky-600" title="Проверенный специалист">
          <AppImage src="/verified.svg" alt="" width={18} height={18} className="h-4.5 w-4.5" />
        </span>
      </div>

      {appointment.recommendations && (
        <div className="mx-1 mt-4 rounded-[18px] bg-slate-50 px-4 py-3 text-[14.5px] text-slate-600">
          {appointment.recommendations}
        </div>
      )}

      {onCancel && (
        <button
          type="button"
          onClick={() => onCancel(appointment)}
          disabled={!canCancel}
          className={[
            "mt-5 w-full rounded-[18px] px-6 py-4 text-center text-[16px] font-semibold shadow-md ring-1 transition-all active:translate-y-[1px]",
            canCancel
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
