import type { TripEventType } from "@/generated/prisma";

export interface SerializedEvent {
  id: string;
  title: string;
  description: string | null;
  startTime: string;
  endTime: string | null;
  type: TripEventType; // lub string, jeśli masz oddzielny typ dla usług
  icon: string | null;
  isPublished: boolean;
  sortOrder: number;

  // NOWE POLA DLA BLOKÓW REZERWACYJNYCH:
  isBookable?: boolean;
  price?: number;
  spotsAvailable?: number;
  capacity?: number;
  spotsTaken?: number;
  isOpen?: boolean; // true = wolny blok, false = whitelist
  services?: BlockServiceSummary[]; // tylko dla whitelist
  reservations?: BlockReservation[]; // pełna lista dla widoku admina
}

// Pojedyncza rezerwacja widoczna w panelu admina (widok "Rezerwacje").
export interface BlockReservation {
  id: string;
  bookerName: string;
  bookerEmail: string | null;
  serviceName: string;
  startTime: string; // ISO sub-slot
  endTime: string; // ISO sub-slot
  status: "PENDING" | "PAID" | "CANCELLED";
  amountGrosze: number;
  paidAt: string | null;
}

// Per-service info dla whitelist bloku (admin podgląd).
export interface BlockServiceSummary {
  id: string;
  name: string;
  capacity: number;
  spotsTaken: number;
}
