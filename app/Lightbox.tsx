"use client";
import { useEffect, useRef } from "react";
import { flushSync } from "react-dom";
import { motion, useMotionValue, useTransform, animate } from "motion/react";
import { project, rubberband, prefersReducedMotion } from "@/lib/spring";
import { settle, useDrag } from "@/lib/gestures";

type Img = { file: string; alt: string };

/** Swipe between photos (rubber band at ends, momentum), swipe up/down to dismiss. */
export default function Lightbox({
  images, index, onIndex, onClose,
}: { images: Img[]; index: number; onIndex: (i: number) => void; onClose: () => void }) {
  const box = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const enter = useMotionValue(prefersReducedMotion() ? 1 : 0);
  const idx = useRef(index);
  useEffect(() => { idx.current = index; });
  const last = images.length - 1;
  const size = () => ({ w: box.current?.clientWidth ?? 375, h: box.current?.clientHeight ?? 667 });

  useEffect(() => {
    if (enter.get() < 1) animate(enter, 1, { duration: 0.25, ease: "easeOut" });
  }, [enter]);

  const go = (dir: -1 | 1, v = 0) => {
    const n = idx.current + dir;
    if (n < 0 || n > last) return settle(x, 0, v, 0.3);
    settle(x, -dir * size().w, v, 0.3, () => {
      flushSync(() => onIndex(n));
      x.set(0);
    });
  };
  const close = () => {
    if (prefersReducedMotion()) return onClose();
    animate(enter, 0, { duration: 0.2, ease: "easeIn", onComplete: onClose });
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const { handlers, wasDragged } = useDrag({
    // Catching a surface mid-flight: take over immediately from its live value.
    instant: () => (x.isAnimating() ? "x" : y.isAnimating() ? "y" : null),
    onDown: () => { x.stop(); y.stop(); },
    onMove: (axis, dx, dy) => {
      const { w, h } = size();
      if (axis === "x") {
        const i = idx.current;
        const blocked = (dx > 0 && i === 0) || (dx < 0 && i === last);
        x.set(blocked ? rubberband(dx, w) : dx);
      } else {
        y.set(dy);
        void h;
      }
    },
    onEnd: (axis, dx, dy, vxx, vyy) => {
      const { w, h } = size();
      if (axis === "x") {
        const land = x.get() + project(vxx);
        if (land < -w / 2 && idx.current < last) go(1, vxx);
        else if (land > w / 2 && idx.current > 0) go(-1, vxx);
        else settle(x, 0, vxx, 0.3);
      } else {
        const land = y.get() + project(vyy);
        if (Math.abs(land) > h * 0.3) {
          const t = Math.sign(land) * h;
          settle(y, t, vyy, 0.15, onClose);
        } else settle(y, 0, vyy, 0.3);
      }
      void dx; void dy;
    },
  });

  const progress = useTransform(y, (v) => Math.min(Math.abs(v) / 300, 1));
  const bg = useTransform([enter, progress], ([e, p]: number[]) => 0.85 * e * (1 - 0.9 * p));
  const bgColor = useTransform(bg, (a) => `rgba(0,0,0,${a})`);
  const imgScale = useTransform(progress, (p) => 1 - 0.1 * p);
  const ui = useTransform([enter, progress], ([e, p]: number[]) => e * (1 - p));
  const enterScale = useTransform(enter, (e) => 0.96 + 0.04 * e);

  return (
    <motion.div
      ref={box}
      className="lightbox-overlay"
      style={{ backgroundColor: bgColor, touchAction: "none", overscrollBehavior: "contain" }}
      role="dialog"
      aria-modal="true"
      aria-label="Photo viewer"
      onClick={(e) => { if (e.target === e.currentTarget && !wasDragged()) close(); }}
      {...handlers}
    >
      <motion.button
        className="lightbox-close"
        style={{ opacity: ui }}
        onClick={(e) => { e.stopPropagation(); close(); }}
      >
        Close
      </motion.button>
      {index > 0 && (
        <motion.button className="lightbox-nav lightbox-prev" style={{ opacity: ui }} aria-label="Previous photo" onClick={(e) => { e.stopPropagation(); go(-1); }}>‹</motion.button>
      )}
      {index < last && (
        <motion.button className="lightbox-nav lightbox-next" style={{ opacity: ui }} aria-label="Next photo" onClick={(e) => { e.stopPropagation(); go(1); }}>›</motion.button>
      )}
      <motion.div style={{ x, y, scale: imgScale, position: "absolute", inset: 0, willChange: "transform" }}>
        {[index - 1, index, index + 1].filter((i) => i >= 0 && i <= last).map((i) => (
          <motion.div
            key={images[i].file}
            style={{ position: "absolute", top: 0, bottom: 0, width: "100%", display: "flex", alignItems: "center", justifyContent: "center", left: `${(i - index) * 100}%`, opacity: i === index ? enter : 1, scale: i === index ? enterScale : 1, pointerEvents: "none" }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/portfolio/${images[i].file}`}
              alt={images[i].alt}
              className="lightbox-img"
              draggable={false}
              style={{ userSelect: "none", WebkitUserSelect: "none", WebkitTouchCallout: "none" }}
            />
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
}
