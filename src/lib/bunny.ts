import "server-only";
import crypto from "crypto";

/**
 * Bunny Stream — bezpieczne serwowanie wideo (HLS + token auth + opcjonalny DRM).
 *
 * Wymagane zmienne środowiskowe (.env):
 *   BUNNY_STREAM_LIBRARY_ID   – ID biblioteki wideo (Stream → Library)
 *   BUNNY_STREAM_API_KEY      – klucz API biblioteki (NIGDY na klliencie)
 *   BUNNY_STREAM_CDN_HOSTNAME – host pull zone, np. vz-xxxxxxxx.b-cdn.net
 *   BUNNY_STREAM_TOKEN_KEY    – (opcjonalnie) klucz token-auth do podpisywania URL
 */

const LIBRARY_ID = process.env.BUNNY_STREAM_LIBRARY_ID || "";
const API_KEY = process.env.BUNNY_STREAM_API_KEY || "";
const CDN_HOST = process.env.BUNNY_STREAM_CDN_HOSTNAME || "";
const TOKEN_KEY = process.env.BUNNY_STREAM_TOKEN_KEY || "";

export const BUNNY_LIBRARY_ID = LIBRARY_ID;

export function bunnyConfigured(): boolean {
  return Boolean(LIBRARY_ID && API_KEY);
}

