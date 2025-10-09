"use client";

import clsx from "clsx";
import FullscreenOverlay from "@/components/FullscreenOverlay";

type PromoSuccessOverlayProps = {
  open: boolean;
  onClose: () => void;
};

const GRADIENT_CLASS =
  "absolute inset-0 bg-gradient-to-b from-sky-400 via-sky-500 to-blue-600";

export default function PromoSuccessOverlay({ open, onClose }: PromoSuccessOverlayProps) {
  return (
    <FullscreenOverlay
      open={open}
      onClose={onClose}
      transitionMs={420}
      backdropClassName="bg-black/40"
      contentWrapperClassName="p-0"
      contentClassName="group relative h-full w-full cursor-pointer overflow-hidden"
      closeOnBackdrop
      closeOnContentClick
    >
      {({ visible }) => {
        const clipClass = visible
          ? "[clip-path:circle(140vmax_at_50%_50%)] opacity-100"
          : "[clip-path:circle(0vmax_at_50%_50%)] opacity-0";
        const textClass = visible ? "opacity-100 scale-100" : "opacity-0 scale-90";

        return (
          <div className="relative flex h-full w-full items-center justify-center">
            <div
              className={clsx(
                "absolute inset-0 pointer-events-none overflow-hidden",
                "transition-[clip-path,opacity] duration-[420ms] ease-[cubic-bezier(0.16,1,0.3,1)]",
                clipClass
              )}
            >
              <div className="relative h-full w-full">
                <div className={GRADIENT_CLASS} />
                <div className="absolute inset-0 bg-gradient-to-br from-white/15 via-transparent to-white/20" />
              </div>
            </div>

            <div
              className={clsx(
                "relative z-10 mx-auto flex max-w-[320px] flex-col items-center justify-center px-8 text-center text-white",
                "transition-[transform,opacity] duration-[360ms] ease-[cubic-bezier(0.16,1,0.3,1)]",
                textClass
              )}
            >
              <div className="text-[26px] font-semibold leading-tight">
                Спасибо!
                <br />
                заявка принята
              </div>

              <div className="mt-8 flex flex-col items-center gap-6">
                <div className="grid h-20 w-20 place-items-center rounded-full border border-white/70 bg-white/15 backdrop-blur-sm">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-10 w-10"
                    viewBox="0 0 48 48"
                    fill="none"
                    aria-hidden="true"
                  >
                    <circle cx="24" cy="24" r="22" stroke="white" strokeWidth="2.5" opacity="0.7" />
                    <path
                      d="M33.5 20.5L23.2 30.8l-5.7-5.7"
                      stroke="white"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <p className="text-[16px] leading-relaxed text-white/90">
                  Наш оператор свяжется с вами
                  <br />
                  в ближайшее время.
                </p>
              </div>
            </div>
          </div>
        );
      }}
    </FullscreenOverlay>
  );
}
