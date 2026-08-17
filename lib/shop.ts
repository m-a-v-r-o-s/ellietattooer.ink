// Shared shop configuration used by both the client UI and the checkout API.
// Keep this free of secrets — it is safe to import into client components.
//
// Prices are VAT-inclusive (24% Greek VAT). `amount` is the authoritative
// tax-included price in cents — checkout always prices from here, never from
// anything the client sends. `basePrice` (excl. VAT, in cents) is derived so
// the storefront and cart can show base price and VAT as separate lines.

export type ShopProduct = {
  id: string;
  name: string;
  amount: number; // cents, VAT included — authoritative for Stripe
  currency: "eur";
  image: string;
  sizes?: string[];
  maxPerOrder: number;
  // Present only for stock-limited products; absent = unlimited.
  totalStock?: number;
};

const VAT_RATE = 0.24;

export const PRODUCTS: ShopProduct[] = [
  {
    id: "backpiece-print",
    name: "Backpiece Print 50×70cm",
    amount: 7000, // €70.00, VAT included
    currency: "eur",
    image: "/portfolio/Backpiece-print.webp",
    maxPerOrder: 1,
    totalStock: 3,
  },
  {
    id: "oversized-tee",
    name: "Boxy Oversized T-Shirt",
    amount: 3500, // €35.00, VAT included
    currency: "eur",
    image: "/portfolio/Oversized-tee2.webp",
    sizes: ["S", "M", "L", "XL"],
    maxPerOrder: 10,
  },
];

export function getProduct(id: string): ShopProduct | undefined {
  return PRODUCTS.find((p) => p.id === id);
}

/** Tax-exclusive price in cents, rounded to the nearest cent. */
export function basePriceCents(amount: number): number {
  return Math.round(amount / (1 + VAT_RATE));
}

// The only stock-limited product today. Availability checks are scoped to
// this id — a generic multi-product stock endpoint isn't needed while
// everything else sells unlimited.
export const SCARCE_PRODUCT_ID = "backpiece-print";

export type ShippingZone = {
  id: string;
  label: string;
  amount: number; // cents, VAT included
  delivery: string; // human-readable estimate
  estimate: { min: number; max: number }; // business days
};

// Greece-only shipping zones (prices include 24% VAT).
export const SHIPPING_ZONES: ShippingZone[] = [
  { id: "athens", label: "Within Athens", amount: 232, delivery: "Next business day", estimate: { min: 1, max: 1 } },
  { id: "mainland", label: "City-to-City mainland", amount: 567, delivery: "Next business day", estimate: { min: 1, max: 1 } },
  { id: "islands", label: "Island destinations", amount: 1116, delivery: "1–3 business days", estimate: { min: 1, max: 3 } },
  { id: "inaccessible", label: "Inaccessible destinations", amount: 1182, delivery: "1–5 business days", estimate: { min: 1, max: 5 } },
  { id: "crete", label: "Within Crete", amount: 1395, delivery: "1–5 business days", estimate: { min: 1, max: 5 } },
];

// Shown when a customer selects a destination outside Greece.
export const INTERNATIONAL_DM_URL = "https://www.instagram.com/ellie_tattooer/";