/** Tworzy obiekt wideo w bibliotece i zwraca jego GUID. */
export async function createBunnyVideo(title: string): Promise<string> {
  const res = await fetch(
    `https://video.bunnycdn.com/library/${LIBRARY_ID}/videos`,
    {
      method: "POST",
      headers: {
        AccessKey: API_KEY,
        "Content-Type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify({ title: title || "Wideo kursu" }),
    },
  );
  if (!res.ok) {
    throw new Error(`Bunny: nie udało się utworzyć wideo (${res.status}).`);
  }
  const data = (await res.json()) as { guid: string };
  return data.guid;
}

export type BunnyVideoStatus = {
  /** Surowy status Bunny: 0 Created · 1 Uploaded · 2 Processing · 3 Transcoding · 4 Finished · 5 Error · 6 UploadFailed. */
  status: number;
  /** Postęp kodowania 0–100. */
  encodeProgress: number;
  /** Odtwarzalne (pierwsza rozdzielczość gotowa lub Finished) — player nie pokaże już „Processing". */
  ready: boolean;
  /** Bunny zgłosił błąd przetwarzania/uploadu. */
  failed: boolean;
  /** Wideo nie istnieje w bibliotece (404) — np. atrapa GUID lub usunięte. */
  notFound: boolean;
  /** Długość nagrania w sekundach (0, gdy Bunny jeszcze nie zna). */
  length: number;
};

/** Status przetwarzania pojedynczego wideo (do pollingu po stronie uploadera). */
export async function getBunnyVideoStatus(
  videoId: string,
): Promise<BunnyVideoStatus> {
  const res = await fetch(
    `https://video.bunnycdn.com/library/${LIBRARY_ID}/videos/${videoId}`,
    {
      headers: { AccessKey: API_KEY, accept: "application/json" },
      cache: "no-store",
    },
  );
  // 404 = wideo nie istnieje (atrapa/usunięte) — zwracamy notFound zamiast
  // rzucać, by uploader nie pollował w nieskończoność. Inne błędy (5xx, sieć)
  // traktujemy jako chwilowe → rzucamy, poll spróbuje ponownie.
  if (res.status === 404) {
    return {
      status: 0,
      encodeProgress: 0,
      ready: false,
      failed: true,
      notFound: true,
      length: 0,
    };
  }
  if (!res.ok) {
    throw new Error(`Bunny: nie udało się pobrać statusu wideo (${res.status}).`);
  }
  const data = (await res.json()) as {
    status?: number;
    encodeProgress?: number;
    availableResolutions?: string | null;
    length?: number;
  };
  const status = data.status ?? 0;
  // Bunny udostępnia wideo do oglądania, gdy pojawi się pierwsza rozdzielczość
  // (już w trakcie transkodowania). Nie czekamy na pełne „Finished" (4), które
  // dla krótkich filmów potrafi długo dochodzić — player embed gra od razu.
  const hasResolution = (data.availableResolutions ?? "").trim().length > 0;
  return {
    status,
    encodeProgress: data.encodeProgress ?? 0,
    ready: status === 4 || hasResolution,
    failed: status === 5 || status === 6,
    notFound: false,
    length: Math.max(0, Math.round(data.length ?? 0)),
  };
}

/** Pozycja wideo z listingu biblioteki Bunny (tylko potrzebne pola). */
export type BunnyVideo = { guid: string; title: string; dateUploaded: string };

/**
 * Lista WSZYSTKICH wideo w bibliotece (z paginacją). Pusta, gdy brak
 * konfiguracji. Używane m.in. przez cron sprzątający osierocone nagrania.
 */
export async function listBunnyVideos(): Promise<BunnyVideo[]> {
  if (!bunnyConfigured()) return [];
  const out: BunnyVideo[] = [];
  const itemsPerPage = 100;
  let page = 1;
  for (;;) {
    const res = await fetch(
      `https://video.bunnycdn.com/library/${LIBRARY_ID}/videos?page=${page}&itemsPerPage=${itemsPerPage}&orderBy=date`,
      { headers: { AccessKey: API_KEY, accept: "application/json" } },
    );
    if (!res.ok) {
      throw new Error(
        `Bunny: nie udało się pobrać listy wideo (${res.status}).`,
      );
    }
    const data = (await res.json()) as {
      items?: { guid: string; title: string; dateUploaded: string }[];
    };
    const items = data.items ?? [];
    for (const v of items) {
      out.push({ guid: v.guid, title: v.title, dateUploaded: v.dateUploaded });
    }
    if (items.length < itemsPerPage) break;
    page += 1;
  }
  return out;
}

/** Usuwa wideo z biblioteki. true = skasowano (404 też, idempotentnie). */
export async function deleteBunnyVideo(videoId: string): Promise<boolean> {
  const res = await fetch(
    `https://video.bunnycdn.com/library/${LIBRARY_ID}/videos/${videoId}`,
    {
      method: "DELETE",
      headers: { AccessKey: API_KEY, accept: "application/json" },
    },
  );
  // 404 = wideo już nie istnieje → traktujemy jak sukces.
  return res.ok || res.status === 404;
}

/** Podpis do uploadu TUS: SHA256(libraryId + apiKey + expire + videoId). */
export function bunnyTusSignature(videoId: string, expire: number): string {
  return crypto
    .createHash("sha256")
    .update(`${LIBRARY_ID}${API_KEY}${expire}${videoId}`)
    .digest("hex");
}

/** URL do osadzenia w <iframe> (player Bunny, gra HLS, obsługuje token/DRM). */
export function bunnyEmbedUrl(videoId: string): string {
  return `https://iframe.mediadelivery.net/embed/${LIBRARY_ID}/${videoId}`;
}

/** Bezpośredni HLS (do własnego playera hls.js). Pusty, gdy brak pull zone. */
export function bunnyHlsUrl(videoId: string): string {
  return CDN_HOST ? `https://${CDN_HOST}/${videoId}/playlist.m3u8` : "";
}

/** GUID wideo z URL-a osadzenia Bunny: …/embed/{libraryId}/{guid}. */
export function bunnyGuidFromEmbed(url: string | null): string | null {
  if (!url) return null;
  return url.match(/\/embed\/[^/]+\/([^/?#]+)/)?.[1] ?? null;
}

/**
 * URL automatycznej miniatury (kadru) wideo. Pull zone Stream blokuje
 * bezpośredni dostęp do plików (sprawdza nagłówek Referer), więc TEN URL
 * pobieramy WYŁĄCZNIE po stronie serwera z nagłówkiem `Referer: BUNNY_EMBED_REFERER`
 * (patrz endpoint cover-from-video). Pusty string, gdy brak pull zone.
 */
export function bunnyThumbnailUrl(videoId: string): string {
  return CDN_HOST ? `https://${CDN_HOST}/${videoId}/thumbnail.jpg` : "";
}

/** Referer akceptowany przez pull zone Stream przy „Block direct URL file access". */
export const BUNNY_EMBED_REFERER = "https://iframe.mediadelivery.net/";

/**
 * Podpisany URL HLS (Token Authentication na pull zone). Podpisujemy CAŁY
 * katalog wideo przez `token_path`, dzięki czemu token obejmuje playlistę ORAZ
 * wszystkie segmenty/warianty (.m3u8/.ts). Ważny przez `ttlSeconds`.
 * Wymaga włączonego token-auth + BUNNY_STREAM_TOKEN_KEY.
 */
export function bunnySignedHlsUrl(
  videoId: string,
  ttlSeconds = 6 * 3600,
): string {
  const base = bunnyHlsUrl(videoId);
  if (!base || !TOKEN_KEY) return base;
  const expires = Math.floor(Date.now() / 1000) + ttlSeconds;
  const tokenPath = `/${videoId}/`;
  // Bunny token: base64url( SHA256(tokenKey + token_path + expires) )
  const token = crypto
    .createHash("sha256")
    .update(`${TOKEN_KEY}${tokenPath}${expires}`)
    .digest("base64")
    .replace(/\n/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
  return `${base}?token=${token}&expires=${expires}&token_path=${encodeURIComponent(tokenPath)}`;
}
