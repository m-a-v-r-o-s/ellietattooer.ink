"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import {
  SHIPPING_ZONES,
  MAX_PER_ORDER,
  TOTAL_STOCK,
  INTERNATIONAL_DM_URL,
} from "@/lib/shop";
import { zoneFromPostalCode } from "@/lib/postal-zones";

const STUDIO_LOGO =
  "https://ritualtattoo.gr/wp-content/uploads/2018/05/ritual_logo_banner_dark_150.png";
const ELLIE_PHOTO = "/Screenshot_2026-05-22_19-59-38.webp";

const PRODUCTS = [
  {
    id: 1,
    name: "BACKPIECE PRINT 50 × 70 cm",
    basePrice: 60,
    price: 74.40,
    sizes: ["50×70CM"],
    images: ["/portfolio/Backpiece-print.webp", "/portfolio/Backpiece-print2.webp"],
    makingOf: "https://www.instagram.com/p/DWwoJxrjTiL/",
  },
];

type Product = {
  id: number;
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

const PORTFOLIO_IMAGES = [
  "Screenshot_2026-05-29_03-06-19.webp",
  "Screenshot_2026-05-29_03-06-39.webp",
  "Screenshot_2026-05-29_03-07-17.webp",
  "Screenshot_2026-05-29_03-07-47.webp",
  "Screenshot_2026-05-29_03-08-49.webp",
  "Screenshot_2026-05-23_01-26-22.webp",
  "Screenshot_2026-05-23_01-26-32.webp",
  "Screenshot_2026-05-23_01-26-52.webp",
  "Screenshot_2026-05-23_01-27-01.webp",
  "Screenshot_2026-05-23_01-27-15.webp",
  "Screenshot_2026-05-23_01-27-37.webp",
  "Screenshot_2026-05-23_01-27-45.webp",
  "Screenshot_2026-05-23_01-28-21.webp",
  "Screenshot_2026-05-23_01-28-37.webp",
  "Screenshot_2026-05-23_01-28-47.webp",
  "Screenshot_2026-05-23_01-28-57.webp",
  "Screenshot_2026-05-23_01-29-05.webp",
  "Screenshot_2026-05-23_01-29-12.webp",
  "Screenshot_2026-05-23_01-29-26.webp",
  "Screenshot_2026-05-23_01-29-44.webp",
  "Screenshot_2026-05-23_01-30-00.webp",
  "Screenshot_2026-05-23_01-30-15.webp",
  "Screenshot_2026-05-23_01-30-21.webp",
  "Screenshot_2026-05-23_01-30-33.webp",
  "Screenshot_2026-05-23_01-30-41.webp",
  "Screenshot_2026-05-23_01-30-48.webp",
  "Screenshot_2026-05-23_01-30-53.webp",
  "Screenshot_2026-05-23_01-31-07.webp",
  "Screenshot_2026-05-23_01-31-23.webp",
  "Screenshot_2026-05-23_01-31-29.webp",
  "Screenshot_2026-05-23_01-31-38.webp",
  "Screenshot_2026-05-23_01-31-43.webp",
  "Screenshot_2026-05-23_01-31-52.webp",
  "Screenshot_2026-05-23_01-32-04.webp",
  "Screenshot_2026-05-23_01-32-10.webp",
  "Screenshot_2026-05-23_01-32-14.webp",
  "Screenshot_2026-05-23_01-32-24.webp",
  "Screenshot_2026-05-23_01-32-39.webp",
  "Screenshot_2026-05-23_01-32-46.webp",
  "Screenshot_2026-05-23_01-33-01.webp",
  "Screenshot_2026-05-23_01-33-13.webp",
  "Screenshot_2026-05-23_01-33-33.webp",
  "Screenshot_2026-05-23_01-33-37.webp",
  "Screenshot_2026-05-23_01-33-42.webp",
  "Screenshot_2026-05-23_01-33-51.webp",
  "Screenshot_2026-05-23_01-34-01.webp",
  "Screenshot_2026-05-23_01-34-09.webp",
  "Screenshot_2026-05-23_01-34-18.webp",
  "Screenshot_2026-05-23_01-34-24.webp",
  "Screenshot_2026-05-23_01-34-31.webp",
  "Screenshot_2026-05-23_01-34-42.webp",
  "Screenshot_2026-05-23_01-34-52.webp",
  "Screenshot_2026-05-23_01-35-01.webp",
  "Screenshot_2026-05-23_01-35-17.webp",
  "Screenshot_2026-05-23_01-35-31.webp",
  "Screenshot_2026-05-23_01-35-42.webp",
  "Screenshot_2026-05-23_01-35-54.webp",
  "Screenshot_2026-05-23_01-36-02.webp",
  "Screenshot_2026-05-23_01-36-09.webp",
  "Screenshot_2026-05-23_01-36-23.webp",
  "Screenshot_2026-05-23_01-36-29.webp",
  "Screenshot_2026-05-23_01-36-36.webp",
  "Screenshot_2026-05-23_01-36-45.webp",
  "Screenshot_2026-05-23_01-36-50.webp",
  "Screenshot_2026-05-23_01-37-01.webp",
  "Screenshot_2026-05-23_01-37-14.webp",
  "Screenshot_2026-05-23_01-37-19.webp",
  "Screenshot_2026-05-23_01-37-26.webp",
  "Screenshot_2026-05-23_01-37-39.webp",
  "Screenshot_2026-05-23_01-37-51.webp",
  "Screenshot_2026-05-23_01-38-04.webp",
  "Screenshot_2026-05-23_01-38-12.webp",
  "Screenshot_2026-05-23_01-38-20.webp",
  "Screenshot_2026-05-23_01-38-23.webp",
  "Screenshot_2026-05-23_01-38-30.webp",
  "Screenshot_2026-05-23_01-38-41.webp",
  "Screenshot_2026-05-23_01-38-54.webp",
  "Screenshot_2026-05-23_01-39-00.webp",
  "Screenshot_2026-05-23_01-39-07.webp",
  "Screenshot_2026-05-23_01-39-11.webp",
  "Screenshot_2026-05-23_01-39-16.webp",
  "Screenshot_2026-05-23_01-39-33.webp",
  "Screenshot_2026-05-23_01-39-39.webp",
  "Screenshot_2026-05-23_01-39-48.webp",
  "Screenshot_2026-05-23_01-39-52.webp",
  "Screenshot_2026-05-23_01-39-57.webp",
  "Screenshot_2026-05-23_01-40-04.webp",
  "Screenshot_2026-05-23_01-40-11.webp",
  "Screenshot_2026-05-23_01-40-14.webp",
  "Screenshot_2026-05-23_01-40-19.webp",
  "Screenshot_2026-05-23_01-40-24.webp",
  "Screenshot_2026-05-23_01-40-29.webp",
  "Screenshot_2026-05-23_01-40-33.webp",
  "Screenshot_2026-05-23_01-40-41.webp",
];

export default function EllieTattooer() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [cartShake, setCartShake] = useState(false);
  const [addedFeedback, setAddedFeedback] = useState<number | null>(null);
  const [navScrolled, setNavScrolled] = useState(false);
  const [showAllPortfolio, setShowAllPortfolio] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [soldOut, setSoldOut] = useState(false);
  const [remaining, setRemaining] = useState(TOTAL_STOCK);
  const [maxPerOrder, setMaxPerOrder] = useState(MAX_PER_ORDER);
  const [postalCode, setPostalCode] = useState("");
  const [shipZone, setShipZone] = useState("");
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [checkingOut, setCheckingOut] = useState(false);
  const [orderStatus, setOrderStatus] = useState<"success" | "cancel" | null>(
    null,
  );

  useEffect(() => {
    const onScroll = () => setNavScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxIndex(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const refreshAvailability = useCallback(async () => {
    try {
      const res = await fetch("/api/availability", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      setSoldOut(!data.available);
      setRemaining(Math.max(0, Number(data.remaining ?? TOTAL_STOCK)));
      setMaxPerOrder(Math.max(0, Number(data.maxPerOrder ?? MAX_PER_ORDER)));
    } catch {
      // keep optimistic defaults if the check fails
    }
  }, []);

  useEffect(() => {
    refreshAvailability();
  }, [refreshAvailability]);

  // Handle the return trip from Stripe Checkout (?checkout=success|cancel).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get("checkout");
    if (status === "success" || status === "cancel") {
      setOrderStatus(status);
      if (status === "success") {
        setCart([]);
        refreshAvailability();
      }
      window.history.replaceState(
        null,
        "",
        window.location.pathname + window.location.hash,
      );
    }
  }, [refreshAvailability]);

  const totalItems = cart.reduce((s, i) => s + i.qty, 0);

  // Create a Stripe Checkout session for the current cart + shipping zone,
  // then hand the customer off to Stripe's hosted payment page.
  const handleCheckout = useCallback(async () => {
    if (checkingOut || soldOut || cart.length === 0 || !shipZone) return;
    setCheckoutError(null);
    setCheckingOut(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity: totalItems, zone: shipZone }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        if (data.soldOut) {
          setSoldOut(true);
          refreshAvailability();
        }
        setCheckoutError(data.error ?? "Something went wrong. Please try again.");
        setCheckingOut(false);
        return;
      }
      // Success: redirect to Stripe (no need to clear the loading flag).
      window.location.href = data.url;
    } catch {
      setCheckoutError("Couldn’t reach checkout. Please try again.");
      setCheckingOut(false);
    }
  }, [checkingOut, soldOut, cart.length, shipZone, totalItems, refreshAvailability]);

  const addToCart = (product: Product) => {
    const size = product.sizes[0];
    if (!size || soldOut) return;
    const cap = Math.max(1, maxPerOrder);
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

  const removeFromCart = (id: number, size: string) =>
    setCart((prev) => prev.filter((i) => !(i.id === id && i.size === size)));

  const updateQty = (id: number, size: string, delta: number) =>
    setCart((prev) =>
      prev.flatMap((i) => {
        if (i.id !== id || i.size !== size) return [i];
        const next = i.qty + delta;
        if (next <= 0) return [];
        if (next > maxPerOrder) return [i];
        return [{ ...i, qty: next }];
      }),
    );

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  const cartTotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const selectedZone = SHIPPING_ZONES.find((z) => z.id === shipZone);
  const shippingCost = selectedZone ? selectedZone.amount / 100 : 0;


  const displayedPortfolioImages = showAllPortfolio
    ? PORTFOLIO_IMAGES
    : PORTFOLIO_IMAGES.slice(0, 27);

  return (
    <div
      style={{
        fontFamily: "var(--font-oswald), 'Impact', sans-serif",
        background: "#fecdbf",
        color: "#111",
        overflowX: "hidden",
      }}
    >
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }

        html { scroll-behavior: smooth; }

        .nav-link {
          font-family: var(--font-oswald), sans-serif;
          font-weight: 600;
          font-size: 13px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #111;
          text-decoration: none;
          cursor: pointer;
          padding: 4px 0;
          position: relative;
          transition: color 0.2s;
        }
        .nav-link::after {
          content: '';
          position: absolute;
          bottom: 0; left: 0;
          width: 0; height: 2px;
          background: #FFB3C1;
          transition: width 0.2s;
        }
        .nav-link:hover::after { width: 100%; }
        .nav-link:hover { color: #FFB3C1; }

        @keyframes shake {
          0%,100% { transform: translateX(0); }
          20% { transform: translateX(-5px) rotate(-5deg); }
          40% { transform: translateX(5px) rotate(5deg); }
          60% { transform: translateX(-4px) rotate(-3deg); }
          80% { transform: translateX(4px) rotate(3deg); }
        }
        .cart-shake { animation: shake 0.5s ease; }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .fade-up { animation: fadeUp 0.7s ease forwards; }

        @keyframes pulse {
          0%,100% { transform: scale(1); }
          50% { transform: scale(1.15); }
        }
        .added-pulse { animation: pulse 0.4s ease; }

        .portfolio-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 3px;
        }
        @media (min-width: 640px) {
          .portfolio-grid {
            grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
            gap: 6px;
          }
        }
        .portfolio-item {
          aspect-ratio: 1;
          background: #1a1a1a;
          position: relative;
          overflow: hidden;
          cursor: pointer;
        }
        .portfolio-item:hover .portfolio-overlay {
          opacity: 1;
        }
        .portfolio-overlay {
          position: absolute; inset: 0;
          background: rgba(255,179,193,0.85);
          display: flex; align-items: center; justify-content: center;
          opacity: 0;
          transition: opacity 0.3s;
          font-family: var(--font-oswald), sans-serif;
          font-size: 14px;
          letter-spacing: 0.2em;
          color: #111;
          text-transform: uppercase;
        }
        .portfolio-item { cursor: pointer; }
        .lightbox-overlay {
          position: fixed; inset: 0; display: flex; align-items: center; justify-content: center;
          background: rgba(0,0,0,0.85); z-index: 2000;
          padding: 24px;
        }
        .lightbox-img {
          max-width: 96%; max-height: 92%; object-fit: contain; box-shadow: 0 8px 40px rgba(0,0,0,0.6);
        }
        .lightbox-close {
          position: fixed; top: 20px; right: 20px; background: transparent; border: 2px solid #fff; color: #fff; padding: 8px 10px; cursor: pointer; font-family: var(--font-oswald), sans-serif; z-index: 2001;
        }
        .portfolio-placeholder {
          width: 100%; height: 100%;
          background: repeating-linear-gradient(
            45deg,
            #1a1a1a,
            #1a1a1a 10px,
            #222 10px,
            #222 20px
          );
          display: flex; align-items: center; justify-content: center;
        }

        .product-card {
          background: #fff;
          border: 2px solid #111;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .product-card:hover {
          transform: translateY(-4px);
          box-shadow: 6px 6px 0 #111;
        }
        .product-media {
          position: relative;
          aspect-ratio: 3 / 4;
          overflow: hidden;
          background: #1a1a1a;
        }
        .product-img-alt {
          opacity: 0;
          transition: opacity 0.45s ease;
        }
        .product-card:hover .product-img-alt { opacity: 1; }
        .product-media-placeholder {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          color: rgba(255, 255, 255, 0.2);
          background: repeating-linear-gradient(
            45deg,
            #1a1a1a,
            #1a1a1a 10px,
            #222 10px,
            #222 20px
          );
        }

        .btn-primary {
          background: #111;
          color: #fff;
          border: 2px solid #111;
          padding: 12px 28px;
          font-family: var(--font-oswald), sans-serif;
          font-weight: 600;
          font-size: 13px;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          cursor: pointer;
          transition: background 0.2s, color 0.2s;
        }
        .btn-primary:hover {
          background: #FFB3C1;
          border-color: #040404;
        }

        .btn-outline {
          background: transparent;
          color: #111;
          border: 2px solid #111;
          padding: 10px 22px;
          font-family: var(--font-oswald), sans-serif;
          font-weight: 600;
          font-size: 12px;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          cursor: pointer;
          transition: background 0.2s, color 0.2s;
        }
        .btn-outline:hover {
          background: #111;
          color: #fff;
        }

        .btn-mint {
          background: #92c8b7;
          color: #111;
          border: 2px solid #92c8b7;
          padding: 10px 22px;
          font-family: var(--font-oswald), sans-serif;
          font-weight: 600;
          font-size: 14px;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          cursor: pointer;
          transition: background 0.2s, color 0.2s, border-color 0.2s;
        }
        .btn-mint:hover {
          background: #111;
          color: #fff;
          border-color: #111;
        }

        .size-btn {
          border: 1.5px solid #aaa;
          background: transparent;
          padding: 5px 10px;
          font-family: var(--font-oswald), sans-serif;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.15s;
          letter-spacing: 0.05em;
        }
        .size-btn.active {
          background: #111;
          color: #fff;
          border-color: #111;
        }
        .size-btn:hover:not(.active) {
          border-color: #111;
        }

        .section-title {
          font-family: var(--font-oswald), sans-serif;
          font-weight: 700;
          font-size: clamp(36px, 6vw, 72px);
          letter-spacing: 0.05em;
          text-transform: uppercase;
          line-height: 1;
        }

        .ig-link {
          display: flex;
          align-items: center;
          gap: 8px;
          text-decoration: none;
          color: #111;
          transition: color 0.2s;
          font-family: var(--font-oswald), sans-serif;
          font-size: 12px;
          font-weight: 500;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }
        .ig-link:hover { color: #FFB3C1; }

        .ig-avatar {
          width: 36px; height: 36px;
          border-radius: 50%;
          object-fit: cover;
          border: 2px solid #111;
          flex-shrink: 0;
        }

        .cart-drawer {
          position: fixed;
          top: 0; right: 0;
          width: 380px;
          height: 100vh;
          background: #fff;
          border-left: 2px solid #111;
          z-index: 1000;
          transform: translateX(100%);
          transition: transform 0.35s cubic-bezier(.4,0,.2,1);
          display: flex;
          flex-direction: column;
        }
        .cart-drawer.open { transform: translateX(0); }

        .cart-overlay {
          position: fixed; inset: 0;
          z-index: 999;
          pointer-events: none;
        }
        .cart-overlay.open { pointer-events: all; }

        .map-container {
          width: 100%;
          height: 360px;
          border: 2px solid #111;
          overflow: hidden;
        }

        .ornament {
          display: inline-block;
          font-size: 24px;
          color: #c0392b;
          margin: 0 12px;
        }

        .hero-section {
          height: calc(100dvh - 72px);
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
          background: #111;
        }
        .hero-bg-pattern {
          position: absolute;
          inset: 0;
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
          background-color: hsl(348, 100%, 86%);
        }
        .divider-line {
          width: 100%; height: 2px; background: #111;
        }
        .red-divider {
          width: 60px; height: 4px; background: #c0392b; margin: 16px 0;
        }

        .about-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 80px;
          align-items: center;
        }
        .two-col-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 60px;
          align-items: start;
        }
        @media (max-width: 768px) {
          .about-grid {
            grid-template-columns: 1fr;
            gap: 48px;
          }
          .two-col-grid {
            grid-template-columns: 1fr;
            gap: 40px;
          }
        }

        .shop-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 360px));
          gap: 32px;
          justify-content: center;
        }
        @media (max-width: 768px) {
          .shop-grid {
            display: flex;
            flex-direction: row;
            justify-content: center;
            overflow-x: auto;
            gap: 16px;
            padding-bottom: 12px;
            -webkit-overflow-scrolling: touch;
          }
          .shop-grid > * {
            flex: 0 0 min(75vw, 340px);
          }
        }

        .mobile-menu-btn { display: none; }
        .mobile-cart-btn { display: none; }
        .mobile-nav { display: none; }

        @media (max-width: 768px) {
          .nav-desktop { display: none !important; }
          .nav-right-desktop { display: none !important; }
          .mobile-menu-btn { display: flex !important; }
          .mobile-cart-btn { display: flex !important; }
          .mobile-nav {
            display: flex;
            flex-direction: column;
            position: absolute;
            top: 72px;
            left: 0;
            right: 0;
            background: #fff7f7;
            border-bottom: 2px solid #111;
            padding: 16px 24px;
            gap: 16px;
            z-index: 99;
          }
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
            borderBottom: "2px solid #111",
            padding: "14px 48px 14px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
            textAlign: "center",
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-oswald), sans-serif",
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
              fontFamily: "var(--font-oswald), sans-serif",
              fontWeight: 700,
              fontSize: 20,
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>
      )}

      {/* NAVBAR */}
      <nav
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          background: "#fff7f7",
          overflow: "visible",
          borderBottom: "2px solid #111",
          boxShadow: navScrolled ? "0 2px 16px rgba(0,0,0,0.08)" : "none",
          transition: "box-shadow 0.3s",
        }}
      >
        <div
          style={{
            maxWidth: 1400,
            margin: "0 auto",
            padding: "0 24px",
            height: 72,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {/* LEFT NAV */}
          <div
            className="nav-desktop"
            style={{ display: "flex", gap: 32, alignItems: "center" }}
          >
            <span className="nav-link" onClick={() => scrollTo("about")}>
              CONTACT
            </span>
            <span
              className="nav-link"
              onClick={() => {
                setShowAllPortfolio(true);
                scrollTo("portfolio");
              }}
            >
              GALLERY
            </span>
            <span className="nav-link" onClick={() => scrollTo("shop")}>
              Shop
            </span>
            
            <span className="nav-link" onClick={() => scrollTo("findme")}>
              STUDIO INFO
            </span>
          </div>

          {/* CENTER LOGO */}
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: "28%",
              transform: "translate(-50%, -35%)",
              display: "flex",
              alignItems: "center",
              pointerEvents: "none",
              zIndex: 110,
            }}
          >
            <img
              src="/portfolio/betty.webp"
              alt="Ellie Tattooer"
              style={{
                height: 333,
                width: "auto",
                objectFit: "contain",
                pointerEvents: "auto",
              }}
            />
          </div>

          {/* MOBILE LEFT: hamburger */}
          <button
            className="mobile-menu-btn"
            onClick={() => setMobileMenuOpen((o) => !o)}
            style={{ background: "none", border: "none", cursor: "pointer", padding: 4, flexDirection: "column", gap: 5 }}
            title="Menu"
          >
            <span style={{ display: "block", width: 22, height: 2, background: "#111", transition: "transform 0.2s", transform: mobileMenuOpen ? "rotate(45deg) translate(5px, 5px)" : "none" }} />
            <span style={{ display: "block", width: 22, height: 2, background: "#111", opacity: mobileMenuOpen ? 0 : 1, transition: "opacity 0.2s" }} />
            <span style={{ display: "block", width: 22, height: 2, background: "#111", transition: "transform 0.2s", transform: mobileMenuOpen ? "rotate(-45deg) translate(5px, -5px)" : "none" }} />
          </button>

          {/* MOBILE RIGHT: cart */}
          <button
            className={`mobile-cart-btn${cartShake ? " cart-shake" : ""}`}
            onClick={handleCartClick}
            style={{ background: "none", border: "none", cursor: "pointer", position: "relative", padding: 4 }}
            title="Cart"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
            {totalItems > 0 && (
              <span style={{ position: "absolute", top: -4, right: -4, background: "#c0392b", color: "#fff", borderRadius: "50%", width: 16, height: 16, fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-oswald), sans-serif" }}>
                {totalItems}
              </span>
            )}
          </button>

          {/* RIGHT */}
          <div
            className="nav-right-desktop"
            style={{ display: "flex", alignItems: "center", gap: 20 }}
          >
            {/* Studio IG */}
            <a
              href="https://www.instagram.com/ritualtattooathens/"
              target="_blank"
              rel="noreferrer"
              className="ig-link"
              title="Ritual Tattoo Athens on Instagram"
            >
              <img
                src={STUDIO_LOGO}
                alt="Ritual Tattoo"
                style={{
                  height: 36,
                  width: 36,
                  objectFit: "cover",
                  border: "2px solid #000",
                  borderRadius: "50%",
                }}
              />
              <span style={{ fontSize: 11 }}>@ritualtattooathens</span>
            </a>
            {/* Ellie IG */}
            <a
              href="https://www.instagram.com/ellie_tattooer/"
              target="_blank"
              rel="noreferrer"
              className="ig-link"
              title="Ellie Tattooer on Instagram"
            >
              <img
                src={ELLIE_PHOTO}
                alt="Ellie"
                className="ig-avatar"
                width={36}
                height={36}
                decoding="async"
              />
              <span style={{ fontSize: 11 }}>@ellie_tattooer</span>
            </a>

            {/* Divider */}
            <div style={{ width: 1, height: 32, background: "#ddd" }} />

            

            {/* Cart */}
            <button
              onClick={handleCartClick}
              className={cartShake ? "cart-shake" : ""}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                position: "relative",
                padding: 4,
              }}
              title="Cart"
            >
              <svg
                width="26"
                height="26"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#111"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
              {totalItems > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: -4,
                    right: -4,
                    background: "#c0392b",
                    color: "#fff",
                    borderRadius: "50%",
                    width: 18,
                    height: 18,
                    fontSize: 10,
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: "var(--font-oswald), sans-serif",
                  }}
                >
                  {totalItems}
                </span>
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* MOBILE NAV DROPDOWN */}
      {mobileMenuOpen && (
        <div className="mobile-nav">
          <span className="nav-link" onClick={() => { scrollTo("about"); setMobileMenuOpen(false); }}>CONTACT</span>
          <span className="nav-link" onClick={() => { setShowAllPortfolio(true); scrollTo("portfolio"); setMobileMenuOpen(false); }}>GALLERY</span>
          <span className="nav-link" onClick={() => { scrollTo("shop"); setMobileMenuOpen(false); }}>SHOP</span>
          <span className="nav-link" onClick={() => { scrollTo("findme"); setMobileMenuOpen(false); }}>STUDIO INFO</span>
        </div>
      )}

      {/* HERO */}
      <section className="hero-section">
        <div className="hero-bg-pattern" />
        <div
          style={{
            position: "relative",
            textAlign: "center",
            padding: "16px 24px",
            color: "#fff",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: "100%",
          }}
          className="fade-up"
        >
          <Image
            src="/portfolio/elliebanner.webp"
            alt="Ellie Tattooer"
            width={900}
            height={600}
            preload={true}
            style={{
              maxWidth: "min(900px, 100vw)",
              width: "auto",
              maxHeight: "calc(100dvh - 260px)",
              height: "auto",
              display: "block",
              margin: "0 auto",
            }}
          />
          <div style={{ marginTop: 16, display: "inline-flex", flexDirection: "column", alignItems: "stretch" }}>
          <p
            style={{
              fontFamily: "var(--font-oswald), sans-serif",
              fontStyle: "normal",
              fontWeight: 700,
              fontSize: 23,
              color: "#ffffff",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              textAlign: "center",
            }}
          >
            American Traditional Tattooing
          </p>
          <div
            style={{
              marginTop: 20,
              display: "flex",
              gap: 16,
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <button
              className="btn-primary"
              onClick={() => {
                setShowAllPortfolio(true);
                scrollTo("portfolio");
              }}
              style={{ fontSize: 14 }}
            >
              View Gallery
            </button>
            <button
              className="btn-mint"
              onClick={() => scrollTo("shop")}
            >
              Shop
            </button>
          </div>
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section
        id="about"
        style={{ padding: "100px 24px", background: "#92c8b7" }}
      >
        <div
          className="about-grid"
          style={{ maxWidth: 1100, margin: "0 auto" }}
        >
          <div>
            <p
              style={{
                fontFamily: "var(--font-oswald), sans-serif",
                fontStyle: "italic",
                color: "#000000",
                fontSize: 17,
                letterSpacing: "0.3em",
                marginBottom: 12,
              }}
            >
              
            </p>
            <h2 className="section-title">
              CONTACT &
              <br />
              INQUIRIES
            </h2>
            
            <p
              style={{
                fontFamily: "var(--font-oswald), sans-serif",
                fontSize: 21,
                lineHeight: 1.8,
                color: "#444",
                marginTop: 8,
              }}
            >
              You can reach me via <strong>Instagram DM</strong> or email to <strong>elliemavrou@gmail.com</strong> Thank you!
            </p>
            <p
              style={{
                fontFamily: "var(--font-oswald), sans-serif",
                fontStyle: "italic",
                fontSize: 19,
                lineHeight: 1.8,
                color: "#666",
                marginTop: 16,
              }}
            ></p>
            <div style={{ marginTop: 32, display: "flex", gap: 12 }}>
              <a
                href="https://www.instagram.com/ellie_tattooer/"
                target="_blank"
                rel="noreferrer"
                className="btn-primary"
                style={{ textDecoration: "none", display: "inline-block" }}
              >
                DM on Instagram
              </a>
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <div style={{ position: "relative" }}>
              <div
                style={{
                  width: 320,
                  height: 380,
                  background: "#111",
                  border: "3px solid #111",
                  overflow: "hidden",
                }}
              >
                <img
                  src={ELLIE_PHOTO}
                  alt="Ellie Tattooer"
                  loading="lazy"
                  decoding="async"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>
              <div
                style={{
                  position: "absolute",
                  bottom: -16,
                  right: -16,
                  width: 320,
                  height: 380,
                  border: "3px solid #c0392b",
                  zIndex: -1,
                }}
              />
            </div>
          </div>
        </div>
      </section>

      

      {/* PORTFOLIO */}
      <section id="portfolio" style={{ padding: "100px 0", background: "#92c8b7" }}>
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            padding: "0 24px",
            marginBottom: 60,
            textAlign: "center",
          }}
        >
          <h2 className="section-title">GALLERY</h2>
          
          <p
            style={{
              fontFamily: "var(--font-oswald), sans-serif",
              fontSize: 20,
              color: "#555",
            }}
          >
            A selection of my latest tattooes.
          </p>
        </div>
        <div className="portfolio-grid">
          {displayedPortfolioImages.map((fileName, idx) => (
            <div
              key={fileName}
              className="portfolio-item"
              onClick={() => setLightboxIndex(idx)}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter") setLightboxIndex(idx);
              }}
            >
              <Image
                src={`/portfolio/${fileName}`}
                alt={`Gallery ${idx + 1}`}
                fill
                sizes="(max-width: 640px) 25vw, 180px"
                style={{ objectFit: "cover" }}
              />
              <div className="portfolio-overlay">View</div>
            </div>
          ))}
        </div>
        <div style={{ textAlign: "center", marginTop: 18 }}>
          {PORTFOLIO_IMAGES.length > 27 && (
            <button
              className="btn-primary"
              onClick={() => setShowAllPortfolio((s) => !s)}
            >
              {showAllPortfolio
                ? "Show less"
                : `Show ${PORTFOLIO_IMAGES.length - 27} more`}
            </button>
          )}
        </div>
        {lightboxIndex !== null && (
          <div
            className="lightbox-overlay"
            onClick={() => setLightboxIndex(null)}
            role="dialog"
            aria-modal="true"
          >
            <button
              className="lightbox-close"
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIndex(null);
              }}
            >
              Close
            </button>
            <img
              src={`/portfolio/${PORTFOLIO_IMAGES[lightboxIndex]}`}
              alt={`Gallery ${lightboxIndex + 1}`}
              className="lightbox-img"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}
      </section>

      <div style={{ borderTop: "2px solid #111" }} />

      {/* SHOP */}
      <section
        id="shop"
        style={{
          padding: "100px 24px",
          background: "hsl(348, 100%, 86%)",
          position: "relative",
        }}
      >
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 60 }}>
            <h2 className="section-title">SHOP</h2>
          </div>
          <div className="shop-grid">
            {PRODUCTS.map((product) => (
              <div key={product.id} className="product-card">
                {/* Product Image */}
                <div className="product-media">
                  {product.images && product.images.length > 0 ? (
                    <>
                      <Image
                        src={product.images[0]}
                        alt={product.name}
                        fill
                        sizes="(max-width: 768px) 75vw, 360px"
                        style={{ objectFit: "cover" }}
                      />
                      {product.images[1] && (
                        <Image
                          src={product.images[1]}
                          alt=""
                          fill
                          sizes="(max-width: 768px) 75vw, 360px"
                          className="product-img-alt"
                          style={{ objectFit: "cover" }}
                        />
                      )}
                    </>
                  ) : (
                    <div className="product-media-placeholder">
                      <div>
                        <svg
                          width="56"
                          height="56"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                        >
                          <rect x="3" y="3" width="18" height="18" rx="2" />
                          <circle cx="8.5" cy="8.5" r="1.5" />
                          <polyline points="21 15 16 10 5 21" />
                        </svg>
                        <p
                          style={{
                            fontFamily: "var(--font-oswald), sans-serif",
                            fontSize: 11,
                            marginTop: 8,
                            letterSpacing: "0.2em",
                          }}
                        >
                          IMAGE COMING SOON
                        </p>
                      </div>
                    </div>
                  )}
                  {!soldOut && (
                    <div
                      style={{
                        position: "absolute",
                        top: 12,
                        left: 12,
                        background: "#c0392b",
                        color: "#fff",
                        fontFamily: "var(--font-oswald), sans-serif",
                        fontSize: 11,
                        fontWeight: 700,
                        letterSpacing: "0.15em",
                        padding: "4px 10px",
                        zIndex: 2,
                      }}
                    >
                      {remaining} LEFT
                    </div>
                  )}
                  {soldOut && (
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        background: "rgba(17,17,17,0.55)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 3,
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "var(--font-oswald), sans-serif",
                          color: "#fff",
                          fontSize: 22,
                          fontWeight: 700,
                          letterSpacing: "0.2em",
                          textTransform: "uppercase",
                          border: "2px solid #fff",
                          padding: "8px 18px",
                        }}
                      >
                        Sold Out
                      </span>
                    </div>
                  )}
                </div>
                {/* Product Info */}
                <div style={{ padding: 24 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginBottom: 16,
                    }}
                  >
                    <h3
                      style={{
                        fontFamily: "var(--font-oswald), sans-serif",
                        fontWeight: 700,
                        fontSize: 16,
                        letterSpacing: "0.03em",
                        textTransform: "uppercase",
                        minWidth: 0,
                      }}
                    >
                      {product.name}
                    </h3>
                    <span
                      style={{
                        fontFamily: "var(--font-oswald), sans-serif",
                        fontWeight: 600,
                        fontSize: 16,
                        color: "#c0392b",
                        flexShrink: 0,
                        marginLeft: 12,
                      }}
                    >
                      €{product.basePrice ?? product.price} + VAT
                    </span>
                  </div>
                  {(() => {
                    const inCart = cart.some((i) => i.id === product.id);
                    const justAdded = addedFeedback === product.id;
                    const viewCart = inCart && !justAdded;
                    return (
                      <button
                        className={`btn-primary ${justAdded ? "added-pulse" : ""}`}
                        style={{
                          width: "100%",
                          opacity: soldOut ? 0.5 : 1,
                          cursor: soldOut ? "not-allowed" : "pointer",
                          background: viewCart ? "#fff" : undefined,
                          color: viewCart ? "#111" : undefined,
                          border: viewCart ? "2px solid #111" : undefined,
                        }}
                        onClick={() =>
                          soldOut
                            ? undefined
                            : viewCart || justAdded
                              ? setCartOpen(true)
                              : addToCart(product)
                        }
                        disabled={soldOut}
                      >
                        {soldOut
                          ? "Sold Out"
                          : justAdded
                            ? "✓ Added to Cart"
                            : viewCart
                              ? "View Cart"
                              : "Add to Cart"}
                      </button>
                    );
                  })()}
                  {product.makingOf && (
                    <a
                      href={product.makingOf}
                      target="_blank"
                      rel="noreferrer"
                      className="ig-link"
                      style={{ justifyContent: "center", marginTop: 14 }}
                    >
                      <svg
                        width="15"
                        height="15"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <polygon points="6 4 20 12 6 20 6 4" />
                      </svg>
                      Watch the making-of
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div style={{ borderTop: "2px solid #111" }} />

      {/* CONTACT + FIND ME */}
      <section id="contact" style={{ padding: "100px 24px", background: "#92c8b7" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 60 }}>
            <p
              style={{
                fontFamily: "var(--font-oswald), sans-serif",
                fontStyle: "italic",
                color: "#1A1A1A",
                fontSize: 17,
                letterSpacing: "0.3em",
                marginBottom: 12,
              }}
            >
              
            </p>
            <h2 className="section-title">STUDIO INFO</h2>
            
          </div>
          <div className="two-col-grid">
            {/* Contact Info */}
            <div id="findme">
              <h3
                style={{
                  fontFamily: "var(--font-oswald), sans-serif",
                  fontWeight: 700,
                  fontSize: 22,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  marginBottom: 32,
                }}
              >
              
              </h3>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  marginBottom: 20,
                }}
              >
                <img
                  src={STUDIO_LOGO}
                  alt="Ritual Tattoo"
                  style={{ height: 36, width: "auto" }}
                />
                <span
                  style={{
                    fontFamily: "var(--font-oswald), sans-serif",
                    fontWeight: 600,
                    fontSize: 15,
                    letterSpacing: "0.1em",
                  }}
                >
                  RITUAL TATTOO ATHENS
                </span>
              </div>
              <div
                style={{ display: "flex", flexDirection: "column", gap: 14 }}
              >
                <div
                  style={{ display: "flex", gap: 12, alignItems: "flex-start" }}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#1A1A1A"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ flexShrink: 0, marginTop: 2 }}
                  >
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  <div>
                    <p
                      style={{
                        fontFamily: "var(--font-oswald), sans-serif",
                        fontSize: 14,
                        letterSpacing: "0.1em",
                        fontWeight: 600,
                      }}
                    >
                      ADDRESS
                    </p>
                    <p
                      style={{
                        fontFamily: "var(--font-oswald), sans-serif",
                        fontSize: 18,
                        color: "#555",
                        marginTop: 2,
                      }}
                    >
                      Fokionos 11 &amp; Ermou
                      <br />
                      Athens, 10563, Greece
                    </p>
                  </div>
                </div>
                <div
                  style={{ display: "flex", gap: 12, alignItems: "flex-start" }}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#1A1A1A"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ flexShrink: 0, marginTop: 2 }}
                  >
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.28h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.96a16 16 0 0 0 5.55 5.55l.95-.95a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21 16.92z" />
                  </svg>
                  <div>
                    <p
                      style={{
                        fontFamily: "var(--font-oswald), sans-serif",
                        fontSize: 14,
                        letterSpacing: "0.1em",
                        fontWeight: 600,
                      }}
                    >
                      PHONE
                    </p>
                    <a
                      href="tel:+302107777230"
                      style={{
                        fontFamily: "var(--font-oswald), sans-serif",
                        fontSize: 18,
                        color: "#555",
                        textDecoration: "none",
                        display: "block",
                        marginTop: 2,
                      }}
                    >
                      +30 210 77 77 230
                    </a>
                    <a
                      href="tel:+306978907800"
                      style={{
                        fontFamily: "var(--font-oswald), sans-serif",
                        fontSize: 18,
                        color: "#555",
                        textDecoration: "none",
                      }}
                    >
                      +30 697 89 07 800
                    </a>
                  </div>
                </div>
                <div
                  style={{ display: "flex", gap: 12, alignItems: "flex-start" }}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#1A1A1A"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ flexShrink: 0, marginTop: 2 }}
                  >
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  <div>
                    <p
                      style={{
                        fontFamily: "var(--font-oswald), sans-serif",
                        fontSize: 14,
                        letterSpacing: "0.1em",
                        fontWeight: 600,
                      }}
                    >
                      HOURS
                    </p>
                    <p
                      style={{
                        fontFamily: "var(--font-oswald), sans-serif",
                        fontSize: 18,
                        color: "#555",
                        marginTop: 2,
                      }}
                    >
                      Mon–Fri: 12:00–21:00
                      <br />
                      Saturday: 12:00–20:00
                    </p>
                  </div>
                </div>
                <div
                  style={{ display: "flex", gap: 12, alignItems: "flex-start" }}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#92c8b7"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ flexShrink: 0, marginTop: 2 }}
                  >
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                  </svg>
                  <div>
                    <p
                      style={{
                        fontFamily: "var(--font-oswald), sans-serif",
                        fontSize: 14,
                        letterSpacing: "0.1em",
                        fontWeight: 600,
                      }}
                    >
                      
                    </p>
                    
                    
                  </div>
                </div>
              </div>
            </div>
            {/* MAP */}
            <div>
              <div className="map-container">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3144.8!2d23.7275!3d37.9755!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x14a1bd7af504e79f%3A0x718fc53e8d527c2f!2sRitual%20Tattoo%20Athens!5e0!3m2!1sen!2sgr!4v1700000000000!5m2!1sen!2sgr"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Ritual Tattoo Athens"
                />
              </div>
              <div
                style={{
                  marginTop: 16,
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#1A1A1A"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <span
                  style={{
                    fontFamily: "var(--font-oswald), sans-serif",
                    fontSize: 13,
                    letterSpacing: "0.1em",
                    color: "#555",
                  }}
                >
                  Fokionos 11 &amp; Ermou, Athens 10563
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer
        style={{
          background: "#fff7f7",
          color: "#fff",
          padding: "28px 24px",
          borderTop: "3px solid #1A1A1A",
        }}
      >
        <div
          style={{
            maxWidth: 1400,
            margin: "0 auto",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <p
            style={{
              fontFamily: "var(--font-oswald), sans-serif",
              fontSize: 12,
              letterSpacing: "0.15em",
              color: "#1A1A1A",
            }}
          >
            © 2026 ELLIE TATTOOER. ALL RIGHTS RESERVED.
          </p>
          <p
            style={{
              fontFamily: "var(--font-oswald), sans-serif",
              fontSize: 12,
              letterSpacing: "0.15em",
              color: "#1A1A1A",
            }}
          >
            © 2026 AKOS DIGITAL. ALL RIGHTS RESERVED.
          </p>
        </div>
      </footer>

      {/* CART OVERLAY */}
      <div
        className={`cart-overlay ${cartOpen ? "open" : ""}`}
        onClick={() => setCartOpen(false)}
      />

      {/* CART DRAWER */}
      <div className={`cart-drawer ${cartOpen ? "open" : ""}`}>
        <div
          style={{
            height: 74,
            padding: "0 24px",
            borderBottom: "2px solid #111",
            background: "hsl(348, 100%, 86%)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexShrink: 0,
          }}
        >
          <h3
            style={{
              fontFamily: "var(--font-oswald), sans-serif",
              fontWeight: 700,
              fontSize: 20,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}
          >
            Your Cart{" "}
            {totalItems > 0 && (
              <span style={{ color: "#c0392b" }}>({totalItems})</span>
            )}
          </h3>
          <button
            onClick={() => setCartOpen(false)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 4,
            }}
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#111"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div style={{ flex: "0 1 auto", minHeight: 0, overflowY: "auto", padding: "24px", background: "#fff" }}>
          {cart.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 0" }}>
              <svg
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#ddd"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ margin: "0 auto 16px" }}
              >
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
              <p
                style={{
                  fontFamily: "var(--font-oswald), sans-serif",
                  fontStyle: "italic",
                  color: "#aaa",
                  fontSize: 19,
                }}
              >
                Your cart is empty
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {cart.map((item) => (
                <div
                  key={`${item.id}-${item.size}`}
                  style={{
                    padding: "12px 0",
                    borderBottom: "1px solid #eee",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                    <p
                      style={{
                        fontFamily: "var(--font-oswald), sans-serif",
                        fontWeight: 600,
                        fontSize: 14,
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                      }}
                    >
                      {item.name}
                    </p>
                    <span
                      style={{
                        fontFamily: "var(--font-oswald), sans-serif",
                        fontWeight: 600,
                        color: "#c0392b",
                        flexShrink: 0,
                        marginLeft: 12,
                      }}
                    >
                      €{(item.price * item.qty).toFixed(2)}
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    {/* Qty stepper */}
                    <div style={{ display: "flex", alignItems: "center", border: "2px solid #111", height: 32 }}>
                      <button
                        onClick={() => updateQty(item.id, item.size, -1)}
                        style={{ width: 32, height: "100%", background: "none", border: "none", cursor: "pointer", fontSize: 18, lineHeight: 1, color: "#111" }}
                      >
                        −
                      </button>
                      <span
                        style={{
                          width: 28,
                          textAlign: "center",
                          fontFamily: "var(--font-oswald), sans-serif",
                          fontWeight: 600,
                          fontSize: 14,
                          borderLeft: "2px solid #111",
                          borderRight: "2px solid #111",
                          lineHeight: "28px",
                        }}
                      >
                        {item.qty}
                      </span>
                      <button
                        onClick={() => updateQty(item.id, item.size, +1)}
                        disabled={item.qty >= maxPerOrder}
                        style={{ width: 32, height: "100%", background: "none", border: "none", cursor: item.qty >= maxPerOrder ? "not-allowed" : "pointer", fontSize: 18, lineHeight: 1, color: item.qty >= maxPerOrder ? "#ccc" : "#111" }}
                      >
                        +
                      </button>
                    </div>
                    {/* Remove */}
                    <button
                      onClick={() => removeFromCart(item.id, item.size)}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "#aaa", fontSize: 13, fontFamily: "var(--font-oswald), sans-serif", letterSpacing: "0.05em" }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        {cart.length > 0 && (
          <div style={{ padding: "24px", borderTop: "2px solid #111", background: "#fff", flexShrink: 0 }}>
            {/* Postal code → auto-detect zone */}
            <label
              htmlFor="postal-code"
              style={{
                display: "block",
                fontFamily: "var(--font-oswald), sans-serif",
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                marginBottom: 6,
              }}
            >
              Enter your postal code
            </label>
            <div style={{ position: "relative", marginBottom: 12 }}>
              <input
                id="postal-code"
                type="text"
                inputMode="numeric"
                maxLength={5}
                placeholder="e.g. 10431"
                value={postalCode}
                onChange={(e) => {
                  const v = e.target.value.replace(/\D/g, "").slice(0, 5);
                  setPostalCode(v);
                  setCheckoutError(null);
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
                style={{
                  width: "100%",
                  padding: "10px 40px 10px 12px",
                  border: `2px solid ${postalCode.length === 5 && !selectedZone && shipZone !== "international" ? "#c0392b" : "#111"}`,
                  background: "#fff",
                  fontFamily: "var(--font-oswald), sans-serif",
                  fontSize: 16,
                  letterSpacing: "0.1em",
                  outline: "none",
                }}
              />
              {postalCode.length === 5 && (
                <span
                  style={{
                    position: "absolute",
                    right: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    fontSize: 16,
                    color: selectedZone ? "#2ecc71" : "#c0392b",
                  }}
                >
                  {selectedZone ? "✓" : "✗"}
                </span>
              )}
            </div>

            {/* Prompt to enter a postal code before any zone resolves */}
            {shipZone === "" && (
              <p
                style={{
                  fontFamily: "var(--font-oswald), sans-serif",
                  fontStyle: "italic",
                  fontSize: 13,
                  color: "#888",
                  lineHeight: 1.5,
                }}
              >
                To calculate shipping costs and delivery time with ELTA Courier.
              </p>
            )}

            {/* Detected zone chip */}
            {selectedZone && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "10px 14px",
                  background: "hsl(348,100%,86%)",
                  border: "2px solid #111",
                  marginBottom: 16,
                  fontFamily: "var(--font-oswald), sans-serif",
                }}
              >
                <span style={{ fontSize: 14, fontWeight: 600 }}>
                  {selectedZone.label}
                </span>
                <span style={{ fontSize: 13, color: "#555" }}>
                  {selectedZone.delivery}
                </span>
              </div>
            )}

            {/* International */}
            {shipZone === "international" && (
              <div
                style={{
                  border: "2px solid #111",
                  padding: 16,
                  background: "#fff7f7",
                  marginBottom: 16,
                }}
              >
                <p
                  style={{
                    fontFamily: "var(--font-oswald), sans-serif",
                    fontSize: 15,
                    lineHeight: 1.5,
                    marginBottom: 12,
                  }}
                >
                  We currently ship within Greece only. For international orders,
                  send a quick DM and we’ll arrange it.
                </p>
                <a
                  href={INTERNATIONAL_DM_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-primary"
                  style={{
                    display: "block",
                    width: "100%",
                    textAlign: "center",
                    textDecoration: "none",
                    fontSize: 14,
                    padding: "14px",
                  }}
                >
                  DM on Instagram to order
                </a>
              </div>
            )}

            {/* Unrecognised */}
            {shipZone === "unknown" && (
              <p
                style={{
                  fontFamily: "var(--font-oswald), sans-serif",
                  fontSize: 13,
                  color: "#c0392b",
                  marginBottom: 16,
                  lineHeight: 1.5,
                }}
              >
                We couldn’t verify this postal code. Double-check it or{" "}
                <a
                  href={INTERNATIONAL_DM_URL}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: "#c0392b" }}
                >
                  DM us
                </a>
                .
              </p>
            )}

            {/* Totals + checkout (only when zone known) */}
            {selectedZone && (
              <>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 6,
                    fontFamily: "var(--font-oswald), sans-serif",
                    fontSize: 15,
                    color: "#444",
                  }}
                >
                  <span>Subtotal</span>
                  <span>€{cartTotal.toFixed(2)}</span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 6,
                    fontFamily: "var(--font-oswald), sans-serif",
                    fontSize: 15,
                    color: "#444",
                  }}
                >
                  <span>Shipping</span>
                  <span>€{shippingCost.toFixed(2)}</span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    margin: "10px 0 16px",
                    paddingTop: 10,
                    borderTop: "1px solid #ddd",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "var(--font-oswald), sans-serif",
                      fontWeight: 600,
                      fontSize: 16,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                    }}
                  >
                    Total
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--font-oswald), sans-serif",
                      fontWeight: 700,
                      fontSize: 20,
                      color: "#c0392b",
                    }}
                  >
                    €{(cartTotal + shippingCost).toFixed(2)}
                  </span>
                </div>
                <button
                  className="btn-primary"
                  style={{
                    width: "100%",
                    fontSize: 14,
                    padding: "14px",
                    opacity: checkingOut ? 0.6 : 1,
                    cursor: checkingOut ? "wait" : "pointer",
                  }}
                  onClick={handleCheckout}
                  disabled={checkingOut}
                >
                  {checkingOut ? "Redirecting to Stripe…" : "Proceed to Checkout"}
                </button>
                {checkoutError && (
                  <p
                    style={{
                      fontFamily: "var(--font-oswald), sans-serif",
                      fontSize: 14,
                      color: "#111",
                      textAlign: "center",
                      marginTop: 8,
                    }}
                  >
                    {checkoutError}
                  </p>
                )}
                <p
                  style={{
                    fontFamily: "var(--font-oswald), sans-serif",
                    fontStyle: "italic",
                    fontSize: 13,
                    color: "#aaa",
                    textAlign: "center",
                    marginTop: 10,
                  }}
                >
                  Secure checkout via Stripe
                </p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
