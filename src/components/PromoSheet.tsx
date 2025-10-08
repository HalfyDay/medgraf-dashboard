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
    <SheetFrame open={open} onClose={onClose} title={title} headerTitle={title}>
      <div className="px-4 pt-3">
        <div className="overflow-hidden rounded-2xl ring-1 ring-black/5">
          <img src={banner} alt={title} className="w-full h-[180px] object-cover" />
        </div>
      </div>

      <div className="px-4 py-4">
        {subtitle && (
          <p className="text-[15px] text-slate-600">{subtitle}</p>
        )}

        {bullets.length > 0 && (
          <ul className="mt-4 space-y-2 text-[15px] text-slate-800">
            {bullets.map((b, i) => (
              <li key={i} className="flex gap-2">
                <span className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-sky-500 shrink-0" />
                <span>{b}</span>
              </li>
            ))}
          </ul>
        )}

        <div className="h-4" />

        <Link
          href={ctaHref}
          className="block w-full rounded-[18px] bg-gradient-to-r from-sky-500 to-blue-600 px-6 py-4 text-center text-[18px] font-semibold text-white shadow-md active:translate-y-[1px]"
        >
          {ctaText}
        </Link>
      </div>
    </SheetFrame>
  );
}
