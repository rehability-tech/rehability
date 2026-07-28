// Gabinet Rehability jako domyślne miejsce wydarzenia.
//
// Duża część wydarzeń/wydarzeń odbywa się "u nas" — w gabinecie w Prudniku.
// Gdy organizator napisze to w prompcie, nie ma powodu, żeby ręcznie szukać
// tego samego adresu w Google. Trzymamy tu jedno źródło prawdy o tym miejscu
// (nazwa, miasto, place_id do mapy) i prostą heurystykę rozpoznawania.

import { BUSINESS_NAP, SITE_LEGAL_NAME } from "@/lib/seo/site";

export const HOME_VENUE = {
  name: SITE_LEGAL_NAME, // "Rehability Piotr Siemaszko"
  city: BUSINESS_NAP.city,
  street: BUSINESS_NAP.street,
  postalCode: BUSINESS_NAP.postalCode,
  // Identyfikator wizytówki Google — ten sam, którego używają już zapisane
  // wydarzenia w gabinecie (podpięty wcześniej ręcznie przez wyszukiwarkę miejsc).
  placeId: "ChIJs7Vie8yXEUcRfBjmt7mLdWc",
} as const;

// Frazy, po których poznajemy, że wydarzenie jest w naszym gabinecie.
const HOME_VENUE_HINTS = [
  "rehability",
  "w gabinecie",
  "w naszym gabinecie",
  "u nas w gabinecie",
  "nasza siedziba",
  "w naszej siedzibie",
  "u nas na miejscu",
];

export function mentionsHomeVenue(text: string | null | undefined): boolean {
  if (!text) return false;
  const normalized = text.toLowerCase();
  return HOME_VENUE_HINTS.some((hint) => normalized.includes(hint));
}

export function buildGoogleMapsEmbedUrl(placeId: string): string {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  return `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=place_id:${placeId}`;
}

export function homeVenueMapUrl(): string {
  return buildGoogleMapsEmbedUrl(HOME_VENUE.placeId);
}
