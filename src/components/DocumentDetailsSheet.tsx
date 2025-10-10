"use client";
/* eslint-disable @next/next/no-img-element */

import SheetFrame from "@/components/SheetFrame";
import type { DocumentItem } from "@/utils/api";

type DocumentDetailsSheetProps = {
  open: boolean;
  onClose: () => void;
  document: DocumentItem | null;
};

function formatDate(dateIso: string) {
  const formatted = new Date(dateIso)
    .toLocaleDateString("ru-RU", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    })
    .replace(/\./g, "");

  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

const DEFAULT_DESCRIPTION = "\u0414\u043e\u043a\u0443\u043c\u0435\u043d\u0442 \u0434\u043e\u0441\u0442\u0443\u043f\u0435\u043d \u0434\u043b\u044f \u0441\u043a\u0430\u0447\u0438\u0432\u0430\u043d\u0438\u044f";
const DOWNLOAD_LABEL = "\u0421\u043a\u0430\u0447\u0430\u0442\u044c PDF";

export default function DocumentDetailsSheet({
  open,
  onClose,
  document,
}: DocumentDetailsSheetProps) {
  if (!document) return null;

  const dateLabel = formatDate(document.date);
  const description = document.description ?? DEFAULT_DESCRIPTION;

  return (
    <SheetFrame
      open={open}
      onClose={onClose}
      title={document.type}
      subtitle={dateLabel}
      iconSrc="/list.svg"
      innerClassName="space-y-4"
    >
      <div className="mx-1 rounded-[18px] bg-white px-4 py-4 shadow-md ring-1 ring-slate-100">
        <div className="flex items-start justify-between gap-4">
          <div className="leading-tight">
            <div className="text-[18px] font-semibold text-slate-900">{dateLabel}</div>
            <div className="mt-1 text-[15px] font-medium text-slate-700">{description}</div>
          </div>
          <a
            href={document.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-11 w-11 items-center justify-center text-sky-600 transition hover:scale-[1.05]"
            aria-label={DOWNLOAD_LABEL}
          >
            <img src="/download.svg" alt="" className="h-6 w-6" />
          </a>
        </div>
      </div>
    </SheetFrame>
  );
}
