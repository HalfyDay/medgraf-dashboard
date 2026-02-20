"use client";

import { useState } from "react";
import SheetFrame from "@/components/SheetFrame";
import AppImage from "@/components/AppImage";
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
const DOWNLOAD_LABEL = "\u0421\u043a\u0430\u0447\u0430\u0442\u044c";
const DOWNLOAD_LOADING_LABEL = "\u0417\u0430\u0433\u0440\u0443\u0437\u043a\u0430...";

function parseFilenameFromDisposition(disposition: string | null) {
  if (!disposition) return null;
  const utfMatch = /filename\*=UTF-8''([^;]+)/i.exec(disposition);
  if (utfMatch?.[1]) {
    try {
      return decodeURIComponent(utfMatch[1].trim());
    } catch {
      return utfMatch[1].trim();
    }
  }
  const match = /filename="?([^";]+)"?/i.exec(disposition);
  return match?.[1]?.trim() || null;
}

export default function DocumentDetailsSheet({
  open,
  onClose,
  document,
}: DocumentDetailsSheetProps) {
  const [downloadLoading, setDownloadLoading] = useState(false);

  if (!document) return null;

  const dateLabel = formatDate(document.date);
  const description = document.description ?? DEFAULT_DESCRIPTION;
  const downloadLink = document.downloadUrl;

  const handleDownload = async () => {
    if (downloadLoading) return;
    setDownloadLoading(true);

    try {
      const res = await fetch(downloadLink, {
        method: "GET",
        credentials: "same-origin",
        cache: "no-store",
      });
      if (!res.ok) {
        throw new Error(`Failed to download document: ${res.status}`);
      }

      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition");
      const filenameFromHeader = parseFilenameFromDisposition(disposition);
      const fallbackName = `${document.title}.pdf`;
      const fileName = filenameFromHeader || fallbackName;

      const objectUrl = window.URL.createObjectURL(blob);
      const link = window.document.createElement("a");
      link.href = objectUrl;
      link.download = fileName;
      window.document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(objectUrl);
    } catch (error) {
      console.warn("failed to download document:", error);
    } finally {
      setDownloadLoading(false);
    }
  };

  return (
    <SheetFrame
      open={open}
      onClose={onClose}
      title={document.title}
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
          <button
            type="button"
            onClick={handleDownload}
            disabled={downloadLoading}
            className="inline-flex h-11 w-11 items-center justify-center text-sky-600 transition hover:scale-[1.05]"
            aria-label={downloadLoading ? DOWNLOAD_LOADING_LABEL : DOWNLOAD_LABEL}
          >
            <AppImage src="/download.svg" alt="" width={24} height={24} className="h-6 w-6" />
          </button>
        </div>
      </div>
    </SheetFrame>
  );
}
