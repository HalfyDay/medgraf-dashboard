"use client";

import { type CSSProperties } from "react";
import FullscreenOverlay from "@/components/FullscreenOverlay";
import AppImage from "@/components/AppImage";

type PromoSuccessOverlayProps = {
  open: boolean;
  onClose: () => void;
  titleLines?: string[];
  subtitle?: string;
  icon?: "check" | "sad";
  variant?: "classic" | "appointment";
  appointmentKind?: "booked" | "cancelled";
  iconSrc?: string;
  iconFallbackSrc?: string;
};

const CLASSIC_GRADIENT_CLASS =
  "absolute inset-0 bg-gradient-to-b from-sky-400 via-sky-500 to-blue-600";

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
  panel: {
    durationMs: 560,
    delayMs: 140,
    ease: "cubic-bezier(0.16, 1, 0.3, 1)",
  },
  appointmentText: {
    durationMs: 360,
    delayMs: 320,
    ease: "cubic-bezier(0.22, 0.61, 0.36, 1)",
  },
} as const;

const DEFAULT_TITLE_LINES = [
  "\u0421\u043f\u0430\u0441\u0438\u0431\u043e!",
  "\u0417\u0430\u044f\u0432\u043a\u0430 \u043f\u0440\u0438\u043d\u044f\u0442\u0430",
];
const DEFAULT_SUBTITLE =
  "\u041d\u0430\u0448 \u043e\u043f\u0435\u0440\u0430\u0442\u043e\u0440 \u0441\u0432\u044f\u0436\u0435\u0442\u0441\u044f \u0441 \u0432\u0430\u043c\u0438\n\u0432 \u0431\u043b\u0438\u0436\u0430\u0439\u0448\u0435\u0435 \u0432\u0440\u0435\u043c\u044f.";

const APPOINTMENT_BOOKED_ICON = "/appointment.svg";
const APPOINTMENT_CANCELLED_ICON = "/cancellation.svg";

function ClassicGraphic({ icon }: { icon: "check" | "sad" }) {
  if (icon === "sad") {
    return <AppImage src="/sadness.svg" alt="" width={80} height={80} className="h-20 w-20" />;
  }

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-26 w-26"
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="32" cy="32" r="25" stroke="white" strokeWidth="4" opacity="0.9" />
      <path
        d="M24 32.5 30.5 39l11.5-11.5"
        stroke="white"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function PromoSuccessOverlay({
  open,
  onClose,
  titleLines,
  subtitle,
  icon = "check",
  variant = "classic",
  appointmentKind = "booked",
  iconSrc,
  iconFallbackSrc,
}: PromoSuccessOverlayProps) {
  const title = titleLines && titleLines.length > 0 ? titleLines : DEFAULT_TITLE_LINES;
  const subtitleText = subtitle ?? DEFAULT_SUBTITLE;

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

        if (variant === "classic") {
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
                  <div className={CLASSIC_GRADIENT_CLASS} />
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
                    <p className="text-[32px] font-semibold leading-tight whitespace-pre-line">
                      {title.join("\n")}
                    </p>

                    <div className="mt-8 flex flex-col items-center gap-8">
                      <div className="grid h-24 w-24 place-items-center rounded-full bg-white/15 backdrop-blur-sm">
                        <ClassicGraphic icon={icon} />
                      </div>
                      <p className="text-[18px] leading-relaxed text-white/90 whitespace-pre-line">
                        {subtitleText}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        }

        const CIRCLE_TOP = "34%";
        const CIRCLE_DIAMETER = "clamp(740px, 118vh, 1240px)";
        const MOBILE_COLUMN_WIDTH = "min(100vw, 430px)";

        const panelDelay = visible ? ANIMATION.panel.delayMs : 0;
        const panelMotionStyle: CSSProperties = {
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(20%)",
          transition: [
            `opacity ${ANIMATION.panel.durationMs}ms ${ANIMATION.panel.ease} ${panelDelay}ms`,
            `transform ${ANIMATION.panel.durationMs}ms ${ANIMATION.panel.ease} ${panelDelay}ms`,
          ].join(", "),
          willChange: "opacity, transform",
        };

        const textDelay = visible ? ANIMATION.appointmentText.delayMs : 0;
        const textStyle: CSSProperties = {
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(12px)",
          transition: [
            `opacity ${ANIMATION.appointmentText.durationMs}ms ${ANIMATION.appointmentText.ease} ${textDelay}ms`,
            `transform ${ANIMATION.appointmentText.durationMs}ms ${ANIMATION.appointmentText.ease} ${textDelay}ms`,
          ].join(", "),
          willChange: "opacity, transform",
        };

        const iconDelay = visible ? ANIMATION.appointmentText.delayMs + 80 : 0;
        const iconStyle: CSSProperties = {
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(-86%)" : "translateY(-78%)",
          transition: [
            `opacity ${ANIMATION.appointmentText.durationMs}ms ${ANIMATION.appointmentText.ease} ${iconDelay}ms`,
            `transform ${ANIMATION.appointmentText.durationMs}ms ${ANIMATION.appointmentText.ease} ${iconDelay}ms`,
          ].join(", "),
          willChange: "opacity, transform",
        };

        const appointmentIconSrc =
          iconSrc ??
          (appointmentKind === "cancelled" ? APPOINTMENT_CANCELLED_ICON : APPOINTMENT_BOOKED_ICON);
        const appointmentIconFallback =
          iconFallbackSrc ?? (appointmentKind === "cancelled" ? "/sadness.svg" : "/verified.svg");

        return (
          <div className="relative h-full w-full overflow-hidden">
            <div className="absolute inset-0 bg-[#0d8fe8]" />

            <div className="absolute inset-0" style={panelMotionStyle}>
              <div
                className="absolute left-1/2 rounded-full bg-[#D9EEFD]"
                style={{
                  width: CIRCLE_DIAMETER,
                  height: CIRCLE_DIAMETER,
                  top: CIRCLE_TOP,
                  transform: "translateX(-50%)",
                }}
              />
            </div>

            <div
              className="absolute inset-y-0 left-1/2 z-10 -translate-x-1/2"
              style={{ width: MOBILE_COLUMN_WIDTH }}
            >
              <div
                className="absolute inset-x-0 flex justify-center"
                style={{ ...iconStyle, top: `calc(${CIRCLE_TOP} + clamp(8px, 1.2vh, 16px))` }}
              >
                <div className="flex h-[clamp(124px,19vh,182px)] w-[clamp(124px,19vh,182px)] items-end justify-center">
                  <AppImage
                    src={appointmentIconSrc}
                    fallbackSrc={appointmentIconFallback}
                    alt=""
                    width={182}
                    height={182}
                    className="max-h-full w-auto max-w-full"
                  />
                </div>
              </div>

              <div
                className="absolute inset-x-0 flex justify-center px-5"
                style={{ ...textStyle, top: `calc(${CIRCLE_TOP} + clamp(154px, 22.5vh, 248px))` }}
              >
                <div className="flex w-full max-w-[390px] flex-col items-center text-center text-[#0b88e3]">
                  <p className="text-[clamp(36px,4.9vh,56px)] font-semibold leading-[1.04] whitespace-pre-line">
                    {title.join("\n")}
                  </p>
                  <p className="mt-[clamp(10px,1.8vh,20px)] max-w-[370px] text-[clamp(16px,2.4vh,28px)] leading-[1.24] whitespace-pre-line">
                    {subtitleText}
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
      }}
    </FullscreenOverlay>
  );
}
