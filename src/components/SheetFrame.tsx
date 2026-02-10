// components/SheetFrame.tsx
"use client";

import React, { PropsWithChildren, ReactNode, useCallback, useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { lockBodyScroll, unlockBodyScroll } from "@/utils/bodyScrollLock";
import AppImage from "@/components/AppImage";

type SheetFrameProps = {
  open: boolean;
  onClose: () => void;

  title: string;
  subtitle?: string;
  iconSrc?: string;

  headerContent?: ReactNode;
  headerClassName?: string;

  initialVH?: number;
  maxVH?: number;

  swipeToClose?: boolean;
  closeThresholdPx?: number;
  closeVelocityPxMs?: number;
  snapBackMs?: number;

  expandUpThresholdPx?: number;

  innerClassName?: string;
  showScrollHint?: boolean;
  scrollHintBottomOffset?: number;
};

export default function SheetFrame({
  open,
  onClose,
  title,
  subtitle,
  iconSrc = "/list.svg",
  headerContent,
  headerClassName,

  initialVH = 78,
  maxVH = 100,

  swipeToClose = true,
  closeThresholdPx = 220,
  closeVelocityPxMs = 0.6,
  snapBackMs = 180,

  expandUpThresholdPx = 72,

  innerClassName,
  showScrollHint = false,
  scrollHintBottomOffset = 0,
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
  const [showBottomScrollHint, setShowBottomScrollHint] = useState(false);
  const dragYRef = useRef(0);
  const expandingUp = useRef(false);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const media = window.matchMedia("(min-width: 768px)");
    const update = () => setIsDesktop(media.matches);
    update();
    if (media.addEventListener) {
      media.addEventListener("change", update);
      return () => media.removeEventListener("change", update);
    }
    media.addListener(update);
    return () => media.removeListener(update);
  }, []);

  const preventWheel = useRef<((e: WheelEvent) => void) | null>(null);
  const preventTouchMove = useRef<((e: TouchEvent) => void) | null>(null);

  const lockInnerScroll = useCallback(() => {
    if (isDesktop) {
      return;
    }
    const sc = scrollRef.current;
    if (!sc) return;
    sc.style.overflowY = "hidden";
    sc.scrollTop = 0;
    if (!preventWheel.current) {
      preventWheel.current = (e) => {
        const target = e.target as Element | null;
        if (target?.closest("[data-allow-horizontal-scroll='true']")) return;
        e.preventDefault();
        e.stopPropagation();
      };
    }
    sc.addEventListener("wheel", preventWheel.current, { passive: false });
    if (!preventTouchMove.current) {
      preventTouchMove.current = (e) => {
        const target = e.target as Element | null;
        if (target?.closest("[data-allow-horizontal-scroll='true']")) return;
        e.preventDefault();
        e.stopPropagation();
      };
    }
    sc.addEventListener("touchmove", preventTouchMove.current, { passive: false });
  }, [isDesktop]);

  useEffect(() => {
    if (!open || !showScrollHint) {
      setShowBottomScrollHint(false);
      return;
    }

    const sc = scrollRef.current;
    if (!sc) {
      setShowBottomScrollHint(false);
      return;
    }

    const MIN_SCROLLABLE_OVERFLOW_PX = 24;
    const MIN_REMAINING_CONTENT_PX = 56;

    const updateHint = () => {
      const maxScrollable = sc.scrollHeight - sc.clientHeight;
      const remaining = sc.scrollHeight - (sc.scrollTop + sc.clientHeight);
      const hasMeaningfulOverflow = maxScrollable > MIN_SCROLLABLE_OVERFLOW_PX;
      const hasMeaningfulRemaining = remaining > MIN_REMAINING_CONTENT_PX;
      setShowBottomScrollHint(hasMeaningfulOverflow && hasMeaningfulRemaining);
    };

    updateHint();
    const raf = window.requestAnimationFrame(updateHint);
    sc.addEventListener("scroll", updateHint, { passive: true });
    window.addEventListener("resize", updateHint);

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(() => updateHint());
      ro.observe(sc);
    }

    return () => {
      window.cancelAnimationFrame(raf);
      sc.removeEventListener("scroll", updateHint);
      window.removeEventListener("resize", updateHint);
      ro?.disconnect();
    };
  }, [open, showScrollHint]);

  const unlockInnerScroll = useCallback(() => {
    const sc = scrollRef.current;
    if (!sc) return;
    sc.style.overflowY = "";
    try {
      if (preventWheel.current) sc.removeEventListener("wheel", preventWheel.current as EventListener);
      if (preventTouchMove.current) sc.removeEventListener("touchmove", preventTouchMove.current as EventListener);
    } catch {}
  }, []);

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
    lockBodyScroll();

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
      unlockBodyScroll();
      unlockInnerScroll();
      setEntered(false);
    };
  }, [open, initialVH, lockInnerScroll, unlockInnerScroll]);

  // When the sheet closes, drop focus from its contents to avoid focus living inside a hidden tree.
  useEffect(() => {
    if (open) return;
    const frame = frameRef.current;
    const active = document.activeElement as HTMLElement | null;
    if (frame && active && frame.contains(active)) {
      active.blur();
    }
  }, [open]);

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

  const snapBack = useCallback(() => {
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
  }, [snapBackMs]);

  const expandToFull = useCallback(() => {
    setAnimatingToFull(true);
    setPanelVH(maxVH);
  }, [maxVH]);

  const isFull = panelVH >= maxVH - 0.5;

  useEffect(() => {
    if (!open) return;
    if (isDesktop || isFull) {
      unlockInnerScroll();
    } else {
      lockInnerScroll();
    }
  }, [isDesktop, isFull, open, lockInnerScroll, unlockInnerScroll]);

  const canSwipeToClose = swipeToClose && !isDesktop;

  useEffect(() => {
    if (!open || !canSwipeToClose) return;
    const el = frameRef.current!;
    const sc = scrollRef.current!;
    const headerEl = headerRef.current;
    const startedOnHeader = { current: false };

    const canStartFromTop = (fromHeader: boolean) => fromHeader || (sc.scrollTop || 0) <= 1;

    const onDown = (x: number, y: number, fromHeader: boolean) => {
      startedOnHeader.current = fromHeader;
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

      const atTop = canStartFromTop(startedOnHeader.current);

      if (dy < 0 && atTop && !isFull) {
        const enoughPull = Math.abs(dy) > expandUpThresholdPx;
        if (enoughPull && !tooSmallForFull.current) {
          expandingUp.current = true;
          preventDefault();
          expandToFull();
        }
        return;
      }

      if (dy > 10 && atTop) {
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
              onClose();
              requestAnimationFrame(() => setDragY(0));
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

    const down = (e: PointerEvent, fromHeader: boolean) => {
      onDown(e.clientX, e.clientY, fromHeader);
      try {
        (e.target as Element).setPointerCapture?.(e.pointerId);
      } catch {}
    };
    const move = (e: PointerEvent) => onMove(e.clientX, e.clientY, e.timeStamp, () => e.preventDefault());
    const up = (e: PointerEvent) => onUp(e.clientY, e.timeStamp);

    const tStart = (e: TouchEvent, fromHeader: boolean) => {
      const t = e.touches[0];
      if (!t) return;
      onDown(t.clientX, t.clientY, fromHeader);
    };
    const tMove = (e: TouchEvent) => {
      const t = e.touches[0];
      if (!t) return;
      onMove(t.clientX, t.clientY, e.timeStamp, () => e.preventDefault());
    };
    const tEnd = (e: TouchEvent) => onUp(lastY.current, e.timeStamp);

    type StoredHandlers = {
      downHandler: (e: PointerEvent) => void;
      tStartHandler: (e: TouchEvent) => void;
    };
    const handlers = new Map<HTMLElement, StoredHandlers>();

    const opts: AddEventListenerOptions = { passive: false, capture: true };
    const targets: Array<{ el: HTMLElement; fromHeader: boolean }> = [
      { el, fromHeader: false },
      ...(headerEl ? [{ el: headerEl, fromHeader: true }] : []),
      { el: sc, fromHeader: false },
    ];
    targets.forEach((target) => {
      const { el: targetEl, fromHeader } = target;
      const downHandler = (e: PointerEvent) => down(e, fromHeader);
      const tStartHandler = (e: TouchEvent) => tStart(e, fromHeader);

      targetEl.addEventListener("pointerdown", downHandler, opts);
      targetEl.addEventListener("pointermove", move, opts);
      targetEl.addEventListener("pointerup", up, opts);
      targetEl.addEventListener("pointercancel", up, opts);

      targetEl.addEventListener("touchstart", tStartHandler, opts);
      targetEl.addEventListener("touchmove", tMove, opts);
      targetEl.addEventListener("touchend", tEnd, opts);
      targetEl.addEventListener("touchcancel", tEnd, opts);

      // store handlers for cleanup
      handlers.set(targetEl, { downHandler, tStartHandler });
    });

    const onVisibility = () => {
      if (document.hidden) {
        setDragY(0);
        sc.style.overflowY = "";
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      targets.forEach((target) => {
        const { el: targetEl, fromHeader } = target;
        const stored = handlers.get(targetEl);

        targetEl.removeEventListener("pointerdown", stored?.downHandler ?? ((e) => down(e, fromHeader)));
        targetEl.removeEventListener("pointermove", move);
        targetEl.removeEventListener("pointerup", up);
        targetEl.removeEventListener("pointercancel", up);

        targetEl.removeEventListener("touchstart", stored?.tStartHandler ?? ((e) => tStart(e, fromHeader)));
        targetEl.removeEventListener("touchmove", tMove);
        targetEl.removeEventListener("touchend", tEnd);
        targetEl.removeEventListener("touchcancel", tEnd);
      });
      handlers.clear();

      document.removeEventListener("visibilitychange", onVisibility);
      sc.style.overflowY = "";
    };
  }, [
    open,
    canSwipeToClose,
    closeThresholdPx,
    closeVelocityPxMs,
    snapBackMs,
    expandUpThresholdPx,
    onClose,
    snapBack,
    expandToFull,
    isFull,
  ]);

  const headerPx = headerRef.current?.offsetHeight || 150;
  const heightStyle = `${panelVH}dvh`;
  const bodyHeightStyle = `calc(${panelVH}dvh - ${headerPx}px)`;

  // ▲ NEW: смещение при появлении (px) и прозрачность подложки
  const enterOffset = entered ? 0 : 56; // было 40
  const backdropOpacity = entered ? 1 : 0;

  return (
    <div
      role={open ? "dialog" : undefined}
      aria-modal={open ? true : undefined}
      className={clsx(
        "fixed inset-0 z-[1000] flex flex-col justify-end",
        open ? "pointer-events-auto" : "pointer-events-none"
      )}
      style={{
        contain: "layout paint size style",
        visibility: open ? "visible" : "hidden",
      }}
      inert={open ? undefined : true}
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
          "relative z-[1] w-full md:mx-auto md:max-w-[680px]",
          "rounded-t-[24px] bg-white dark:bg-slate-900",
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
          className={clsx(
            "relative rounded-t-[24px]",
            headerContent
              ? null
              : "px-4 pt-5 pb-10 text-white bg-[linear-gradient(135deg,#00A6FF_0%,#24E38E_100%)]",
            headerClassName
          )}
          style={{ touchAction: "none" }}
        >
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-1/2 z-10 hidden h-11 w-11 -translate-y-[70%] items-center justify-center rounded-full bg-white/20 text-white transition hover:bg-white/30 md:inline-flex"
            aria-label="Закрыть"
          >
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" aria-hidden="true">
              <path
                d="M6 9l6 6 6-6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          {headerContent ?? (
            <div className="flex items-center gap-3">
              <span className="inline-flex h-14 w-14 items-center justify-center rounded-[12px] bg-white/15 ring-1 ring-white/20">
                <AppImage src={iconSrc} alt="" width={60} height={60} className="h-15 w-15" />
              </span>
              <div className="leading-tight">
                <div className={clsx("font-bold leading-none", subtitle ? "text-[22px]" : "text-[20px]")}>
                  {title}
                </div>
                {subtitle && <div className="mt-1 text-[14.5px] font-medium text-white/75">{subtitle}</div>}
              </div>
            </div>
          )}
        </div>

        {/* Белая область со скроллом содержимого */}
        <div
          ref={scrollRef}
          className={clsx(
            "-mt-6 w-full overflow-y-auto rounded-t-[24px] bg-white px-4 pb-8 pt-6 dark:bg-slate-900",
            "relative z-[2]",
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
        </div>
        {showScrollHint && showBottomScrollHint && (
          <div
            className="pointer-events-none absolute left-0 right-0 z-[30] h-24 overflow-hidden"
            style={{ bottom: `${scrollHintBottomOffset}px` }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-sky-500/52 via-blue-500/28 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-sky-500/44 via-blue-500/26 to-transparent" />
            <div className="absolute inset-0 bg-[radial-gradient(72%_130%_at_0%_100%,rgba(14,165,233,0.52),rgba(14,165,233,0.2)_56%,transparent_78%),radial-gradient(72%_130%_at_100%_100%,rgba(37,99,235,0.56),rgba(37,99,235,0.22)_58%,transparent_80%)]" />
            <div className="absolute inset-0 animate-pulse bg-[radial-gradient(68%_120%_at_0%_100%,rgba(14,165,233,0.28),transparent_72%),radial-gradient(68%_120%_at_100%_100%,rgba(37,99,235,0.3),transparent_74%)]" />
          </div>
        )}
      </div>
    </div>
  );
}

export function SectionCard({
  children,
  className = "",
}: PropsWithChildren<{ className?: string }>) {
  return (
    <div className={clsx("mx-1 rounded-[18px] bg-white p-2 shadow-md ring-1 ring-slate-100 dark:bg-slate-900 dark:ring-slate-800", className)}>
      {children}
    </div>
  );
}
