import { useLayoutEffect, useRef } from "react";
import { motion } from "motion/react";
import { FILL, type Img } from "./cart";

// Draggable hero stickers. To add one of Ellie's stickers: drop the file in
// public/stickers/ and add an entry (ratio = width / height of the art,
// position as % of the hero). wideOnly hides it on phones.
export const STICKERS: {
  src: string;
  ratio: number;
  width: string;
  pos: React.CSSProperties;
  rotate: number;
  photo?: boolean;
  wideOnly?: boolean;
}[] = [
  { src: "/stickers/betty.webp", ratio: 271 / 231, width: "clamp(70px, 12vw, 130px)", pos: { left: "5%", top: "16%" }, rotate: -12 },
  { src: "/portfolio/Screenshot_2026-08-17_16-28-40.webp", ratio: 1, width: "clamp(80px, 11vw, 140px)", pos: { right: "4%", top: "16%" }, rotate: 8, photo: true, wideOnly: true },
];

const drag = {
  drag: true,
  dragElastic: 0.2,
  dragTransition: { bounceStiffness: 300, bounceDamping: 20 },
} as const;

/** `imgs` holds the optimized image for each STICKERS entry, in order. */
export default function HeroStickers({ imgs }: { imgs: Img[] }) {
  // Stickers stay inside the hero, which is static markup around this island.
  const anchor = useRef<HTMLSpanElement>(null);
  const heroRef = useRef<HTMLElement | null>(null);
  useLayoutEffect(() => {
    heroRef.current = anchor.current?.closest(".c-hero") ?? null;
  }, []);

  return (
    <>
      <span ref={anchor} hidden />
      {STICKERS.map((s, i) => (
        <motion.div
          key={s.src}
          aria-hidden="true"
          className={`c-sticker${s.photo ? " photo" : ""}${s.wideOnly ? " wide-only" : ""}`}
          style={{ ...s.pos, width: s.width, aspectRatio: s.ratio, rotate: s.rotate }}
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
