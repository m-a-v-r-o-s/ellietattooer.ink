import type { ReactNode } from "react";
import Link from "next/link";

// Shared chrome for the two legal pages (privacy, terms). Not used anywhere
// else, so it stays a plain prop-driven shell rather than a layout route —
// two call sites don't earn a route group.
export default function LegalPage({
  title,
  lastUpdated,
  children,
}: {
  title: string;
  lastUpdated: string;
  children: ReactNode;
}) {
  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        background: "#fff7f7",
        color: "#111",
        fontFamily: "var(--font-oswald), sans-serif",
      }}
    >
      <header
        style={{
          borderBottom: "2px solid #111",
          padding: "20px 24px",
        }}
      >
        <Link
          href="/"
          style={{
            color: "#111",
            textDecoration: "none",
            fontWeight: 600,
            fontSize: 13,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
          }}
        >
          ★ Ellie Tattooer ★
        </Link>
      </header>

      <main style={{ flex: 1, padding: "64px 24px" }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <h1
            style={{
              fontWeight: 700,
              fontSize: "clamp(28px, 5vw, 44px)",
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              marginBottom: 8,
            }}
          >
            {title}
          </h1>
          <p style={{ fontSize: 13, color: "#888", marginBottom: 40 }}>
            Last updated: {lastUpdated}
          </p>
          <div
            style={{
              fontSize: 16,
              lineHeight: 1.75,
              color: "#333",
            }}
          >
            {children}
          </div>
        </div>
      </main>

      <footer
        style={{
          borderTop: "2px solid #111",
          padding: "24px",
          display: "flex",
          flexWrap: "wrap",
          gap: 20,
          justifyContent: "center",
        }}
      >
        <Link href="/" style={{ color: "#111", fontSize: 12, letterSpacing: "0.1em", textTransform: "uppercase" }}>
          Home
        </Link>
        <Link href="/privacy" style={{ color: "#111", fontSize: 12, letterSpacing: "0.1em", textTransform: "uppercase" }}>
          Privacy Policy
        </Link>
        <Link href="/terms" style={{ color: "#111", fontSize: 12, letterSpacing: "0.1em", textTransform: "uppercase" }}>
          Terms of Service
        </Link>
      </footer>
    </div>
  );
}
