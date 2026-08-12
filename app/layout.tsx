import type { Metadata } from "next";
import { Oswald } from "next/font/google";
import Script from "next/script";
import { SITE_URL, SITE_NAME } from "@/lib/site";
import "./globals.css";

const oswald = Oswald({
  variable: "--font-oswald",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const DESCRIPTION =
  "Ellie Tattooer — American Traditional tattoo artist at Ritual Tattoo Athens. Browse the gallery, shop signed prints, and get in touch to book.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "★ ELLIE TATTOOER ★",
    template: `%s | ${SITE_NAME}`,
  },
  description: DESCRIPTION,
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${oswald.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
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
