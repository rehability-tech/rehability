/**
 * Rdzeń orkiestracji kampanii — CZYSTY, sterowany wstrzykniętymi zależnościami.
 *
 * Zna wyłącznie abstrakcje z `./types`: repozytorium (storage), provider (wysyłka)
 * i funkcję renderującą. Nie importuje Prismy ani Resend — to czyni go przenośnym.
 *
 * Model wysyłki = kolejka + drainer:
 *   1. enqueueCampaign  — materializuje odbiorców (PENDING) dla segmentu, status → SENDING.
 *   2. drainCampaign    — wysyła paczkami (wołane z API i/lub crona), aż 0 PENDING → SENT.
 * Dzięki temu duże listy nie biją w limity czasu funkcji serverless.
 */
import type {
  MailCampaign,
  MailContact,
  MailProvider,
  MailRepository,
  OutgoingMessage,
  RecipientStatusUpdate,
  RenderCampaign,
} from "./types";
import type { MailerConfig } from "./config";
import { buildUnsubscribeUrl, substituteContactVars } from "./unsubscribe";

export interface CampaignDeps {
  repo: MailRepository;
  provider: MailProvider;
  render: RenderCampaign;
  config: MailerConfig;
}

/** Składa nagłówek From z (opcjonalnych) ustawień kampanii albo configu. */
function buildFrom(campaign: MailCampaign, config: MailerConfig): string {
  if (campaign.fromEmail) {
    const name = campaign.fromName || config.fromName;
    return `${name} <${campaign.fromEmail}>`;
  }
  return config.fromHeader;
}

function buildMessage(
  campaign: MailCampaign,
  contact: MailContact,
  deps: CampaignDeps,
): OutgoingMessage {
  const unsubscribeUrl = buildUnsubscribeUrl(
    deps.config.appUrl,
    contact.unsubscribeToken,
  );
  return {
    to: contact.email,
    from: buildFrom(campaign, deps.config),
    subject: substituteContactVars(campaign.subject, contact),
    html: deps.render(campaign, contact, { unsubscribeUrl }),
    headers: { "List-Unsubscribe": `<${unsubscribeUrl}>` },
  };
}

/**
 * Materializuje kolejkę odbiorców dla segmentu kampanii i przełącza ją w SENDING.
 * Idempotentne — ponowne wywołanie nie zduplikuje odbiorców (createMany skipDuplicates).
 */
export async function enqueueCampaign(
  campaignId: string,
  deps: CampaignDeps,
): Promise<{ queued: number; total: number }> {
  const campaign = await deps.repo.getCampaign(campaignId);
  if (!campaign) throw new Error("Kampania nie istnieje.");

  const contacts = await deps.repo.findContactsBySegment(campaign.filter);
  const queued = await deps.repo.createRecipients(
    campaignId,
    contacts.map((c) => ({ id: c.id, email: c.email })),
  );
  await deps.repo.setCampaignStatus(campaignId, "SENDING", {
    totalRecipients: contacts.length,
  });
  return { queued, total: contacts.length };
}

export interface DrainResult {
  sent: number;
  failed: number;
  remaining: number;
  done: boolean;
}

/**
 * Wysyła do `limit` oczekujących odbiorców jedną paczką. Zwraca, ile zostało.
 * Gdy 0 PENDING — domyka kampanię (SENDING → SENT).
 */
export async function drainCampaign(
  campaignId: string,
  limit: number,
  deps: CampaignDeps,
): Promise<DrainResult> {
  const pending = await deps.repo.nextPendingRecipients(campaignId, limit);

  if (pending.length === 0) {
    await deps.repo.finishCampaignIfDone(campaignId);
    return { sent: 0, failed: 0, remaining: 0, done: true };
  }

  const campaign = await deps.repo.getCampaign(campaignId);
  if (!campaign) throw new Error("Kampania nie istnieje.");

  const messages = pending.map((p) => buildMessage(campaign, p.contact, deps));
  const results = await deps.provider.sendBatch(messages);

  const now = new Date();
  const updates: RecipientStatusUpdate[] = pending.map((p, i) => {
    const r = results[i];
    return {
      id: p.id,
      status: r?.ok ? "SENT" : "FAILED",
      providerMessageId: r?.providerMessageId ?? null,
      error: r?.ok ? null : (r?.error ?? "Nieznany błąd wysyłki"),
      sentAt: r?.ok ? now : null,
    };
  });
  await deps.repo.markRecipients(updates);

  const sent = updates.filter((u) => u.status === "SENT").length;
  const failed = updates.length - sent;
  await deps.repo.bumpCampaignCounts(campaignId, {
    sentCount: sent,
    failedCount: failed,
  });

  const remaining = await deps.repo.countPendingRecipients(campaignId);
  const done = remaining === 0;
  if (done) await deps.repo.finishCampaignIfDone(campaignId);

  return { sent, failed, remaining, done };
}

/** Wysyła pojedynczą wiadomość testową na wskazany adres (nie dotyka kolejki). */
export async function sendTest(
  campaignId: string,
  toEmail: string,
  deps: CampaignDeps,
): Promise<void> {
  const campaign = await deps.repo.getCampaign(campaignId);
  if (!campaign) throw new Error("Kampania nie istnieje.");

  const fakeContact: MailContact = {
    id: "test",
    email: toEmail,
    name: "Test",
    status: "SUBSCRIBED",
    sources: [],
    tags: [],
    unsubscribeToken: "test-token",
  };

  const message = buildMessage(campaign, fakeContact, deps);
  message.subject = `[TEST] ${message.subject}`;

  const [res] = await deps.provider.sendBatch([message]);
  if (!res?.ok) throw new Error(res?.error ?? "Nie udało się wysłać testu.");
}
