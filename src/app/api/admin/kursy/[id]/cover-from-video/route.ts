import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { prisma } from "@/lib/prisma";
import {
  bunnyGuidFromEmbed,
  bunnyThumbnailUrl,
  BUNNY_EMBED_REFERER,
} from "@/lib/bunny";

export const runtime = "nodejs";

const paramsSchema = z.object({ id: z.string().min(1) });

const MAX_BYTES = 10 * 1024 * 1024;
const FETCH_TIMEOUT_MS = 8000;
const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp", "image/avif"];

/**
 * Ustawia okładkę z automatycznego kadru wideo (Bunny). Pull zone Stream
 * blokuje bezpośredni dostęp do plików (sprawdza Referer), więc kadr pobieramy
 * tutaj — po stronie serwera, z właściwym nagłówkiem — i zapisujemy do naszego
 * Vercel Blob. Token Bunny i tak by wygasł, więc kopiujemy obraz na stałe.
 * URL miniatury budujemy z danych kursu (nie z wejścia klienta) → brak SSRF.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const { isAuthorized, response } = await requireAdmin();
    if (!isAuthorized) return response as NextResponse;

    const { id } = paramsSchema.parse(await params);

    // Opcjonalny wybór konkretnego nagrania (tryb modułowy — kadr z wybranej
    // lekcji). Walidujemy go względem nagrań kursu → brak SSRF.
    const body = (await req.json().catch(() => ({}))) as { guid?: unknown };
    const wantedGuid =
      typeof body.guid === "string" && body.guid.trim() ? body.guid.trim() : null;

    const course = await prisma.course.findUnique({
      where: { id },
      select: {
        slug: true,
        video: true,
        modules: {
          orderBy: { order: "asc" },
          select: { lessons: { orderBy: { order: "asc" }, select: { video: true } } },
        },
      },
    });
    if (!course) {
      return NextResponse.json({ error: "Kurs nie istnieje." }, { status: 404 });
    }

    // Wszystkie GUID-y nagrań kursu (główne + lekcje) — zbiór dozwolonych.
    const allGuids = [
      course.video,
      ...course.modules.flatMap((m) => m.lessons.map((l) => l.video)),
    ]
      .map((u) => bunnyGuidFromEmbed(u))
      .filter((g): g is string => !!g);

    // Wybrany kadr musi należeć do kursu; inaczej fallback na pierwsze nagranie.
    const guid =
      wantedGuid && allGuids.includes(wantedGuid) ? wantedGuid : allGuids[0] ?? null;
    const thumbUrl = guid ? bunnyThumbnailUrl(guid) : "";
    if (!thumbUrl) {
      return NextResponse.json(
        { error: "Kurs nie ma jeszcze nagrania, z którego można pobrać kadr." },
        { status: 400 },
      );
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    let imgRes: Response;
    try {
      imgRes = await fetch(thumbUrl, {
        signal: controller.signal,
        redirect: "error",
        // Pull zone wpuszcza tylko z dozwolonym Refererem (Block direct URL access).
        headers: { Referer: BUNNY_EMBED_REFERER },
      });
    } finally {
      clearTimeout(timeout);
    }

    if (!imgRes.ok) {
      // Najczęściej: wideo wciąż się koduje, więc kadr (miniatura) jeszcze nie
      // istnieje. To nie błąd serwera — sygnalizujemy „jeszcze nie teraz" (409),
      // a klient ma fallback (Pexels / okładka ręczna).
      return NextResponse.json(
        { error: "Kadr jeszcze niegotowy — wideo się koduje. Spróbuj później." },
        { status: 409 },
      );
    }

    const contentType = (imgRes.headers.get("content-type") || "")
      .split(";")[0]
      .trim()
      .toLowerCase();
    if (!ALLOWED_MIME.includes(contentType)) {
      return NextResponse.json(
        { error: "Kadr nie jest jeszcze gotowy. Spróbuj za chwilę." },
        { status: 415 },
      );
    }

    const buffer = Buffer.from(await imgRes.arrayBuffer());
    if (buffer.byteLength > MAX_BYTES) {
      return NextResponse.json(
        { error: "Kadr jest za duży (max 10 MB)." },
        { status: 413 },
      );
    }

    const ext = contentType.includes("png")
      ? ".png"
      : contentType.includes("webp")
        ? ".webp"
        : contentType.includes("avif")
          ? ".avif"
          : ".jpg";

    const blob = await put(`kurs-okladka-${course.slug}${ext}`, buffer, {
      access: "public",
      addRandomSuffix: true,
      contentType,
    });

    return NextResponse.json({ ok: true, url: blob.url });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Nieprawidłowe dane" }, { status: 400 });
    }
    console.error("Błąd pobierania kadru z wideo:", error);
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}
