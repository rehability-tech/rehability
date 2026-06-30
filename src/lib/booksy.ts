// Profil Booksy gabinetu Rehability — jedno źródło prawdy dla linków rezerwacji.
// Wszystkie przyciski "Zarezerwuj / Umów" w gabinecie kierują tutaj.
export const BOOKSY_URL =
  "https://booksy.com/pl-pl/293064_rehability-piotr-siemaszko_fizjoterapia_13658_prudnik";

// Deep-linki do pojedynczych zabiegów.
// Booksy nie udostępnia publicznie ID usług w treści strony (to SPA — w HTML są
// tylko nazwy i ceny, bez linków per zabieg), więc domyślnie każdy przycisk kieruje
// na profil, który od razu pokazuje listę zabiegów z przyciskiem rezerwacji.
//
// Aby pojedynczy zabieg otwierał się od razu do rezerwacji: w panelu Booksy przy
// danej usłudze użyj opcji "Udostępnij / Skopiuj link" i wklej go tutaj.
// Klucz = dokładny tytuł zabiegu z sekcji Specjaliści (np. "Terapia manualna").
const BOOKSY_SERVICE_LINKS: Record<string, string> = {
  // "Wizyta Fizjoterapeutyczna": "https://booksy.com/pl-pl/...",
  // "Terapia manualna": "https://booksy.com/pl-pl/...",
  // "Diagnostyka USG-RUSI": "https://booksy.com/pl-pl/...",
};

// Zwraca deep-link do konkretnego zabiegu (jeśli skonfigurowany) lub link do profilu.
export function booksyServiceUrl(serviceTitle?: string): string {
  if (serviceTitle && BOOKSY_SERVICE_LINKS[serviceTitle]) {
    return BOOKSY_SERVICE_LINKS[serviceTitle];
  }
  return BOOKSY_URL;
}
