"use client";

import { type CSSProperties } from "react";
import FullscreenOverlay from "@/components/FullscreenOverlay";

type PromoSuccessOverlayProps = {
  open: boolean;
  onClose: () => void;
};

const GRADIENT_CLASS =
  "absolute inset-0 bg-gradient-to-b from-sky-400 via-sky-500 to-blue-600";

// Centralized animation timings so the reveal stays consistent.
// Tweak these numbers to speed up or slow down the success overlay animation.
const ANIMATION = {
  circle: {
    durationMs: 900,
    ease: "cubic-bezier(0.16, 1, 0.3, 1)",
    scaleMin: 0.02,
  },
  text: {
    durationMs: 400,
    delayMs: 160,
    ease: "cubic-bezier(0.22, 0.61, 0.36, 1)",
  },
} as const;

export default function PromoSuccessOverlay({ open, onClose }: PromoSuccessOverlayProps) {
  return (
    <FullscreenOverlay
      open={open}
      onClose={onClose}
      transitionMs={ANIMATION.circle.durationMs}
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
            : `translate(-50%, -50%) scale(${ANIMATION.circle.scaleMin})`,
          opacity: visible ? 1 : 0,
          transition: [
            `transform ${ANIMATION.circle.durationMs}ms ${ANIMATION.circle.ease}`,
            `opacity ${ANIMATION.circle.durationMs}ms ${ANIMATION.circle.ease}`,
          ].join(", "),
          willChange: "transform, opacity",
        };

        const haloStyle: CSSProperties = {
          opacity: visible ? 0.85 : 0,
          transform: visible ? "scale(1)" : "scale(0.6)",
          transition: `opacity ${ANIMATION.circle.durationMs}ms ${ANIMATION.circle.ease}, transform ${ANIMATION.circle.durationMs}ms ${ANIMATION.circle.ease}`,
          transformOrigin: "50% 50%",
          willChange: "opacity, transform",
        };

        const textDelay = visible ? ANIMATION.text.delayMs : 0;
        const textStyle: CSSProperties = {
          opacity: visible ? 1 : 0,
          transform: visible ? "scale(1)" : "scale(0.9)",
          transition: [
            `opacity ${ANIMATION.text.durationMs}ms ${ANIMATION.text.ease} ${textDelay}ms`,
            `transform ${ANIMATION.text.durationMs}ms ${ANIMATION.text.ease} ${textDelay}ms`,
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
                    Заявка принята
                  </p>

                  <div className="mt-8 flex flex-col items-center gap-8">
                    <div className="grid h-24 w-24 place-items-center rounded-full bg-white/15 backdrop-blur-sm">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-26 w-26"
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
                </div>
              </div>
            </div>
          </div>
        );
      }}
    </FullscreenOverlay>
  );
}
