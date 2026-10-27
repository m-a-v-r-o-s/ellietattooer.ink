"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useMotionValue } from "motion/react";
import Lightbox from "./Lightbox";
import { project, rubberband } from "@/lib/spring";
import { settle, useDrag } from "@/lib/gestures";
import {
  SHIPPING_ZONES,
  INTERNATIONAL_DM_URL,
  SCARCE_PRODUCT_ID,
  basePriceCents,
  getProduct,
} from "@/lib/shop";
import { zoneFromPostalCode } from "@/lib/postal-zones";
import CheckoutPanel from "./CheckoutPanel";

const STUDIO_LOGO =
  "https://ritualtattoo.gr/wp-content/uploads/2018/05/ritual_logo_banner_dark_150.png";
const ELLIE_PHOTO = "/Screenshot_2026-05-22_19-59-38.webp";

// Price/basePrice are derived from lib/shop's cents amounts so the storefront
// can never drift from what checkout actually charges.
const BACKPIECE = getProduct("backpiece-print")!;
const TEE = getProduct("oversized-tee")!;

const PRODUCTS = [
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
const MULTI_SIZE_IDS = new Set(PRODUCTS.filter((p) => p.sizes.length > 1).map((p) => p.id));

type Product = {
  id: string;
  name: string;
  price: number;
  basePrice?: number;
  sizes: string[];
  images?: string[];
  makingOf?: string;
};

type CartItem = Product & {
  size: string;
  qty: number;
};

const PORTFOLIO_IMAGES: { file: string; alt: string }[] = [
  { file: "Screenshot_2026-10-27_07-28-30.webp", alt: "Black traditional octopus tattoo, on the arm" },
  { file: "Screenshot_2026-10-27_07-28-37.webp", alt: "Traditional colorful fish tattoo with bubbles, on the forearm" },
  { file: "Screenshot_2026-10-27_07-28-48.webp", alt: "Black traditional UFO abducting a running figure over a picket fence tattoo, on the forearm" },
  { file: "Screenshot_2026-10-27_07-28-54.webp", alt: "Traditional colorful black cat holding a heart balloon tattoo, on the arm" },
  { file: "Screenshot_2026-10-27_07-29-14.webp", alt: "Black and grey traditional Nosferatu vampire tattoo, on the upper arm" },
  { file: "Screenshot_2026-10-27_07-29-29.webp", alt: "Black traditional eye tattoo, on the hand" },
  { file: "Screenshot_2026-10-27_07-29-46.webp", alt: "Traditional colorful devil baby tattoo with hearts reading 'BORN TO LOVE', on the arm" },
  { file: "Screenshot_2026-10-27_07-30-08.webp", alt: "Traditional colorful olive branch tattoo next to an amphora, on the forearm" },
  { file: "Screenshot_2026-10-27_07-30-24.webp", alt: "Black traditional peacock tattoo with flowers" },
  { file: "Screenshot_2026-10-27_07-30-36.webp", alt: "Traditional colorful skull and crossbones tattoo reading 'death' with a bottle, dice and a boot, on the neck" },
  { file: "Screenshot_2026-10-27_07-30-44.webp", alt: "Traditional colorful goat head tattoo, on the arm" },
  { file: "Screenshot_2026-10-27_07-31-03.webp", alt: "Black traditional snarling wolf head tattoo, on the arm" },
  { file: "Screenshot_2026-10-27_07-31-19.webp", alt: "Traditional colorful flaming sacred heart tattoo wrapped in thorns, on the forearm" },
  { file: "Screenshot_2026-10-27_07-31-26.webp", alt: "Traditional colorful laughing and crying dice tattoo" },
  { file: "Screenshot_2026-10-27_07-31-33.webp", alt: "Black traditional crossed nails tattoo" },
  { file: "Screenshot_2026-10-27_07-31-52.webp", alt: "Traditional colorful hooded skull with a purple cross and a yin-yang tattoo, on the forearm" },
  { file: "Screenshot_2026-10-27_07-32-13.webp", alt: "Traditional colorful pink panther head tattoo" },
  { file: "Screenshot_2026-08-17_16-24-32.webp", alt: "Traditional Betty Boop tattoo, on the calf" },
  { file: "Screenshot_2026-08-17_16-24-42.webp", alt: "Black and grey traditional swallow tattoo with flowers, on the forearm" },
  { file: "Screenshot_2026-08-17_16-24-49.webp", alt: "Black and grey traditional koi fish with wings tattoo, on the shin" },
  { file: "Screenshot_2026-08-17_16-25-10.webp", alt: "Traditional colorful eagle fighting a snake tattoo, on the shoulder" },
  { file: "Screenshot_2026-08-17_16-25-35.webp", alt: "Traditional colorful bloody scythe tattoo, on the wrist" },
  { file: "Screenshot_2026-08-17_16-25-38.webp", alt: "Black and grey traditional dagger tattoo, on the forearm" },
  { file: "Screenshot_2026-08-17_16-25-43.webp", alt: "Black and grey traditional grim reaper tattoo with a rose, healed on the calf" },
  { file: "Screenshot_2026-08-17_16-25-52.webp", alt: "Traditional red pin-up girl tattoo with blonde hair, on the upper arm" },
  { file: "Screenshot_2026-08-17_16-26-00.webp", alt: "Black and grey traditional cobra snake tattoo with a rose and a skull, on the forearm" },
  { file: "Screenshot_2026-08-17_16-26-07.webp", alt: "Black traditional bomb tattoo with smoke, part of a forearm sleeve" },
  { file: "Screenshot_2026-08-17_16-26-18.webp", alt: "Traditional colorful strawberries tattoo with vine and flowers, on the leg" },
  { file: "Screenshot_2026-08-17_16-26-32.webp", alt: "Traditional colorful portrait tattoo of a woman wearing a checkered headscarf, on the forearm" },
  { file: "Screenshot_2026-08-17_16-26-45.webp", alt: "Traditional colorful mermaid tattoo with a spear, on the upper arm" },
  { file: "Screenshot_2026-08-17_16-26-51.webp", alt: "Black traditional flower tattoo, part of a forearm sleeve" },
  { file: "Screenshot_2026-08-17_16-27-02.webp", alt: "Traditional colorful she-devil portrait tattoo with horns and stars, on the arm" },
  { file: "Screenshot_2026-08-17_16-27-12.webp", alt: "Traditional colorful winged wheel tattoo, on the leg" },
  { file: "Screenshot_2026-08-17_16-27-18.webp", alt: "Black traditional olive branch tattoo, on the shoulder" },
  { file: "Screenshot_2026-08-17_16-27-38.webp", alt: "Traditional colorful olive branch tattoo, on the forearm" },
  { file: "Screenshot_2026-08-17_16-27-48.webp", alt: "Traditional colorful pin-up woman with peacock feathers tattoo, on the forearm" },
  { file: "Screenshot_2026-08-17_16-27-59.webp", alt: "Traditional colorful sad clown tattoo with a top hat, on the arm" },
  { file: "Screenshot_2026-08-17_16-28-04.webp", alt: "Black traditional scorpion tattoo, on the forearm" },
  { file: "Screenshot_2026-08-17_16-28-16.webp", alt: "Traditional colorful gravestone tattoo reading 'RIP MY PAST', on the arm" },
  { file: "Screenshot_2026-08-17_16-28-28.webp", alt: "Black traditional death's-head moth tattoo with eyes on its wings, on the chest" },
  { file: "Screenshot_2026-08-17_16-28-40.webp", alt: "Traditional colorful red devil baby tattoo with a pitchfork, on the leg" },
  { file: "Screenshot_2026-08-17_16-29-17.webp", alt: "Traditional colorful tiger head tattoo, on the chest" },
  { file: "Screenshot_2026-05-29_03-06-19.webp", alt: "Traditional tattoo of a cluster of eyeballs framed by a green spiked sunburst, on the forearm" },
  { file: "Screenshot_2026-05-29_03-06-39.webp", alt: "Traditional tattoo of Taz the Tasmanian Devil spinning in a tornado, on the forearm" },
  { file: "Screenshot_2026-05-29_03-07-17.webp", alt: "Traditional red rose tattoo with green leaves, on the ankle" },
  { file: "Screenshot_2026-05-29_03-07-47.webp", alt: "Traditional flaming rum bottle tattoo, on the forearm" },
  { file: "Screenshot_2026-05-29_03-08-49.webp", alt: "Black and grey traditional hannya mask tattoo, on the forearm" },
  { file: "Screenshot_2026-05-23_01-26-22.webp", alt: "Black traditional cat skull tattoo with hanging chain and heart charm, on the forearm" },
  { file: "Screenshot_2026-05-23_01-26-32.webp", alt: "Black traditional prowling panther tattoo, on the forearm" },
  { file: "Screenshot_2026-05-23_01-26-52.webp", alt: "Black traditional floral tattoo with a snake and dagger, on the forearm" },
  { file: "Screenshot_2026-05-23_01-27-01.webp", alt: "Black and grey traditional moth tattoo, on the forearm" },
  { file: "Screenshot_2026-05-23_01-27-15.webp", alt: "Traditional fish tattoo with a heart-shaped tail, in red and teal" },
  { file: "Screenshot_2026-05-23_01-27-37.webp", alt: "Traditional dagger and gem tattoo, part of a forearm sleeve" },
  { file: "Screenshot_2026-05-23_01-27-45.webp", alt: "Black traditional portrait tattoo of a woman in a headscarf holding a bowl, on the forearm" },
  { file: "Screenshot_2026-05-23_01-28-21.webp", alt: "Traditional black and green olive branch tattoo on the chest" },
  { file: "Screenshot_2026-05-23_01-28-37.webp", alt: "Black traditional rabbit tattoo, on the forearm" },
  { file: "Screenshot_2026-05-23_01-28-47.webp", alt: "Traditional colorful jester tattoo, on the forearm" },
  { file: "Screenshot_2026-05-23_01-28-57.webp", alt: "Traditional colorful pin-up mermaid with a shark, on the ribs" },
  { file: "Screenshot_2026-05-23_01-29-05.webp", alt: "Traditional dagger through a red heart tattoo, on the forearm" },
  { file: "Screenshot_2026-05-23_01-29-12.webp", alt: "Traditional colorful cartoon duck tattoo, on the forearm" },
  { file: "Screenshot_2026-05-23_01-29-26.webp", alt: "Black and grey traditional pin-up woman smoking a cigarette, on the forearm" },
  { file: "Screenshot_2026-05-23_01-29-44.webp", alt: "Traditional colorful retro car with palm trees tattoo, on the forearm" },
  { file: "Screenshot_2026-05-23_01-30-00.webp", alt: "Black traditional tombstone tattoo with the letter E, on the shoulder" },
  { file: "Screenshot_2026-05-23_01-30-15.webp", alt: "Black traditional tattoo of a woman with a cat and spider, on the forearm" },
  { file: "Screenshot_2026-05-23_01-30-21.webp", alt: "Traditional colorful jester skeleton tattoo, on the chest" },
  { file: "Screenshot_2026-05-23_01-30-33.webp", alt: "Traditional colorful bunny-eared pin-up girl tattoo, on the arm" },
  { file: "Screenshot_2026-05-23_01-30-41.webp", alt: "Traditional colorful dragon-like creature tattoo, on the arm" },
  { file: "Screenshot_2026-05-23_01-30-48.webp", alt: "Traditional red and black bat-wing dagger tattoo, on the forearm" },
  { file: "Screenshot_2026-05-23_01-30-53.webp", alt: "Black and grey traditional portrait of a woman with a rose, on the forearm" },
  { file: "Screenshot_2026-05-23_01-31-07.webp", alt: "Traditional colorful mermaid tattoo, on the forearm" },
  { file: "Screenshot_2026-05-23_01-31-23.webp", alt: "Black traditional mermaid tattoo, on the upper arm" },
  { file: "Screenshot_2026-05-23_01-31-29.webp", alt: "Traditional colorful pin-up portrait with a skull, on the upper arm" },
  { file: "Screenshot_2026-05-23_01-31-38.webp", alt: "Traditional colorful parrot tattoo, on the shoulder" },
  { file: "Screenshot_2026-05-23_01-31-43.webp", alt: "Traditional colorful bear-paw character tattoo, on the arm" },
  { file: "Screenshot_2026-05-23_01-31-52.webp", alt: "Traditional colorful black panther head tattoo, on the shoulder" },
  { file: "Screenshot_2026-05-23_01-32-04.webp", alt: "Traditional colorful eye with wings tattoo, on the arm" },
  { file: "Screenshot_2026-05-23_01-32-10.webp", alt: "Traditional colorful pin-up woman tattoo, on the thigh" },
  { file: "Screenshot_2026-05-23_01-32-14.webp", alt: "Traditional colorful harlequin frog tattoo, on the arm" },
  { file: "Screenshot_2026-05-23_01-32-24.webp", alt: "Traditional colorful geisha portrait with a dragon and koi, on the forearm" },
  { file: "Screenshot_2026-05-23_01-32-39.webp", alt: "Traditional red and black bat-wing heart tattoo, on the knee" },
  { file: "Screenshot_2026-05-23_01-32-46.webp", alt: "Black and grey traditional skull and crossbones tattoo, on the arm" },
  { file: "Screenshot_2026-05-23_01-33-01.webp", alt: "Black traditional weeping woman with sun rays tattoo, on the forearm" },
  { file: "Screenshot_2026-05-23_01-33-13.webp", alt: "Black traditional kewpie doll tattoo, on the forearm" },
  { file: "Screenshot_2026-05-23_01-33-33.webp", alt: "Black traditional grim reaper tattoo, on the arm" },
  { file: "Screenshot_2026-05-23_01-33-37.webp", alt: "Black and grey traditional frog on a string tattoo, on the chest" },
  { file: "Screenshot_2026-05-23_01-33-42.webp", alt: "Traditional colorful bulldog head tattoo, on the arm" },
  { file: "Screenshot_2026-05-23_01-33-51.webp", alt: "Black traditional olive branch tattoo, on the forearm" },
  { file: "Screenshot_2026-05-23_01-34-01.webp", alt: "Traditional colorful bat with red wings tattoo, on the wrist" },
  { file: "Screenshot_2026-05-23_01-34-09.webp", alt: "Traditional colorful crowned portrait tattoo, on the arm" },
  { file: "Screenshot_2026-05-23_01-34-18.webp", alt: "Traditional colorful mermaid combing her hair tattoo, on the forearm" },
  { file: "Screenshot_2026-05-23_01-34-24.webp", alt: "Black traditional tattoo of two faces with barbed wire and a locket, on the arm" },
  { file: "Screenshot_2026-05-23_01-34-31.webp", alt: "Black traditional skull with a panther and blood drops tattoo, on the arm" },
  { file: "Screenshot_2026-05-23_01-34-42.webp", alt: "Traditional colorful pin-up girl tattoo with the word HATE, on the arm" },
  { file: "Screenshot_2026-05-23_01-34-52.webp", alt: "Traditional colorful couple riding a scooter through flames tattoo, on the arm" },
  { file: "Screenshot_2026-05-23_01-35-01.webp", alt: "Traditional colorful nude pin-up woman tattoo, on the shoulder" },
  { file: "Screenshot_2026-05-23_01-35-17.webp", alt: "Traditional colorful spider with flowers tattoo, on the lower back" },
  { file: "Screenshot_2026-05-23_01-35-31.webp", alt: "Traditional colorful sailing ship on rough waves tattoo, on the arm" },
  { file: "Screenshot_2026-05-23_01-35-42.webp", alt: "Black traditional dagger through a rose with blood drops tattoo, on the forearm" },
  { file: "Screenshot_2026-05-23_01-35-54.webp", alt: "Black traditional skull and crossbones tattoo with a memento mori banner, on the arm" },
  { file: "Screenshot_2026-05-23_01-36-02.webp", alt: "Black traditional death's-head moth tattoo, on the arm" },
  { file: "Screenshot_2026-05-23_01-36-09.webp", alt: "Traditional colorful slot machine tattoo, on the arm" },
  { file: "Screenshot_2026-05-23_01-36-23.webp", alt: "Traditional colorful mermaid with flames tattoo, on the arm" },
  { file: "Screenshot_2026-05-23_01-36-29.webp", alt: "Traditional colorful tombstone tattoo reading Rip My Past with dice, on the arm" },
  { file: "Screenshot_2026-05-23_01-36-36.webp", alt: "Traditional colorful butterfly tattoo with hearts and a web pattern, on the shoulder" },
  { file: "Screenshot_2026-05-23_01-36-45.webp", alt: "Traditional colorful cats with roses tattoo, on the forearm" },
  { file: "Screenshot_2026-05-23_01-36-50.webp", alt: "Traditional colorful anchor and heart with dagger tattoo, on the chest" },
  { file: "Screenshot_2026-05-23_01-37-01.webp", alt: "Traditional colorful nude mermaid tattoo, on the upper arm" },
  { file: "Screenshot_2026-05-23_01-37-14.webp", alt: "Black traditional scorpion and dagger tattoo, on the forearm" },
  { file: "Screenshot_2026-05-23_01-37-19.webp", alt: "Traditional colorful umbrella with lightning bolts tattoo, on the arm" },
  { file: "Screenshot_2026-05-23_01-37-26.webp", alt: "Traditional colorful fly tattoo, on the arm" },
  { file: "Screenshot_2026-05-23_01-37-39.webp", alt: "Traditional colorful skull and crossbones with a heart tattoo, on the arm" },
  { file: "Screenshot_2026-05-23_01-37-51.webp", alt: "Black traditional scorpion tattoo running down the shin" },
  { file: "Screenshot_2026-05-23_01-38-04.webp", alt: "Traditional colorful devil head tattoo, on the arm" },
  { file: "Screenshot_2026-05-23_01-38-12.webp", alt: "Black traditional nesting doll tattoo, on the forearm" },
  { file: "Screenshot_2026-05-23_01-38-20.webp", alt: "Traditional colorful crying woman's face tattoo, on the forearm" },
  { file: "Screenshot_2026-05-23_01-38-23.webp", alt: "Black traditional daisy flowers tattoo, on the forearm" },
  { file: "Screenshot_2026-05-23_01-38-30.webp", alt: "Traditional colorful nude mermaid tattoo, on the forearm" },
  { file: "Screenshot_2026-05-23_01-38-41.webp", alt: "Black traditional eagle and snake tattoo, on the shoulder" },
  { file: "Screenshot_2026-05-23_01-38-54.webp", alt: "Black and grey traditional tiki totem mask tattoo with flowers, on the forearm" },
  { file: "Screenshot_2026-05-23_01-39-00.webp", alt: "Traditional colorful pin-up woman with a snake tattoo, on the forearm" },
  { file: "Screenshot_2026-05-23_01-39-07.webp", alt: "Traditional colorful skull with a snake tattoo, on the shoulder" },
  { file: "Screenshot_2026-05-23_01-39-11.webp", alt: "Black traditional gramophone tattoo, on the forearm" },
  { file: "Screenshot_2026-05-23_01-39-16.webp", alt: "Traditional colorful dagger through a rose tattoo, on the forearm" },
  { file: "Screenshot_2026-05-23_01-39-33.webp", alt: "Traditional colorful butterfly tattoo, on the forearm" },
  { file: "Screenshot_2026-05-23_01-39-39.webp", alt: "Traditional colorful eye with a spiderweb and spider tattoo, on the arm" },
  { file: "Screenshot_2026-05-23_01-39-48.webp", alt: "Traditional colorful panther head with hearts tattoo, on the arm" },
  { file: "Screenshot_2026-05-23_01-39-52.webp", alt: "Black traditional bison head tattoo, on the shoulder" },
  { file: "Screenshot_2026-05-23_01-39-57.webp", alt: "Traditional colorful sacred heart with dagger and flames tattoo, on the forearm" },
  { file: "Screenshot_2026-05-23_01-40-04.webp", alt: "Traditional colorful cat in a kimono holding an umbrella tattoo, on the chest" },
  { file: "Screenshot_2026-05-23_01-40-11.webp", alt: "Traditional colorful devil woman holding a mask tattoo, on the forearm" },
  { file: "Screenshot_2026-05-23_01-40-14.webp", alt: "Traditional colorful skeleton relaxing on a beach with a cocktail tattoo, on the arm" },
  { file: "Screenshot_2026-05-23_01-40-19.webp", alt: "Traditional colorful straight razor with roses and a web tattoo, on the forearm" },
  { file: "Screenshot_2026-05-23_01-40-24.webp", alt: "Black and grey traditional hannya mask tattoo, on the shoulder" },
  { file: "Screenshot_2026-05-23_01-40-29.webp", alt: "Traditional colorful tulips with a lipstick tattoo, on the forearm" },
  { file: "Screenshot_2026-05-23_01-40-33.webp", alt: "Traditional colorful portrait of a woman in a chainmail hood tattoo, on the shoulder" },
  { file: "Screenshot_2026-05-23_01-40-41.webp", alt: "Traditional colorful nude pin-up woman riding a motorcycle tattoo, on the shin" },
];

// Every alt starts with its palette ("Black and grey ...", "Black traditional
// ..." or a colour description), so the filter reads it from there.
const isBlackWork = (alt: string) => alt.startsWith("Black");
const GALLERY_FILTERS = [
  { id: "all", label: "All", count: PORTFOLIO_IMAGES.length },
  { id: "colour", label: "Colour", count: PORTFOLIO_IMAGES.filter((i) => !isBlackWork(i.alt)).length },
  { id: "black", label: "Black & grey", count: PORTFOLIO_IMAGES.filter((i) => isBlackWork(i.alt)).length },
] as const;
type GalleryFilter = (typeof GALLERY_FILTERS)[number]["id"];
// Fills whole rows at 3, 4 and 6 columns.
const WALL_PREVIEW = 24;

const NAV = [
  { id: "portfolio", label: "Flash wall" },
  { id: "about", label: "Get tattooed" },
  { id: "shop", label: "Merch" },
  { id: "findme", label: "Find the studio" },
];

// Draggable hero stickers. To add one of Ellie's stickers: drop the file in
// public/stickers/ and add an entry (ratio = width / height of the art,
// position as % of the hero). wideOnly hides it on phones.
const STICKERS: {
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

// Cookie-consent persistence. Bump the version suffix to re-prompt everyone.
const COOKIE_CONSENT_KEY = "ellie_cookie_consent_v1";

// Publish the analytics choice so any analytics that loads later can honour it.
// No-ops cleanly when nothing (e.g. Google Consent Mode) is present.
function applyConsent(analytics: boolean) {
  if (typeof window === "undefined") return;
  (window as unknown as { __analyticsConsent?: boolean }).__analyticsConsent =
    analytics;
  const w = window as unknown as { gtag?: (...args: unknown[]) => void };
  if (typeof w.gtag === "function") {
    w.gtag("consent", "update", {
      analytics_storage: analytics ? "granted" : "denied",
    });
  }
}

export default function EllieTattooer() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [cartShake, setCartShake] = useState(false);
  const [addedFeedback, setAddedFeedback] = useState<string | null>(null);
  const [showAllPortfolio, setShowAllPortfolio] = useState(false);
  const [galleryFilter, setGalleryFilter] = useState<GalleryFilter>("all");
  const heroRef = useRef<HTMLElement>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  // Scoped to the one stock-limited product (the print) — everything else
  // sells unlimited, so it doesn't need an availability round trip.
  const [soldOut, setSoldOut] = useState(false);
  const [scarceMaxPerOrder, setScarceMaxPerOrder] = useState(BACKPIECE.maxPerOrder);
  const [selectedSizes, setSelectedSizes] = useState<Record<string, string>>({});
  const [postalCode, setPostalCode] = useState("");
  const [shipZone, setShipZone] = useState("");
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [checkingOut, setCheckingOut] = useState(false);
  // Set once /api/checkout returns a Stripe Elements client secret — swaps
  // the "Continue to Payment" button for the in-drawer payment step. Cleared
  // whenever the cart changes or the drawer closes, since a Checkout Session
  // is created from a fixed snapshot of the cart and doesn't track edits.
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [orderStatus, setOrderStatus] = useState<"success" | "cancel" | null>(
    null,
  );
  const [cookieBannerOpen, setCookieBannerOpen] = useState(false);
  const [cookieManage, setCookieManage] = useState(false);
  const [analyticsPref, setAnalyticsPref] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxIndex(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Show the cookie banner only when we have no stored decision yet.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(COOKIE_CONSENT_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as { analytics?: boolean };
        applyConsent(!!saved.analytics);
      } else {
        // localStorage only exists after hydration, so this read has to live in an effect.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setCookieBannerOpen(true);
      }
    } catch {
      setCookieBannerOpen(true);
    }
  }, []);

  const persistCookieConsent = useCallback((analytics: boolean) => {
    try {
      localStorage.setItem(
        COOKIE_CONSENT_KEY,
        JSON.stringify({ analytics, ts: Date.now() }),
      );
    } catch {
      // Storage unavailable — the choice still applies for this session.
    }
    applyConsent(analytics);
    setCookieManage(false);
    setCookieBannerOpen(false);
  }, []);

  const refreshAvailability = useCallback(async () => {
    try {
      const res = await fetch("/api/availability", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      setSoldOut(!data.available);
      setScarceMaxPerOrder(Math.max(0, Number(data.maxPerOrder ?? BACKPIECE.maxPerOrder)));
    } catch {
      // keep optimistic defaults if the check fails
    }
  }, []);

  // Per-product cart cap: the print is stock-limited (server-verified via
  // /api/availability above); everything else uses its own fixed cap.
  const capFor = useCallback(
    (id: string) =>
      id === SCARCE_PRODUCT_ID
        ? Math.max(1, scarceMaxPerOrder)
        : (getProduct(id)?.maxPerOrder ?? 99),
    [scarceMaxPerOrder],
  );

  useEffect(() => {
    // Sets state only after the fetch resolves, never synchronously.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refreshAvailability();
  }, [refreshAvailability]);

  // Handle the return trip from Stripe's in-page checkout. Stripe redirects
  // back with ?session_id=... (from the Checkout Session's return_url) once
  // the buyer confirms payment; look up what actually happened server-side
  // rather than trust the redirect alone.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get("session_id");
    if (sessionId) {
      fetch(`/api/checkout/status?session_id=${encodeURIComponent(sessionId)}`)
        .then((res) => res.json())
        .then((data) => {
          const status = data.status === "complete" ? "success" : "cancel";
          setOrderStatus(status);
          if (status === "success") {
            setCart([]);
            setClientSecret(null);
            refreshAvailability();
          }
        })
        .catch(() => setOrderStatus("cancel"));
      window.history.replaceState(
        null,
        "",
        window.location.pathname + window.location.hash,
      );
    }
  }, [refreshAvailability]);

  const totalItems = cart.reduce((s, i) => s + i.qty, 0);
  const cartHasScarceItem = cart.some((i) => i.id === SCARCE_PRODUCT_ID);

  // Create a Stripe Checkout session for the current cart + shipping zone,
  // then render Stripe's in-page payment step (Address + Payment Elements)
  // with the returned client secret.
  const handleCheckout = useCallback(async () => {
    if (checkingOut || (cartHasScarceItem && soldOut) || cart.length === 0 || !shipZone) return;
    setCheckoutError(null);
    setCheckingOut(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart.map((i) => ({ id: i.id, size: i.size, qty: i.qty })),
          zone: shipZone,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.clientSecret) {
        if (data.soldOut) {
          setSoldOut(true);
          refreshAvailability();
        }
        setCheckoutError(data.error ?? "Something went wrong. Please try again.");
        setCheckingOut(false);
        return;
      }
      setClientSecret(data.clientSecret);
      setCheckingOut(false);
    } catch {
      setCheckoutError("Couldn’t reach checkout. Please try again.");
      setCheckingOut(false);
    }
  }, [checkingOut, soldOut, cartHasScarceItem, cart, shipZone, refreshAvailability]);

  const addToCart = (product: Product, size: string) => {
    if (!size) return;
    if (product.id === SCARCE_PRODUCT_ID && soldOut) return;
    const cap = capFor(product.id);
    setClientSecret(null); // cart changed: any in-progress payment step is stale
    setCart((prev) => {
      const existing = prev.find((i) => i.id === product.id && i.size === size);
      if (existing) {
        if (existing.qty >= cap) return prev; // at the per-order limit
        return prev.map((i) =>
          i.id === product.id && i.size === size ? { ...i, qty: i.qty + 1 } : i,
        );
      }
      return [...prev, { ...product, size, qty: 1 }];
    });
    setAddedFeedback(product.id);
    setTimeout(() => setAddedFeedback(null), 1200);
  };

  const handleCartClick = () => {
    if (totalItems === 0) {
      setCartShake(true);
      setTimeout(() => setCartShake(false), 600);
    } else {
      setCartOpen(true);
    }
  };

  const removeFromCart = (id: string, size: string) => {
    setClientSecret(null); // cart changed: any in-progress payment step is stale
    setCart((prev) => prev.filter((i) => !(i.id === id && i.size === size)));
  };

  const updateQty = (id: string, size: string, delta: number) => {
    setClientSecret(null); // cart changed: any in-progress payment step is stale
    setCart((prev) =>
      prev.flatMap((i) => {
        if (i.id !== id || i.size !== size) return [i];
        const next = i.qty + delta;
        if (next <= 0) return [];
        if (next > capFor(id)) return [i];
        return [{ ...i, qty: next }];
      }),
    );
  };

  const closeCart = () => {
    setCartOpen(false);
    setClientSecret(null);
  };

  // Cart drawer: x is a motion value. Swipe right to close (1:1, rubber band when
  // pulled open further, momentum decides), catchable mid-animation.
  const drawerRef = useRef<HTMLDivElement>(null);
  const drawerX = useMotionValue(420);
  const drawerStart = useRef(0);
  const releaseV = useRef(0);
  const drawerW = () => (drawerRef.current?.offsetWidth ?? 380) + 4;
  const park = (parked: boolean) => {
    if (drawerRef.current) drawerRef.current.inert = parked;
  };
  useEffect(() => {
    const v = releaseV.current;
    releaseV.current = 0;
    if (cartOpen) {
      park(false);
      settle(drawerX, 0, v, v ? 0.3 : 0);
    } else {
      settle(drawerX, drawerW(), v, v ? 0.15 : 0, () => park(true));
    }
  }, [cartOpen, drawerX]);
  const drawerDrag = useDrag({
    instant: () => (drawerX.isAnimating() ? "x" : null),
    onDown: (e) => {
      if ((e.target as HTMLElement).closest("input, textarea, select")) return false;
      drawerX.stop();
      drawerStart.current = drawerX.get();
    },
    onLock: (axis) => axis === "x",
    onMove: (_a, dx) => {
      const nx = drawerStart.current + dx;
      drawerX.set(nx < 0 ? rubberband(nx, drawerW()) : nx);
    },
    onEnd: (_a, _dx, _dy, vx) => {
      const wantOpen = drawerX.get() + project(vx) < drawerW() / 2;
      if (wantOpen === cartOpen) {
        settle(drawerX, wantOpen ? 0 : drawerW(), vx, wantOpen ? 0.3 : 0.15);
      } else {
        releaseV.current = vx;
        if (wantOpen) setCartOpen(true);
        else closeCart();
      }
    },
  });

  const cartTotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  // basePrice is undefined only if a cart item somehow lacks it; falls back
  // to the tax-inclusive price so VAT reads as zero rather than throwing.
  const cartBaseTotal = cart.reduce((s, i) => s + (i.basePrice ?? i.price) * i.qty, 0);
  const cartVat = cartTotal - cartBaseTotal;
  const selectedZone = SHIPPING_ZONES.find((z) => z.id === shipZone);
  const shippingCost = selectedZone ? selectedZone.amount / 100 : 0;


  const filteredPortfolio =
    galleryFilter === "all"
      ? PORTFOLIO_IMAGES
      : PORTFOLIO_IMAGES.filter((i) => isBlackWork(i.alt) === (galleryFilter === "black"));
  const displayedPortfolioImages = showAllPortfolio
    ? filteredPortfolio
    : filteredPortfolio.slice(0, WALL_PREVIEW);

  return (
    <div
      style={{
        fontFamily: "var(--font-oswald), 'Impact', sans-serif",
        background: "#92C8B7",
        color: "#111",
        overflowX: "hidden",
      }}
    >
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }

        html { scroll-behavior: smooth; }


        @keyframes shake {
          0%,100% { transform: translateX(0); }
          20% { transform: translateX(-5px) rotate(-5deg); }
          40% { transform: translateX(5px) rotate(5deg); }
          60% { transform: translateX(-4px) rotate(-3deg); }
          80% { transform: translateX(4px) rotate(3deg); }
        }
        .cart-shake { animation: shake 0.5s ease; }


        @keyframes pulse {
          0%,100% { transform: scale(1); }
          50% { transform: scale(1.15); }
        }
        .added-pulse { animation: pulse 0.4s ease; }

        .lightbox-overlay {
          position: fixed; inset: 0; display: flex; align-items: center; justify-content: center;
          background: rgba(0,0,0,0.85); z-index: 2000;
          padding: 24px;
        }
        .lightbox-nav {
          position: fixed; top: 50%; z-index: 2001; width: 44px; height: 44px; margin-top: -22px;
          background: rgba(0,0,0,0.4); border: 2px solid #fff; color: #fff; font-size: 26px; line-height: 1;
          cursor: pointer; font-family: var(--font-oswald), sans-serif;
        }
        .lightbox-prev { left: calc(12px + env(safe-area-inset-left, 0px)); }
        .lightbox-next { right: calc(12px + env(safe-area-inset-right, 0px)); }
        .lightbox-img {
          max-width: 96%; max-height: 92%; object-fit: contain; box-shadow: 0 8px 40px rgba(0,0,0,0.6);
        }
        .lightbox-close {
          position: fixed; top: calc(20px + env(safe-area-inset-top, 0px)); right: calc(20px + env(safe-area-inset-right, 0px)); background: transparent; border: 2px solid #fff; color: #fff; padding: 8px 10px; cursor: pointer; font-family: var(--font-oswald), sans-serif; z-index: 2001;
        }
        .btn-primary {
          display: inline-flex; align-items: center; justify-content: center;
          min-height: 50px; padding: 0 22px;
          background: #141112; color: #FFB8C6;
          border: 2.5px solid #141112; border-radius: 14px; box-shadow: 4px 4px 0 #92C8B7;
          font: 400 18px/1.1 var(--font-shrikhand), "Arial Black", sans-serif;
          text-align: center; text-decoration: none; cursor: pointer;
          transition: transform var(--press-ms) var(--ease-out), box-shadow var(--press-ms) var(--ease-out);
        }
        .btn-primary:disabled { opacity: .55; cursor: not-allowed; }
        @media (hover: hover) and (pointer: fine) { .btn-primary:hover:not(:disabled) { transform: translate(-2px,-2px); box-shadow: 6px 6px 0 #92C8B7; } }
        .btn-primary:active:not(:disabled) { transform: translate(3px,3px); box-shadow: 1px 1px 0 #92C8B7; }

        /* Cookie card in the sticker style. The copy is Greek and neither
           Shrikhand nor DM Mono has Greek glyphs, so the text uses the
           system monospace (which does) instead of mixing two faces. */
        .cookie-card {
          --P: #FFB8C6; --M: #92C8B7; --K: #141112; --W: #fffafa;
          --cookie-mono: ui-monospace, "SFMono-Regular", Menlo, Consolas, "DejaVu Sans Mono", "Roboto Mono", monospace;
          position: fixed;
          left: max(20px, env(safe-area-inset-left, 0px));
          bottom: calc(20px + env(safe-area-inset-bottom, 0px));
          z-index: 3000;
          width: min(420px, calc(100vw - 40px));
          background: var(--W);
          color: var(--K);
          border: 2.5px solid var(--K);
          border-radius: 20px;
          box-shadow: 6px 6px 0 var(--K);
          padding: 20px 20px 18px;
          font-family: var(--cookie-mono);
          animation: cookieUp var(--spring-smooth-ms) var(--spring-smooth) forwards;
        }
        @keyframes menuIn {
          from { opacity: 0; transform: translateY(-12px) scale(0.98); }
          to { opacity: 1; transform: none; }
        }
        @keyframes cookieUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .cookie-label {
          display: inline-block;
          font: 400 24px/1 var(--font-shrikhand), "Arial Black", sans-serif;
          background: var(--P);
          border: 2.5px solid var(--K);
          border-radius: 12px;
          padding: 6px 12px 8px;
          transform: rotate(-3deg);
          margin-bottom: 14px;
        }
        .cookie-body {
          font-size: 13px;
          line-height: 1.6;
          margin-bottom: 16px;
        }
        .cookie-body a { color: inherit; text-decoration: underline; text-decoration-color: var(--P); text-decoration-thickness: 3px; text-underline-offset: 3px; }
        .cookie-actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }
        .cookie-btn {
          flex: 1 1 auto;
          min-height: 46px;
          padding: 0 16px;
          background: var(--W);
          color: var(--K);
          border: 2.5px solid var(--K);
          border-radius: 14px;
          box-shadow: 3px 3px 0 var(--K);
          font: 700 12.5px/1 var(--cookie-mono);
          letter-spacing: .04em;
          text-transform: uppercase;
          cursor: pointer;
          transition: transform var(--press-ms) var(--ease-out), box-shadow var(--press-ms) var(--ease-out);
        }
        .cookie-btn.ink { background: var(--K); color: var(--P); }
        @media (hover: hover) and (pointer: fine) { .cookie-btn:hover { transform: translate(-1px,-1px); box-shadow: 4px 4px 0 var(--K); } }
        .cookie-btn:active { transform: translate(2px,2px); box-shadow: 1px 1px 0 var(--K); }
        .cookie-link {
          display: inline-block;
          margin-top: 14px;
          min-height: 24px;
          background: none;
          border: none;
          padding: 0;
          cursor: pointer;
          font: 600 12px/1.6 var(--cookie-mono);
          text-transform: uppercase;
          color: var(--K);
          text-decoration: underline;
          text-decoration-color: var(--M);
          text-decoration-thickness: 3px;
          text-underline-offset: 3px;
        }
        .cookie-row {
          border-top: 2px dashed var(--K);
          padding: 14px 0;
        }
        .cookie-row:first-of-type { border-top: none; padding-top: 0; }
        .cookie-row-head {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 6px;
        }
        .cookie-row-clickable { cursor: pointer; }
        .cookie-checkbox {
          width: 20px; height: 20px;
          accent-color: var(--K);
          flex-shrink: 0;
          cursor: pointer;
        }
        .cookie-checkbox:disabled { cursor: default; }
        .cookie-row-title {
          font-size: 13.5px;
          font-weight: 700;
          text-transform: uppercase;
        }
        .cookie-badge {
          margin-left: auto;
          font-size: 10px;
          font-weight: 600;
          text-transform: uppercase;
          background: var(--M);
          border: 2px solid var(--K);
          border-radius: 99px;
          padding: 3px 9px;
          white-space: nowrap;
        }
        .cookie-row-desc {
          font-size: 12px;
          line-height: 1.55;
          padding-left: 30px;
        }
        @media (max-width: 480px) {
          .cookie-card {
            left: 12px; right: 12px; bottom: calc(12px + env(safe-area-inset-bottom, 0px));
            width: auto;
            box-shadow: 4px 4px 0 var(--K);
            padding: 18px 16px 16px;
          }
          .cookie-actions { flex-direction: column; }
        }

        .cart-drawer {
          --P: #FFB8C6; --M: #92C8B7; --K: #141112; --W: #fffafa;
          position: fixed;
          top: 0; right: 0;
          width: min(400px, 100vw);
          height: 100vh;
          height: 100dvh;
          padding-bottom: env(safe-area-inset-bottom, 0px);
          background: var(--W);
          color: var(--K);
          border-left: 2.5px solid var(--K);
          box-shadow: -6px 0 0 rgba(20,17,18,.12);
          z-index: 1000;
          font: 14px/1.5 var(--font-dm-mono), ui-monospace, monospace;
          /* x is driven by a motion value (swipe to close, catchable mid-flight). */
          touch-action: pan-y;
          overscroll-behavior: contain;
          display: flex;
          flex-direction: column;
        }
        .cd-head {
          flex-shrink: 0; height: 74px; padding: 0 16px 0 22px; padding-top: env(safe-area-inset-top, 0px);
          box-sizing: content-box;
          display: flex; align-items: center; justify-content: space-between;
          background: var(--P); border-bottom: 2.5px solid var(--K);
        }
        .cd-head h3 { font: 400 26px/1 var(--font-shrikhand), "Arial Black", sans-serif; display: flex; align-items: center; gap: 10px; }
        .cd-count { font: 500 13px/1 var(--font-dm-mono), monospace; background: var(--K); color: var(--P); border-radius: 99px; min-width: 26px; height: 26px; display: inline-grid; place-items: center; padding: 0 7px; }
        .cd-close { width: 44px; height: 44px; display: grid; place-items: center; background: var(--W); color: var(--K); border: 2.5px solid var(--K); border-radius: 50%; box-shadow: 3px 3px 0 var(--K); cursor: pointer; }
        .cd-scroll { flex: 1 1 auto; min-height: 0; overflow-y: auto; overscroll-behavior: contain; }
        .cd-items { padding: 20px; display: grid; gap: 14px; }
        .cd-empty { display: grid; justify-items: center; gap: 14px; padding: 48px 0; text-align: center; }
        .cd-empty img { filter: drop-shadow(3px 4px 0 rgba(20,17,18,.85)); transform: rotate(-8deg); }
        .cd-empty p { font: 400 22px/1.1 var(--font-shrikhand), "Arial Black", sans-serif; }
        .cd-item { display: grid; grid-template-columns: 72px minmax(0,1fr); gap: 12px; padding: 12px; background: #fff; border: 2.5px solid var(--K); border-radius: 16px; box-shadow: 3px 3px 0 var(--K); }
        .cd-thumb { position: relative; width: 72px; height: 72px; border: 2px solid var(--K); border-radius: 10px; overflow: hidden; background: var(--K); }
        .cd-info { display: grid; gap: 6px; min-width: 0; }
        .cd-row { display: flex; justify-content: space-between; align-items: center; gap: 10px; }
        .cd-name { font: 400 15px/1.15 var(--font-shrikhand), "Arial Black", sans-serif; min-width: 0; }
        .cd-size { font: 500 12px/1 var(--font-dm-mono), monospace; }
        .cd-price { font-weight: 500; flex-shrink: 0; background: var(--P); border: 2px solid var(--K); border-radius: 99px; padding: 2px 8px; font-size: 13px; }
        .cd-vat { font-size: 11px; opacity: .7; }
        .cd-qty { display: inline-flex; align-items: center; border: 2px solid var(--K); border-radius: 99px; overflow: hidden; height: 36px; }
        .cd-qty button { width: 36px; height: 100%; background: none; border: 0; font-size: 18px; line-height: 1; color: var(--K); cursor: pointer; }
        .cd-qty button:disabled { opacity: .3; cursor: not-allowed; }
        .cd-qty span { min-width: 28px; text-align: center; font-weight: 500; }
        .cd-remove { background: none; border: 0; min-height: 32px; padding: 0 4px; font: 500 12px/1 var(--font-dm-mono), monospace; text-transform: uppercase; color: var(--K); text-decoration: underline; text-decoration-color: var(--P); text-decoration-thickness: 3px; text-underline-offset: 3px; cursor: pointer; }
        .cd-foot { padding: 20px; border-top: 2.5px dashed var(--K); display: grid; gap: 12px; }
        .cd-label { font-weight: 500; font-size: 12px; text-transform: uppercase; letter-spacing: .06em; }
        .cd-postal { position: relative; }
        .cd-postal input { width: 100%; min-height: 48px; padding: 10px 44px 10px 14px; background: #fff; color: var(--K); border: 2.5px solid var(--K); border-radius: 14px; font: 500 16px/1 var(--font-dm-mono), monospace; letter-spacing: .12em; outline: none; }
        .cd-postal input:focus-visible { box-shadow: 0 0 0 3px var(--P); }
        .cd-postal input[aria-invalid="true"] { border-color: #c0392b; }
        .cd-mark { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); width: 26px; height: 26px; border-radius: 50%; display: grid; place-items: center; font-size: 14px; background: #c0392b; color: #fff; }
        .cd-mark.ok { background: var(--M); color: var(--K); border: 2px solid var(--K); }
        .cd-note { font-size: 12.5px; opacity: .75; }
        .cd-zone { display: flex; justify-content: space-between; align-items: center; gap: 10px; padding: 10px 14px; background: var(--M); border: 2.5px solid var(--K); border-radius: 99px; font-size: 13px; }
        .cd-zone span:first-child { font-weight: 500; }
        .cd-intl { display: grid; gap: 12px; padding: 14px; border: 2.5px dashed var(--K); border-radius: 14px; font-size: 13.5px; }
        .cd-error { font-size: 13px; color: #b42318; }
        .cd-error a { color: inherit; }
        .cd-totals { margin: 4px 0 6px; display: grid; gap: 4px; }
        .cd-totals div { display: flex; justify-content: space-between; gap: 10px; font-size: 13.5px; }
        .cd-totals dd { margin: 0; }
        .cd-totals .cd-total { margin-top: 8px; padding-top: 10px; border-top: 2px dashed var(--K); align-items: baseline; }
        .cd-total dt { font-weight: 500; text-transform: uppercase; letter-spacing: .06em; }
        .cd-total dd { font: 400 26px/1 var(--font-shrikhand), "Arial Black", sans-serif; }
        .cd-back { justify-self: start; background: none; border: 0; padding: 0; min-height: 28px; font: 500 12.5px/1 var(--font-dm-mono), monospace; color: var(--K); text-decoration: underline; cursor: pointer; }
        .cd-secure { font-size: 11.5px; text-align: center; opacity: .65; }

        .cart-overlay {
          position: fixed; inset: 0;
          z-index: 999;
          pointer-events: none;
        }
        .cart-overlay.open { pointer-events: all; }

        /* Sticker Shop: pink over mint, black die-cut outlines like the wordmark. */
        html { scroll-padding-top: 72px; }
        .c-top, .c-hero, .c-sec, .c-foot, .c-menu {
          --P: #FFB8C6; --M: #92C8B7; --K: #141112; --W: #fffafa;
          font-family: var(--font-dm-mono), ui-monospace, monospace;
          font-size: 14px;
          color: var(--K);
        }
        .c-in { max-width: 1240px; margin: 0 auto; padding: 0 max(20px, env(safe-area-inset-left, 0px)) 0 max(20px, env(safe-area-inset-right, 0px)); }
        @media (min-width: 768px) { .c-in { padding-left: 40px; padding-right: 40px; } }
        .c-display { font-family: var(--font-shrikhand), "Arial Black", sans-serif; font-weight: 400; }

        .c-top { position: sticky; top: 0; z-index: 100; height: 64px; display: flex; align-items: center; }
        .c-top .c-in { display: flex; align-items: center; gap: 8px; width: 100%; }
        .c-pill {
          display: inline-flex; align-items: center; gap: 8px; min-height: 42px; padding: 0 14px;
          background: var(--W); color: var(--K); border: 2.5px solid var(--K); border-radius: 99px;
          box-shadow: 3px 3px 0 var(--K); font: 500 12px/1 var(--font-dm-mono), monospace;
          letter-spacing: .06em; text-transform: uppercase; text-decoration: none; white-space: nowrap; cursor: pointer;
        }
        .c-pill img { width: 26px; height: auto; }
        .c-pill.pink { background: var(--P); }
        .c-pill .count { background: var(--K); color: var(--P); border-radius: 99px; min-width: 20px; height: 20px; display: inline-grid; place-items: center; padding: 0 5px; }
        .c-nav { display: none; gap: 8px; margin-left: auto; }
        .c-cart { margin-left: auto; }
        .c-menu-btn { margin-left: auto; }
        .c-menu-btn + .c-cart { margin-left: 0; }
        @media (min-width: 900px) {
          .c-nav { display: flex; }
          .c-cart { margin-left: 0; }
          .c-menu-btn { display: none; }
        }
        .c-menu {
          position: absolute; top: 64px; left: 12px; right: 12px; z-index: 101;
          display: grid; gap: 8px; padding: 14px; background: var(--W);
          border: 2.5px solid var(--K); border-radius: 20px; box-shadow: 5px 5px 0 var(--K);
          transform-origin: top center; animation: menuIn var(--spring-smooth-ms) var(--spring-smooth) both;
        }
        .c-menu .c-pill { justify-content: center; min-height: 48px; box-shadow: none; }
        @media (min-width: 900px) { .c-menu { display: none; } }

        /* Fills the first screen. The pink half hangs off the wordmark (its
           ::before ends ~72% down the logo), so the seam stays on the logo
           whatever the viewport height. */
        .c-hero {
          position: relative; overflow: hidden; isolation: isolate;
          margin-top: -64px; padding: 100px 0 44px;
          min-height: 100vh; min-height: 100svh;
          display: flex; flex-direction: column; justify-content: center;
          background: var(--W);
          border-bottom: 2.5px solid var(--K);
        }
        .c-logo-wrap { position: relative; width: min(680px, 94%); }
        .c-logo-wrap::before {
          content: ""; position: absolute; z-index: -1;
          left: -100vw; right: -100vw; top: -100vh; bottom: 28%;
          background: var(--P); border-bottom: 2.5px solid var(--K);
        }
        .c-hero .c-in { position: relative; display: grid; justify-items: center; text-align: center; gap: 12px; }
        .c-logo { display: block; width: 100%; height: auto; filter: drop-shadow(5px 6px 0 rgba(20,17,18,.9)); animation: c-bob 5s ease-in-out infinite; }
        @keyframes c-bob { 50% { transform: translateY(-6px) rotate(-1deg); } }
        .c-hero h1 { font-size: clamp(22px, 4.2vw, 42px); line-height: 1.05; margin-top: -4px; }
        .c-ctas { display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; margin-top: 8px; }
        .c-hint { font-size: 11px; letter-spacing: .08em; text-transform: uppercase; opacity: .75; }

        .c-big {
          display: inline-flex; align-items: center; justify-content: center; min-height: 50px; padding: 0 22px;
          background: var(--W); color: var(--K); border: 2.5px solid var(--K); border-radius: 14px;
          box-shadow: 4px 4px 0 var(--K); font: 400 19px/1 var(--font-shrikhand), sans-serif;
          text-decoration: none; cursor: pointer;
          transition: transform var(--press-ms) var(--ease-out), box-shadow var(--press-ms) var(--ease-out), background-color .2s;
        }
        @media (hover: hover) and (pointer: fine) { .c-big:hover:not(:disabled) { transform: translate(-2px,-2px); box-shadow: 6px 6px 0 var(--K); } }
        .c-big:active:not(:disabled), .c-pill:active { transform: translate(3px,3px); box-shadow: 1px 1px 0 var(--K); }
        .c-big.ink { background: var(--K); color: var(--P); }
        .c-big.mint { background: var(--M); }
        .c-big:disabled { opacity: .5; cursor: not-allowed; }

        .c-sticker { position: absolute; z-index: 4; height: auto; cursor: grab; user-select: none; -webkit-user-select: none; filter: drop-shadow(3px 4px 0 rgba(20,17,18,.85)); }
        .c-sticker:active { cursor: grabbing; }
        .c-sticker.photo { border: 5px solid var(--W); }
        @media (max-width: 619px) { .c-sticker.wide-only { display: none; } }

        .c-sec { padding: 56px 0; border-bottom: 2.5px solid var(--K); background: var(--M); }
        .c-sec.pink { background: var(--P); }
        .c-sec.white { background: var(--W); }
        .c-head { display: flex; flex-wrap: wrap; align-items: flex-end; justify-content: space-between; gap: 12px 20px; margin-bottom: 26px; }
        .c-head h2 { font-size: clamp(40px, 8vw, 88px); line-height: .95; }
        .c-head p { max-width: 40ch; margin-top: 6px; }
        .c-tabs { display: flex; flex-wrap: wrap; gap: 8px; }
        .c-tabs button {
          min-height: 40px; padding: 0 14px; background: var(--W); color: var(--K);
          border: 2.5px solid var(--K); border-radius: 99px; cursor: pointer;
          font: 500 12px/1 var(--font-dm-mono), monospace; letter-spacing: .06em; text-transform: uppercase;
        }
        .c-tabs button[aria-pressed="true"] { background: var(--K); color: var(--P); }

        .c-wall { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
        @media (min-width: 640px) { .c-wall { grid-template-columns: repeat(4, 1fr); gap: 12px; } }
        @media (min-width: 1000px) { .c-wall { grid-template-columns: repeat(6, 1fr); } }
        .c-tile {
          position: relative; aspect-ratio: 1; padding: 0; overflow: hidden; cursor: zoom-in;
          background: var(--K); border: 2.5px solid var(--K); border-radius: 14px; box-shadow: 3px 3px 0 var(--K);
          transition: transform var(--spring-bouncy-ms) var(--spring-bouncy);
          animation: c-pop var(--spring-bouncy-ms) var(--spring-bouncy) both;
        }
        @keyframes c-pop { from { transform: scale(.86); } }
        @media (hover: hover) and (pointer: fine) {
          .c-tile:nth-child(odd):hover { transform: rotate(-3deg) scale(1.05); }
          .c-tile:nth-child(even):hover { transform: rotate(3deg) scale(1.05); }
        }
        .c-more { display: flex; justify-content: center; margin-top: 22px; }

        .c-get { display: grid; gap: 22px; }
        @media (min-width: 860px) { .c-get { grid-template-columns: 1.2fr 1fr; align-items: start; } }
        .c-bubble { background: var(--W); border: 2.5px solid var(--K); border-radius: 22px; padding: 22px; box-shadow: 5px 5px 0 var(--K); font-size: 16px; line-height: 1.6; }
        .c-bubble b { background: var(--P); padding: 0 4px; font-weight: 500; }
        .c-bubble a.mail { color: inherit; }
        .c-side { display: grid; gap: 18px; }
        .c-me { width: min(260px, 70%); aspect-ratio: 320 / 380; position: relative; border: 2.5px solid var(--K); border-radius: 18px; overflow: hidden; box-shadow: 5px 5px 0 var(--K); transform: rotate(3deg); justify-self: center; background: var(--K); }
        .c-steps { display: grid; gap: 10px; margin: 0; padding: 0; list-style: none; counter-reset: s; }
        .c-steps li { display: grid; grid-template-columns: 42px 1fr; gap: 12px; align-items: center; background: var(--W); border: 2.5px solid var(--K); border-radius: 14px; padding: 10px 12px; counter-increment: s; }
        .c-steps li::before { content: counter(s); width: 42px; height: 42px; border-radius: 50%; background: var(--M); border: 2.5px solid var(--K); display: grid; place-items: center; font: 400 18px/1 var(--font-shrikhand), sans-serif; }

        .c-merch { display: grid; gap: 24px; }
        @media (min-width: 720px) { .c-merch { grid-template-columns: 1fr 1fr; } }
        .c-card { background: var(--W); border: 2.5px solid var(--K); border-radius: 20px; box-shadow: 6px 6px 0 var(--K); overflow: hidden; display: grid; grid-template-rows: auto 1fr; }
        .c-card .ph { position: relative; aspect-ratio: 1; background: var(--K); border-bottom: 2.5px solid var(--K); }
        .c-card .alt { opacity: 0; transition: opacity .45s ease; }
        @media (hover: hover) and (pointer: fine) { .c-card:hover .alt { opacity: 1; } }
        .c-price { position: absolute; right: 12px; top: 12px; z-index: 2; width: 76px; height: 76px; border-radius: 50%; background: var(--P); border: 2.5px solid var(--K); display: grid; place-items: center; font: 400 22px/1 var(--font-shrikhand), sans-serif; transform: rotate(10deg); }
        .c-soldout { position: absolute; inset: 0; z-index: 3; display: grid; place-items: center; background: rgba(20,17,18,.55); }
        .c-soldout span { background: var(--P); border: 2.5px solid var(--K); border-radius: 12px; padding: 8px 16px; font: 400 24px/1 var(--font-shrikhand), sans-serif; transform: rotate(-6deg); }
        .c-card .bd { padding: 16px 18px 20px; display: grid; gap: 12px; align-content: start; }
        .c-card h3 { font-size: 22px; line-height: 1.05; }
        .c-card .meta { font-size: 12.5px; line-height: 1.55; }
        .c-sizes { display: flex; flex-wrap: wrap; gap: 8px; }
        .c-sizes button { min-width: 44px; min-height: 40px; padding: 0 10px; background: var(--W); border: 2.5px solid var(--K); border-radius: 10px; font: 500 13px/1 var(--font-dm-mono), monospace; cursor: pointer; }
        .c-sizes button[aria-pressed="true"] { background: var(--P); }
        .c-act { display: flex; flex-wrap: wrap; gap: 10px 14px; align-items: center; }
        .c-act .c-big { font-size: 16px; min-height: 46px; }
        .c-act a { font-size: 12px; text-transform: uppercase; letter-spacing: .06em; color: inherit; }
        .c-ship { margin-top: 24px; background: var(--W); border: 2.5px dashed var(--K); border-radius: 14px; padding: 12px 16px; font-size: 12.5px; line-height: 1.7; }
        .c-ship a { color: inherit; }

        .c-find { display: grid; gap: 18px; }
        @media (min-width: 900px) { .c-find { grid-template-columns: 1fr 1fr 1.3fr; } }
        .c-box { background: var(--W); border: 2.5px solid var(--K); border-radius: 18px; padding: 18px; box-shadow: 4px 4px 0 var(--K); line-height: 1.7; min-width: 0; }
        .c-box h3 { font-size: 20px; line-height: 1.1; margin-bottom: 10px; display: flex; align-items: center; gap: 10px; }
        .c-box h3 img { width: 34px; height: 34px; border-radius: 50%; border: 2px solid var(--K); object-fit: cover; }
        .c-box a { color: inherit; }
        .c-box.map { padding: 0; overflow: hidden; min-height: 260px; display: grid; }
        .c-box.map iframe { width: 100%; height: 100%; min-height: 260px; border: 0; display: block; }
        .c-gr { margin-top: 22px; font-size: 12.5px; line-height: 1.8; max-width: 80ch; }
        .c-gr a { color: inherit; }

        .c-foot { background: var(--K); color: var(--W); padding: 24px 0 calc(24px + env(safe-area-inset-bottom, 0px)); font-size: 11.5px; letter-spacing: .06em; text-transform: uppercase; }
        .c-foot .c-in { display: grid; gap: 16px; }
        .c-foot nav { display: flex; flex-wrap: wrap; gap: 8px 18px; padding-bottom: 16px; border-bottom: 1px solid #3a3234; }
        .c-foot a { color: var(--W); text-underline-offset: 3px; }
        @media (hover: hover) and (pointer: fine) { .c-foot a:hover { color: var(--P); } }
        .c-foot .row { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 8px 20px; }
        .c-foot .credit { color: var(--P); }

        @media (prefers-reduced-motion: reduce) {
          .c-logo, .c-tile { animation: none; }
        }

        @media (prefers-reduced-motion: reduce) {
          @keyframes menuIn { from { opacity: 0; } to { opacity: 1; } }
          @keyframes cookieUp { from { opacity: 0; } to { opacity: 1; } }
        }
      `}</style>

      {/* ORDER STATUS BANNER (return from Stripe Checkout) */}
      {orderStatus && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            zIndex: 3000,
            background: orderStatus === "success" ? "#92c8b7" : "#fff7f7",
            borderBottom: "2.5px solid #141112",
            padding: "calc(14px + env(safe-area-inset-top, 0px)) 48px 14px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
            textAlign: "center",
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-dm-mono), ui-monospace, monospace",
              fontWeight: 600,
              fontSize: 14,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
            }}
          >
            {orderStatus === "success"
              ? "Thank you! Your order is confirmed — a receipt is on its way to your email."
              : "Checkout canceled — your cart is still saved."}
          </span>
          <button
            onClick={() => setOrderStatus(null)}
            aria-label="Dismiss"
            style={{
              position: "absolute",
              right: 16,
              background: "none",
              border: "none",
              cursor: "pointer",
              fontFamily: "var(--font-dm-mono), ui-monospace, monospace",
              fontWeight: 700,
              fontSize: 20,
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>
      )}

      {/* HEADER */}
      <header className="c-top">
        <div className="c-in">
          <a className="c-pill" href="#top" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: "smooth" }); }}>
            <Image src="/stickers/betty.webp" alt="" width={26} height={22} priority />
            Ellie
          </a>
          <nav className="c-nav" aria-label="Main">
            {NAV.map((l) => (
              <a key={l.id} className="c-pill" href={`#${l.id}`}>{l.label}</a>
            ))}
          </nav>
          <button
            type="button"
            className="c-pill c-menu-btn"
            aria-expanded={mobileMenuOpen}
            aria-controls="c-menu"
            onClick={() => setMobileMenuOpen((o) => !o)}
          >
            {mobileMenuOpen ? "Close" : "Menu"}
          </button>
          <button
            type="button"
            className={`c-pill pink c-cart${cartShake ? " cart-shake" : ""}`}
            onClick={handleCartClick}
            aria-label={`Cart, ${totalItems} ${totalItems === 1 ? "item" : "items"}`}
          >
            Cart <span className="count">{totalItems}</span>
          </button>
        </div>
        {mobileMenuOpen && (
          <nav id="c-menu" className="c-menu" aria-label="Mobile">
            {NAV.map((l) => (
              <a key={l.id} className="c-pill" href={`#${l.id}`} onClick={() => setMobileMenuOpen(false)}>
                {l.label}
              </a>
            ))}
          </nav>
        )}
      </header>

      {/* HERO: pink over white, wordmark on the seam, fills the first screen */}
      <section className="c-hero" ref={heroRef}>
        <div className="c-in">
          <div className="c-logo-wrap">
            <Image
              src="/portfolio/elliebanner.webp"
              alt="Ellie Tattooer"
              width={1800}
              height={1200}
              priority
              sizes="(max-width: 720px) 94vw, 680px"
              className="c-logo"
            />
          </div>
          <h1 className="c-display">American Traditional Tattooing</h1>
          <div className="c-ctas">
            <a className="c-big" href="#portfolio">View gallery</a>
            <a className="c-big ink" href="#about">Book a tattoo</a>
            <a className="c-big" href="#shop">Shop</a>
          </div>
          <p className="c-hint" aria-hidden="true">↔ drag the stickers</p>
        </div>
        {STICKERS.map((s) => (
          <motion.div
            key={s.src}
            aria-hidden="true"
            className={`c-sticker${s.photo ? " photo" : ""}${s.wideOnly ? " wide-only" : ""}`}
            style={{ ...s.pos, width: s.width, aspectRatio: s.ratio, rotate: s.rotate }}
            drag
            dragConstraints={heroRef}
            dragElastic={0.2}
            dragTransition={{ bounceStiffness: 300, bounceDamping: 20 }}
            whileDrag={{ scale: 1.08 }}
          >
            <Image src={s.src} alt="" fill sizes="150px" draggable={false} style={{ objectFit: "cover", pointerEvents: "none" }} />
          </motion.div>
        ))}
        <motion.svg
          aria-hidden="true"
          className="c-sticker"
          viewBox="0 0 100 100"
          style={{ left: "5%", bottom: "4%", width: "clamp(44px, 6vw, 74px)" }}
          drag
          dragConstraints={heroRef}
          dragElastic={0.2}
          dragTransition={{ bounceStiffness: 300, bounceDamping: 20 }}
          whileDrag={{ scale: 1.12 }}
        >
          <path d="M50 4 62 36 96 38 69 59 79 93 50 73 21 93 31 59 4 38 38 36Z" fill="#FFB8C6" stroke="#141112" strokeWidth="6" strokeLinejoin="round" />
        </motion.svg>
      </section>

      {/* FLASH WALL (gallery) */}
      <section id="portfolio" className="c-sec">
        <div className="c-in">
          <div className="c-head">
            <div>
              <h2 className="c-display">Flash wall</h2>
              <p>A selection of my latest tattoos.</p>
            </div>
            <div className="c-tabs" role="group" aria-label="Filter the gallery">
              {GALLERY_FILTERS.map((f) => (
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
                <Image
                  src={`/portfolio/${item.file}`}
                  alt={item.alt}
                  fill
                  sizes="(max-width: 640px) 33vw, (max-width: 1000px) 25vw, 200px"
                  style={{ objectFit: "cover" }}
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
      </section>

      {/* GET TATTOOED (contact & inquiries) */}
      <section id="about" className="c-sec pink">
        <div className="c-in">
          <div className="c-head">
            <h2 className="c-display">Get tattooed</h2>
          </div>
          <div className="c-get">
            <div className="c-side">
              <div className="c-bubble">
                <p>
                  You can reach me via <b>Instagram DM</b> or email to{" "}
                  <a className="mail" href="mailto:elliemavrou@gmail.com"><b>elliemavrou@gmail.com</b></a> Thank you!
                </p>
                <div className="c-ctas" style={{ justifyContent: "flex-start", marginTop: 16 }}>
                  <a className="c-big ink" href="https://www.instagram.com/ellie_tattooer/" target="_blank" rel="noreferrer">
                    DM on Instagram
                  </a>
                </div>
              </div>
              <ol className="c-steps">
                <li>Send your idea, placement and rough size.</li>
                <li>Ellie replies with a date and a quote.</li>
                <li>Come to Ritual Tattoo Athens and get tattooed.</li>
              </ol>
            </div>
            <div className="c-me">
              <Image src={ELLIE_PHOTO} alt="Ellie Tattooer" fill sizes="260px" style={{ objectFit: "cover" }} />
            </div>
          </div>
        </div>
      </section>

      {/* MERCH (shop) */}
      <section id="shop" className="c-sec">
        <div className="c-in">
          <div className="c-head">
            <div>
              <h2 className="c-display">Merch</h2>
              <p>Signed and shipped from Athens.</p>
            </div>
          </div>
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
                    <Image src={product.images[0]} alt={product.name} fill sizes="(max-width: 720px) 90vw, 560px" style={{ objectFit: "cover" }} />
                    {product.images[1] && (
                      <Image src={product.images[1]} alt="" fill sizes="(max-width: 720px) 90vw, 560px" className="alt" style={{ objectFit: "cover" }} />
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
                          viewCart || justAdded ? setCartOpen(true) : addToCart(product, resolvedSize!)
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
          <p className="c-ship">
            Shipping by Greek postcode:{" "}
            {SHIPPING_ZONES.map((z) => `${z.label} €${(z.amount / 100).toFixed(2)}`).join(" · ")}
            {" · "}International orders:{" "}
            <a href={INTERNATIONAL_DM_URL} target="_blank" rel="noreferrer">DM @ellie_tattooer</a>
          </p>
        </div>
      </section>

      {/* FIND THE STUDIO (studio info) */}
      <section id="findme" className="c-sec white">
        <div className="c-in">
          <div className="c-head">
            <h2 className="c-display">Find the studio</h2>
          </div>
          <div className="c-find">
            <div className="c-box">
              <h3 className="c-display">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={STUDIO_LOGO} alt="Ritual Tattoo Athens logo" />
                Ritual Tattoo Athens
              </h3>
              <p>
                Fokionos 11 &amp; Ermou
                <br />
                Athens, 10563, Greece
                <br />
                <a href="https://www.instagram.com/ritualtattooathens/" target="_blank" rel="noreferrer">@ritualtattooathens</a>
              </p>
            </div>
            <div className="c-box">
              <h3 className="c-display">Hours &amp; phone</h3>
              <p>
                Mon–Fri: 12:00–21:00
                <br />
                Saturday: 12:00–20:00
                <br />
                <a href="tel:+302107777230">+30 210 77 77 230</a>
                <br />
                <a href="tel:+306978907800">+30 697 89 07 800</a>
              </p>
            </div>
            <div className="c-box map">
              <iframe
                src="https://www.google.com/maps?q=Ritual%20Tattoo%20Athens%2C%20Fokionos%2011%20%26%20Ermou%2C%20Athens%2010563%2C%20Greece&output=embed"
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Map: Ritual Tattoo Athens, Fokionos 11 & Ermou"
              />
            </div>
          </div>

          {/* Greek summary of the same details. Most walk-in clients search in
              Greek, so this is real content for readers, not a crawler block. */}
          <p className="c-gr" lang="el">
            Τατουάζ σε στυλ American Traditional στην Αθήνα. Η Ellie
            δουλεύει στο στούντιο Ritual Tattoo Athens, Φωκίωνος 11 &amp;
            Ερμού, Αθήνα 10563. Για ραντεβού και ερωτήσεις, στείλτε μήνυμα
            στο Instagram <a href="https://www.instagram.com/ellie_tattooer/" target="_blank" rel="noreferrer">@ellie_tattooer</a>{" "}
            ή email στο elliemavrou@gmail.com.
          </p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="c-foot">
        <div className="c-in">
          <nav aria-label="Footer">
            <a href="#about">Contact</a>
            <a href="#portfolio">Gallery</a>
            <a href="#shop">Shop</a>
            <a href="#findme">Studio Info</a>
            <Link href="/privacy">Privacy Policy</Link>
            <Link href="/terms">Terms of Service</Link>
            <a href="https://www.instagram.com/ellie_tattooer/" target="_blank" rel="noreferrer">@ellie_tattooer</a>
            <a href="https://www.instagram.com/ritualtattooathens/" target="_blank" rel="noreferrer">@ritualtattooathens</a>
          </nav>
          <div className="row">
            <p>© 2026 Ellie Tattooer. All rights reserved.</p>
            <p>
              © 2026{" "}
              <a className="credit" href="https://www.akosds.com" target="_blank" rel="noopener noreferrer">
                Akos Digital Services
              </a>
              . All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* CART OVERLAY */}
      <div
        className={`cart-overlay ${cartOpen ? "open" : ""}`}
        onClick={closeCart}
      />

      {/* CART DRAWER */}
      <motion.div
        className="cart-drawer"
        style={{ x: drawerX }}
        ref={drawerRef}
        {...drawerDrag.handlers}
      >
        <div className="cd-head">
          <h3>
            Your cart{" "}
            {totalItems > 0 && <span className="cd-count">{totalItems}</span>}
          </h3>
          <button type="button" className="cd-close" onClick={closeCart} aria-label="Close cart">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div className="cd-scroll">
        <div className="cd-items">
          {cart.length === 0 ? (
            <div className="cd-empty">
              <Image src="/stickers/betty.webp" alt="" width={110} height={94} />
              <p>Your cart is empty</p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={`${item.id}-${item.size}`} className="cd-item">
                {item.images?.[0] && (
                  <div className="cd-thumb">
                    <Image src={item.images[0]} alt="" fill sizes="72px" style={{ objectFit: "cover" }} />
                  </div>
                )}
                <div className="cd-info">
                  <div className="cd-row">
                    <p className="cd-name">
                      {item.name}
                      {MULTI_SIZE_IDS.has(item.id) && item.size && (
                        <span className="cd-size"> · {item.size}</span>
                      )}
                    </p>
                    <span className="cd-price">€{(item.price * item.qty).toFixed(2)}</span>
                  </div>
                  <p className="cd-vat">
                    €{((item.basePrice ?? item.price) * item.qty).toFixed(2)} excl. VAT + €
                    {((item.price - (item.basePrice ?? item.price)) * item.qty).toFixed(2)} VAT
                  </p>
                  <div className="cd-row">
                    <div className="cd-qty">
                      <button
                        type="button"
                        onClick={() => updateQty(item.id, item.size, -1)}
                        aria-label={`Remove one ${item.name}`}
                      >
                        −
                      </button>
                      <span aria-live="polite">{item.qty}</span>
                      <button
                        type="button"
                        onClick={() => updateQty(item.id, item.size, +1)}
                        disabled={item.qty >= capFor(item.id)}
                        aria-label={`Add one ${item.name}`}
                      >
                        +
                      </button>
                    </div>
                    <button
                      type="button"
                      className="cd-remove"
                      onClick={() => removeFromCart(item.id, item.size)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        {cart.length > 0 && (
          <div className="cd-foot">
            {/* Postal code → auto-detect zone */}
            <label htmlFor="postal-code" className="cd-label">
              Enter your postal code
            </label>
            <div className="cd-postal">
              <input
                id="postal-code"
                type="text"
                inputMode="numeric"
                autoComplete="postal-code"
                enterKeyHint="done"
                maxLength={5}
                placeholder="e.g. 10431"
                value={postalCode}
                aria-invalid={postalCode.length === 5 && !selectedZone && shipZone !== "international"}
                onChange={(e) => {
                  const v = e.target.value.replace(/\D/g, "").slice(0, 5);
                  setPostalCode(v);
                  setCheckoutError(null);
                  setClientSecret(null); // zone may change: any payment step is stale
                  if (v.length === 5) {
                    const result = zoneFromPostalCode(v);
                    if (result === "international" || result === null) {
                      setShipZone(result === "international" ? "international" : "unknown");
                    } else {
                      setShipZone(result.id);
                    }
                  } else {
                    setShipZone("");
                  }
                }}
              />
              {postalCode.length === 5 && (
                <span className={`cd-mark${selectedZone ? " ok" : ""}`} aria-hidden="true">
                  {selectedZone ? "✓" : "✗"}
                </span>
              )}
            </div>

            {/* Prompt to enter a postal code before any zone resolves */}
            {shipZone === "" && (
              <p className="cd-note">
                To calculate shipping costs and delivery time with ELTA Courier.
              </p>
            )}

            {/* Detected zone chip */}
            {selectedZone && (
              <div className="cd-zone">
                <span>{selectedZone.label}</span>
                <span>{selectedZone.delivery}</span>
              </div>
            )}

            {/* International */}
            {shipZone === "international" && (
              <div className="cd-intl">
                <p>
                  We currently ship within Greece only. For international orders,
                  send a quick DM and we’ll arrange it.
                </p>
                <a
                  href={INTERNATIONAL_DM_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-primary"
                  style={{ width: "100%" }}
                >
                  DM on Instagram to order
                </a>
              </div>
            )}

            {/* Unrecognised */}
            {shipZone === "unknown" && (
              <p className="cd-error">
                We couldn’t verify this postal code. Double-check it or{" "}
                <a href={INTERNATIONAL_DM_URL} target="_blank" rel="noreferrer">
                  DM us
                </a>
                .
              </p>
            )}

            {/* Totals + checkout (only when zone known) */}
            {selectedZone && (
              <>
                <dl className="cd-totals">
                  <div><dt>Subtotal (excl. VAT)</dt><dd>€{cartBaseTotal.toFixed(2)}</dd></div>
                  <div><dt>VAT (24%)</dt><dd>€{cartVat.toFixed(2)}</dd></div>
                  <div><dt>Shipping</dt><dd>€{shippingCost.toFixed(2)}</dd></div>
                  <div className="cd-total"><dt>Total</dt><dd>€{(cartTotal + shippingCost).toFixed(2)}</dd></div>
                </dl>
                {clientSecret ? (
                  <>
                    <button type="button" className="cd-back" onClick={() => setClientSecret(null)}>
                      ‹ Back to cart details
                    </button>
                    <CheckoutPanel clientSecret={clientSecret} />
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      className="btn-primary"
                      style={{ width: "100%", cursor: checkingOut ? "wait" : undefined }}
                      onClick={handleCheckout}
                      disabled={checkingOut}
                    >
                      {checkingOut ? "Loading payment…" : "Continue to payment"}
                    </button>
                    {checkoutError && <p className="cd-error" style={{ textAlign: "center", marginTop: 10 }}>{checkoutError}</p>}
                    <p className="cd-secure">Secure checkout via Stripe</p>
                  </>
                )}
              </>
            )}
          </div>
        )}
        </div>
      </motion.div>

      {/* COOKIE CONSENT */}
      {cookieBannerOpen && (
        <div
          className="cookie-card"
          role="dialog"
          aria-label="Cookies"
          aria-live="polite"
        >
          <div className="cookie-label">Cookies</div>

          {!cookieManage ? (
            <>
              <p className="cookie-body">
                Αυτός ο ιστότοπος χρησιμοποιεί απαραίτητα cookies για να
                λειτουργεί. Με τη συγκατάθεσή σου, προαιρετικά cookies όπως
                analytics με βοηθούν να τον βελτιώσω. Έχεις τον έλεγχο: αποδοχή,
                απόρριψη ή διαχείριση προτιμήσεων. Δες την{" "}
                <Link href="/privacy">
                  Πολιτική Απορρήτου
                </Link>
                .
              </p>
              <div className="cookie-actions">
                <button
                  className="cookie-btn ink"
                  onClick={() => persistCookieConsent(true)}
                >
                  Αποδοχή όλων
                </button>
                <button
                  className="cookie-btn"
                  onClick={() => persistCookieConsent(false)}
                >
                  Απόρριψη όλων
                </button>
              </div>
              <button
                className="cookie-link"
                onClick={() => {
                  setAnalyticsPref(false);
                  setCookieManage(true);
                }}
              >
                Διαχείριση προτιμήσεων
              </button>
            </>
          ) : (
            <>
              <div className="cookie-row">
                <label className="cookie-row-head">
                  <input
                    type="checkbox"
                    className="cookie-checkbox"
                    checked
                    disabled
                    readOnly
                  />
                  <span className="cookie-row-title">Απολύτως απαραίτητα</span>
                  <span className="cookie-badge">Πάντα ενεργά</span>
                </label>
                <p className="cookie-row-desc">
                  Απαραίτητα για τη λειτουργία του ιστότοπου, όπως ασφάλεια και η
                  αποθήκευση αυτής της επιλογής.
                </p>
              </div>
              <div className="cookie-row">
                <label className="cookie-row-head cookie-row-clickable">
                  <input
                    type="checkbox"
                    className="cookie-checkbox"
                    checked={analyticsPref}
                    onChange={(e) => setAnalyticsPref(e.target.checked)}
                  />
                  <span className="cookie-row-title">Analytics</span>
                </label>
                <p className="cookie-row-desc">
                  Ανώνυμα στατιστικά που με βοηθούν να καταλάβω πώς
                  χρησιμοποιείται ο ιστότοπος.
                </p>
              </div>
              <div className="cookie-actions">
                <button
                  className="cookie-btn"
                  onClick={() => persistCookieConsent(analyticsPref)}
                >
                  Αποθήκευση προτιμήσεων
                </button>
                <button
                  className="cookie-btn ink"
                  onClick={() => persistCookieConsent(true)}
                >
                  Αποδοχή όλων
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
