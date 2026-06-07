// Grupowanie rezerwacji w "pakiety" (zabierz przyjaciółkę) do wyświetlenia na listach.
// Czysta funkcja (client-safe) — działa na dowolnym obiekcie z `id` i `invitedById`.

export type PackageUnit<T> =
  | { kind: "single"; item: T }
  | { kind: "package"; members: T[] };

/**
 * Łączy zapraszającego z jego gośćmi w jeden pakiet.
 * - Gość (ma `invitedById` wskazujący na kogoś z listy) zostaje pokazany WEWNĄTRZ
 *   pakietu zapraszającego, a nie jako osobny wiersz.
 * - Kolejność jednostek odpowiada kolejności wejściowej (po zapraszającym/osobie).
 */
export function groupIntoPackages<
  T extends { id: string; invitedById?: string | null },
>(items: T[]): PackageUnit<T>[] {
  const byId = new Map(items.map((i) => [i.id, i]));

  const guestsByInviter = new Map<string, T[]>();
  for (const it of items) {
    if (it.invitedById && byId.has(it.invitedById)) {
      const arr = guestsByInviter.get(it.invitedById) ?? [];
      arr.push(it);
      guestsByInviter.set(it.invitedById, arr);
    }
  }

  const units: PackageUnit<T>[] = [];
  for (const it of items) {
    // Gość kogoś z listy → pojawi się wewnątrz pakietu zapraszającego.
    if (it.invitedById && byId.has(it.invitedById)) continue;

    const guests = guestsByInviter.get(it.id);
    if (guests && guests.length > 0) {
      units.push({ kind: "package", members: [it, ...guests] });
    } else {
      units.push({ kind: "single", item: it });
    }
  }
  return units;
}

export const isPaidBookingStatus = (s: string | null | undefined) =>
  s === "DEPOSIT_PAID" || s === "FULLY_PAID";

/** Etykieta pakietu zależna od liczby osób. */
export function packageLabel(memberCount: number): string {
  return memberCount === 2 ? "Pakiet Duo" : `Pakiet · ${memberCount} os.`;
}
