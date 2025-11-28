// components/PromoSheet.tsx
"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useRef, useState } from "react";
import SheetFrame from "@/components/SheetFrame";
import PromoSuccessOverlay from "@/components/PromoSuccessOverlay";

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

  if (!promo) return null;

  const {
    title,
    subtitle,
    description,
    banner,
    cardImage,
    bullets = [],
    ctaText = "Записаться",
  } = promo;

  const headerImage = banner || cardImage;

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
        headerContent={
          <div className="relative z-0 h-[248px] w-full overflow-hidden">
            <img
              src={headerImage}
              alt={title}
              className="pointer-events-none absolute inset-0 -z-10 h-full w-full object-cover"
            />
          </div>
        }
        headerClassName="overflow-hidden bg-black/10"
      >
        <div className="px-4 py-5">
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

          <button
            type="button"
            onClick={handleCtaClick}
            className="mt-6 w-full rounded-[18px] bg-gradient-to-r from-sky-500 to-blue-600 px-6 py-4 text-center text-[18px] font-semibold text-white shadow-md transition-transform active:translate-y-[1px]"
          >
            {ctaText}
          </button>
        </div>
      </SheetFrame>
      <PromoSuccessOverlay open={successOpen} onClose={() => setSuccessOpen(false)} />
    </>
  );
}
