/**
 * Weryfikacja i parsowanie webhooków providera (Resend używa schematu Svix).
 *
 * Celowo BEZ zależności `svix` — ręczna weryfikacja HMAC-SHA256 trzyma moduł
 * lekkim i przenośnym. Sekret ma format "whsec_<base64>".
 */
import crypto from "crypto";
import type { RecipientStatus } from "./types";

export interface ResendWebhookHeaders {
  "svix-id"?: string | null;
  "svix-timestamp"?: string | null;
  "svix-signature"?: string | null;
}

function timingSafeEqualStr(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

/**
 * Weryfikuje podpis Svix. `rawBody` MUSI być surowym ciałem żądania (string),
 * nie sparsowanym JSON-em — inaczej podpis się nie zgodzi.
 */
export function verifyResendSignature(
  secret: string | undefined,
  headers: ResendWebhookHeaders,
  rawBody: string,
): boolean {
  if (!secret) return false;
  const id = headers["svix-id"];
  const ts = headers["svix-timestamp"];
  const sigHeader = headers["svix-signature"];
  if (!id || !ts || !sigHeader) return false;

  const secretBytes = Buffer.from(secret.replace(/^whsec_/, ""), "base64");
  const signedContent = `${id}.${ts}.${rawBody}`;
  const expected = crypto
    .createHmac("sha256", secretBytes)
    .update(signedContent)
    .digest("base64");

  // Nagłówek może zawierać wiele podpisów: "v1,<sig> v1,<sig2>".
  const provided = sigHeader
    .split(" ")
    .map((part) => part.split(",")[1])
    .filter(Boolean);

  return provided.some((sig) => timingSafeEqualStr(sig, expected));
}

export interface ParsedResendEvent {
  /** Surowy typ Resend, np. "email.delivered". */
  type: string;
  /** ID wiadomości providera (do korelacji z CampaignRecipient). */
  messageId?: string;
  email?: string;
  /** Zmapowany status odbiorcy (jeśli zdarzenie go zmienia). */
  recipientStatus?: RecipientStatus;
  /** Czy zdarzenie powinno wpłynąć na status kontaktu (bounce/complaint). */
  contactStatus?: "BOUNCED" | "COMPLAINED";
}

/** Mapuje payload Resend na neutralny event domeny mailingowej. */
export function parseResendEvent(payload: unknown): ParsedResendEvent | null {
  if (!payload || typeof payload !== "object") return null;
  const p = payload as {
    type?: string;
    data?: { email_id?: string; to?: string | string[] };
  };
  if (!p.type) return null;

  const toRaw = p.data?.to;
  const email = Array.isArray(toRaw) ? toRaw[0] : toRaw;

  const event: ParsedResendEvent = {
    type: p.type,
    messageId: p.data?.email_id,
    email,
  };

  switch (p.type) {
    case "email.delivered":
      event.recipientStatus = "DELIVERED";
      break;
    case "email.opened":
      event.recipientStatus = "OPENED";
      break;
    case "email.bounced":
      event.recipientStatus = "BOUNCED";
      event.contactStatus = "BOUNCED";
      break;
    case "email.complained":
      event.contactStatus = "COMPLAINED";
      break;
    default:
      // sent / clicked / delivery_delayed — pomijamy (status już SENT).
      break;
  }

  return event;
}
