import { useEffect, useState } from "react";
import Lightbox from "./Lightbox";
import { FILL } from "./cart";

/** One gallery photo: public file name, alt text, optimized thumbnail. */
export type WallImage = { file: string; alt: string; src: string; srcSet: string };

// Every alt starts with its palette ("Black and grey ...", "Black traditional
// ..." or a colour description), so the filter reads it from there.
const isBlackWork = (alt: string) => alt.startsWith("Black");
// Fills whole rows at 3, 4 and 6 columns.
const WALL_PREVIEW = 24;

/** Flash wall (gallery): colour / black & grey filter, "Show N more", lightbox. */
export default function FlashWall({ images }: { images: WallImage[] }) {
  const [showAllPortfolio, setShowAllPortfolio] = useState(false);
  const [galleryFilter, setGalleryFilter] = useState<"all" | "colour" | "black">("all");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxIndex(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const filters = [
    { id: "all", label: "All", count: images.length },
    { id: "colour", label: "Colour", count: images.filter((i) => !isBlackWork(i.alt)).length },
    { id: "black", label: "Black & grey", count: images.filter((i) => isBlackWork(i.alt)).length },
  ] as const;

  const filteredPortfolio =
    galleryFilter === "all"
      ? images
      : images.filter((i) => isBlackWork(i.alt) === (galleryFilter === "black"));
  const displayedPortfolioImages = showAllPortfolio
    ? filteredPortfolio
    : filteredPortfolio.slice(0, WALL_PREVIEW);

  return (
    <>
      <div className="c-in">
        <div className="c-head">
          <div>
            <h2 className="c-display">Flash wall</h2>
            <p>A selection of my latest tattoos.</p>
          </div>
          <div className="c-tabs" role="group" aria-label="Filter the gallery">
            {filters.map((f) => (
              <button
                key={f.id}
                type="button"
                aria-pressed={galleryFilter === f.id}
                onClick={() => { setGalleryFilter(f.id); setShowAllPortfolio(false); }}
              >
                {f.label} · {f.count}
              </button>
            ))}
          </div>
        </div>
        <div className="c-wall">
          {displayedPortfolioImages.map((item, idx) => (
            <button
              key={item.file}
              type="button"
              className="c-tile"
              style={{ animationDelay: `${Math.min(idx, 24) * 30}ms` }}
              onClick={() => setLightboxIndex(idx)}
              aria-label={`Open photo: ${item.alt}`}
            >
              <img
                src={item.src}
                srcSet={item.srcSet}
                alt={item.alt}
                sizes="(max-width: 640px) 33vw, (max-width: 1000px) 25vw, 200px"
                loading="lazy"
                decoding="async"
                style={FILL}
              />
            </button>
          ))}
        </div>
        {filteredPortfolio.length > WALL_PREVIEW && (
          <div className="c-more">
            <button type="button" className="c-big" onClick={() => setShowAllPortfolio((s) => !s)}>
              {showAllPortfolio ? "Show less" : `Show ${filteredPortfolio.length - WALL_PREVIEW} more`}
            </button>
          </div>
        )}
      </div>
      {lightboxIndex !== null && (
        <Lightbox
          images={filteredPortfolio}
          index={lightboxIndex}
          onIndex={setLightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </>
  );
}
