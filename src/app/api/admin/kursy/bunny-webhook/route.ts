import { NextResponse } from "next/server";

// Webhook Bunny Stream — wywoływany server-to-server przy zmianie statusu
// wideo (m.in. zakończenie przetwarzania / błąd). NIE wymaga sesji admina;
// zabezpieczamy sekretem w query (?secret=...), porównywanym z BUNNY_WEBHOOK_SECRET.
//
// Status (Bunny): 0 Created · 1 Uploaded · 2 Processing · 3 Transcoding ·
// 4 Finished · 5 Error · 6 UploadFailed.
type BunnyWebhookPayload = {
  VideoLibraryId?: number;
  VideoGuid?: string;
  Status?: number;
};

export async function POST(request: Request): Promise<NextResponse> {
  const secret = process.env.BUNNY_WEBHOOK_SECRET || "";
  if (secret) {
    const url = new URL(request.url);
    if (url.searchParams.get("secret") !== secret) {
      return NextResponse.json({ error: "Brak autoryzacji." }, { status: 401 });
    }
  }

  let payload: BunnyWebhookPayload;
  try {
    payload = (await request.json()) as BunnyWebhookPayload;
  } catch {
    return NextResponse.json({ error: "Nieprawidłowy payload." }, { status: 400 });
  }

  const { VideoGuid, Status } = payload;
  const ready = Status === 3 || Status === 4;
  const failed = Status === 5 || Status === 6;

  // TODO (po podłączeniu modelu Course w Prisma): zapisz status wideo,
  // np. oznacz lekcję jako gotową gdy `ready`, albo zgłoś błąd gdy `failed`.
  console.info(
    `[bunny-webhook] video=${VideoGuid} status=${Status}` +
      (ready ? " (gotowe)" : failed ? " (błąd)" : ""),
  );

  // Zawsze 200 — Bunny ponawia przy innym kodzie.
  return NextResponse.json({ received: true });
}
