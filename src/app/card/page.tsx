// src/app/card/page.tsx
"use client";

// import Header from "@/components/Header";
// import BottomNav from "@/components/BottomNav";

export default function CardPage() {
  return (
    <div className="min-h-dvh flex flex-col bg-white">
      {/* <Header /> */}

      <main className="flex-1">
        <div className="mx-auto max-w-[520px] px-4 py-6">
          <h1 className="text-xl font-semibold">Мои приёмы</h1>
          <p className="text-sm text-neutral-500 mt-2">
            Здесь позже появится список ваших приёмов.
          </p>
        </div>
      </main>

      {/* отступ под фиксированный BottomNav */}
      <div className="h-20 md:h-24" />
      {/* <BottomNav /> */}
    </div>
  );
}
