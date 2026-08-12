import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "The terms that apply to browsing ellietattooer.com and buying prints from its online shop.",
  openGraph: {
    title: "Terms of Service | Ellie Tattooer",
    description:
      "The terms that apply to browsing ellietattooer.com and buying prints from its online shop.",
    url: "/terms",
    type: "website",
  },
};

export default function TermsOfService() {
  return (
    <LegalPage title="Terms of Service" lastUpdated="August 12, 2026">
      <p style={{ marginBottom: 24 }}>
        These terms apply to your use of <strong>ellietattooer.com</strong>{" "}
        and any purchase made through its shop. By using the site or placing
        an order, you agree to them.
      </p>

      <h2 style={sectionH2}>Tattoo services</h2>
      <p style={{ marginBottom: 24 }}>
        This website is informational and promotional for tattoo work done in
        person at Ritual Tattoo Athens (Fokionos 11 &amp; Ermou, Athens
        10563, Greece). It is not a booking system and does not create a
        contract for tattoo services — bookings, consultations, consent
        forms, pricing, and aftercare for actual tattoo work are arranged
        directly with the studio, not through this site.
      </p>

      <h2 style={sectionH2}>The online shop</h2>
      <p style={{ marginBottom: 12 }}>
        The shop currently sells one item, a limited-edition print, in
        strictly limited quantity. Prices are shown in EUR and include 24%
        Greek VAT. Shipping is currently offered within Greece only;
        international buyers are invited to arrange a purchase by Instagram
        DM instead.
      </p>
      <p style={{ marginBottom: 12 }}>
        Checkout and payment are processed by <strong>Stripe</strong>. An
        order is only confirmed once payment succeeds and you&apos;re shown a
        confirmation on this site; Stripe also emails you a receipt directly.
      </p>
      <p style={{ marginBottom: 24 }}>
        <strong>Cancellations &amp; returns.</strong> Contact{" "}
        <a href="mailto:elliemavrou@gmail.com" style={linkStyle}>
          elliemavrou@gmail.com
        </a>{" "}
        as soon as possible after ordering if you need to change or cancel
        it. As a consumer in the EU/Greece you are generally entitled to a
        14-day withdrawal right on goods ordered online; if the print arrives
        damaged or isn&apos;t as described, contact me for a replacement or
        refund.
      </p>

      <h2 style={sectionH2}>Intellectual property</h2>
      <p style={{ marginBottom: 24 }}>
        All tattoo designs, photographs, and artwork shown on this site are
        the property of Ellie Tattooer (or used with permission) and may not
        be reproduced, copied, or used commercially without written
        permission. Buying a print grants you the physical print itself, not
        the underlying artwork&apos;s copyright.
      </p>

      <h2 style={sectionH2}>Third-party links</h2>
      <p style={{ marginBottom: 24 }}>
        This site links to Instagram and embeds a Google Maps view. Those
        services operate under their own terms and privacy policies, which
        are outside my control.
      </p>

      <h2 style={sectionH2}>Limitation of liability</h2>
      <p style={{ marginBottom: 24 }}>
        This site is provided as-is. To the extent permitted by law, Ellie
        Tattooer is not liable for indirect or consequential losses arising
        from use of the site, except where liability cannot legally be
        excluded (such as for defective products under Greek/EU consumer
        law).
      </p>

      <h2 style={sectionH2}>Governing law</h2>
      <p style={{ marginBottom: 24 }}>
        These terms are governed by the laws of Greece, without prejudice to
        any mandatory consumer-protection rights you have in your country of
        residence.
      </p>

      <h2 style={sectionH2}>Changes</h2>
      <p style={{ marginBottom: 24 }}>
        These terms may be updated occasionally; the &quot;Last updated&quot; date
        above will reflect the latest version.
      </p>

      <h2 style={sectionH2}>Contact</h2>
      <p>
        Questions about these terms: email{" "}
        <a href="mailto:elliemavrou@gmail.com" style={linkStyle}>
          elliemavrou@gmail.com
        </a>{" "}
        or DM{" "}
        <a
          href="https://www.instagram.com/ellie_tattooer/"
          target="_blank"
          rel="noreferrer"
          style={linkStyle}
        >
          @ellie_tattooer
        </a>{" "}
        on Instagram.
      </p>
    </LegalPage>
  );
}

const sectionH2: React.CSSProperties = {
  fontWeight: 700,
  fontSize: 20,
  letterSpacing: "0.04em",
  textTransform: "uppercase",
  marginTop: 8,
  marginBottom: 12,
};

const linkStyle: React.CSSProperties = {
  color: "#c0392b",
  textDecoration: "underline",
};
