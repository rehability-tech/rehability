// Centralna konfiguracja SEO dla całej aplikacji.
// Jedno źródło prawdy dla URL bazowego, NAP, social i defaultów Metadata.
// Importowana przez root layout, robots.ts, sitemap.ts oraz generateMetadata.

const PROD_URL = "https://rehabilityprudnik.pl";

// W dev/staging używamy NEXT_PUBLIC_SITE_URL (np. http://localhost:3000),
// w prod zawsze produkcyjny URL — żeby canonical / og:url były spójne.
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || PROD_URL;

export const SITE_NAME = "Rehability Prudnik";
export const SITE_LEGAL_NAME = "Rehability Piotr Siemaszko";

export const SITE_DEFAULT_TITLE =
  "Rehability Prudnik — Fizjoterapia, Masaż Kobido i Wyjazdy Holistyczne";

export const SITE_TITLE_TEMPLATE = `%s | ${SITE_NAME}`;

export const SITE_DEFAULT_DESCRIPTION =
  "Medyczny fundament w świecie wellness. Specjalistyczna fizjoterapia, " +
  "diagnostyka USG-RUSI, masaże lecznicze i Kobido w gabinecie w Prudniku " +
  "oraz holistyczne wyjazdy regeneracyjne prowadzone przez fizjoterapeutów.";

export const SITE_KEYWORDS = [
  "fizjoterapia Prudnik",
  "masaż Kobido Prudnik",
  "wyjazdy holistyczne",
  "trening siłowy dla kobiet w domu",
  "masaż tkanek głębokich Nysa",
  "USG RUSI Prudnik",
  "rehabilitacja Prudnik",
  "masaż leczniczy Prudnik",
  "dietetyk Prudnik",
];

export const SITE_LOCALE = "pl_PL";
export const SITE_LANG = "pl";
export const SITE_COUNTRY = "PL";

// Domyślne zdjęcie OG (1200x630). Plik fizycznie pod /public/images/og-default.jpg.
export const SITE_OG_IMAGE = {
  url: "/images/og-default.jpg",
  width: 1200,
  height: 630,
  alt: `${SITE_NAME} — fizjoterapia, masaże i wyjazdy holistyczne`,
} as const;

// NAP (Name + Address + Phone) — używane w LocalBusiness JSON-LD i stopkach.
export const BUSINESS_NAP = {
  legalName: SITE_LEGAL_NAME,
  brandName: SITE_NAME,
  street: "ul. Piastowska 30",
  city: "Prudnik",
  postalCode: "48-200",
  country: SITE_COUNTRY,
  phone: "+48 693 537 543",
  email: "piotrsiemaszko.fizjo@gmail.com",
  taxId: "7551941564", // NIP
} as const;

export const SOCIAL_LINKS = {
  facebook:
    "https://www.facebook.com/profile.php?id=61555623812761",
  instagram: "https://www.instagram.com/rehabilityprudnik",
  booksy:
    "https://booksy.com/pl-pl/293064_rehability-piotr-siemaszko_fizjoterapia_13658_prudnik",
} as const;

// Wszystkie sciezki cudzysłowem zablokowane w robots.txt — używane też przez
// sitemap.ts (do wykluczenia) i opcjonalnie w middleware (noindex headers).
export const ROBOTS_DISALLOWED_PATHS = [
  "/admin",
  "/admin/",
  "/panel",
  "/panel/",
  "/api",
  "/api/",
  "/logowanie",
] as const;

// Buduje absolutny URL z bazy SITE_URL. Używaj zamiast string concatenation,
// żeby uniknąć podwójnych slashy i niespójności po stronie og:url / canonical.
export function absoluteUrl(path = "/"): string {
  const trimmed = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_URL}${trimmed === "/" ? "" : trimmed}`;
}
