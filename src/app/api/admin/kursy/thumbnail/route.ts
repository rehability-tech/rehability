import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import {
  bunnyConfigured,
  bunnyThumbnailUrl,
  BUNNY_EMBED_REFERER,
} from "@/lib/bunny";

export const runtime = "nodejs";

// GUID Bunny (UUID). Walidacja chroni przed SSRF — host budujemy sami.
const GUID_RE = /^[a-zA-Z0-9-]{8,64}$/;
const TIMEOUT_MS = 8000;

/**
 * Proxy miniatury (kadru) wideo z Bunny. Pull zone Stream blokuje bezpośredni
 * dostęp do plików (sprawdza Referer), więc przeglądarka nie może wyświetlić
 * `thumbnail.jpg` wprost — pobieramy go tu, po stronie serwera, z właściwym
 * nagłówkiem i streamujemy do <img>. 404, gdy kadr jeszcze nie istnieje
 * (wideo w trakcie kodowania lub atrapa GUID).
 */
export async function GET(request: Request): Promise<Response> {
  const { isAuthorized, response } = await requireAdmin();
  if (!isAuthorized) return response as NextResponse;
  if (!bunnyConfigured()) return new NextResponse(null, { status: 503 });

  const guid = new URL(request.url).searchParams.get("guid") || "";
  if (!GUID_RE.test(guid)) return new NextResponse(null, { status: 400 });

  const url = bunnyThumbnailUrl(guid);
  if (!url) return new NextResponse(null, { status: 503 });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: "error",
      headers: { Referer: BUNNY_EMBED_REFERER },
      cache: "no-store",
    });
    if (!res.ok) return new NextResponse(null, { status: 404 });
    const contentType = res.headers.get("content-type") || "image/jpeg";
    if (!contentType.startsWith("image/")) {
      return new NextResponse(null, { status: 404 });
    }
    const buffer = Buffer.from(await res.arrayBuffer());
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        // Krótki cache — kadr może się pojawić chwilę po zakończeniu kodowania.
        "Cache-Control": "private, max-age=60",
      },
    });
  } catch {
    return new NextResponse(null, { status: 502 });
  } finally {
    clearTimeout(timeout);
  }
}
