/**
 * Generyczne typy i kontrakty modułu mailingowego.
 *
 * To serce przenośności: rdzeń (`campaigns.ts`) zna WYŁĄCZNIE te abstrakcje —
 * `MailRepository` (skąd brać/gdzie zapisywać dane), `MailProvider` (czym wysłać)
 * i `RenderCampaign` (jak złożyć HTML). Konkretne implementacje (Prisma, Resend,
 * edytor maili) to wymienne adaptery. Zero typów Prisma/Resend tutaj.
 */

export type ContactStatus =
  | "SUBSCRIBED"
  | "UNSUBSCRIBED"
  | "BOUNCED"
  | "COMPLAINED";

export type CampaignStatus =
  | "DRAFT"
  | "SCHEDULED"
  | "SENDING"
  | "SENT"
  | "FAILED";

export type RecipientStatus =
  | "PENDING"
  | "SENT"
  | "DELIVERED"
  | "OPENED"
  | "BOUNCED"
  | "FAILED";

/** Pojedynczy kontakt w postaci niezależnej od warstwy danych. */
export interface MailContact {
  id: string;
  email: string;
  name: string | null;
  status: ContactStatus;
  sources: string[];
  tags: string[];
  unsubscribeToken: string;
}

/** Filtr segmentu odbiorców. `sources`/`tags` dopasowują się jako "ANY". */
export interface SegmentFilter {
  sources?: string[];
  tags?: string[];
  /** Domyślnie tylko SUBSCRIBED. */
  status?: ContactStatus;
}

/** Kampania w postaci niezależnej od warstwy danych. */
export interface MailCampaign {
  id: string;
  name: string;
  subject: string;
  fromName: string | null;
  fromEmail: string | null;
  /** Sekcje z edytora maili (EmailSection[]); rdzeń traktuje je jako nieprzezroczyste. */
  sections: unknown;
  ctaUrl: string | null;
  status: CampaignStatus;
  filter: SegmentFilter;
}

/** Wiadomość gotowa do wysłania. */
export interface OutgoingMessage {
  to: string;
  from: string;
  subject: string;
  html: string;
  replyTo?: string;
  headers?: Record<string, string>;
}

/** Wynik wysyłki pojedynczej wiadomości. */
export interface SendResult {
  to: string;
  ok: boolean;
  providerMessageId?: string;
  error?: string;
}

/** Provider wysyłki (Resend, SES, ...). */
export interface MailProvider {
  /** Wysyła paczkę wiadomości; zwraca wyniki W TEJ SAMEJ KOLEJNOŚCI co wejście. */
  sendBatch(messages: OutgoingMessage[]): Promise<SendResult[]>;
}

/** Odbiorca oczekujący w kolejce, z dociągniętym kontaktem do renderu. */
export interface PendingRecipient {
  id: string;
  contact: MailContact;
}

/** Łatka liczników kampanii (wszystkie pola opcjonalne, inkrementowane). */
export interface CampaignCountsPatch {
  sentCount?: number;
  deliveredCount?: number;
  openedCount?: number;
  bouncedCount?: number;
  failedCount?: number;
}

/** Aktualizacja statusu odbiorcy po wysyłce. */
export interface RecipientStatusUpdate {
  id: string;
  status: RecipientStatus;
  providerMessageId?: string | null;
  error?: string | null;
  sentAt?: Date | null;
}

/** Warstwa dostępu do danych — jedyne wejście rdzenia do storage. */
export interface MailRepository {
  // ── Kontakty ────────────────────────────────────────────────
  findContactsBySegment(filter: SegmentFilter): Promise<MailContact[]>;
  countContactsBySegment(filter: SegmentFilter): Promise<number>;
  findContactByUnsubToken(token: string): Promise<MailContact | null>;
  setContactStatus(id: string, status: ContactStatus): Promise<void>;
  setContactStatusByEmail(email: string, status: ContactStatus): Promise<void>;

  // ── Kampanie ────────────────────────────────────────────────
  getCampaign(id: string): Promise<MailCampaign | null>;
  setCampaignStatus(
    id: string,
    status: CampaignStatus,
    extra?: { totalRecipients?: number; sentAt?: Date | null },
  ): Promise<void>;
  finishCampaignIfDone(id: string): Promise<void>;
  bumpCampaignCounts(id: string, patch: CampaignCountsPatch): Promise<void>;

  // ── Odbiorcy (kolejka) ──────────────────────────────────────
  createRecipients(
    campaignId: string,
    contacts: Array<{ id: string; email: string }>,
  ): Promise<number>;
  nextPendingRecipients(
    campaignId: string,
    limit: number,
  ): Promise<PendingRecipient[]>;
  countPendingRecipients(campaignId: string): Promise<number>;
  markRecipients(updates: RecipientStatusUpdate[]): Promise<void>;
  /** Webhook: aktualizuje odbiorcę po ID wiadomości providera. */
  updateRecipientByProviderId(
    providerMessageId: string,
    patch: {
      status?: RecipientStatus;
      openedAt?: Date | null;
      error?: string | null;
    },
  ): Promise<{ campaignId: string; contactEmail: string } | null>;
}

/** Funkcja renderująca HTML kampanii dla konkretnego kontaktu. */
export type RenderCampaign = (
  campaign: MailCampaign,
  contact: MailContact,
  ctx: { unsubscribeUrl: string },
) => string;
