import { NextResponse } from "next/server";
import crypto from "node:crypto";

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

/** Porównanie stałoczasowe (bez wycieku sekretu przez timing). */
function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

export async function POST(request: Request): Promise<NextResponse> {
  const secret = process.env.BUNNY_WEBHOOK_SECRET || "";
  // Fail-closed: bez skonfigurowanego sekretu nie przyjmujemy wywołań (to
  // publiczny endpoint) — inaczej każdy mógłby go wołać.
  if (!secret) {
    console.error("[bunny-webhook] Brak BUNNY_WEBHOOK_SECRET — odrzucam.");
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 },
    );
  }
  const provided = new URL(request.url).searchParams.get("secret") ?? "";
  if (!safeEqual(provided, secret)) {
    return NextResponse.json({ error: "Brak autoryzacji." }, { status: 401 });
  }

  let payload: BunnyWebhookPayload;
  try {
    payload = (await request.json()) as BunnyWebhookPayload;
  } catch {
    return NextResponse.json({ error: "Nieprawidłowy payload." }, { status: 400 });
  }

  const { VideoGuid, Status } = payload;
  // Bez availableResolutions (webhook nie niesie) uznajemy „gotowe" dopiero na
  // Finished (4) — spójnie z pollingiem, który poza tym używa też hasResolution.
  const ready = Status === 4;
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
