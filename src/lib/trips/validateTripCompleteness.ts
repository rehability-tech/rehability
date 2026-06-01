// ==========================================
// WALIDACJA KOMPLETNOŚCI WYJAZDU DO PUBLIKACJI
// ==========================================
// Reużywalna funkcja sprawdzająca, czy Wyjazd spełnia wszystkie wymagania
// niezbędne do statusu "PUBLISHED". Używana w endpointach API:
//   - /api/admin/wyjazdy/status   (twarda blokada przy zmianie statusu)
//   - /api/admin/wyjazdy/[id]     (auto-cofnięcie do DRAFT po edycji treści)
//   - /api/admin/wyjazdy/save     (auto-cofnięcie do DRAFT po edycji danych)

type TripLike = {
  heroImage?: string | null;
  location?: string | null;
  startDate?: Date | string | null;
  endDate?: Date | string | null;
  mapUrl?: string | null;
  allowBringFriend?: boolean | null;
  blocks?: unknown;
};

export type TripCompletenessResult = {
  isComplete: boolean;
  missing: string[];
};

export function validateTripCompleteness(trip: TripLike): TripCompletenessResult {
  const missing: string[] = [];

  if (!trip.heroImage) missing.push("zdjęcia (tła)");
  if (!trip.location) missing.push("lokalizacji");
  if (!trip.startDate || !trip.endDate) missing.push("daty wyjazdu");

  let blocksCount = 0;
  let hasMapBlock = false;
  let hasBookingOptionsBlock = false;
  const incompletePricingItems: string[] = [];

  if (trip.blocks) {
    try {
      const parsed =
        typeof trip.blocks === "string" ? JSON.parse(trip.blocks) : trip.blocks;
      if (Array.isArray(parsed)) {
        blocksCount = parsed.length;
        hasMapBlock = parsed.some(
          (block: { type?: string }) => block?.type === "map",
        );
        hasBookingOptionsBlock = parsed.some(
          (block: { type?: string }) => block?.type === "bookingOptions",
        );

        // Walidacja pozycji w blokach "Lista usług" — każda musi mieć
        // nazwę, czas, cenę i opis. Zdjęcie jest opcjonalne.
        for (const block of parsed) {
          if (
            block?.type !== "pricingList" ||
            !Array.isArray(block?.content?.items)
          ) {
            continue;
          }
          for (const item of block.content.items) {
            const name = String(item?.name ?? "").trim();
            const duration = String(item?.duration ?? "").trim();
            const price = String(item?.price ?? "").trim();
            const description = String(item?.description ?? "").trim();

            const missingFields: string[] = [];
            if (!name) missingFields.push("nazwa");
            if (!duration) missingFields.push("czas");
            if (!price) missingFields.push("cena");
            if (!description) missingFields.push("opis");

            if (missingFields.length > 0) {
              const label = name || "(nienazwana usługa)";
              incompletePricingItems.push(
                `"${label}" (brak: ${missingFields.join(", ")})`,
              );
            }
          }
        }
      }
    } catch {
      // Niepoprawny JSON — traktujemy bloki jak puste
    }
  }

  if (incompletePricingItems.length > 0) {
    missing.push(
      `uzupełnionych usług w bloku "Lista usług": ${incompletePricingItems.join("; ")}`,
    );
  }

  if (blocksCount < 3) missing.push("minimum 3 bloków w Edytorze Treści");

  if (hasMapBlock && (!trip.mapUrl || trip.mapUrl.trim() === "")) {
    missing.push("linku do mapy Google (wymagany przez dodany blok mapy)");
  }

  if (trip.allowBringFriend && !hasBookingOptionsBlock) {
    missing.push(
      'bloku "Opcje rezerwacji" w treści (wymagany, gdy włączono "Zabierz przyjaciółkę")',
    );
  }

  return { isComplete: missing.length === 0, missing };
}
