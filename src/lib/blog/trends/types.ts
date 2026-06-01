/**
 * Kontrakt warstwy trendów (Dependency Inversion).
 *
 * Generator harmonogramu zależy WYŁĄCZNIE od tego interfejsu, nie od konkretnego
 * dostawcy. Dzięki temu Google Trends, DataForSEO, SerpApi czy mock są
 * wymienne bez zmian w logice biznesowej (Liskov / Open-Closed).
 */

/** Pojedyncze zapytanie powiązane zwrócone przez API trendów. */
export interface RelatedQuery {
  /** Treść frazy (np. "ćwiczenia na rwę kulszową"). */
  query: string;
  /**
   * Względna siła/wzrost trendu. Dla "rising" Google zwraca wartości typu
   * "+250%" / "Breakout" — normalizujemy je do liczby (Breakout => duża waga).
   */
  value: number;
}

export interface TrendsProvider {
  /** Nazwa providera (do logów i pola `source` w odpowiedzi). */
  readonly name: string;

  /**
   * Zwraca ROSNĄCE ("rising") zapytania powiązane dla podanej frazy bazowej.
   *
   * Implementacje MUSZĄ rzucać błędem przy niepowodzeniu (rate limit, timeout) —
   * orkiestrator decyduje o fallbacku, nie provider. To upraszcza testy i czyni
   * zachowanie przewidywalnym.
   *
   * @param seed   Fraza bazowa (seed keyword).
   * @param geo    Kod kraju ISO (np. "PL").
   * @param signal Opcjonalny AbortSignal do twardego timeoutu.
   */
  relatedRising(
    seed: string,
    geo: string,
    signal?: AbortSignal,
  ): Promise<RelatedQuery[]>;
}
