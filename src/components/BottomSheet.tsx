"use client";
import { useEffect, useMemo } from "react";
import { motion, AnimatePresence, useMotionValue } from "framer-motion";

type Props = {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  initialVH?: number;
  maxVH?: number;      // верхний предел как доля высоты окна
  className?: string;
  withHandle?: boolean;
};

export default function BottomSheet({
  open,
  onClose,
  children,
  initialVH = 58,
  maxVH = 90,          // не даём тянуть выше 90vh
  className,
  withHandle = false,
}: Props) {
  const getVh = () => (typeof window === "undefined" ? 800 : window.innerHeight);
  const vh = getVh();

  const minH = useMemo(() => (vh * initialVH) / 100, [vh, initialVH]);
  const maxHHard = useMemo(() => (vh * maxVH) / 100, [vh, maxVH]); // «потолок»

  const height = useMotionValue(minH);
  let startH = minH;

  // пересчитываем при открытии и ресайзе окна (без рывков)
  useEffect(() => {
    if (!open) return;
    document.documentElement.style.overflow = "hidden";
    height.set(minH);

    const onResize = () => {
      const newVh = getVh();
      const newMin = (newVh * initialVH) / 100;
      const newMax = (newVh * maxVH) / 100;
      const cur = height.get();
      const ratio = (cur - minH) / (maxHHard - minH);
      const next = Math.min(newMax, Math.max(newMin, newMin + ratio * (newMax - newMin)));
      height.set(next);
    };
    window.addEventListener("resize", onResize);
    return () => {
      document.documentElement.style.overflow = "";
      window.removeEventListener("resize", onResize);
    };
  }, [open, minH, maxHHard, height, initialVH, maxVH]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-[80] bg-black/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className={`fixed inset-x-0 bottom-0 z-[81] mx-auto w-full max-w-[520px] overflow-hidden rounded-t-[24px] bg-white shadow-xl ${className ?? ""}`}
            style={{ height }}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
            drag="y"
            dragMomentum={false}
            dragConstraints={{ top: 0, bottom: 0 }}
            onDragStart={() => { startH = height.get(); }}
            onDrag={(_, info) => {
              // тянем вверх → увеличиваем высоту, но не выше maxHHard; вниз — не ниже minH
              const next = Math.min(maxHHard, Math.max(minH, startH - info.offset.y));
              height.set(next);
            }}
            onDragEnd={(_, info) => {
              // вниз далеко/быстро — закрыть
              if (info.offset.y > 140 || info.velocity.y > 800) onClose();
            }}
          >
            {!withHandle ? null : (
              <div className="flex items-center justify-center pt-2">
                <div className="h-1.5 w-12 rounded-full bg-slate-200" />
              </div>
            )}
            <div className={`flex ${withHandle ? "h-[calc(100%-12px)]" : "h-full"} flex-col overflow-hidden`}>
              <div className="min-h-0 flex-1 overflow-y-auto">
                {children}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
