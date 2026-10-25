// Akos DS mobile feel: zero-dependency motion primitives (Apple's WWDC18/WWDC23 math).
// Copy this file into a project as-is. Run `node spring.js` to self-check.

const TAU = 2 * Math.PI;

// Apple's (duration, bounce) to mass/stiffness/damping. Duration is perceptual, not settle time.
// bounce 0 = smooth, 0.15 = snappy, 0.3 = bouncy. Keep bounce <= 0.4 for UI.
export function appleSpring(duration = 0.5, bounce = 0) {
  const stiffness = (TAU / duration) ** 2;
  const damping = bounce >= 0 ? (4 * Math.PI * (1 - bounce)) / duration : (4 * Math.PI) / (duration * (1 + bounce));
  return { stiffness, damping, mass: 1 };
}

// UIScrollView rubber band: past a boundary the element follows less the further you pull.
// Never exceeds `dimension` however far the finger goes. c = 0.55 is iOS.
export const rubberband = (overshoot, dimension, c = 0.55) =>
  (overshoot * dimension * c) / (dimension + c * Math.abs(overshoot));

// Where a flick would coast to (UIScrollView deceleration). 0.998 normal, 0.99 snappy.
export const project = (velocity, rate = 0.998) => ((velocity / 1000) * rate) / (1 - rate);

// Release velocity in px/s from the last ~100ms of pointer samples.
export function velocityTracker(windowMs = 100) {
  let samples = [];
  return {
    add(x, t = performance.now()) {
      samples.push([x, t]);
      samples = samples.filter(([, st]) => t - st <= windowMs);
    },
    get() {
      if (samples.length < 2) return 0;
      const [x0, t0] = samples[0], [x1, t1] = samples[samples.length - 1];
      return t1 > t0 ? ((x1 - x0) / (t1 - t0)) * 1000 : 0;
    },
    reset() { samples = []; },
  };
}

// Interruptible spring on one axis. `state` ({ x, v } in px and px/s) is live: grab it mid-flight
// and its current x and v are the presentation value and velocity to continue from.
// Retarget by calling again with the same state. Returns stop().
export function springTo(state, target, { duration = 0.5, bounce = 0, onUpdate, onDone, restDelta = 0.5, restSpeed = 10 } = {}) {
  const { stiffness: k, damping: c } = appleSpring(duration, bounce);
  const raf = globalThis.requestAnimationFrame ?? ((f) => setTimeout(() => f(performance.now()), 16));
  const caf = globalThis.cancelAnimationFrame ?? clearTimeout;
  let last = performance.now(), id;
  const step = (now) => {
    let dt = Math.min((now - last) / 1000, 0.064);
    last = now;
    for (const h = 1 / 240; dt > 0; dt -= h) { // fixed substeps keep stiff springs stable
      const s = Math.min(h, dt);
      state.v += (-k * (state.x - target) - c * state.v) * s;
      state.x += state.v * s;
    }
    if (Math.abs(state.x - target) < restDelta && Math.abs(state.v) < restSpeed) {
      state.x = target; state.v = 0;
      onUpdate?.(state.x); onDone?.();
      return;
    }
    onUpdate?.(state.x);
    id = raf(step);
  };
  id = raf(step);
  return () => caf(id);
}

// Spring as a CSS linear() easing for plain transitions (no gesture velocity). Analytic solution,
// so the curve is exact. Returns { easing, ms } where ms is the settle time to use as duration.
// v0 is optional initial velocity as a fraction of the distance per second.
export function springEasing(duration = 0.5, bounce = 0, v0 = 0) {
  const w0 = TAU / duration, z = Math.max(0, Math.min(1, 1 - bounce));
  const e = (t) => {
    if (z >= 1) return Math.exp(-w0 * t) * (-1 + (v0 - w0) * t);
    const wd = w0 * Math.sqrt(1 - z * z);
    return Math.exp(-z * w0 * t) * (-Math.cos(wd * t) + ((v0 - z * w0) / wd) * Math.sin(wd * t));
  };
  let end = 0.016;
  while (end < 5 && !(Math.abs(e(end)) < 0.001 && Math.abs(e(end + 0.05)) < 0.001)) end += 0.016;
  const n = Math.ceil(end / 0.016), pts = [];
  for (let i = 0; i <= n; i++) pts.push(+(1 + e((i / n) * end)).toFixed(3));
  pts[n] = 1;
  return { easing: `linear(${pts.join(', ')})`, ms: Math.round(end * 1000) };
}

export const prefersReducedMotion = () =>
  globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

// Self-check: `node spring.js`. With `--css`, prints the tokens for tokens.css.
if (typeof process !== 'undefined' && import.meta.url === `file://${process.argv[1]}`) {
  const { default: assert } = await import('node:assert');
  const near = (a, b, eps = 1e-6) => assert.ok(Math.abs(a - b) < eps, `${a} != ${b}`);
  // rubber band equals the reel's form (1 - 1/(c*x/d + 1)) * d and is capped by d
  near(rubberband(300, 844), (1 - 1 / ((0.55 * 300) / 844 + 1)) * 844);
  assert.ok(rubberband(1e9, 844) < 844 && rubberband(-300, 844) < 0);
  near(project(1000), 499, 1e-9);
  // bounce maps to damping ratio 1 - bounce (reel: .smooth 1.0, .snappy 0.85, .bouncy 0.70)
  for (const [b, ratio] of [[0, 1], [0.15, 0.85], [0.3, 0.7]]) {
    const { stiffness, damping } = appleSpring(0.5, b);
    near(damping / (2 * Math.sqrt(stiffness)), ratio);
  }
  const peak = (s) => Math.max(...s.easing.slice(7, -1).split(', ').map(Number));
  assert.ok(peak(springEasing(0.5, 0)) <= 1, 'smooth must not overshoot');
  assert.ok(peak(springEasing(0.5, 0.3)) > 1.02, 'bouncy must overshoot');
  // springTo settles on target and keeps velocity when retargeted mid-flight
  const st = { x: 0, v: 0 };
  await new Promise((done) => springTo(st, 100, { bounce: 0.15, onDone: done }));
  near(st.x, 100);
  const vt = velocityTracker(); vt.add(0, 0); vt.add(50, 50);
  near(vt.get(), 1000);
  if (process.argv.includes('--css')) {
    for (const [name, b] of [['smooth', 0], ['snappy', 0.15], ['bouncy', 0.3]]) {
      const s = springEasing(0.5, b);
      console.log(`  --spring-${name}: ${s.easing};\n  --spring-${name}-ms: ${s.ms}ms;`);
    }
  } else console.log('spring.js ok');
}
