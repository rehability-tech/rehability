/**
 * Współdzielone typy modułu CRM 360°.
 *
 * Trzymamy je w jednym miejscu (DRY), bo korzystają z nich zarówno Server
 * Components (mapowanie danych z Prisma) jak i Client Components (props).
 * Wszystkie kwoty są już ZSERIALIZOWANE do liczb w PLN (grosze / 100),
 * a daty do stringów ISO — komponenty klienckie nie dotykają `Decimal` ani
 * obiektów `Date` Prismy.
 */

/** Segment lojalnościowy wyliczany na serwerze na podstawie LTV i liczby wyjazdów. */
export type Loyalty = "VIP" | "RETURNING" | "NEW";

/** Wiersz listy CRM (widok zbiorczy). */
export interface CrmClient {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  /** Telefon pochodzi z rezerwacji (model User go nie ma). */
  phone: string | null;
  /** Liczba rezerwacji (bez statusu CANCELLED). */
  tripsCount: number;
  /** Suma wpłat w PLN (grosze / 100). */
  totalSpent: number;
  loyalty: Loyalty;
  /** Czy klient wypełnił kartę zdrowia. */
  hasHealthProfile: boolean;
}

/** Pojedyncza rezerwacja w widoku profilu. */
export interface ClientBooking {
  id: string;
  status: string;
  amountPaid: number;
  amountTotal: number;
  /** Data utworzenia rezerwacji (ISO). */
  createdAt: string;
  trip: {
    id: string;
    title: string;
    location: string;
    /** ISO lub null. */
    startDate: string | null;
    endDate: string | null;
    heroImage: string | null;
  } | null;
  /** Zamówione usługi SPA w ramach tej rezerwacji. */
  serviceOrders: ClientServiceOrder[];
}

/** Zamówienie usługi SPA (historia zabiegów). */
export interface ClientServiceOrder {
  id: string;
  status: string;
  /** Cena w PLN. */
  price: number;
  /** ISO lub null. */
  startTime: string | null;
  serviceName: string;
}

/** Pełny profil zdrowotny (wszystkie pola HealthProfile). */
export interface ClientHealthProfile {
  dietType: string;
  foodIntolerances: string[];
  foodNotes: string | null;
  chronicConditions: string | null;
  medications: string | null;
  injuries: string | null;
  allergies: string | null;
  emergencyName: string | null;
  emergencyPhone: string | null;
}

/** Zserializowany, kompletny profil 360° przekazywany do Client Component. */
export interface ClientProfileData {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  phone: string | null;
  loyalty: Loyalty;
  totalSpent: number;
  tripsCount: number;
  /** Liczba zamówionych zabiegów SPA (łącznie). */
  spaCount: number;
  bookings: ClientBooking[];
  health: ClientHealthProfile | null;
}
