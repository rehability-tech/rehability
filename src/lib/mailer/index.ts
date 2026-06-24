/**
 * Punkt wejścia modułu mailingowego (composition root).
 *
 * Spina przenośny rdzeń z konkretnymi adapterami tego projektu:
 *   • repozytorium  → Prisma  (repository/prisma.ts)
 *   • provider      → Resend  (provider/resend.ts)
 *   • render        → edytor maili (render.ts)
 *   • config        → env     (config.ts)
 *
 * Przeniesienie do innego projektu = podmiana tych czterech adapterów; reszta
 * (campaigns.ts, segments.ts, unsubscribe.ts, webhook.ts, types.ts) jedzie 1:1.
 *
 * To jedyny — poza repository/prisma.ts — plik świadomie zależny od projektu
 * (importuje `@/lib/prisma`).
 */
import { prisma } from "@/lib/prisma";
import { loadMailerConfigFromEnv, type MailerConfig } from "./config";
import { createPrismaMailRepository } from "./repository/prisma";
import { createResendProvider, RESEND_BATCH_LIMIT } from "./provider/resend";
import { renderCampaignHtml } from "./render";
import {
  drainCampaign,
  enqueueCampaign,
  sendTest,
  type CampaignDeps,
  type DrainResult,
} from "./campaigns";
import type {
  CampaignCountsPatch,
  ContactStatus,
  MailContact,
  SegmentFilter,
} from "./types";

export interface Mailer {
  config: MailerConfig;
  /** Domyślny rozmiar paczki wysyłki. */
  batchLimit: number;
  /** Liczy odbiorców pasujących do segmentu (live preview audytorium). */
  countSegment(filter: SegmentFilter): Promise<number>;
  /** Tworzy kolejkę odbiorców + status SENDING. */
  enqueue(campaignId: string): Promise<{ queued: number; total: number }>;
  /** Wysyła jedną paczkę z kolejki. */
  drain(campaignId: string, limit?: number): Promise<DrainResult>;
  /** Wysyła wiadomość testową. */
  sendTest(campaignId: string, toEmail: string): Promise<void>;
  /** Webhook: aktualizuje odbiorcę po ID wiadomości providera. */
  applyProviderEvent(
    messageId: string,
    patch: {
      status?: import("./types").RecipientStatus;
      openedAt?: Date | null;
      countsPatch?: CampaignCountsPatch;
    },
  ): Promise<void>;
  /** Webhook: ustawia status kontaktu po adresie (bounce/complaint). */
  setContactStatusByEmail(email: string, status: ContactStatus): Promise<void>;
  /** Wypisanie: znajduje kontakt po tokenie. */
  findContactByUnsubToken(token: string): Promise<MailContact | null>;
  /** Wypisanie: ustawia status UNSUBSCRIBED. */
  unsubscribe(contactId: string): Promise<void>;
}

let cached: Mailer | null = null;

export function getMailer(): Mailer {
  if (cached) return cached;

  const config = loadMailerConfigFromEnv();
  const repo = createPrismaMailRepository(prisma);
  const provider = createResendProvider(config.resendApiKey);

  const deps: CampaignDeps = {
    repo,
    provider,
    config,
    render: (campaign, contact, ctx) =>
      renderCampaignHtml(campaign, contact, {
        unsubscribeUrl: ctx.unsubscribeUrl,
        appUrl: config.appUrl,
        fromName: config.fromName,
      }),
  };

  cached = {
    config,
    batchLimit: RESEND_BATCH_LIMIT,
    countSegment: (filter) => repo.countContactsBySegment(filter),
    enqueue: (campaignId) => enqueueCampaign(campaignId, deps),
    drain: (campaignId, limit = RESEND_BATCH_LIMIT) =>
      drainCampaign(campaignId, limit, deps),
    sendTest: (campaignId, toEmail) => sendTest(campaignId, toEmail, deps),
    async applyProviderEvent(messageId, patch) {
      const res = await repo.updateRecipientByProviderId(messageId, {
        status: patch.status,
        openedAt: patch.openedAt,
      });
      if (res && patch.countsPatch) {
        await repo.bumpCampaignCounts(res.campaignId, patch.countsPatch);
      }
    },
    setContactStatusByEmail: (email, status) =>
      repo.setContactStatusByEmail(email, status),
    findContactByUnsubToken: (token) => repo.findContactByUnsubToken(token),
    unsubscribe: (contactId) => repo.setContactStatus(contactId, "UNSUBSCRIBED"),
  };

  return cached;
}

export { loadMailerConfigFromEnv } from "./config";
export { verifyResendSignature, parseResendEvent } from "./webhook";
export { buildUnsubscribeUrl } from "./unsubscribe";
export { describeSegment, normalizeSegment } from "./segments";
export type {
  SegmentFilter,
  MailContact,
  ContactStatus,
  CampaignStatus,
  RecipientStatus,
} from "./types";
