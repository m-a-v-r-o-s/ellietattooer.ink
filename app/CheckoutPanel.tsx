"use client";

import { useState, type FormEvent } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  CheckoutElementsProvider,
  useCheckoutElements,
  ContactDetailsElement,
  ShippingAddressElement,
  PaymentElement,
} from "@stripe/react-stripe-js/checkout";

// Loaded once at module scope, not per-render, per Stripe's own guidance.
const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = PUBLISHABLE_KEY ? loadStripe(PUBLISHABLE_KEY) : null;

const labelStyle: React.CSSProperties = {
  fontFamily: "var(--font-dm-mono), ui-monospace, monospace",
  fontSize: 12,
  fontWeight: 600,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  marginBottom: 8,
};

// Stripe's fields in the site's sticker style. System monospace rather than a
// Google-hosted font, so the payment iframe makes no extra third-party request.
const STRIPE_APPEARANCE = {
  theme: "stripe" as const,
  variables: {
    colorPrimary: "#141112",
    colorText: "#141112",
    colorBackground: "#ffffff",
    colorDanger: "#b42318",
    borderRadius: "12px",
    fontFamily: 'ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace',
  },
  rules: {
    ".Input": { border: "2.5px solid #141112", boxShadow: "none" },
    ".Input:focus": { boxShadow: "0 0 0 3px #FFB8C6" },
    ".Tab": { border: "2.5px solid #141112" },
    ".Tab--selected": { backgroundColor: "#FFB8C6" },
  },
};

export default function CheckoutPanel({ clientSecret }: { clientSecret: string }) {
  if (!stripePromise) {
    return (
      <p style={{ fontFamily: "var(--font-dm-mono), ui-monospace, monospace", fontSize: 14, color: "#c0392b" }}>
        Payment isn’t set up yet — please check back soon.
      </p>
    );
  }

  return (
    <CheckoutElementsProvider
      stripe={stripePromise}
      // No defaultValues.shippingAddress: prefilling is a client-side address
      // update, which server_only sessions reject at load.
      options={{ clientSecret, elementsOptions: { appearance: STRIPE_APPEARANCE } }}
    >
      <PaymentForm />
    </CheckoutElementsProvider>
  );
}

function PaymentForm() {
  const checkoutState = useCheckoutElements();
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [savingAddress, setSavingAddress] = useState(false);
  const [editingAddress, setEditingAddress] = useState(true);
  const [phone, setPhone] = useState("");

  if (checkoutState.type === "loading") {
    return (
      <p style={{ fontFamily: "var(--font-dm-mono), ui-monospace, monospace", fontSize: 14, color: "#888" }}>
        Loading payment form…
      </p>
    );
  }
  if (checkoutState.type === "error") {
    return (
      <p style={{ fontFamily: "var(--font-dm-mono), ui-monospace, monospace", fontSize: 14, color: "#c0392b" }}>
        {checkoutState.error.message}
      </p>
    );
  }

  const { checkout } = checkoutState;

  // The session only accepts a shipping address from our server (see
  // /api/checkout/shipping), which prices shipping from it in the same step.
  // Stripe also refuses to confirm while the address form is mounted, so a
  // saved address collapses to a summary with an Edit link.
  const saveAddress = async () => {
    const value = await checkout.getShippingAddressElement()?.getValue();
    if (!value?.complete) {
      setMessage("Please complete your shipping address.");
      return;
    }
    // The courier needs a phone number (phone_number_collection on the
    // session), and Stripe's address element can't collect one here.
    if (!/^\+?[\d\s()-]{8,20}$/.test(phone.trim())) {
      setMessage("Please enter a phone number for the courier.");
      return;
    }
    setSavingAddress(true);
    setMessage(null);
    try {
      const result = await checkout.runServerUpdate(async () => {
        const res = await fetch("/api/checkout/shipping", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId: checkout.id,
            name: value.value.name,
            address: value.value.address,
          }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error ?? "Couldn’t update shipping. Please try again.");
        }
      });
      if (result.type === "error") throw new Error(result.error.message);
      await checkout.updatePhoneNumber(phone.trim());
      setEditingAddress(false);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Couldn’t update shipping. Please try again.");
    } finally {
      setSavingAddress(false);
    }
  };

  const shippingOption = checkout.shipping?.shippingOption;
  const saved = checkout.shippingAddress;
  const canPay = !editingAddress && checkout.canConfirm && !submitting;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);
    try {
      const result = await checkout.confirm();
      // On success Stripe navigates the browser to return_url, nothing left
      // to do here. Only an immediate error (e.g. a declined card) returns.
      if (result.type === "error") throw new Error(result.error.message);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Payment failed. Please try again.");
      setSubmitting(false);
    }
  };

  const smallText: React.CSSProperties = { fontFamily: "var(--font-dm-mono), ui-monospace, monospace", fontSize: 14 };

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ marginBottom: 16 }}>
        <div style={labelStyle}>Email</div>
        <ContactDetailsElement />
      </div>
      <div style={{ marginBottom: 16 }}>
        <div style={labelStyle}>Shipping address</div>
        {editingAddress || !saved ? (
          <>
            <ShippingAddressElement />
            <label style={{ ...smallText, display: "block", marginTop: 8 }}>
              Phone (for the courier)
              <input
                type="tel"
                autoComplete="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                style={{ display: "block", width: "100%", marginTop: 4, padding: "10px 12px", border: "2.5px solid #141112", borderRadius: 12, fontSize: 16, background: "#fff" }}
              />
            </label>
            <button
              type="button"
              className="btn-primary"
              onClick={saveAddress}
              disabled={savingAddress}
              style={{ width: "100%", marginTop: 8 }}
            >
              {savingAddress ? "Saving…" : "Use this address"}
            </button>
          </>
        ) : (
          <div style={smallText}>
            <div>{saved.name}</div>
            <div>{[saved.address.line1, saved.address.line2].filter(Boolean).join(", ")}</div>
            <div>{[saved.address.postal_code, saved.address.city].filter(Boolean).join(" ")}</div>
            <div>{phone}</div>
            {shippingOption && (
              <p style={{ marginTop: 8 }}>
                Shipping ({shippingOption.displayName}): {shippingOption.amount} · Total{" "}
                {checkout.total.total.amount}
              </p>
            )}
            <button
              type="button"
              onClick={() => setEditingAddress(true)}
              style={{ ...smallText, background: "none", border: 0, padding: 0, textDecoration: "underline", cursor: "pointer", marginTop: 4 }}
            >
              Edit address
            </button>
          </div>
        )}
      </div>
      <div style={{ marginBottom: 16 }}>
        <div style={labelStyle}>Payment</div>
        <PaymentElement />
      </div>
      {message && (
        <p style={{ ...smallText, color: "#c0392b", marginBottom: 12 }}>
          {message}
        </p>
      )}
      <button
        type="submit"
        className="btn-primary"
        disabled={!canPay}
        style={{ width: "100%" }}
      >
        {submitting ? "Processing…" : "Pay now"}
      </button>
    </form>
  );
}
