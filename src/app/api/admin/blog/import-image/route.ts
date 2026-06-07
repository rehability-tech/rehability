import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import {
  assertPublicHttpUrl,
  UnsafeUrlError,
} from "@/lib/uploads/assertPublicHttpUrl";

export const runtime = "nodejs";

// Limit pobieranego obrazka i twardy timeout — chronią przed wyssaniem pamięci
// i przed "wiszącym" połączeniem do wolnego/złośliwego hosta.
const MAX_BYTES = 10 * 1024 * 1024;
const FETCH_TIMEOUT_MS = 8000;
const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];

// Zaciąga zdjęcie z zewnętrznego URL (np. Pexels) i zapisuje je do naszego
// Vercel Blob, tak aby okładka żyła na naszej domenie i nie zniknęła nam spod nóg.
export async function POST(request: Request): Promise<NextResponse> {
  try {
    const { isAuthorized, response } = await requireAdmin();
    if (!isAuthorized) return response as NextResponse;

    const { url, filename } = (await request.json()) as {
      url?: string;
      filename?: string;
    };

    if (!url) {
      return NextResponse.json(
        { error: "Nieprawidłowy adres zdjęcia." },
        { status: 400 },
      );
    }

    // Ochrona przed SSRF: odrzucamy loopback / sieć prywatną / metadata chmury.
    let safeUrl: URL;
    try {
      safeUrl = await assertPublicHttpUrl(url);
    } catch (e) {
      if (e instanceof UnsafeUrlError) {
        return NextResponse.json(
          { error: "Adres zdjęcia jest niedozwolony." },
          { status: 400 },
        );
      }
      throw e;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    let imgRes: Response;
    try {
      imgRes = await fetch(safeUrl.toString(), {
        signal: controller.signal,
        redirect: "error", // redirect mógłby ominąć walidację hosta
      });
    } finally {
      clearTimeout(timeout);
    }

    if (!imgRes.ok) {
      return NextResponse.json(
        { error: "Nie udało się pobrać zdjęcia ze źródła." },
        { status: 502 },
      );
    }

    const contentType = (imgRes.headers.get("content-type") || "")
      .split(";")[0]
      .trim()
      .toLowerCase();
    if (!ALLOWED_MIME.includes(contentType)) {
      return NextResponse.json(
        { error: "Pobrany zasób nie jest dozwolonym obrazkiem." },
        { status: 415 },
      );
    }

    const declaredLength = Number(imgRes.headers.get("content-length") ?? "0");
    if (declaredLength > MAX_BYTES) {
      return NextResponse.json(
        { error: "Zdjęcie jest za duże (max 10 MB)." },
        { status: 413 },
      );
    }

    const buffer = Buffer.from(await imgRes.arrayBuffer());
    if (buffer.byteLength > MAX_BYTES) {
      return NextResponse.json(
        { error: "Zdjęcie jest za duże (max 10 MB)." },
        { status: 413 },
      );
    }

    const ext = contentType.includes("png")
      ? ".png"
      : contentType.includes("webp")
        ? ".webp"
        : contentType.includes("gif")
          ? ".gif"
          : contentType.includes("avif")
            ? ".avif"
            : ".jpg";
    const safeName = (filename || "blog-cover")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60);

    const blob = await put(`blog-cover-${safeName}${ext}`, buffer, {
      access: "public",
      addRandomSuffix: true,
      contentType,
    });

    return NextResponse.json({ success: true, url: blob.url });
  } catch (error) {
    console.error("Błąd importu zdjęcia do bloba:", error);
    return NextResponse.json(
      { error: "Błąd zapisu zdjęcia." },
      { status: 500 },
    );
  }
}
