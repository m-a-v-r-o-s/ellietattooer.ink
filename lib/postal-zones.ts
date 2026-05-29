import { SHIPPING_ZONES, type ShippingZone } from "./shop";

// Remote islands classified as "inaccessible" by Greek couriers.
// Checked before the general island range.
const INACCESSIBLE = new Set([
  "85111", // Kastelorizo (Megisti)
  "74002", // Gavdos
  "82101", // Oinousses
  "82104", // Psara
  "83400", // Fourni
  "85002", // Agathonisi
  "85003", // Arki
]);

function zone(id: string): ShippingZone | null {
  return SHIPPING_ZONES.find((z) => z.id === id) ?? null;
}

/**
 * Maps a Greek 5-digit postal code to a shipping zone.
 * Returns:
 *   ShippingZone  — recognised Greek address
 *   "international" — code is outside the Greek range (10000–85999)
 *   null           — 5 digits but unrecognised within the Greek range
 */
export function zoneFromPostalCode(raw: string): ShippingZone | "international" | null {
  const code = raw.replace(/\s/g, "");
  if (!/^\d{5}$/.test(code)) return null;

  const n = parseInt(code, 10);

  // Outside Greek postal code range entirely
  if (n < 10000 || n > 85999) return "international";

  // Inaccessible islands (check before general island ranges)
  if (INACCESSIBLE.has(code)) return zone("inaccessible");

  // Within Athens (Greater Athens / Piraeus: 10xxx–18xxx)
  if (n >= 10000 && n <= 18999) return zone("athens");

  // Crete (70xxx–74xxx)
  if (n >= 70000 && n <= 74999) return zone("crete");

  // Islands
  if (
    (n >= 28000 && n <= 29999) || // Ionian (Kefalonia, Zakynthos, Lefkada)
    (n >= 49000 && n <= 49999) || // Corfu
    (n >= 80000 && n <= 85999)    // Aegean islands (Cyclades, Dodecanese, North Aegean)
  ) return zone("islands");

  // City-to-City mainland (everything else in the valid Greek range)
  if (
    (n >= 19000 && n <= 27999) || // East Attica + Central Greece
    (n >= 30000 && n <= 48999) || // Western Greece, Thessaly, Epirus
    (n >= 50000 && n <= 69999) || // Macedonia, Thrace
    (n >= 75000 && n <= 79999)    // remaining mainland south
  ) return zone("mainland");

  return null; // valid-range but unclassified
}
