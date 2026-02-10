// components/CheckupsSheet.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import AppImage from "@/components/AppImage";
import SheetFrame from "@/components/SheetFrame";
import PromoSuccessOverlay from "@/components/PromoSuccessOverlay";
import type { CheckupData } from "@/types/checkups";

const formatPrice = (value?: string | number) => {
  if (value == null || value === "") return null;
  if (typeof value === "number") {
    return value.toLocaleString("ru-RU");
  }
  return value.replace(/\s+/g, " ").trim();
};

const Price = ({ value, oldValue }: { value?: string | number; oldValue?: string | number }) => {
  const current = formatPrice(value);
  const previous = formatPrice(oldValue);
  if (!current && !previous) return null;
  return (
    <div className="mt-4">
      {previous && (
        <div className="text-[15px] text-slate-400 line-through">
          {previous}&nbsp;₽
        </div>
      )}
      {current && (
        <div className="text-[28px] font-semibold tracking-tight">
          {current}&nbsp;₽
        </div>
      )}
    </div>
  );
};

const renderTextBlocks = (value?: string) => {
  if (!value) return null;
  const lines = value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (!lines.length) return null;
  return (
    <div className="space-y-2 text-[16px] leading-[1.65] text-slate-600 text-justify">
      {lines.map((line, idx) => (
        <p key={`${line}-${idx}`} className="indent-5">
          {line}
        </p>
      ))}
    </div>
  );
};

export default function CheckupsSheet({
  open,
  onClose,
  checkup,
}: {
  open: boolean;
  onClose: () => void;
  checkup: CheckupData | null;
}) {
  const [successOpen, setSuccessOpen] = useState(false);
  const checkupId = checkup?.id ?? null;
  const successTimerRef = useRef<number | null>(null);
  const SUCCESS_OVERLAY_DELAY_MS = 60;

  useEffect(() => {
    if (successTimerRef.current) {
      window.clearTimeout(successTimerRef.current);
      successTimerRef.current = null;
    }
    setSuccessOpen(false);
  }, [checkupId]);

  useEffect(() => {
    return () => {
      if (successTimerRef.current) {
        window.clearTimeout(successTimerRef.current);
        successTimerRef.current = null;
      }
    };
  }, []);

  if (!checkup) return null;

  const {
    title,
    sub,
    bg,
    bullets,
    price,
    oldPrice,
    image,
    description,
    ctaText = "Оставить заявку",
  } = checkup;

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
      <SheetFrame open={open} onClose={onClose} title={title} showScrollHint>
        {/* Верхняя цветная карточка (вместо изображения) */}
        <div className="px-4 pt-3">
          <div
            className={[
              "relative overflow-hidden rounded-2xl ring-1 ring-black/5",
              "text-white",
            ].join(" ")}
          >
            {image ? (
              <AppImage
                src={image}
                alt=""
                width={1200}
                height={600}
                sizes="100vw"
                unoptimized
                className="block h-auto w-full object-contain"
              />
            ) : (
              <div
                className={[
                  "bg-gradient-to-br",
                  bg,
                  "h-40",
                  "w-full",
                ].join(" ")}
              />
            )}
          </div>
        </div>

{/* Контент шита */}
        <div className="px-4 pt-5 pb-16">
          {description ? (
            <div className="mb-4">
              {renderTextBlocks(description)}
            </div>
          ) : null}
          {sub && (
            <div className="mb-4 text-[16px] font-medium text-slate-700 indent-5 text-justify">
              {sub}
            </div>
          )}
          {bullets?.length ? (
            <>
              <div className="mb-3 text-[20px] font-semibold">Состав комплекса:</div>
              <ul className="space-y-2 text-[16px] leading-[1.55]">
                {bullets.map((b, i) => (
                  <li key={i} className="pl-4 relative">
                    <span className="absolute left-0 top-[.55em] -translate-y-1/2 text-black dark:text-slate-100">•</span>
                    {b}
                  </li>
                ))}
              </ul>
            </>
          ) : null}

          <Price value={price} oldValue={oldPrice} />

        </div>
        <div className="sticky bottom-0 z-20 px-4 py-4">
          <button
            type="button"
            onClick={handleCtaClick}
            className="block w-full rounded-[18px] bg-gradient-to-r from-sky-500 to-blue-600 px-6 py-4 text-center text-[17px] font-semibold text-white shadow-md transition-transform active:translate-y-[1px]"
          >
            {ctaText}
          </button>
        </div>
      </SheetFrame>

      <PromoSuccessOverlay open={successOpen} onClose={() => setSuccessOpen(false)} />
    </>
  );
}
