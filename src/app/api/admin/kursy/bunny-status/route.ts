import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import {
  bunnyConfigured,
  getBunnyVideoStatus,
  bunnyGuidFromEmbed,
} from "@/lib/bunny";

// Status przetwarzania wideo w Bunny — odpytywany przez VideoUploader, żeby
// przełączyć podgląd na player, gdy tylko wideo jest grywalne: status „Finished"
// (4) LUB pojawi się pierwsza rozdzielczość (hasResolution) — bez czekania na 4.
export async function GET(request: Request): Promise<NextResponse> {
  const { isAuthorized, response } = await requireAdmin();
  if (!isAuthorized) return response as NextResponse;

  if (!bunnyConfigured()) {
    return NextResponse.json(
      { error: "Bunny Stream nie jest skonfigurowany." },
      { status: 503 },
    );
  }

  const raw = new URL(request.url).searchParams.get("videoId") || "";
  // Akceptujemy zarówno czysty GUID, jak i pełny embed URL.
  const videoId = raw.includes("/embed/") ? bunnyGuidFromEmbed(raw) : raw;
  if (!videoId) {
    return NextResponse.json({ error: "Brak videoId." }, { status: 400 });
  }

  try {
    return NextResponse.json(await getBunnyVideoStatus(videoId));
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || "Błąd pobierania statusu wideo." },
      { status: 500 },
    );
  }
}
