"use client";
import { useEffect, useState } from "react";
import SheetFrame, { SectionCard } from "@/components/SheetFrame";

type Doc = { id: string; type: string; date: string; url: string };
const mockDocs: Doc[] = [
  { id: "1", type: "УЗИ",     date: "2025-08-31", url: "#" },
  { id: "2", type: "МРТ",     date: "2025-08-31", url: "#" },
  { id: "3", type: "Анализы", date: "2025-08-31", url: "#" },
];

function formatRuShort(d: string | Date) {
  return new Date(d)
    .toLocaleDateString("ru-RU", { day: "2-digit", month: "short", year: "numeric" })
    .replace(/ ?г\.?/gi, "")
    .replace(/\./g, "")
    .replace(/\b([а-яё])/i, (m) => m.toUpperCase());
}

export default function DocumentsSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setTimeout(() => { setDocs(mockDocs); setLoading(false); }, 120);
  }, [open]);

  return (
    <SheetFrame open={open} onClose={onClose} title="Мои исследования" iconSrc="/list.svg">
      <SectionCard>
        {loading && <div className="p-4 text-center text-slate-500">Загрузка…</div>}
        {!loading && docs.length === 0 && <div className="p-4 text-center text-slate-500">Пока пусто</div>}

        <ul className="divide-y divide-slate-100">
          {docs.map((d) => (
            <li key={d.id} className="px-4 py-3">
              <div className="flex items-start justify-between gap-4">
                <div className="leading-tight">
                  <div className="text-[18px] font-extrabold text-slate-900">{formatRuShort(d.date)}</div>
                  <div className="mt-1 text-[14px] font-semibold text-slate-600">{d.type}</div>
                </div>
                <a
                  href={d.url}
                  className="mt-1 inline-flex h-9 w-9 items-center justify-center rounded-xl text-slate-600 hover:bg-slate-50"
                  download
                  aria-label="Скачать"
                >
                  <img src="/download.svg" alt="" className="h-7 w-7" />
                </a>
              </div>
            </li>
          ))}
        </ul>
      </SectionCard>
    </SheetFrame>
  );
}
