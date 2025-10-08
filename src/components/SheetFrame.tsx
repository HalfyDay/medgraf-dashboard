// components/SheetFrame.tsx
"use client";

import React, { PropsWithChildren, useEffect, useRef, useState } from "react";
import clsx from "clsx";

type SheetFrameProps = {
  open: boolean;
  onClose: () => void;

  title: string;
  subtitle?: string;
  iconSrc?: string;

  initialVH?: number;
  maxVH?: number;

  swipeToClose?: boolean;
  closeThresholdPx?: number;
  closeVelocityPxMs?: number;
  snapBackMs?: number;

  expandUpThresholdPx?: number;

  innerClassName?: string;
};

export default function SheetFrame({
  open,
  onClose,
  title,
  subtitle,
  iconSrc = "/list.svg",

  initialVH = 78,
  maxVH = 100,

  swipeToClose = true,
  closeThresholdPx = 220,
  closeVelocityPxMs = 0.6,
  snapBackMs = 180,

  expandUpThresholdPx = 72,

  innerClassName,
  children,
}: PropsWithChildren<SheetFrameProps>) {
  const frameRef = useRef<HTMLDivElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const headerRef = useRef<HTMLDivElement | null>(null);

  const tooSmallForFull = useRef(false);

  const recomputeContentFit = () => {
    const sc = scrollRef.current;
    const hh = headerRef.current?.offsetHeight || 0;
    if (!sc) return;
    const totalContent = hh + sc.scrollHeight;
    const viewport = window.innerHeight;
    tooSmallForFull.current = totalContent <= viewport * 0.88;
  };

  // ▲ NEW: состояние «вошёл на экран»
  const [entered, setEntered] = useState(false);
  const ENTER_DUR = 360;
  const ENTER_EASE = "cubic-bezier(0.16,1,0.3,1)";

  useEffect(() => {
    if (!open) return;
    recomputeContentFit();
    const ro = new ResizeObserver(() => recomputeContentFit());
    if (scrollRef.current) ro.observe(scrollRef.current);
    window.addEventListener("resize", recomputeContentFit);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", recomputeContentFit);
    };
  }, [open]);

  const [panelVH, setPanelVH] = useState<number>(initialVH);
  const [dragY, setDragY] = useState(0);
  const [animatingToFull, setAnimatingToFull] = useState(false);
  const dragYRef = useRef(0);
  const expandingUp = useRef(false);

  const preventWheel = useRef<(e: WheelEvent) => void>();
  const preventTouchMove = useRef<(e: TouchEvent) => void>();

  const lockInnerScroll = () => {
    const sc = scrollRef.current;
    if (!sc) return;
    sc.style.overflowY = "hidden";
    sc.scrollTop = 0;
    if (!preventWheel.current) {
      preventWheel.current = (e) => {
        e.preventDefault();
        e.stopPropagation();
      };
    }
    sc.addEventListener("wheel", preventWheel.current, { passive: false });
    if (!preventTouchMove.current) {
      preventTouchMove.current = (e) => {
        e.preventDefault();
        e.stopPropagation();
      };
    }
    sc.addEventListener("touchmove", preventTouchMove.current, { passive: false });
  };

  const unlockInnerScroll = () => {
    const sc = scrollRef.current;
    if (!sc) return;
    sc.style.overflowY = "";
    try {
      if (preventWheel.current) sc.removeEventListener("wheel", preventWheel.current as any);
      if (preventTouchMove.current) sc.removeEventListener("touchmove", preventTouchMove.current as any);
    } catch {}
  };

  const startY = useRef(0);
  const startX = useRef(0);
  const lastY = useRef(0);
  const lastTs = useRef(0);
  const draggingDown = useRef(false);
  const consideringExpand = useRef(false);

  // Блокируем body и готовим входную анимацию
  const [suppressHeightOnce, setSuppressHeightOnce] = useState(false);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Жёстко выставляем стартовые значения без анимации высоты
    setSuppressHeightOnce(true);
    setAnimatingToFull(false);        // сброс возможного «full» с прошлого окна
    setPanelVH(initialVH);
    setDragY(0);

    setEntered(false);
    // 1-й кадр — применяем стартовые стили, 2-й — включаем плавные переходы
    requestAnimationFrame(() => {
      setEntered(true);
      requestAnimationFrame(() => setSuppressHeightOnce(false));
    });

    lockInnerScroll();

    return () => {
      document.body.style.overflow = prev;
      unlockInnerScroll();
      setEntered(false);
    };
  }, [open, initialVH]);

  useEffect(() => {
    const el = frameRef.current;
    if (!open || !el) return;

    const onEnd = (e: TransitionEvent) => {
      if (e.propertyName !== "height") return;
      setAnimatingToFull(false);
    };

    el.addEventListener("transitionend", onEnd);
    return () => el.removeEventListener("transitionend", onEnd);
  }, [open]);

  useEffect(() => {
    dragYRef.current = dragY;
  }, [dragY]);

  const snapBack = () => {
    const start = dragYRef.current;
    const startTs = performance.now();
    const step = () => {
      const t = Math.min(1, (performance.now() - startTs) / snapBackMs);
      const eased = 1 - Math.pow(1 - t, 3);
      const val = Math.max(0, start * (1 - eased));
      setDragY(val);
      if (t < 1) requestAnimationFrame(step);
      else setDragY(0);
    };
    requestAnimationFrame(step);
  };

  const expandToFull = () => {
    setAnimatingToFull(true);
    setPanelVH(maxVH);
  };

  const isFull = panelVH >= maxVH - 0.5;

  useEffect(() => {
    if (!open) return;
    if (isFull) {
      unlockInnerScroll();
    } else {
      lockInnerScroll();
    }
  }, [isFull, open]);

  useEffect(() => {
    if (!open || !swipeToClose) return;
    const el = frameRef.current!;
    const sc = scrollRef.current!;

    const canStartFromTop = () => (sc.scrollTop || 0) <= 1;

    const onDown = (x: number, y: number) => {
      startY.current = y;
      startX.current = x;
      lastY.current = y;
      lastTs.current = performance.now();
      draggingDown.current = false;
      consideringExpand.current = false;
      expandingUp.current = false;
    };

    const onMove = (x: number, y: number, ts: number, preventDefault: () => void) => {
      if (!startY.current) return;
      const dy = y - startY.current;
      const dx = Math.abs(x - startX.current);
      const ady = Math.abs(dy);

      if (!draggingDown.current && !expandingUp.current && dx > ady) return;

      if (dy < 0 && canStartFromTop() && !isFull) {
        const enoughPull = Math.abs(dy) > expandUpThresholdPx;
        if (enoughPull && !tooSmallForFull.current) {
          expandingUp.current = true;
          preventDefault();
          expandToFull();
        }
        return;
      }

      if (dy > 10 && canStartFromTop()) {
        draggingDown.current = true;
        sc.style.overflowY = "hidden";
        preventDefault();
        setDragY(dy < 0 ? 0 : dy);
        lastY.current = y;
        lastTs.current = ts || performance.now();
      }
    };

    const onUp = (y: number, ts: number) => {
      const totalDy = y - startY.current;
      const dt = Math.max(1, (ts || performance.now()) - lastTs.current);
      const vy = (y - lastY.current) / dt;

      startY.current = startX.current = 0;

      if (expandingUp.current) {
        expandingUp.current = false;
        return;
      }

      if (draggingDown.current) {
        draggingDown.current = false;
        sc.style.overflowY = "";

        if (totalDy > closeThresholdPx || vy > closeVelocityPxMs) {
          const h = el.getBoundingClientRect().height;
          const from = Math.max(0, dragYRef.current);
          const t0 = performance.now();
          const dur = 160;
          const step = () => {
            const t = Math.min(1, (performance.now() - t0) / dur);
            const eased = t * (2 - t);
            setDragY(from + (h - from) * eased);
            if (t < 1) requestAnimationFrame(step);
            else {
              setDragY(0);
              onClose();
            }
          };
          requestAnimationFrame(step);
        } else {
          snapBack();
        }
      } else {
        consideringExpand.current = false;
      }
    };

    const down = (e: PointerEvent) => {
      onDown(e.clientX, e.clientY);
      try {
        (e.target as Element).setPointerCapture?.(e.pointerId);
      } catch {}
    };
    const move = (e: PointerEvent) => onMove(e.clientX, e.clientY, e.timeStamp, () => e.preventDefault());
    const up = (e: PointerEvent) => onUp(e.clientY, e.timeStamp);

    const tStart = (e: TouchEvent) => {
      const t = e.touches[0];
      if (!t) return;
      onDown(t.clientX, t.clientY);
    };
    const tMove = (e: TouchEvent) => {
      const t = e.touches[0];
      if (!t) return;
      onMove(t.clientX, t.clientY, e.timeStamp, () => e.preventDefault());
    };
    const tEnd = (e: TouchEvent) => onUp(lastY.current, e.timeStamp);

    const opts: AddEventListenerOptions = { passive: false };
    el.addEventListener("pointerdown", down, opts);
    el.addEventListener("pointermove", move, opts);
    el.addEventListener("pointerup", up, opts);
    el.addEventListener("pointercancel", up, opts);

    el.addEventListener("touchstart", tStart, opts);
    el.addEventListener("touchmove", tMove, opts);
    el.addEventListener("touchend", tEnd, opts);
    el.addEventListener("touchcancel", tEnd, opts);

    const onVisibility = () => {
      if (document.hidden) {
        setDragY(0);
        if (scrollRef.current) scrollRef.current.style.overflowY = "";
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", up);

      el.removeEventListener("touchstart", tStart);
      el.removeEventListener("touchmove", tMove);
      el.removeEventListener("touchend", tEnd);
      el.removeEventListener("touchcancel", tEnd);

      document.removeEventListener("visibilitychange", onVisibility);
      if (scrollRef.current) scrollRef.current.style.overflowY = "";
    };
  }, [
    open,
    swipeToClose,
    closeThresholdPx,
    closeVelocityPxMs,
    snapBackMs,
    expandUpThresholdPx,
    onClose,
    isFull,
  ]);

  if (!open) return null;

  const headerPx = headerRef.current?.offsetHeight || 150;
  const heightStyle = `${panelVH}dvh`;
  const bodyHeightStyle = `calc(${panelVH}dvh - ${headerPx}px)`;

  // ▲ NEW: смещение при появлении (px) и прозрачность подложки
  const enterOffset = entered ? 0 : 56; // было 40
  const backdropOpacity = entered ? 1 : 0;

  return (
    <div
      aria-modal
      role="dialog"
      className="fixed inset-0 z-[1000] flex flex-col justify-end"
      style={{ contain: "layout paint size style" }}
    >
      {/* затемнение */}
      <div
        className="absolute inset-0 bg-black/30"
        style={{
          opacity: backdropOpacity,
          transition: `opacity ${ENTER_DUR}ms ${ENTER_EASE}`
        }}
      />

      {/* сам фрейм у нижней границы */}
      <div
        ref={frameRef}
        className={clsx(
          "relative z-[1] w-full",
          "rounded-t-[24px] bg-white",
          "shadow-[0_-4px_24px_rgba(0,0,0,0.18)]"
        )}
        style={{
          height: heightStyle,
          transform: `translate3d(0, ${dragY + enterOffset}px, 0)`,
          backfaceVisibility: "hidden",
          willChange: "transform,height",
          transition: suppressHeightOnce
            // На самый первый кадр отключаем анимацию высоты, оставляем только плавный «вылет»
            ? `transform ${ENTER_DUR}ms ${ENTER_EASE}`
            : (animatingToFull
                ? `height 320ms ${ENTER_EASE}, transform ${ENTER_DUR}ms ${ENTER_EASE}`
                : `height 220ms ${ENTER_EASE}, transform ${ENTER_DUR}ms ${ENTER_EASE}`),
        }}
      >
        {/* Синяя шапка */}
        <div
          ref={headerRef}
          className="rounded-t-[24px] px-4 pt-5 pb-10 text-white bg-[linear-gradient(135deg,#0076E1_0%,#0096F8_100%)]"
        >
          <div className="flex items-center gap-3">
            <span className="inline-flex h-14 w-14 items-center justify-center rounded-[12px] bg-white/15 ring-1 ring-white/20">
              <img src={iconSrc} alt="" className="h-15 w-15" />
            </span>
            <div className="leading-tight">
              <div className={clsx("font-bold leading-none", subtitle ? "text-[22px]" : "text-[20px]")}>
                {title}
              </div>
              {subtitle && <div className="mt-1 text-[14.5px] font-medium text-white/75">{subtitle}</div>}
            </div>
          </div>
        </div>

        {/* Белая область со скроллом содержимого */}
        <div
          ref={scrollRef}
          className={clsx(
            "-mt-6 w-full overflow-y-auto rounded-t-[24px] bg-white px-4 pb-8 pt-6",
            "overscroll-contain touch-pan-y",
            innerClassName
          )}
          style={{
            height: bodyHeightStyle,
            WebkitOverflowScrolling: "touch",
            overscrollBehavior: "contain",
          }}
        >
          {children}
          <div className="h-8" />
        </div>
      </div>
    </div>
  );
}

export function SectionCard({
  children,
  className = "",
}: PropsWithChildren<{ className?: string }>) {
  return (
    <div className={clsx("mx-1 rounded-[18px] bg-white p-2 shadow-md ring-1 ring-slate-100", className)}>
      {children}
    </div>
  );
}
