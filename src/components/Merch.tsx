import { useState } from "react";
import { SCARCE_PRODUCT_ID } from "@/lib/shop";
import { FILL, PRODUCTS, addToCart, openCart, useShop, type Img, type Product } from "./cart";

/** Merch cards: size choice, add to cart, sold-out state. `imgs` maps each product image path to its optimized version. */
export default function Merch({ imgs }: { imgs: Record<string, Img> }) {
  const { cart, soldOut } = useShop();
  const [selectedSizes, setSelectedSizes] = useState<Record<string, string>>({});
  const [addedFeedback, setAddedFeedback] = useState<string | null>(null);

  const add = (product: Product, size: string) => {
    if (!addToCart(product, size)) return;
    setAddedFeedback(product.id);
    setTimeout(() => setAddedFeedback(null), 1200);
  };

  return (
    <div className="c-merch">
      {PRODUCTS.map((product) => {
        const isScarce = product.id === SCARCE_PRODUCT_ID;
        const soldOutDisabled = isScarce && soldOut;
        const resolvedSize =
          product.sizes.length > 1 ? selectedSizes[product.id] : product.sizes[0];
        const sizeMissing = !resolvedSize;
        const disabled = soldOutDisabled || sizeMissing;
        const inCart = !!resolvedSize && cart.some(
          (i) => i.id === product.id && i.size === resolvedSize,
        );
        const justAdded = addedFeedback === product.id;
        const viewCart = inCart && !justAdded;
        return (
          <article key={product.id} className="c-card">
            <div className="ph">
              <span className="c-price">€{product.price}</span>
              <img {...imgs[product.images[0]]} alt={product.name} sizes="(max-width: 720px) 90vw, 560px" loading="lazy" decoding="async" style={FILL} />
              {product.images[1] && (
                <img {...imgs[product.images[1]]} alt="" sizes="(max-width: 720px) 90vw, 560px" loading="lazy" decoding="async" className="alt" style={FILL} />
              )}
              {soldOutDisabled && <div className="c-soldout"><span>Sold out</span></div>}
            </div>
            <div className="bd">
              <h3 className="c-display">{product.name}</h3>
              <p className="meta">{product.blurb}</p>
              {product.sizes.length > 1 ? (
                <div className="c-sizes" role="group" aria-label="Size">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      type="button"
                      aria-pressed={resolvedSize === size}
                      onClick={() => setSelectedSizes((prev) => ({ ...prev, [product.id]: size }))}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              ) : (
                !product.fixedSize && <p className="meta">Size: {product.sizes[0]}</p>
              )}
              <div className="c-act">
                <button
                  type="button"
                  className={`c-big${viewCart ? "" : " mint"}${justAdded ? " added-pulse" : ""}`}
                  disabled={disabled}
                  onClick={() =>
                    viewCart || justAdded ? openCart() : add(product, resolvedSize!)
                  }
                >
                  {soldOutDisabled
                    ? "Sold out"
                    : sizeMissing
                      ? "Select a size"
                      : justAdded
                        ? "✓ Added to cart"
                        : viewCart
                          ? "View cart"
                          : "Add to cart"}
                </button>
                {product.makingOf && (
                  <a href={product.makingOf} target="_blank" rel="noreferrer">▶ Watch the making-of</a>
                )}
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
