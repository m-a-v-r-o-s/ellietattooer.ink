import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Page Not Found",
  description: "This page doesn't exist. Head back to Ellie Tattooer's homepage.",
};

export default function NotFound() {
  return (
    <main
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "80px 24px",
        background: "#fecdbf",
        color: "#111",
        fontFamily: "var(--font-oswald), sans-serif",
      }}
    >
      <p
        style={{
          fontStyle: "italic",
          letterSpacing: "0.3em",
          fontSize: 15,
          color: "#c0392b",
          marginBottom: 12,
        }}
      >
        404
      </p>
      <h1
        style={{
          fontWeight: 700,
          fontSize: "clamp(32px, 6vw, 56px)",
          letterSpacing: "0.05em",
          textTransform: "uppercase",
          lineHeight: 1.1,
          marginBottom: 20,
        }}
      >
        This piece isn&apos;t inked yet
      </h1>
      <p
        style={{
          fontSize: 18,
          color: "#444",
          maxWidth: 480,
          lineHeight: 1.6,
          marginBottom: 36,
        }}
      >
        The page you&apos;re looking for doesn&apos;t exist or has moved. Head back
        to the homepage to see the gallery and shop.
      </p>
      <Link
        href="/"
        style={{
          background: "#111",
          color: "#fff",
          border: "2px solid #111",
          padding: "14px 32px",
          fontWeight: 600,
          fontSize: 13,
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          textDecoration: "none",
        }}
      >
        Back to Homepage
      </Link>
    </main>
  );
}
