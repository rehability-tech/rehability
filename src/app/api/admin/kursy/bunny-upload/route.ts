import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import {
  bunnyConfigured,
  createBunnyVideo,
  bunnyTusSignature,
  bunnyEmbedUrl,
  bunnyHlsUrl,
  BUNNY_LIBRARY_ID,
} from "@/lib/bunny";

// Inicjuje upload do Bunny Stream: tworzy obiekt wideo i zwraca dane do
// bezpośredniego, wznawialnego uploadu TUS po stronie klienta (klucz API
// nie opuszcza serwera).
export async function POST(request: Request): Promise<NextResponse> {
  const { isAuthorized, response } = await requireAdmin();
  if (!isAuthorized) return response as NextResponse;

  if (!bunnyConfigured()) {
    return NextResponse.json(
      {
        error:
          "Bunny Stream nie jest skonfigurowany. Uzupełnij BUNNY_STREAM_LIBRARY_ID i BUNNY_STREAM_API_KEY.",
      },
      { status: 503 },
    );
  }

  try {
    const { title } = (await request.json()) as { title?: string };
    const videoId = await createBunnyVideo(title || "Wideo kursu");
    const expire = Math.floor(Date.now() / 1000) + 3600; // 1h na upload
    const signature = bunnyTusSignature(videoId, expire);

    return NextResponse.json({
      libraryId: BUNNY_LIBRARY_ID,
      videoId,
      signature,
      expire,
      embedUrl: bunnyEmbedUrl(videoId),
      hlsUrl: bunnyHlsUrl(videoId),
    });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || "Błąd inicjalizacji uploadu wideo." },
      { status: 500 },
    );
  }
}
