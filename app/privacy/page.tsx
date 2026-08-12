import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How Ellie Tattooer collects, uses, and protects your data when you browse, contact, or buy from this site.",
  openGraph: {
    title: "Privacy Policy | Ellie Tattooer",
    description:
      "How Ellie Tattooer collects, uses, and protects your data when you browse, contact, or buy from this site.",
    url: "/privacy",
    type: "website",
  },
};

export default function PrivacyPolicy() {
  return (
    <LegalPage title="Privacy Policy" lastUpdated="August 12, 2026">
      <p style={{ marginBottom: 24 }}>
        This Privacy Policy explains how Ellie Tattooer (&quot;I&quot;, &quot;me&quot;,
        &quot;this site&quot;) handles information collected through{" "}
        <strong>ellietattooer.com</strong>. I work as a tattoo artist at Ritual
        Tattoo Athens, Fokionos 11 &amp; Ermou, Athens 10563, Greece.
      </p>

      <h2 style={sectionH2}>Information I collect</h2>
      <p style={{ marginBottom: 12 }}>
        <strong>When you contact me</strong> (by Instagram DM or email), I
        receive whatever you send me — typically your name, contact details,
        and tattoo ideas. This is used only to reply to you and, if you book,
        to plan the appointment.
      </p>
      <p style={{ marginBottom: 12 }}>
        <strong>When you buy a print in the shop</strong>, checkout is handled
        entirely by <strong>Stripe</strong>. I never see or store your card
        details. Stripe collects your name, email, shipping address, and
        payment information to process the order and ships that data to me
        only as needed to fulfil it (address, order contents). See{" "}
        <a href="https://stripe.com/privacy" target="_blank" rel="noreferrer" style={linkStyle}>
          Stripe&apos;s Privacy Policy
        </a>{" "}
        for how they handle it.
      </p>
      <p style={{ marginBottom: 24 }}>
        <strong>Cookies.</strong> Essential cookies keep the site and cart
        working and remember your cookie choice. With your consent, an
        optional analytics cookie helps me understand how the site is used —
        see the cookie banner on the homepage to change your choice at any
        time. No advertising or cross-site tracking cookies are used.
      </p>

      <h2 style={sectionH2}>Third parties</h2>
      <p style={{ marginBottom: 24 }}>
        This site embeds a Google Maps view of the studio and links out to
        Instagram. Those services may collect data under their own privacy
        policies when you interact with their embedded or linked content. If
        analytics is enabled and you&apos;ve consented, Google Analytics
        processes anonymised usage data — see{" "}
        <a href="https://policies.google.com/privacy" target="_blank" rel="noreferrer" style={linkStyle}>
          Google&apos;s Privacy Policy
        </a>
        .
      </p>

      <h2 style={sectionH2}>Data retention</h2>
      <p style={{ marginBottom: 24 }}>
        Messages and inquiries are kept only as long as needed to answer you
        or complete a booking. Order records are retained by Stripe per their
        own policy and as required for tax and accounting purposes.
      </p>

      <h2 style={sectionH2}>Your rights</h2>
      <p style={{ marginBottom: 24 }}>
        You can ask what information I hold about you, ask me to correct or
        delete it, or withdraw analytics consent at any time, by emailing{" "}
        <a href="mailto:elliemavrou@gmail.com" style={linkStyle}>
          elliemavrou@gmail.com
        </a>
        . If you&apos;re in the EU/EEA, you also have the right to lodge a
        complaint with your local data protection authority.
      </p>

      <h2 style={sectionH2}>Children</h2>
      <p style={{ marginBottom: 24 }}>
        This site is not directed at children, and tattoo services are only
        provided to adults consistent with Greek law.
      </p>

      <h2 style={sectionH2}>Changes to this policy</h2>
      <p style={{ marginBottom: 24 }}>
        This policy may be updated occasionally to reflect changes to the
        site or how it&apos;s run. The &quot;Last updated&quot; date at the top of this
        page will change accordingly.
      </p>

      <h2 style={sectionH2}>Contact</h2>
      <p>
        Questions about this policy: email{" "}
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
