"use client";
import { useEffect, useRef } from "react";
import { animate, type MotionValue } from "motion/react";
import { appleSpring, prefersReducedMotion, velocityTracker } from "./spring";

/** Spring a motion value to target, carrying release velocity (px/s). Jumps under reduced motion. */
export function settle(mv: MotionValue<number>, target: number, velocity = 0, bounce = 0, onDone?: () => void) {
  if (prefersReducedMotion()) {
    mv.set(target);
    onDone?.();
    return;
  }
  const c = animate(mv, target, { type: "spring", ...appleSpring(0.5, bounce), velocity });
  c.then(() => onDone?.());
  return c;
}

type Opts = {
  /** Called on pointerdown; return false to ignore (inputs, etc.). Stop running springs here. */
  onDown?: (e: React.PointerEvent) => boolean | void;
  /** Called once the axis is decided. Return false to hand the gesture back to the browser. */
  onLock?: (axis: "x" | "y", dx: number, dy: number) => boolean | void;
  onMove: (axis: "x" | "y", dx: number, dy: number) => void;
  onEnd: (axis: "x" | "y", dx: number, dy: number, vx: number, vy: number) => void;
  /** Skip hysteresis: lock immediately (catching a moving surface). */
  instant?: () => "x" | "y" | null;
};

/** Pointer-based drag with 10px axis hysteresis, capture on commit, release velocity. */
export function useDrag(opts: Opts) {
  const o = useRef(opts);
  useEffect(() => { o.current = opts; });
  const s = useRef<{ id: number; sx: number; sy: number; axis: "x" | "y" | null; dead: boolean } | null>(null);
  const vx = useRef(velocityTracker());
  const vy = useRef(velocityTracker());
  const dragged = useRef(false);

  const finish = (e: React.PointerEvent) => {
    const st = s.current;
    if (!st || st.id !== e.pointerId) return;
    s.current = null;
    if (st.axis) {
      try { (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId); } catch {}
      o.current.onEnd(st.axis, e.clientX - st.sx, e.clientY - st.sy, vx.current.get(), vy.current.get());
      // swallow the click that follows a drag
      dragged.current = true;
      setTimeout(() => (dragged.current = false), 0);
    }
  };

  return {
    wasDragged: () => dragged.current,
    handlers: {
      onPointerDown(e: React.PointerEvent) {
        if (!e.isPrimary || (e.pointerType === "mouse" && e.button !== 0)) return;
        if (o.current.onDown?.(e) === false) return;
        s.current = { id: e.pointerId, sx: e.clientX, sy: e.clientY, axis: null, dead: false };
        vx.current.reset(); vy.current.reset();
        vx.current.add(0); vy.current.add(0);
        const a = o.current.instant?.() ?? null;
        if (a) {
          s.current.axis = a;
          (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
          o.current.onLock?.(a, 0, 0);
        }
      },
      onPointerMove(e: React.PointerEvent) {
        const st = s.current;
        if (!st || st.id !== e.pointerId) return;
        const dx = e.clientX - st.sx, dy = e.clientY - st.sy;
        if (!st.axis) {
          if (Math.hypot(dx, dy) < 10) return;
          const axis = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
          if (o.current.onLock?.(axis, dx, dy) === false) { s.current = null; return; }
          st.axis = axis;
          (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        }
        vx.current.add(dx); vy.current.add(dy);
        o.current.onMove(st.axis, dx, dy);
      },
      onPointerUp: finish,
      onPointerCancel: finish,
    },
  };
}
