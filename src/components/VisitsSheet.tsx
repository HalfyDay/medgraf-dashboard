"use client";
import SheetFrame, { SectionCard } from "@/components/SheetFrame";

const appointment = {
  date: new Date("2025-08-31T13:00:00"),
  time: "13:00",
  clinic: { name: "Медграфт", city: "Усть-Илимск" },
  conclusion: "Заключение",
  doctor: {
    name: "Былым И. А.",
    role: "Офтальмолог",
    avatar: "/doc1.png",
    verified: true,
  },
};

function formatRuShort(d: Date) {
  return d
    .toLocaleDateString("ru-RU", { day: "2-digit", month: "short", year: "numeric" })
    .replace(/ ?г\.?/gi, "")
    .replace(/\./g, "")
    .replace(/\b([а-яё])/i, (m) => m.toUpperCase());
}

export default function VisitsSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <SheetFrame
      open={open}
      onClose={onClose}
      title="История посещений"
      subtitle="Ваши приёмы"
      iconSrc="/list.svg"
    >
      {/* Можно оставлять секционные заголовки как есть — это уже «наполнение» */}
      <h2 className="px-1 mb-3 text-[22px] font-extrabold text-slate-900">Детали записи</h2>

      <SectionCard>
        <ul className="divide-y divide-slate-100">
          {/* Дата */}
          <li className="px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="leading-tight">
                <div className="text-[14px] text-slate-600">Дата</div>
                <div className="mt-1 text-[18px] font-extrabold text-slate-900">
                  {formatRuShort(appointment.date)}
                </div>
              </div>
              <div className="shrink-0 opacity-70">
                <img src="/date.svg" alt="" className="h-7 w-7" />
              </div>
            </div>
          </li>

          {/* Время */}
          <li className="px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="leading-tight">
                <div className="text-[14px] text-slate-600">Время</div>
                <div className="mt-1 text-[18px] font-extrabold text-slate-900">
                  {appointment.time}
                </div>
              </div>
              <div className="shrink-0 opacity-70">
                <img src="/time.svg" alt="" className="h-7 w-7" />
              </div>
            </div>
          </li>

          {/* Место */}
          <li className="px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="leading-tight">
                <div className="text-[18px] font-extrabold text-slate-900">{appointment.clinic.name}</div>
                <div className="mt-1 text-[16px] font-semibold text-slate-600">{appointment.clinic.city}</div>
              </div>
              <div className="shrink-0 opacity-70">
                <img src="/clinic.svg" alt="" className="h-7 w-7" />
              </div>
            </div>
          </li>

          {/* Заключение */}
          <li className="px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="leading-tight">
                <div className="text-[18px] font-extrabold text-slate-900">
                  {appointment.conclusion}
                </div>
              </div>
              <div className="shrink-0 opacity-70">
                <img src="/note.svg" alt="" className="h-7 w-7" />
              </div>
            </div>
          </li>
        </ul>
      </SectionCard>

      {/* Карточка врача — тоже «наполнение» */}
      <div className="mx-1 mt-4 flex items-center justify-between rounded-[18px] bg-white px-4 py-3 shadow-md ring-1 ring-slate-100">
        <div className="flex items-center gap-3">
          <img
            src={appointment.doctor.avatar}
            alt="doctor avatar"
            className="h-11 w-11 rounded-full object-cover"
            onError={(e) =>
              ((e.target as HTMLImageElement).src =
                "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'><rect width='100%' height='100%' rx='20' fill='%23E5E7EB'/><text x='50%' y='54%' dominant-baseline='middle' text-anchor='middle' font-size='12' fill='%239CA3AF'>👨‍⚕️</text></svg>")
            }
          />
          <div className="leading-tight">
            <div className="text-[16px] font-bold text-slate-900">{appointment.doctor.name}</div>
            <div className="text-[13px] text-slate-600">{appointment.doctor.role}</div>
          </div>
        </div>

        {appointment.doctor.verified && (
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-sky-500/10 text-sky-600" title="Проверено">
            <img src="/verified.svg" alt="" className="h-4.5 w-4.5" />
          </span>
        )}
      </div>
    </SheetFrame>
  );
}
