// Wspólna logika "pakietu" (zabierz przyjaciółkę): wyznaczanie partnera
// rezerwacji na podstawie relacji invitedBy / invitedGuests.

export const PAID_STATUSES = ["DEPOSIT_PAID", "FULLY_PAID"] as const;
const DEAD_STATUSES = ["CANCELLED", "EXPIRED"];

export function isPaidStatus(status: string | null | undefined): boolean {
  return status === "DEPOSIT_PAID" || status === "FULLY_PAID";
}

interface RelatedBooking {
  id: string;
  name: string | null;
  email: string;
  status: string;
}

export interface MinimalBookingForPackage {
  status: string;
  invitedBy?: RelatedBooking | null;
  invitedGuests?: RelatedBooking[] | null;
}

export interface PackagePartner {
  bookingId: string;
  name: string | null;
  email: string;
  status: string;
  paid: boolean;
  /** "inviter" = ta osoba zaprosiła; "guest" = ta osoba została zaproszona */
  relation: "inviter" | "guest";
}

export interface PackageInfo {
  partner: PackagePartner;
  /** Aktywny = OBIE strony mają opłaconą zaliczkę. */
  active: boolean;
}

/** Prisma `select`/`include` dla relacji partnera (do wklejenia w zapytania). */
export const PACKAGE_RELATION_SELECT = {
  invitedBy: {
    select: { id: true, name: true, email: true, status: true },
  },
  invitedGuests: {
    select: { id: true, name: true, email: true, status: true },
  },
} as const;

/** Wyznacza partnera "pakietu" dla danej rezerwacji (albo null). */
export function resolvePackage(
  booking: MinimalBookingForPackage,
): PackageInfo | null {
  // 1. Ta rezerwacja została zaproszona przez kogoś.
  if (booking.invitedBy && !DEAD_STATUSES.includes(booking.invitedBy.status)) {
    const p = booking.invitedBy;
    return {
      partner: {
        bookingId: p.id,
        name: p.name,
        email: p.email,
        status: p.status,
        paid: isPaidStatus(p.status),
        relation: "inviter",
      },
      active: isPaidStatus(booking.status) && isPaidStatus(p.status),
    };
  }

  // 2. Ta rezerwacja zaprosiła kogoś (bierzemy pierwszego żywego gościa).
  const guest = booking.invitedGuests?.find(
    (g) => !DEAD_STATUSES.includes(g.status),
  );
  if (guest) {
    return {
      partner: {
        bookingId: guest.id,
        name: guest.name,
        email: guest.email,
        status: guest.status,
        paid: isPaidStatus(guest.status),
        relation: "guest",
      },
      active: isPaidStatus(booking.status) && isPaidStatus(guest.status),
    };
  }

  return null;
}
