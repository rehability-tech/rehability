import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Montserrat } from "next/font/google";
import "./globals.css";
import { DebugNav } from "./_components/DebugNav";
import { ConsentBanner } from "@/components/ConsentBanner";

// 1. Optymalizacja czcionek z Google Fonts (zmienne CSS zgodne z Twoim @theme)
const fontHeading = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap", // Zapobiega Layout Shift (CLS)
  weight: ["600", "500", "700", "800"],
});

const fontBody = Montserrat({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
  weight: ["400", "500", "600"],
});

// 2. Metadata API - Fundament SEO [cite: 14, 15, 62]
export const metadata: Metadata = {
  metadataBase: new URL("https://yourdomain.com"), // Zmień na swój adres [cite: 63, 120]
  title: {
    default: "Coastal Wellness | Profesjonalna Opieka i Terapia",
    template: "%s | Coastal Wellness", // Automatycznie dodaje brand do podstron [cite: 25, 67, 122]
  },
  description:
    "Odkryj spokój i profesjonalną opiekę w Coastal Wellness. Specjalistyczne terapie w otoczeniu natury.",
  keywords: ["terapia", "wellness", "coastal wellness", "zdrowie psychiczne"],
  alternates: {
    canonical: "/", // Zapobiega duplikacji treści [cite: 113, 127]
  },
  openGraph: {
    type: "website",
    locale: "pl_PL",
    url: "https://yourdomain.com",
    siteName: "Coastal Wellness",
    images: [
      {
        url: "/og-image.jpg", // Wymaga pliku w public/ [cite: 96, 1031]
        width: 1200,
        height: 630,
        alt: "Coastal Wellness - Główny baner",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 3. Structured Data (JSON-LD) - Pomaga Google zrozumieć Twój biznes [cite: 128, 134, 140]
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": "https://yourdomain.com/#organization",
    name: "Coastal Wellness",
    url: "https://yourdomain.com",
    logo: "https://yourdomain.com/logo.png",
    description: "Profesjonalna opieka i nowoczesne terapie.",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Twoje Miasto",
      addressCountry: "PL",
    },
  };

  return (
    <html lang="pl" className={`${fontHeading.variable} ${fontBody.variable}`}>
      <head>
        {/* Preconnect do CDN ze zdjęciami campów – usuwa ~150ms TLS handshake przy pierwszym <img>. */}
        <link
          rel="preconnect"
          href="https://wkel0sdzlinz0k7a.public.blob.vercel-storage.com"
          crossOrigin="anonymous"
        />
        <link
          rel="dns-prefetch"
          href="https://wkel0sdzlinz0k7a.public.blob.vercel-storage.com"
        />
        {/* Wstrzykiwanie danych strukturalnych [cite: 135, 136, 182] */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="antialiased min-h-screen  ">
        <DebugNav />
        <main>{children}</main>
        <ConsentBanner />
      </body>
    </html>
  );
}
