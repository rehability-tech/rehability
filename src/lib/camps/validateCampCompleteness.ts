// ==========================================
// WALIDACJA KOMPLETNOŚCI CAMPA DO PUBLIKACJI
// ==========================================
// Reużywalna funkcja sprawdzająca, czy Camp spełnia wszystkie wymagania
// niezbędne do statusu "PUBLISHED". Używana w endpointach API:
//   - /api/admin/campy/status   (twarda blokada przy zmianie statusu)
//   - /api/admin/campy/[id]     (auto-cofnięcie do DRAFT po edycji treści)
//   - /api/admin/campy/save     (auto-cofnięcie do DRAFT po edycji danych)

type CampLike = {
  heroImage?: string | null;
  location?: string | null;
  startDate?: Date | string | null;
  endDate?: Date | string | null;
  mapUrl?: string | null;
  allowBringFriend?: boolean | null;
  blocks?: unknown;
};

export type CampCompletenessResult = {
  isComplete: boolean;
  missing: string[];
};

export function validateCampCompleteness(camp: CampLike): CampCompletenessResult {
  const missing: string[] = [];

  if (!camp.heroImage) missing.push("zdjęcia (tła)");
  if (!camp.location) missing.push("lokalizacji");
  if (!camp.startDate || !camp.endDate) missing.push("daty wyjazdu");

  let blocksCount = 0;
  let hasMapBlock = false;
  let hasBookingOptionsBlock = false;

  if (camp.blocks) {
    try {
      const parsed =
        typeof camp.blocks === "string" ? JSON.parse(camp.blocks) : camp.blocks;
      if (Array.isArray(parsed)) {
        blocksCount = parsed.length;
        hasMapBlock = parsed.some(
          (block: { type?: string }) => block?.type === "map",
        );
        hasBookingOptionsBlock = parsed.some(
          (block: { type?: string }) => block?.type === "bookingOptions",
        );
      }
    } catch {
      // Niepoprawny JSON — traktujemy bloki jak puste
    }
  }

  if (blocksCount < 3) missing.push("minimum 3 bloków w Edytorze Treści");

  if (hasMapBlock && (!camp.mapUrl || camp.mapUrl.trim() === "")) {
    missing.push("linku do mapy Google (wymagany przez dodany blok mapy)");
  }

  if (camp.allowBringFriend && !hasBookingOptionsBlock) {
    missing.push(
      'bloku "Opcje rezerwacji" w treści (wymagany, gdy włączono "Zabierz przyjaciółkę")',
    );
  }

  return { isComplete: missing.length === 0, missing };
}
