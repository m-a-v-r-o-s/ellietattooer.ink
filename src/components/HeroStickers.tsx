import { useLayoutEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { FILL, type Img } from "./cart";

// Draggable hero stickers. To add one of Ellie's stickers: drop the file in
// public/stickers/ and add an entry (ratio = width / height of the art,
// position as % of the hero). wideOnly hides it on phones. `white` starts it in
// the free white space nearest that point (fractions of the hero width and of
// the white area's height), falling back to `pos` when nothing fits there.
export const STICKERS: {
  src: string;
  ratio: number;
  width: string;
  pos: React.CSSProperties;
  white?: [number, number];
  rotate: number;
  photo?: boolean;
  wideOnly?: boolean;
}[] = [
  { src: "/stickers/betty.webp", ratio: 271 / 231, width: "clamp(70px, 12vw, 130px)", pos: { left: "5%", top: "16%" }, rotate: -12 },
  { src: "/portfolio/Screenshot_2026-08-17_16-28-40.webp", ratio: 1, width: "clamp(80px, 11vw, 140px)", pos: { right: "4%", top: "16%" }, rotate: 8, photo: true, wideOnly: true },
  { src: "/stickers/devil-betty.webp", ratio: 860 / 783, width: "clamp(80px, 13vw, 150px)", pos: { right: "22%", top: "70px" }, white: [0.9, 0.75], rotate: 10 },
  { src: "/stickers/lips.webp", ratio: 1, width: "clamp(70px, 11vw, 130px)", pos: { left: "30%", top: "84px" }, white: [0.1, 0.4], rotate: -8 },
];

const drag = {
  drag: true,
  dragElastic: 0.2,
  dragTransition: { bounceStiffness: 300, bounceDamping: 20 },
} as const;

type Spot = { left: number; top: number } | null;

/** Nearest spot to `want` in the hero's white half that clears its content
 *  and `taken`, or null. ponytail: 8px grid scan, fine for a few stickers. */
function whiteSpot(hero: HTMLElement, el: HTMLElement, want: [number, number], taken: DOMRect[]): Spot {
  const PAD = 16; // room for the tilt and the drop shadow
  const h = hero.getBoundingClientRect();
  const wrap = hero.querySelector<HTMLElement>(".c-logo-wrap")!;
  const seam = wrap.getBoundingClientRect().bottom - h.top - parseFloat(getComputedStyle(wrap, "::before").bottom);
  const blocks = [...hero.querySelectorAll(".c-logo-wrap, h1, .c-ctas, .c-hint, .c-star")]
    .map((e) => e.getBoundingClientRect())
    .concat(taken)
    .map((r) => ({ l: r.left - h.left - PAD, t: r.top - h.top - PAD, r: r.right - h.left + PAD, b: r.bottom - h.top + PAD }));
  const w = el.offsetWidth, ht = el.offsetHeight;
  const wx = want[0] * h.width, wy = seam + want[1] * (h.height - seam);
  let best: Spot = null, bestD = Infinity;
  for (let top = seam + PAD; top + ht + PAD <= h.height; top += 8)
    for (let left = PAD; left + w + PAD <= h.width; left += 8) {
      if (blocks.some((b) => left < b.r && b.l < left + w && top < b.b && b.t < top + ht)) continue;
      const d = (left + w / 2 - wx) ** 2 + (top + ht / 2 - wy) ** 2;
      if (d < bestD) (bestD = d), (best = { left, top });
    }
  return best;
}

/** `imgs` holds the optimized image for each STICKERS entry, in order. */
export default function HeroStickers({ imgs }: { imgs: Img[] }) {
  // Stickers stay inside the hero, which is static markup around this island.
  const anchor = useRef<HTMLSpanElement>(null);
  const heroRef = useRef<HTMLElement | null>(null);
  useLayoutEffect(() => {
    heroRef.current = anchor.current?.closest(".c-hero") ?? null;
  }, []);

  const els = useRef<(HTMLDivElement | null)[]>([]);
  const [spots, setSpots] = useState<Spot[] | null>(null);
  useLayoutEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;
    const place = () => {
      const taken: DOMRect[] = [];
      setSpots(STICKERS.map((s, i) => {
        const spot = s.white ? whiteSpot(hero, els.current[i]!, s.white, taken) : null;
        if (spot) {
          const h = hero.getBoundingClientRect();
          taken.push(new DOMRect(h.left + spot.left, h.top + spot.top, els.current[i]!.offsetWidth, els.current[i]!.offsetHeight));
        }
        return spot;
      }));
    };
    const ro = new ResizeObserver(place);
    ro.observe(hero);
    return () => ro.disconnect();
  }, []);

  return (
    <>
      <span ref={anchor} hidden />
      {STICKERS.map((s, i) => (
        <motion.div
          key={s.src}
          aria-hidden="true"
          ref={(el) => { els.current[i] = el; }}
          className={`c-sticker${s.photo ? " photo" : ""}${s.wideOnly ? " wide-only" : ""}${s.white ? " auto" : ""}${spots ? " placed" : ""}`}
          style={{
            ...(spots?.[i] ?? s.pos), width: s.width, aspectRatio: s.ratio, rotate: s.rotate,
          }}
          dragConstraints={heroRef}
          whileDrag={{ scale: 1.08 }}
          {...drag}
        >
          <img {...imgs[i]} alt="" sizes="150px" loading="lazy" decoding="async" draggable={false} style={{ ...FILL, pointerEvents: "none" }} />
        </motion.div>
      ))}
    </>
  );
}
