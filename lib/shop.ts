// Shared shop configuration used by both the client UI and the checkout API.
// Keep this free of secrets — it is safe to import into client components.

export const PRODUCT = {
  id: "backpiece-print",
  name: "Backpiece Print 50×70cm",
  amount: 7440, // €74.40 in cents — €60 + 24% VAT
  currency: "eur",
  image: "/portfolio/Backpiece-print.webp",
} as const;

// Total units that will ever be sold. Never exposed to the browser.
export const TOTAL_STOCK = 5;

// Max units a single customer can buy in one order.
export const MAX_PER_ORDER = 2;

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
