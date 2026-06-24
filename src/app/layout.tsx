import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Montserrat } from "next/font/google";
import "./globals.css";
import { DebugNav } from "./_components/DebugNav";
import { FavoritesProvider } from "./_components/FavoritesProvider";
import { ConsentBanner } from "@/components/ConsentBanner";
import PWARegister from "@/components/PWARegister";
import { Analytics } from "@vercel/analytics/next";
import {
  SITE_URL,
  SITE_NAME,
  SITE_DEFAULT_TITLE,
  SITE_TITLE_TEMPLATE,
  SITE_DEFAULT_DESCRIPTION,
  SITE_KEYWORDS,
  SITE_LOCALE,
  SITE_LANG,
  SITE_OG_IMAGE,
  BUSINESS_NAP,
  SOCIAL_LINKS,
  absoluteUrl,
} from "@/lib/seo/site";

const fontHeading = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
  weight: ["600", "500", "700", "800"],
});

const fontBody = Montserrat({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_DEFAULT_TITLE,
    template: SITE_TITLE_TEMPLATE,
  },
  description: SITE_DEFAULT_DESCRIPTION,
  keywords: SITE_KEYWORDS,
  applicationName: SITE_NAME,
  authors: [{ name: BUSINESS_NAP.legalName, url: SITE_URL }],
  creator: BUSINESS_NAP.legalName,
  publisher: BUSINESS_NAP.legalName,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: SITE_LOCALE,
    url: SITE_URL,
    siteName: SITE_NAME,
    title: SITE_DEFAULT_TITLE,
    description: SITE_DEFAULT_DESCRIPTION,
    images: [SITE_OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_DEFAULT_TITLE,
    description: SITE_DEFAULT_DESCRIPTION,
    images: [SITE_OG_IMAGE.url],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  // Tagi geolokalizacyjne - krytyczne wsparcie dla Local SEO w fizjoterapii[cite: 1].
  other: {
    "geo.region": "PL-16",
    "geo.placename": BUSINESS_NAP.city,
    "geo.position": "50.3200;17.5800", // Dokładne koordynaty zaktualizuj w zależności od adresu
    ICBM: "50.3200, 17.5800",
  },
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: SITE_NAME,
  },
};

export const viewport: Viewport = {
  themeColor: "#287d88",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const localBusinessLd = {
    "@context": "https://schema.org",
    "@type": ["LocalBusiness", "HealthAndBeautyBusiness", "MedicalBusiness"],
    "@id": absoluteUrl("/#organization"),
    name: SITE_NAME,
    legalName: BUSINESS_NAP.legalName,
    url: SITE_URL,
    logo: absoluteUrl("/icon.svg"),
    image: absoluteUrl(SITE_OG_IMAGE.url),
    description: SITE_DEFAULT_DESCRIPTION,
    telephone: BUSINESS_NAP.phone,
    email: BUSINESS_NAP.email,
    taxID: BUSINESS_NAP.taxId,
    vatID: `PL${BUSINESS_NAP.taxId}`,
    priceRange: "$$",
    address: {
      "@type": "PostalAddress",
      streetAddress: BUSINESS_NAP.street,
      addressLocality: BUSINESS_NAP.city,
      postalCode: BUSINESS_NAP.postalCode,
      addressCountry: BUSINESS_NAP.country,
    },
    areaServed: [
      { "@type": "City", name: "Prudnik" },
      { "@type": "AdministrativeArea", name: "województwo opolskie" },
      { "@type": "Country", name: "Polska" },
    ],
    sameAs: [
      SOCIAL_LINKS.facebook,
      SOCIAL_LINKS.instagram,
      SOCIAL_LINKS.booksy,
    ],
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        opens: "09:00",
        closes: "19:00",
      },
    ],
  };

  const websiteLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": absoluteUrl("/#website"),
    url: SITE_URL,
    name: SITE_NAME,
    inLanguage: SITE_LANG,
    publisher: { "@id": absoluteUrl("/#organization") },
  };

  return (
    <html
      lang={SITE_LANG}
      className={`${fontHeading.variable} ${fontBody.variable}`}
    >
      <head>
        <link
          rel="preconnect"
          href="https://wkel0sdzlinz0k7a.public.blob.vercel-storage.com"
          crossOrigin="anonymous"
        />
        <link
          rel="dns-prefetch"
          href="https://wkel0sdzlinz0k7a.public.blob.vercel-storage.com"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteLd) }}
        />
      </head>
      <body className="antialiased min-h-screen  ">
        <PWARegister />
        <DebugNav />
        <FavoritesProvider>
          <main>{children}</main>
        </FavoritesProvider>
        <ConsentBanner />
        <Analytics />
      </body>
    </html>
  );
}
