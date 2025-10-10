"use client";
/* eslint-disable @next/next/no-img-element */

import SheetFrame from "@/components/SheetFrame";
import type { DocumentItem } from "@/utils/api";

type DocumentsSheetProps = {
  open: boolean;
  onClose: () => void;
  documents: DocumentItem[];
  loading?: boolean;
  onSelect: (document: DocumentItem) => void;
};

function formatDate(dateIso: string) {
  const formatted = new Date(dateIso)
    .toLocaleDateString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

  return formatted;
}

const CARD_GRADIENT = "from-sky-500 to-blue-600";
const TITLE = "\u041c\u043e\u0438 \u0438\u0441\u0441\u043b\u0435\u0434\u043e\u0432\u0430\u043d\u0438\u044f";
const SUBTITLE = "\u0420\u0435\u0437\u0443\u043b\u044c\u0442\u0430\u0442\u044b \u043e\u0431\u0441\u043b\u0435\u0434\u043e\u0432\u0430\u043d\u0438\u0439 \u0438 \u0430\u043d\u0430\u043b\u0438\u0437\u043e\u0432";
const LOADING_TEXT = "\u0417\u0430\u0433\u0440\u0443\u0436\u0430\u0435\u043c \u0441\u043f\u0438\u0441\u043e\u043a \u0438\u0441\u0441\u043b\u0435\u0434\u043e\u0432\u0430\u043d\u0438\u0439\u2026";
const EMPTY_TEXT =
  "\u0417\u0434\u0435\u0441\u044c \u043f\u043e\u044f\u0432\u044f\u0442\u0441\u044f \u0440\u0435\u0437\u0443\u043b\u044c\u0442\u0430\u0442\u044b \u0432\u0430\u0448\u0438\u0445 \u0438\u0441\u0441\u043b\u0435\u0434\u043e\u0432\u0430\u043d\u0438\u0439 \u0438 \u0430\u043d\u0430\u043b\u0438\u0437\u043e\u0432 \u043f\u043e\u0441\u043b\u0435 \u043f\u043e\u0441\u0435\u0449\u0435\u043d\u0438\u044f \u043a\u043b\u0438\u043d\u0438\u043a\u0438.";
const SECTION_TITLE = "\u0414\u043e\u0441\u0442\u0443\u043f\u043d\u044b\u0435 \u0434\u043e\u043a\u0443\u043c\u0435\u043d\u0442\u044b";

export default function DocumentsSheet({
  open,
  onClose,
  documents,
  loading = false,
  onSelect,
}: DocumentsSheetProps) {
  const hasDocuments = documents.length > 0;

  return (
    <SheetFrame
      open={open}
      onClose={onClose}
      title={TITLE}
      subtitle={SUBTITLE}
      iconSrc="/list.svg"
      innerClassName="space-y-4"
    >
      {loading && (
        <div className="rounded-[18px] bg-slate-100/80 px-5 py-6 text-center text-[15px] text-slate-600">
          {LOADING_TEXT}
        </div>
      )}

      {!loading && !hasDocuments && (
        <div className="rounded-[18px] bg-slate-100/90 px-5 py-6 text-center text-[15px] text-slate-600">
          {EMPTY_TEXT}
        </div>
      )}

      {!loading && hasDocuments && (
        <div className="space-y-3">
          <h3 className="px-1 text-[15px] font-semibold uppercase tracking-wide text-slate-500">
            {SECTION_TITLE}
          </h3>
          <div className="space-y-3">
            {documents.map((doc) => (
              <button
                key={doc.id}
                type="button"
                onClick={() => onSelect(doc)}
                className={[
                  "relative flex w-full items-center gap-3 rounded-[20px] bg-gradient-to-r px-4 py-4 text-left shadow-lg ring-1 ring-black/5 transition-transform active:translate-y-[1px]",
                  CARD_GRADIENT,
                  "text-white",
                ].join(" ")}
              >
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-[14px] bg-white/15">
                  <img src="/list.svg" alt="" className="h-12 w-12" />
                </span>

                <div className="min-w-0 flex-1 leading-tight">
                  <div className="min-w-0">
                    <div className="truncate text-[17px] font-semibold">
                      {doc.type}
                    </div>
                  </div>
                  <div className="mt-1 text-[14px] text-white/90">
                    {formatDate(doc.date)}
                  </div>
                </div>

                <span className="shrink-0">
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    className="opacity-90"
                    aria-hidden="true"
                  >
                    <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </SheetFrame>
  );
}
