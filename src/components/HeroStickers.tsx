import { useLayoutEffect, useRef } from "react";
import { motion } from "motion/react";
import { FILL, type Img } from "./cart";

// Draggable hero stickers. To add one of Ellie's stickers: drop the file in
// public/stickers/ and add an entry (ratio = width / height of the art,
// position as % of the hero). wideOnly hides it on phones; lineArt swaps the
// hard offset shadow, which doubles thin black lines, for a soft one. The
// hero's bottom padding is a band reserved for the stickers pinned there (see
// .c-hero). onWhite is a second version of the art shown wherever the sticker
// is below the pink/white seam, switching line by line as it crosses.
export const STICKERS: {
  src: string;
  ratio: number;
  width: string;
  pos: React.CSSProperties;
  rotate: number;
  photo?: boolean;
  wideOnly?: boolean;
  lineArt?: boolean;
  onWhite?: string;
}[] = [
  { src: "/stickers/betty.webp", ratio: 271 / 231, width: "clamp(70px, 12vw, 130px)", pos: { left: "5%", top: "16%" }, rotate: -12 },
  { src: "/stickers/ritual.webp", ratio: 282 / 350, width: "clamp(72px, 11vw, 135px)", pos: { right: "4%", top: "16%" }, rotate: 8, lineArt: true, onWhite: "/stickers/ritual-on-white.webp" },
  { src: "/stickers/devil-betty.webp", ratio: 860 / 783, width: "clamp(80px, 13vw, 150px)", pos: { right: "20%", bottom: "24px" }, rotate: 10 },
  { src: "/stickers/lips.webp", ratio: 1, width: "clamp(70px, 11vw, 130px)", pos: { left: "22%", bottom: "24px" }, rotate: -8 },
];

const drag = {
  drag: true,
  dragElastic: 0.2,
  dragTransition: { bounceStiffness: 300, bounceDamping: 20 },
} as const;

const IMG = { alt: "", sizes: "150px", loading: "lazy", decoding: "async", draggable: false, style: { ...FILL, pointerEvents: "none" } } as const;

// Clips the art to the part of the sticker above the seam and the onWhite art
// to the part below. The seam is horizontal on the page; the sticker is
// rotated (and scaled while dragged) about its centre, so the cut is that line
// mapped into the sticker's own box.
function clipAtSeam(el: HTMLElement, rotate: number) {
  const seamEl = document.querySelector(".c-logo-wrap");
  const [top, bottom] = el.querySelectorAll("img");
  if (!seamEl || !bottom) return;
  const w = el.offsetWidth, h = el.offsetHeight, t = (rotate * Math.PI) / 180;
  const r = el.getBoundingClientRect();
  const scale = r.height / (w * Math.abs(Math.sin(t)) + h * Math.cos(t));
  const s = seamEl.getBoundingClientRect();
  const seam = (s.bottom - s.height * 0.28 - (r.top + r.height / 2)) / scale; // .c-logo-wrap::before ends 28% up
  const at = (x: number) => h / 2 + (seam - (x - w / 2) * Math.sin(t)) / Math.cos(t);
  const line = `0 ${at(0)}px, ${w}px ${at(w)}px`;
  top.style.clipPath = `polygon(${line}, ${w}px -1e4px, 0 -1e4px)`;
  bottom.style.clipPath = `polygon(${line}, ${w}px 1e4px, 0 1e4px)`;
}

/** `imgs` holds the optimized image (and onWhite image) for each STICKERS entry, in order. */
export default function HeroStickers({ imgs }: { imgs: (Img & { onWhite?: Img })[] }) {
  // Stickers stay inside the hero, which is static markup around this island.
  const anchor = useRef<HTMLSpanElement>(null);
  const heroRef = useRef<HTMLElement | null>(null);
  const seamed = useRef<Map<HTMLElement, number>>(new Map());
  useLayoutEffect(() => {
    heroRef.current = anchor.current?.closest(".c-hero") ?? null;
    const update = () => seamed.current.forEach((rotate, el) => clipAtSeam(el, rotate));
    update();
    const ro = new ResizeObserver(update); // viewport and logo size both move the seam
    ro.observe(heroRef.current!);
    return () => ro.disconnect();
  }, []);

  return (
    <>
      <span ref={anchor} hidden />
      {STICKERS.map((s, i) => (
        <motion.div
          key={s.src}
          aria-hidden="true"
          className={`c-sticker${s.photo ? " photo" : ""}${s.wideOnly ? " wide-only" : ""}${s.lineArt ? " line-art" : ""}`}
          style={{ ...s.pos, width: s.width, aspectRatio: s.ratio, rotate: s.rotate }}
          dragConstraints={heroRef}
          whileDrag={{ scale: 1.08 }}
          {...drag}
          {...(imgs[i].onWhite && {
            ref: (el: HTMLDivElement | null) => { if (el) seamed.current.set(el, s.rotate); },
            onUpdate: () => seamed.current.forEach((rotate, el) => clipAtSeam(el, rotate)),
          })}
        >
          <img {...imgs[i]} {...IMG} />
          {imgs[i].onWhite && <img {...imgs[i].onWhite} {...IMG} />}
        </motion.div>
      ))}
    </>
  );
}
