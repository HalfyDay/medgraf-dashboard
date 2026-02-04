"use client";

import AppImage from "@/components/AppImage";
import AboutHero from "@/components/AboutHero";

const GALLERY = ["/gallery-1.svg", "/gallery-2.svg"];

export default function GalleryPage() {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <main className="flex-1">
        <div className="mx-auto max-w-[520px] -mt-14 px-4 pb-6 md:-mt-16">
          <div className="relative">
            <AboutHero title="Фотогалерея" />

            <section className="relative z-10 -mt-16 rounded-[28px] bg-white p-5 shadow-[0_18px_50px_rgba(14,74,166,0.12)] dark:bg-slate-900">
              <div className="space-y-5">
                {GALLERY.map((src, index) => (
                  <div key={`${src}-${index}`} className="overflow-hidden rounded-[18px] shadow-sm ring-1 ring-slate-100">
                    <AppImage
                      src={src}
                      alt="Фото клиники"
                      width={480}
                      height={320}
                      className="h-auto w-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </main>

      <div className="h-20 md:h-24" />
    </div>
  );
}
