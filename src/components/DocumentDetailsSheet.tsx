"use client";

import { useState } from "react";
import SheetFrame from "@/components/SheetFrame";
import AppImage from "@/components/AppImage";
import type { DocumentItem } from "@/utils/api";

type DocumentDetailsSheetProps = {
  open: boolean;
  onClose: () => void;
  document: DocumentItem | null;
  onBack?: () => void;
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

const DEFAULT_DESCRIPTION = "Документ доступен для скачивания";
const DOWNLOAD_LABEL = "Скачать";
const DOWNLOAD_LOADING_LABEL = "Загрузка...";

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
  onBack,
}: DocumentDetailsSheetProps) {
  const [downloadLoading, setDownloadLoading] = useState(false);

  if (!document) return null;

  const dateLabel = formatDate(document.date);
  const description = document.description ?? DEFAULT_DESCRIPTION;
  const downloadLink = document.downloadUrl;
  const cleanTitle = document.title
    ? document.title.replace(/_/g, " ").replace(/\s+/g, " ").trim()
    : "";

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
      title={cleanTitle}
      subtitle={dateLabel}
      iconSrc="/list.svg"
      innerClassName="space-y-4"
    >
      <button
        type="button"
        onClick={handleDownload}
        disabled={downloadLoading}
        className="w-[calc(100%-8px)] mx-1 text-left rounded-[18px] bg-white px-4 py-4 shadow-md ring-1 ring-slate-100 transition hover:bg-slate-50 active:scale-[0.99] block cursor-pointer"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="leading-tight">
            <div className="text-[18px] font-semibold text-slate-900">{dateLabel}</div>
            <div className="mt-1 text-[15px] font-medium text-slate-700">{description}</div>
          </div>
          <div
            className="inline-flex h-11 w-11 items-center justify-center text-sky-600 transition hover:scale-[1.05]"
            aria-label={downloadLoading ? DOWNLOAD_LOADING_LABEL : DOWNLOAD_LABEL}
          >
            <AppImage src="/download.svg" alt="" width={24} height={24} className="h-6 w-6" />
          </div>
        </div>
      </button>

      <button
        type="button"
        onClick={onBack || onClose}
        className="relative w-[calc(100%-8px)] mx-1 flex items-center justify-center rounded-[18px] bg-gradient-to-r from-sky-500 to-blue-600 text-white py-3.5 text-[16px] font-semibold shadow-md transition active:scale-[0.98] cursor-pointer hover:opacity-95"
      >
        <span className="absolute left-6 flex items-center">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </span>
        <span>Назад</span>
      </button>
    </SheetFrame>
  );
}
