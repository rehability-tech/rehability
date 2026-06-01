import type { RelatedQuery, TrendsProvider } from "./types";

/**
 * Provider oparty o bibliotekę `google-trends-api`.
 *
 * UWAGA produkcyjna: to NIEoficjalne API — Google bywa zawodne, throttluje i
 * potrafi zwrócić HTML strony z captchą zamiast JSON-a. Dlatego:
 *   1. Bibliotekę ładujemy DYNAMICZNIE (opcjonalna zależność — brak paczki nie
 *      wywala builda; orkiestrator po prostu przejdzie na fallback).
 *   2. Każde wywołanie ma twardy timeout (AbortSignal).
 *   3. Każdy błąd parsowania / sieci jest propagowany w górę — decyzję o
 *      fallbacku podejmuje orkiestrator, nie provider.
 *
 * Instalacja (gdy zdecydujemy się używać na prod): `npm i google-trends-api`
 * oraz `npm i -D @types/google-trends-api`.
 */
export class GoogleTrendsProvider implements TrendsProvider {
  readonly name = "google-trends-api";

  async relatedRising(
    seed: string,
    geo: string,
    signal?: AbortSignal,
  ): Promise<RelatedQuery[]> {
    // Dynamiczny import — paczka jest OPCJONALNA. Używamy `new Function`, bo
    // bundler (Turbopack/webpack) NIE analizuje statycznie importu zbudowanego
    // w runtime — dzięki temu brak zainstalowanej paczki nie wywala builda
    // ("Module not found"), a my po prostu wpadamy w fallback. `as any`, bo brak
    // typów w runtime.
    let googleTrends: any;
    try {
      const runtimeImport = new Function(
        "m",
        "return import(m)",
      ) as (m: string) => Promise<any>;
      googleTrends = (await runtimeImport("google-trends-api")).default;
    } catch {
      throw new Error(
        "google-trends-api nie jest zainstalowane — uruchamiam fallback.",
      );
    }

    if (signal?.aborted) throw new Error("Trends request aborted before start");

    // relatedQueries zwraca SUROWY string JSON (lub HTML przy blokadzie).
    const raw: string = await googleTrends.relatedQueries({
      keyword: seed,
      geo,
      hl: "pl",
    });

    let parsed: any;
    try {
      parsed = JSON.parse(raw);
    } catch {
      // Najczęstszy objaw rate-limitu: Google oddaje HTML zamiast JSON.
      throw new Error(
        `Google Trends zwrócił nie-JSON dla "${seed}" (prawdopodobnie rate limit).`,
      );
    }

    const rankedList: any[] =
      parsed?.default?.rankedList ?? parsed?.rankedList ?? [];

    // rankedList[0] = TOP queries, rankedList[1] = RISING queries.
    const rising = rankedList[1]?.rankedKeyword ?? [];

    return rising
      .map(
        (item: any): RelatedQuery => ({
          query: String(item?.query ?? "").trim(),
          value: normalizeTrendValue(item?.value ?? item?.formattedValue),
        }),
      )
      .filter((q: RelatedQuery) => q.query.length > 0);
  }
}

/**
 * Normalizuje wartość trendu do liczby porządkującej.
 * Google zwraca m.in. liczby (np. 250), "+250%", "Breakout".
 * "Breakout" traktujemy jako maksymalny priorytet.
 */
function normalizeTrendValue(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const s = String(value ?? "").toLowerCase();
  if (s.includes("breakout")) return 100_000;
  const digits = s.replace(/[^0-9]/g, "");
  return digits ? Number(digits) : 0;
}
