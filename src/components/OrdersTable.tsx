import type { Order } from "@/lib/stripe";
import { getProduct, SHIPPING_ZONES } from "@/lib/shop";
import { zoneFromPostalCode } from "@/lib/postal-zones";

// Rendered on the server only (no client directive), so none of this ships
// to the browser. src/pages/admin/orders.astro does the auth and the Stripe call.

function formatMoney(cents: number | null, currency: string | null) {
  if (cents === null) return "—";
  return new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency: (currency ?? "eur").toUpperCase(),
  }).format(cents / 100);
}

function formatDate(unixSeconds: number) {
  return new Date(unixSeconds * 1000).toLocaleString("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function itemsLabel(items: Order["items"]) {
  return items
    .map((i) => {
      const name = getProduct(i.id)?.name ?? i.id;
      return `${i.qty}× ${name}${i.size ? ` (${i.size})` : ""}`;
    })
    .join(", ");
}

function zoneLabel(zoneId: string | null) {
  if (!zoneId) return null;
  return SHIPPING_ZONES.find((z) => z.id === zoneId)?.label ?? zoneId;
}

/**
 * The zone charged at checkout comes from a postal code the buyer typed on
 * our site, before Stripe collects their real shipping address. Nothing
 * stops those from disagreeing (an Athens code entered to get cheap
 * shipping, a real address in Crete). Flag it here whenever the real
 * address resolves to a pricier zone than what was actually charged.
 */
function shippingShortfall(order: Order) {
  const code = order.address?.postal_code;
  if (!order.zone || !code) return null;

  const real = zoneFromPostalCode(code);
  if (!real || real === "international" || real.id === order.zone) return null;

  const charged = SHIPPING_ZONES.find((z) => z.id === order.zone);
  if (!charged || real.amount <= charged.amount) return null;

  return { real, charged };
}

export default function OrdersTable({
  configured,
  orders,
  hasMore,
  nextCursor,
  after,
}: {
  configured: boolean;
  orders: Order[];
  hasMore: boolean;
  nextCursor: string | null;
  after?: string;
}) {
  if (!configured) {
    return (
      <main style={{ padding: 32, fontFamily: "system-ui, sans-serif" }}>
        <h1>Orders</h1>
        <p>STRIPE_SECRET_KEY isn&apos;t configured, so there&apos;s nothing to show yet.</p>
      </main>
    );
  }

  return (
    <main style={{ padding: "32px 24px", fontFamily: "system-ui, sans-serif", maxWidth: 1100, margin: "0 auto" }}>
      <h1 style={{ marginBottom: 4 }}>Orders</h1>
      <p style={{ color: "#666", marginBottom: 24 }}>
        Paid orders, most recent first. Source of truth is Stripe &mdash; nothing here is stored separately.
      </p>

      {orders.length === 0 ? (
        <p>No orders {after ? "on this page" : "yet"}.</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "2px solid #111" }}>
                <th style={{ padding: "8px 12px" }}>Date</th>
                <th style={{ padding: "8px 12px" }}>Customer</th>
                <th style={{ padding: "8px 12px" }}>Items</th>
                <th style={{ padding: "8px 12px" }}>Ship to</th>
                <th style={{ padding: "8px 12px" }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                const shortfall = shippingShortfall(order);
                return (
                  <tr key={order.id} style={{ borderBottom: "1px solid #ddd", verticalAlign: "top" }}>
                    <td style={{ padding: "10px 12px", whiteSpace: "nowrap" }}>{formatDate(order.created)}</td>
                    <td style={{ padding: "10px 12px" }}>
                      <div>{order.name ?? "—"}</div>
                      <div style={{ color: "#666" }}>{order.email ?? "—"}</div>
                      {order.phone && <div style={{ color: "#666" }}>{order.phone}</div>}
                    </td>
                    <td style={{ padding: "10px 12px" }}>{itemsLabel(order.items) || "—"}</td>
                    <td style={{ padding: "10px 12px" }}>
                      {order.address ? (
                        <>
                          <div>{[order.address.line1, order.address.line2].filter(Boolean).join(", ")}</div>
                          <div>{[order.address.postal_code, order.address.city].filter(Boolean).join(" ")}</div>
                          {zoneLabel(order.zone) && <div style={{ color: "#666" }}>{zoneLabel(order.zone)}</div>}
                          {shortfall && (
                            <div style={{ color: "#b91c1c", fontWeight: 600, marginTop: 4 }}>
                              Shipping underpaid: postal code is {shortfall.real.label} (
                              {formatMoney(shortfall.real.amount, order.currency)}), charged{" "}
                              {shortfall.charged.label} ({formatMoney(shortfall.charged.amount, order.currency)})
                            </div>
                          )}
                        </>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td style={{ padding: "10px 12px", whiteSpace: "nowrap" }}>
                      {formatMoney(order.amountTotal, order.currency)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {hasMore && nextCursor && (
        <div style={{ marginTop: 20 }}>
          <a href={`/admin/orders?after=${nextCursor}`}>Older orders →</a>
        </div>
      )}
    </main>
  );
}
