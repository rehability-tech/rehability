import { NextResponse } from "next/server";
import {
  getMailer,
  verifyResendSignature,
  parseResendEvent,
} from "@/lib/mailer";
import type { CampaignCountsPatch } from "@/lib/mailer/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Webhook Resend (schemat Svix). Aktualizuje statusy odbiorców kampanii
 * (delivered/opened/bounced/complained) oraz status kontaktu przy bounce/complaint.
 *
 * WAŻNE: podpis weryfikujemy na SUROWYM ciele (`req.text()`), nie na sparsowanym
 * JSON-ie — inaczej HMAC się nie zgodzi.
 */
export async function POST(req: Request) {
  const mailer = getMailer();
  const raw = await req.text();

  const verified = verifyResendSignature(
    mailer.config.webhookSecret,
    {
      "svix-id": req.headers.get("svix-id"),
      "svix-timestamp": req.headers.get("svix-timestamp"),
      "svix-signature": req.headers.get("svix-signature"),
    },
    raw,
  );

  if (!verified) {
    // Brak sekretu lub błędny podpis — odrzucamy (chroni liczniki przed spoofingiem).
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const event = parseResendEvent(payload);
  if (!event) return NextResponse.json({ ok: true, ignored: true });

  try {
    // Aktualizacja odbiorcy + liczników kampanii.
    if (event.messageId && event.recipientStatus) {
      const countsPatch: CampaignCountsPatch = {};
      if (event.recipientStatus === "DELIVERED") countsPatch.deliveredCount = 1;
      if (event.recipientStatus === "OPENED") countsPatch.openedCount = 1;
      if (event.recipientStatus === "BOUNCED") countsPatch.bouncedCount = 1;

      await mailer.applyProviderEvent(event.messageId, {
        status: event.recipientStatus,
        openedAt: event.recipientStatus === "OPENED" ? new Date() : undefined,
        countsPatch,
      });
    }

    // Bounce / complaint → wyłączamy kontakt z przyszłych wysyłek.
    if (event.contactStatus && event.email) {
      await mailer.setContactStatusByEmail(event.email, event.contactStatus);
    }
  } catch (e) {
    console.error("[webhooks/resend] apply error:", e);
    // Zwracamy 200, żeby Resend nie zalewał retry — błąd mamy w logach.
  }

  return NextResponse.json({ ok: true });
}
