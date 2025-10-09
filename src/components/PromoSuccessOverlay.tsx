"use client";

import { type CSSProperties } from "react";
import FullscreenOverlay from "@/components/FullscreenOverlay";

type PromoSuccessOverlayProps = {
  open: boolean;
  onClose: () => void;
};

const GRADIENT_CLASS =
  "absolute inset-0 bg-gradient-to-b from-sky-400 via-sky-500 to-blue-600";
const CIRCLE_DURATION_MS = 520;
const TEXT_DURATION_MS = 360;
const TEXT_DELAY_MS = 120;
const CIRCLE_EASE = "cubic-bezier(0.16, 1, 0.3, 1)";
const TEXT_EASE = "cubic-bezier(0.22, 0.61, 0.36, 1)";
const SCALE_MIN = 0.02;

export default function PromoSuccessOverlay({ open, onClose }: PromoSuccessOverlayProps) {
  return (
    <FullscreenOverlay
      open={open}
      onClose={onClose}
      transitionMs={CIRCLE_DURATION_MS}
      backdropClassName="bg-black/45"
      contentWrapperClassName="p-0"
      contentClassName="relative h-full w-full cursor-pointer transition-none"
      contentFade={false}
      lockScroll
      closeOnBackdrop
      closeOnContentClick
    >
      {({ visible }) => {
        const bubbleStyle: CSSProperties = {
          position: "absolute",
          left: "50%",
          top: "50%",
          width: "140vmax",
          height: "140vmax",
          borderRadius: "9999px",
          overflow: "hidden",
          transform: visible
            ? "translate(-50%, -50%) scale(1)"
            : `translate(-50%, -50%) scale(${SCALE_MIN})`,
          opacity: visible ? 1 : 0,
          transition: [
            `transform ${CIRCLE_DURATION_MS}ms ${CIRCLE_EASE}`,
            `opacity ${CIRCLE_DURATION_MS}ms ${CIRCLE_EASE}`,
          ].join(", "),
          willChange: "transform, opacity",
        };

        const haloStyle: CSSProperties = {
          opacity: visible ? 0.85 : 0,
          transform: visible ? "scale(1)" : "scale(0.6)",
          transition: `opacity ${CIRCLE_DURATION_MS}ms ${CIRCLE_EASE}, transform ${CIRCLE_DURATION_MS}ms ${CIRCLE_EASE}`,
          transformOrigin: "50% 50%",
          willChange: "opacity, transform",
        };

        const textDelay = visible ? TEXT_DELAY_MS : 0;
        const textStyle: CSSProperties = {
          opacity: visible ? 1 : 0,
          transform: visible ? "scale(1)" : "scale(0.9)",
          transition: [
            `opacity ${TEXT_DURATION_MS}ms ${TEXT_EASE} ${textDelay}ms`,
            `transform ${TEXT_DURATION_MS}ms ${TEXT_EASE} ${textDelay}ms`,
          ].join(", "),
          transformOrigin: "50% 50%",
          willChange: "opacity, transform",
        };

        return (
          <div className="relative flex h-full w-full items-center justify-center overflow-hidden">
            <div style={bubbleStyle}>
              <div className="absolute inset-0">
                <div className={GRADIENT_CLASS} />
                <div className="absolute inset-0 bg-gradient-to-br from-white/15 via-transparent to-white/20" />
                <div
                  className="absolute inset-0 rounded-full border border-white/35 blur-[120px]"
                  style={haloStyle}
                />
              </div>

              <div className="relative z-10 flex h-full w-full items-center justify-center">
                <div
                  className="mx-auto flex max-w-[360px] flex-col items-center px-6 text-center text-white"
                  style={textStyle}
                >
                  <p className="text-[32px] font-semibold leading-tight">
                    Спасибо!
                    <br />
                    заявка принята
                  </p>

                  <div className="mt-12 flex flex-col items-center gap-8">
                    <div className="grid h-[108px] w-[108px] place-items-center rounded-full border border-white/55 bg-white/12 shadow-[0_0_40px_rgba(255,255,255,0.18)] backdrop-blur-[2px]">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-14 w-14"
                        viewBox="0 0 64 64"
                        fill="none"
                        aria-hidden="true"
                      >
                        <circle
                          cx="32"
                          cy="32"
                          r="25"
                          stroke="white"
                          strokeWidth="4"
                          opacity="0.9"
                        />
                        <path
                          d="M24 32.5 30.5 39l11.5-11.5"
                          stroke="white"
                          strokeWidth="4"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>

                    <p className="text-[18px] leading-relaxed text-white/90">
                      Наш оператор свяжется с вами
                      <br />
                      в ближайшее время.
                    </p>
                  </div>

                    в ближайшее время.
                  </p>
             и поможем с дальнейшими шагами.
  </div>
        );
      }}
    </FullscreenOverlay>
  );
}
