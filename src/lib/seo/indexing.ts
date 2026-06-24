// Powiadamianie wyszukiwarek o nowych/zmienionych URL-ach wg standardu IndexNow.
//
// IndexNow to otwarty protokół wspierany przez Bing, Yandex, Seznam, DuckDuckGo
// i inne (jeden request trafia do wszystkich uczestników).
//
// ⚠️ GOOGLE NIE uczestniczy w IndexNow. Dla Google standardową, zgodną z polityką
// drogą jest dynamiczny `sitemap.xml` z `lastmod` (mamy w app/sitemap.ts) plus
// linkowanie wewnętrzne — Google sam dociąga nowe wpisy z sitemapy.
//
// Weryfikacja własności domeny: klucz musi być publicznie dostępny pod adresem
// https://<host>/<INDEXNOW_KEY>.txt i zawierać dokładnie tę wartość. Plik leży w
// /public/<INDEXNOW_KEY>.txt. Klucz NIE jest tajny (jest publiczny z założenia),
// więc trzymanie go w repo jest poprawne. Rotacja = zmień stałą i nazwę pliku.

import { SITE_URL, absoluteUrl } from "./site";

export const INDEXNOW_KEY = "72c3a4e845c3dcd7e6269c73fbeb8a2b";

const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow";

/**
 * Zgłasza jeden lub wiele URL-i do IndexNow. Bezpieczne do wywołania z dowolnego
 * miejsca — nigdy nie rzuca wyjątkiem (powiadomienie wyszukiwarki nie może
 * wywrócić publikacji) i jest no-op poza produkcją.
 */
export async function notifyIndexNow(urls: string | string[]): Promise<void> {
  // Tylko produkcja — w dev/staging IndexNow odrzuciłby localhost i tak.
  if (process.env.NODE_ENV !== "production") return;

  const urlList = (Array.isArray(urls) ? urls : [urls]).filter(Boolean);
  if (urlList.length === 0) return;

  try {
    const res = await fetch(INDEXNOW_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        host: new URL(SITE_URL).host,
        key: INDEXNOW_KEY,
        keyLocation: absoluteUrl(`/${INDEXNOW_KEY}.txt`),
        urlList,
      }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error("[indexnow] odpowiedź błędu:", res.status, detail);
    }
  } catch (err) {
    console.error("[indexnow] nie udało się powiadomić:", err);
  }
}
