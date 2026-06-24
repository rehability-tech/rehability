import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";

// Client upload (bezpośrednio do Vercel Blob) — omija limit body funkcji
// serverless, więc obsługuje duże pliki wideo z realnym progresem po stronie
// klienta. Autoryzację robimy w onBeforeGenerateToken (callback ukończenia
// przychodzi z serwerów Vercela bez sesji użytkownika).
export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const json = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        const { isAuthorized } = await requireAdmin();
        if (!isAuthorized) {
          throw new Error("Brak uprawnień administratora.");
        }
        return {
          allowedContentTypes: [
            "video/mp4",
            "video/quicktime",
            "video/webm",
            "video/x-matroska",
          ],
          maximumSizeInBytes: 2_000_000_000, // 2 GB
          addRandomSuffix: true,
        };
      },
      onUploadCompleted: async () => {
        // Tu w przyszłości: zapis URL-a wideo do bazy (gdy pojawi się model Course).
      },
    });

    return NextResponse.json(json);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || "Błąd przesyłania wideo." },
      { status: 400 },
    );
  }
}
