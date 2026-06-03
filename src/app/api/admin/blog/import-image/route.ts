import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";

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

    if (!url || !/^https?:\/\//i.test(url)) {
      return NextResponse.json(
        { error: "Nieprawidłowy adres zdjęcia." },
        { status: 400 },
      );
    }

    const imgRes = await fetch(url);
    if (!imgRes.ok) {
      return NextResponse.json(
        { error: "Nie udało się pobrać zdjęcia ze źródła." },
        { status: 502 },
      );
    }

    const contentType = imgRes.headers.get("content-type") || "image/jpeg";
    const ext = contentType.includes("png")
      ? ".png"
      : contentType.includes("webp")
        ? ".webp"
        : ".jpg";
    const safeName = (filename || "blog-cover")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60);

    const buffer = Buffer.from(await imgRes.arrayBuffer());

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
