// components/PromoSheet.tsx
"use client";

import SheetFrame from "@/components/SheetFrame";
import Link from "next/link";

export type PromoData = {
  title: string;
  subtitle?: string;
  banner: string;      // для внутри SheetFrame (banner_promo_X.svg)
  cardImage: string;   // для карточки на главной (promo-X.png)
  bullets?: string[];
  ctaHref?: string;
  ctaText?: string;
};

export default function PromoSheet({ open, onClose, promo }: {
  open: boolean; onClose: () => void; promo: PromoData | null;
}) {
  if (!promo) return null;
  const { title, subtitle, banner, bullets = [], ctaHref = "/booking", ctaText = "Записаться" } = promo;

  return (
    <SheetFrame
      open={open}
      onClose={onClose}
      title={title}
      headerContent={(
        <div className="relative isolate h-[248px] w-full">
          <img
            src={banner}
            alt={title}
            className="absolute inset-0 -z-10 h-full w-full select-none object-cover"
            draggable={false}
          />
        </div>
      )}
      headerClassName="relative overflow-hidden p-0"
    >
      <div className="px-4 py-5">
        <div className="space-y-2 text-slate-900">
          <h2 className="text-[22px] font-semibold leading-tight">{title}</h2>
          {subtitle && <p className="text-[15px] leading-[1.55] text-slate-600">{subtitle}</p>}
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

        <Link
          href={ctaHref}
          className="mt-6 block w-full rounded-[18px] bg-gradient-to-r from-sky-500 to-blue-600 px-6 py-4 text-center text-[18px] font-semibold text-white shadow-md active:translate-y-[1px]"
        >
          {ctaText}
        </Link>
      </div>
    </SheetFrame>
  );
}
