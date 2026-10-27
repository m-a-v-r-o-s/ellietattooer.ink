import { useState, useEffect, useCallback, useRef } from "react";
import { motion, useMotionValue } from "motion/react";
import { project, rubberband } from "@/lib/spring";
import { settle, useDrag } from "@/lib/gestures";
import { SHIPPING_ZONES, INTERNATIONAL_DM_URL, SCARCE_PRODUCT_ID } from "@/lib/shop";
import { zoneFromPostalCode } from "@/lib/postal-zones";
import CheckoutPanel from "./CheckoutPanel";
import {
  FILL, MULTI_SIZE_IDS, capFor, closeCart, refreshAvailability, removeFromCart, set,
  totalItems as countItems, updateQty, useShop, type Img,
} from "./cart";

/**
 * Cart drawer with the in-drawer Stripe payment step, plus the order status
 * banner shown on the return trip from Stripe. `thumbs` maps each product
 * image path to its optimized thumbnail, `betty` is the empty-cart sticker.
 */
export default function CartDrawer({ thumbs, betty }: { thumbs: Record<string, Img>; betty: Img }) {
  const { cart, cartOpen, soldOut, clientSecret } = useShop();
  const [postalCode, setPostalCode] = useState("");
  const [shipZone, setShipZone] = useState("");
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [checkingOut, setCheckingOut] = useState(false);
  const [orderStatus, setOrderStatus] = useState<"success" | "cancel" | null>(
    null,
  );
  const setClientSecret = (clientSecret: string | null) => set({ clientSecret });

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
            set({ cart: [], clientSecret: null });
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
  }, []);

  const totalItems = countItems(cart);
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
          set({ soldOut: true });
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
  }, [checkingOut, soldOut, cartHasScarceItem, cart, shipZone]);

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
        if (wantOpen) set({ cartOpen: true });
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

  return (
    <>
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
              <img {...betty} sizes="110px" alt="" width={110} height={94} loading="lazy" decoding="async" style={{ color: "transparent" }} />
              <p>Your cart is empty</p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={`${item.id}-${item.size}`} className="cd-item">
                {item.images?.[0] && (
                  <div className="cd-thumb">
                    <img {...thumbs[item.images[0]]} alt="" sizes="72px" loading="lazy" decoding="async" style={FILL} />
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
    </>
  );
}
