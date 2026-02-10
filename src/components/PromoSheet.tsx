// components/PromoSheet.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import SheetFrame from "@/components/SheetFrame";
import PromoSuccessOverlay from "@/components/PromoSuccessOverlay";
import AppImage from "@/components/AppImage";

export type PromoData = {
  id?: string;
  title: string;
  subtitle?: string;
  description?: string;
  start?: string;
  end?: string;
  banner?: string; // Banner image inside the sheet
  cardImage: string; // Preview image for the promo card
  bullets?: string[];
  ctaHref?: string;
  ctaText?: string;
};

export default function PromoSheet({
  open,
  onClose,
  promo,
}: {
  open: boolean;
  onClose: () => void;
  promo: PromoData | null;
}) {
  const [successOpen, setSuccessOpen] = useState(false);
  const [headerAspectRatio, setHeaderAspectRatio] = useState<number>(16 / 9);
  const successTimerRef = useRef<number | null>(null);
  const SUCCESS_OVERLAY_DELAY_MS = 60;

  useEffect(() => {
    if (successTimerRef.current) {
      window.clearTimeout(successTimerRef.current);
      successTimerRef.current = null;
    }
    setSuccessOpen(false);
  }, [promo]);

  useEffect(() => {
    return () => {
      if (successTimerRef.current) {
        window.clearTimeout(successTimerRef.current);
        successTimerRef.current = null;
      }
    };
  }, []);

  const period = useMemo(() => {
    const start = promo?.start;
    const end = promo?.end;

    if (!start && !end) return "";

    const format = (value?: string) => {
      if (!value) return null;
      const dt = new Date(value);
      if (Number.isNaN(dt.getTime())) return value;
      return dt.toLocaleDateString("ru-RU", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    };

    const from = format(start);
    const to = format(end);
    if (from && to) return `${from} — ${to}`;
    return from || to || "";
  }, [promo?.start, promo?.end]);

  const headerImage = promo?.banner || promo?.cardImage || "";

  useEffect(() => {
    if (!headerImage) return;
    let cancelled = false;
    const probe = new window.Image();
    probe.decoding = "async";
    probe.onload = () => {
      if (cancelled) return;
      const w = probe.naturalWidth || 0;
      const h = probe.naturalHeight || 0;
      if (w > 0 && h > 0) {
        setHeaderAspectRatio(w / h);
      }
    };
    probe.src = headerImage;
    return () => {
      cancelled = true;
    };
  }, [headerImage]);

  if (!promo) return null;

  const {
    title,
    subtitle,
    description,
    bullets = [],
    ctaText = "Записаться",
  } = promo;

  const handleCtaClick = () => {
    onClose();
    if (successTimerRef.current) {
      window.clearTimeout(successTimerRef.current);
    }
    successTimerRef.current = window.setTimeout(() => {
      setSuccessOpen(true);
      successTimerRef.current = null;
    }, SUCCESS_OVERLAY_DELAY_MS);
  };

  return (
    <>
      <SheetFrame
        open={open}
        onClose={onClose}
        title={title}
        showScrollHint
        headerContent={
          <div
            className="relative z-0 w-full overflow-hidden bg-slate-100"
            style={{ aspectRatio: `${headerAspectRatio}` }}
          >
            <AppImage
              src={headerImage}
              alt={title}
              fill
              sizes="100vw"
              unoptimized
              className="pointer-events-none absolute inset-0 -z-10 object-cover"
            />
          </div>
        }
        headerClassName="overflow-hidden bg-black/10"
      >
        <div className="px-4 pt-5 pb-16">
          <div className="space-y-2 text-slate-900">
            <h2 className="text-[22px] font-semibold leading-tight">{title}</h2>
            {subtitle && <p className="text-[15px] leading-[1.55] text-slate-600">{subtitle}</p>}
            {description && <p className="text-[15px] leading-[1.55] text-slate-600">{description}</p>}
            {period && <p className="text-[13px] text-slate-500">Срок действия: {period}</p>}
          </div>

          {bullets.length > 0 && (
            <ul className="mt-5 space-y-2 text-[15px] leading-[1.55] text-slate-800">
              {bullets.map((b, i) => (
                <li key={i} className="flex gap-2">
                  <span className="mt-[7px] inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-sky-500" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          )}

        </div>
        <div className="sticky bottom-0 z-20 px-4 py-4">
          <button
            type="button"
            onClick={handleCtaClick}
            className="w-full rounded-[18px] bg-gradient-to-r from-sky-500 to-blue-600 px-6 py-4 text-center text-[18px] font-semibold text-white shadow-md transition-transform active:translate-y-[1px]"
          >
            {ctaText}
          </button>
        </div>
      </SheetFrame>
      <PromoSuccessOverlay open={successOpen} onClose={() => setSuccessOpen(false)} />
    </>
  );
}

