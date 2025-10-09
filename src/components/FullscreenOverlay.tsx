"use client";

import clsx from "clsx";
import { type MouseEvent, type ReactNode, useEffect, useRef, useState } from "react";
import { lockBodyScroll, unlockBodyScroll } from "@/utils/bodyScrollLock";

type OverlayChildren =
  | ReactNode
  | ((state: { visible: boolean }) => ReactNode);

type FullscreenOverlayProps = {
  open: boolean;
  onClose: () => void;
  children: OverlayChildren;

  backdropClassName?: string;
  contentWrapperClassName?: string;
  contentClassName?: string;
  contentFade?: boolean;
  lockScroll?: boolean;

  transitionMs?: number;
  closeOnBackdrop?: boolean;
  closeOnContentClick?: boolean;
};

const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";

export default function FullscreenOverlay({
  open,
  onClose,
  children,
  backdropClassName,
  contentWrapperClassName,
  contentClassName,
  contentFade = true,
  lockScroll = false,
  transitionMs = 360,
  closeOnBackdrop = true,
  closeOnContentClick = false,
}: FullscreenOverlayProps) {
  const [mounted, setMounted] = useState(open);
  const [visible, setVisible] = useState(false);
  const exitTimerRef = useRef<ReturnType<typeof window.setTimeout> | null>(null);
  const entryFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (open) {
      if (exitTimerRef.current) {
        window.clearTimeout(exitTimerRef.current);
        exitTimerRef.current = null;
      }
      if (entryFrameRef.current !== null) {
        window.cancelAnimationFrame(entryFrameRef.current);
        entryFrameRef.current = null;
      }

      setMounted(true);
      entryFrameRef.current = window.requestAnimationFrame(() => {
        entryFrameRef.current = window.requestAnimationFrame(() => {
          setVisible(true);
          entryFrameRef.current = null;
        });
      });
      return;
    }

    setVisible(false);
    if (entryFrameRef.current !== null) {
      window.cancelAnimationFrame(entryFrameRef.current);
      entryFrameRef.current = null;
    }
    exitTimerRef.current = window.setTimeout(() => {
      setMounted(false);
      exitTimerRef.current = null;
    }, transitionMs);

    return () => {
      if (exitTimerRef.current) {
        window.clearTimeout(exitTimerRef.current);
        exitTimerRef.current = null;
      }
      if (entryFrameRef.current !== null) {
        window.cancelAnimationFrame(entryFrameRef.current);
        entryFrameRef.current = null;
      }
    };
  }, [open, transitionMs]);

  useEffect(() => {
    if (!lockScroll) return;
    if (!mounted) return;

    lockBodyScroll();
    return () => {
      unlockBodyScroll();
    };
  }, [lockScroll, mounted]);

  useEffect(() => {
    return () => {
      if (exitTimerRef.current) {
        window.clearTimeout(exitTimerRef.current);
        exitTimerRef.current = null;
      }
      if (entryFrameRef.current !== null) {
        window.cancelAnimationFrame(entryFrameRef.current);
        entryFrameRef.current = null;
      }
    };
  }, []);

  const transitionStyle = {
    transitionDuration: `${transitionMs}ms`,
    transitionTimingFunction: EASE,
  };

  if (!mounted) return null;

  const handleBackdropClick = () => {
    if (!closeOnBackdrop) return;
    onClose();
  };

  const handleContentClick = (event: MouseEvent<HTMLDivElement>) => {
    if (!closeOnContentClick) {
      event.stopPropagation();
      return;
    }
    onClose();
  };

  const wrapperClass = clsx(
    "relative z-[1] flex h-full w-full items-center justify-center",
    contentWrapperClassName ?? "p-6"
  );

  const contentClass = clsx(
    contentFade && "group/data-overlay transition-opacity",
    contentFade && (visible ? "opacity-100" : "opacity-0"),
    contentClassName ??
      "flex w-full max-w-sm flex-col items-center justify-center rounded-[28px] bg-white p-8 text-center shadow-xl"
  );

  const renderedChildren =
    typeof children === "function"
      ? (children as (state: { visible: boolean }) => ReactNode)({ visible })
      : children;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-hidden={!open}
      className={clsx(
        "fixed inset-0 z-[1600] flex h-full w-full items-center justify-center",
        visible ? "pointer-events-auto" : "pointer-events-none"
      )}
      onClick={closeOnBackdrop ? handleBackdropClick : undefined}
    >
      <div
        className={clsx(
          "absolute inset-0 transition-opacity ease-out",
          visible ? "opacity-100" : "opacity-0",
          backdropClassName ?? "bg-black/40"
        )}
        style={transitionStyle}
      />

      <div className={wrapperClass}>
        <div
          className={contentClass}
          style={transitionStyle}
          onClick={handleContentClick}
          data-visible={visible ? "true" : "false"}
          data-state={visible ? "open" : "closed"}
        >
          {renderedChildren}
        </div>
      </div>
    </div>
  );
}
