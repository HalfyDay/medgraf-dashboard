"use client";

import AppImage from "@/components/AppImage";

type AboutHeroProps = {
  title: string;
};

export default function AboutHero({ title }: AboutHeroProps) {
  return (
    <section className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#0076E1] to-[#0096F8] px-6 pt-[76px] pb-24 text-white md:pt-[84px]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          background:
            "radial-gradient(120% 80% at 0% 0%, rgba(255,255,255,.22) 0%, rgba(255,255,255,0) 55%), radial-gradient(110% 70% at 100% 10%, rgba(255,255,255,.16) 0%, rgba(255,255,255,0) 55%)",
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 top-10 h-56 w-56 rounded-full bg-white/10 blur-2xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-16 bottom-0 h-56 w-56 rounded-full bg-white/10 blur-2xl"
      />

      <AppImage
        src="/Vector.svg"
        alt=""
        width={200}
        height={200}
        className="pointer-events-none absolute right-0 top-0 h-full w-[200px] opacity-50 object-cover object-right translate-x-6"
      />

      <div className="relative">
        <div className="text-[13px] font-semibold uppercase tracking-wide text-white/85">
          О клинике
        </div>
        <h1 className="mt-3 text-[30px] font-extrabold leading-tight tracking-tight">
          {title}
        </h1>
      </div>
    </section>
  );
}

