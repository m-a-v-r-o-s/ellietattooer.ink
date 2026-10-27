import type { Metadata, Viewport } from "next";
import { DM_Mono, Oswald, Shrikhand } from "next/font/google";
import Script from "next/script";
import { SITE_URL, SITE_NAME } from "@/lib/site";
import "./globals.css";

const oswald = Oswald({
  variable: "--font-oswald",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

// Home page display face (matches the bubble wordmark) and its label/body face.
const shrikhand = Shrikhand({
  variable: "--font-shrikhand",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});
const dmMono = DM_Mono({
  variable: "--font-dm-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

// Header is #fff7f7 in both schemes (the site has no dark theme).
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fff7f7" },
    { media: "(prefers-color-scheme: dark)", color: "#fff7f7" },
  ],
  colorScheme: "light",
};

const DESCRIPTION =
  "American Traditional tattoo artist working out of Ritual Tattoo Athens, Fokionos 11 & Ermou. Τατουάζ στην Αθήνα. Browse the gallery, shop signed prints, and get in touch to book a session.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    // The starred wordmark is the on-page branding; the title tag is what a
    // search result shows, so it names the craft and the city instead.
    default: "Ellie Tattooer: American Traditional Tattoo Artist in Athens",
    template: `%s | ${SITE_NAME}`,
  },
  description: DESCRIPTION,
  // Resolved per route against metadataBase, and inherited by the legal pages
  // that define their own metadata. Apex and www both answer, so without this
  // the site competes with itself for every page. www is the canonical host,
  // matching the other sites and the sitemap registered in Search Console.
  alternates: { canonical: "./" },
  openGraph: {
    title: "★ ELLIE TATTOOER ★",
    description: DESCRIPTION,
    url: "/",
    siteName: SITE_NAME,
    type: "website",
    images: [{ url: "/portfolio/elliebanner.webp", width: 1800, height: 1200 }],
  },
};

// Google Analytics (GA4) is unwired until NEXT_PUBLIC_GA_MEASUREMENT_ID is
// set — see .env.example. Consent defaults to denied; the cookie banner in
// app/page.tsx calls window.gtag('consent', 'update', ...) once the visitor
// chooses, via the existing applyConsent() helper.
const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

// Studio entity schema. Address, phones and the studio link are the same ones
// rendered in the Studio Info section; the profile links come from the header
// and contact sections.
const STUDIO_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "TattooParlor",
  "@id": `${SITE_URL}/#studio`,
  name: SITE_NAME,
  url: SITE_URL,
  description: DESCRIPTION,
  image: `${SITE_URL}/portfolio/elliebanner.webp`,
  email: "elliemavrou@gmail.com",
  telephone: "+30 210 77 77 230",
  address: {
    "@type": "PostalAddress",
    streetAddress: "Fokionos 11 & Ermou",
    addressLocality: "Athens",
    postalCode: "10563",
    addressCountry: "GR",
  },
  areaServed: { "@type": "City", name: "Athens" },
  knowsLanguage: ["el", "en"],
  sameAs: [
    "https://www.instagram.com/ellie_tattooer/",
    "https://www.instagram.com/ritualtattooathens/",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${oswald.variable} ${shrikhand.variable} ${dmMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(STUDIO_SCHEMA) }}
        />
        {children}
        {GA_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="ga-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                window.gtag = gtag;
                gtag('js', new Date());
                gtag('consent', 'default', { analytics_storage: 'denied' });
                gtag('config', '${GA_ID}');
              `}
            </Script>
          </>
        )}
      </body>
    </html>
  );
}
