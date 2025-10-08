// components/CheckupsSheet.tsx
"use client";

import SheetFrame from "@/components/SheetFrame";
import Link from "next/link";

export type CheckupData = {
  id: string;
  title: string;
  sub?: string;
  bg: string; // tailwind: from-... to-...
  icon?: "mrt" | "stetho" | "eye" | "balloon" | "heart" | "leaf" | "ear" | "bone";
  bullets?: string[];
  price?: string | number;
  ctaHref?: string;
  ctaText?: string;
};

const Price = ({ value }: { value?: string | number }) => {
  if (value == null || value === "") return null;
  const str =
    typeof value === "number"
      ? value.toLocaleString("ru-RU")
      : value.replace(/\s+/g, " ").trim();
  return (
    <div className="mt-4 text-[28px] font-semibold tracking-tight">
      {str}&nbsp;₽
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
  if (!checkup) return null;

  const {
    title,
    sub,
    bg,
    icon,
    bullets,
    price,
    ctaHref = "/booking",
    ctaText = "Оставить заявку",
  } = checkup;

  const Icon = () => {
    const common = { width: 24, height: 24, viewBox: "0 0 24 24", fill: "none" } as const;
    switch (icon) {
      case "mrt":
        return (
          <svg {...common}>
            <rect x="3" y="6" width="18" height="12" rx="3" stroke="currentColor" strokeWidth="1.8" />
            <path d="M7 10h10M7 14h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        );
      case "stetho":
        return (
          <svg {...common}>
            <path d="M6 6v5a5 5 0 1 0 10 0V6M6 6h2M16 6h2M18 14a2 2 0 1 0 0-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        );
      case "eye":
        return (
          <svg {...common}>
            <path d="M2 12s4-6 10-6 10 6 10 6-4 6-10 6-10-6-10-6Z" stroke="currentColor" strokeWidth="1.8"/>
            <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8"/>
          </svg>
        );
      case "balloon":
        return (
          <svg {...common}>
            <path d="M12 3c3 0 5 2.2 5 5s-2 7-5 7-5-4.2-5-7 2-5 5-5Z" stroke="currentColor" strokeWidth="1.8"/>
            <path d="M12 15c0 2-1 3-3 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
        );
      case "heart":
        return (
          <svg {...common}>
            <path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2 4 4 0 0 1 7 2c0 5.5-7 10-7 10Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        );
      case "leaf":
        return (
          <svg {...common}>
            <path d="M4 14c3-6 8-8 16-8-1 8-3 13-9 14-4 .5-7-2-7-6Z" stroke="currentColor" strokeWidth="1.8"/>
            <path d="M10 10c0 4 1 6 4 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
        );
      case "ear":
        return (
          <svg {...common}>
            <path d="M16 15c0 2-1.5 4-4 4s-4-2-4-4V9a4 4 0 1 1 8 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        );
      case "bone":
        return (
          <svg {...common}>
            <path d="M5 9a2.5 2.5 0 1 1 3-3l8 8a2.5 2.5 0 1 1-3 3l-8-8Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <SheetFrame open={open} onClose={onClose} title={title} headerTitle={title}>
      {/* Верхняя цветная карточка (вместо изображения) */}
      <div className="px-4 pt-3">
        <div
          className={[
            "relative overflow-hidden rounded-2xl ring-1 ring-black/5",
            "bg-gradient-to-br",
            bg,
            "text-white",
          ].join(" ")}
          style={{ minHeight: 128 }}
        >
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(110% 55% at 0% 0%, rgba(255,255,255,.14) 0%, rgba(255,255,255,0) 60%)",
            }}
          />
          <div className="relative z-10 w-full p-4">
            <div className="mb-2 opacity-95 text-white/90"><Icon /></div>
            <div className="text-[18px] font-semibold leading-tight">{title}</div>
            {sub && <div className="text-[13.5px] leading-5 text-white/85">{sub}</div>}
          </div>
        </div>
      </div>

      {/* Контент шита */}
      <div className="px-4 py-5">
        {bullets?.length ? (
          <>
            <div className="text-[18px] font-semibold mb-3">Состав комплекса:</div>
            <ul className="space-y-2 text-[15px] leading-[1.45]">
              {bullets.map((b, i) => (
                <li key={i} className="pl-4 relative">
                  <span className="absolute left-0 top-[.55em] -translate-y-1/2 text-black">•</span>
                  {b}
                </li>
              ))}
            </ul>
          </>
        ) : null}

        <Price value={price} />

        <Link
          href={ctaHref}
          className="mt-5 block w-full rounded-[18px] bg-gradient-to-r from-sky-500 to-blue-600 px-6 py-4 text-center text-[17px] font-semibold text-white shadow-md active:translate-y-[1px]"
        >
          {ctaText}
        </Link>
      </div>
    </SheetFrame>
  );
}
