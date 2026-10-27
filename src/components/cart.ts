import { useSyncExternalStore } from "react";
import { SCARCE_PRODUCT_ID, basePriceCents, getProduct } from "@/lib/shop";

// Shop state shared by the Header, Merch and CartDrawer islands. Each island
// hydrates on its own, so the cart can't live in one component's useState;
// this module is the one copy they all subscribe to.

// Price/basePrice are derived from lib/shop's cents amounts so the storefront
// can never drift from what checkout actually charges.
const BACKPIECE = getProduct("backpiece-print")!;
const TEE = getProduct("oversized-tee")!;

export const PRODUCTS = [
  {
    id: BACKPIECE.id,
    name: "BACKPIECE PRINT 50 × 70 cm",
    basePrice: basePriceCents(BACKPIECE.amount) / 100,
    price: BACKPIECE.amount / 100,
    sizes: ["50×70CM"],
    images: ["/portfolio/Backpiece-print.webp", "/portfolio/Backpiece-print2.webp"],
    makingOf: "https://www.instagram.com/p/DWwoJxrjTiL/",
    blurb: "Limited run, printed from Ellie's backpiece flash. VAT included.",
    // Its one "size" is its dimensions, already in the name.
    fixedSize: true,
  },
  {
    id: TEE.id,
    name: "OVERSIZED T-SHIRT",
    basePrice: basePriceCents(TEE.amount) / 100,
    price: TEE.amount / 100,
    sizes: TEE.sizes!,
    images: [
      "/portfolio/Oversized-tee2.webp",
      "/portfolio/Oversized-tee3.webp",
    ],
    blurb: "Boxy fit, heavy cotton. VAT included.",
  },
];

// Products with a real size choice show it in the cart; the print's one
// "size" is really just its fixed dimensions, already in its name.
export const MULTI_SIZE_IDS = new Set(PRODUCTS.filter((p) => p.sizes.length > 1).map((p) => p.id));

export type Product = {
  id: string;
  name: string;
  price: number;
  basePrice?: number;
  sizes: string[];
  images?: string[];
  makingOf?: string;
};

export type CartItem = Product & {
  size: string;
  qty: number;
};

/** Build-time optimized image (src + srcset), keyed by its public path. */
export type Img = { src: string; srcSet: string };

// Next/image `fill` rendering, kept so the markup lays out exactly as before.
export const FILL: React.CSSProperties = {
  position: "absolute", height: "100%", width: "100%", inset: 0, objectFit: "cover", color: "transparent",
};

type State = {
  cart: CartItem[];
  cartOpen: boolean;
  cartShake: boolean;
  // Scoped to the one stock-limited product (the print) — everything else
  // sells unlimited, so it doesn't need an availability round trip.
  soldOut: boolean;
  scarceMaxPerOrder: number;
  // Set once /api/checkout returns a Stripe Elements client secret — swaps
  // the "Continue to Payment" button for the in-drawer payment step. Cleared
  // whenever the cart changes or the drawer closes, since a Checkout Session
  // is created from a fixed snapshot of the cart and doesn't track edits.
  clientSecret: string | null;
};

let state: State = {
  cart: [],
  cartOpen: false,
  cartShake: false,
  soldOut: false,
  scarceMaxPerOrder: BACKPIECE.maxPerOrder,
  clientSecret: null,
};
const listeners = new Set<() => void>();

export function set(patch: Partial<State> | ((s: State) => Partial<State>)) {
  state = { ...state, ...(typeof patch === "function" ? patch(state) : patch) };
  listeners.forEach((l) => l());
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
export const useShop = () => useSyncExternalStore(subscribe, () => state, () => state);

export const totalItems = (cart: CartItem[]) => cart.reduce((s, i) => s + i.qty, 0);

export async function refreshAvailability() {
  try {
    const res = await fetch("/api/availability", { cache: "no-store" });
    if (!res.ok) return;
    const data = await res.json();
    set({
      soldOut: !data.available,
      scarceMaxPerOrder: Math.max(0, Number(data.maxPerOrder ?? BACKPIECE.maxPerOrder)),
    });
  } catch {
    // keep optimistic defaults if the check fails
  }
}

// Per-product cart cap: the print is stock-limited (server-verified via
// /api/availability above); everything else uses its own fixed cap.
export const capFor = (id: string) =>
  id === SCARCE_PRODUCT_ID
    ? Math.max(1, state.scarceMaxPerOrder)
    : (getProduct(id)?.maxPerOrder ?? 99);

/** False when nothing was added (no size, or the print sold out). */
export function addToCart(product: Product, size: string) {
  if (!size) return false;
  if (product.id === SCARCE_PRODUCT_ID && state.soldOut) return false;
  const cap = capFor(product.id);
  set(({ cart }) => {
    // cart changed: any in-progress payment step is stale
    const existing = cart.find((i) => i.id === product.id && i.size === size);
    if (existing) {
      if (existing.qty >= cap) return { clientSecret: null }; // at the per-order limit
      return {
        clientSecret: null,
        cart: cart.map((i) =>
          i.id === product.id && i.size === size ? { ...i, qty: i.qty + 1 } : i,
        ),
      };
    }
    return { clientSecret: null, cart: [...cart, { ...product, size, qty: 1 }] };
  });
  return true;
}

export function removeFromCart(id: string, size: string) {
  // cart changed: any in-progress payment step is stale
  set(({ cart }) => ({ clientSecret: null, cart: cart.filter((i) => !(i.id === id && i.size === size)) }));
}

export function updateQty(id: string, size: string, delta: number) {
  // cart changed: any in-progress payment step is stale
  set(({ cart }) => ({
    clientSecret: null,
    cart: cart.flatMap((i) => {
      if (i.id !== id || i.size !== size) return [i];
      const next = i.qty + delta;
      if (next <= 0) return [];
      if (next > capFor(id)) return [i];
      return [{ ...i, qty: next }];
    }),
  }));
}

export const openCart = () => set({ cartOpen: true });
export const closeCart = () => set({ cartOpen: false, clientSecret: null });

export function handleCartClick() {
  if (totalItems(state.cart) === 0) {
    set({ cartShake: true });
    setTimeout(() => set({ cartShake: false }), 600);
  } else {
    openCart();
  }
}

// Runs once, in the browser, whichever island loads this module first.
if (typeof window !== "undefined") refreshAvailability();
