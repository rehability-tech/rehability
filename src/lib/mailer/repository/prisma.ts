/**
 * Adapter warstwy danych na Prisma (implementacja `MailRepository`).
 *
 * JEDYNY plik modułu importujący Prisma. Mapuje modele bazy (Contact / Campaign
 * / CampaignRecipient) na generyczne typy z `../types`. Przeniesienie modułu do
 * innego storage = napisanie nowego pliku spełniającego ten sam interfejs.
 */
import type { PrismaClient } from "@/generated/prisma";
import type {
  CampaignCountsPatch,
  CampaignStatus,
  ContactStatus,
  MailCampaign,
  MailContact,
  MailRepository,
  PendingRecipient,
  RecipientStatus,
  RecipientStatusUpdate,
  SegmentFilter,
} from "../types";

type ContactRow = {
  id: string;
  email: string;
  name: string | null;
  status: string;
  sources: string[];
  tags: string[];
  unsubscribeToken: string;
};

function toMailContact(row: ContactRow): MailContact {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    status: row.status as ContactStatus,
    sources: row.sources,
    tags: row.tags,
    unsubscribeToken: row.unsubscribeToken,
  };
}

const CONTACT_SELECT = {
  id: true,
  email: true,
  name: true,
  status: true,
  sources: true,
  tags: true,
  unsubscribeToken: true,
} as const;

/** Buduje `where` Prisma z filtra segmentu. */
function segmentWhere(filter: SegmentFilter) {
  const where: Record<string, unknown> = {
    status: filter.status ?? "SUBSCRIBED",
  };
  if (filter.sources?.length) where.sources = { hasSome: filter.sources };
  if (filter.tags?.length) where.tags = { hasSome: filter.tags };
  return where;
}

export function createPrismaMailRepository(
  prisma: PrismaClient,
): MailRepository {
  return {
    // ── Kontakty ──────────────────────────────────────────────
    async findContactsBySegment(filter) {
      const rows = await prisma.contact.findMany({
        where: segmentWhere(filter),
        select: CONTACT_SELECT,
      });
      return rows.map(toMailContact);
    },

    async countContactsBySegment(filter) {
      return prisma.contact.count({ where: segmentWhere(filter) });
    },

    async findContactByUnsubToken(token) {
      const row = await prisma.contact.findUnique({
        where: { unsubscribeToken: token },
        select: CONTACT_SELECT,
      });
      return row ? toMailContact(row) : null;
    },

    async setContactStatus(id, status: ContactStatus) {
      await prisma.contact.update({ where: { id }, data: { status } });
    },

    async setContactStatusByEmail(email, status: ContactStatus) {
      await prisma.contact.updateMany({
        where: { email: email.toLowerCase() },
        data: { status },
      });
    },

    // ── Kampanie ──────────────────────────────────────────────
    async getCampaign(id): Promise<MailCampaign | null> {
      const c = await prisma.campaign.findUnique({ where: { id } });
      if (!c) return null;
      return {
        id: c.id,
        name: c.name,
        subject: c.subject,
        fromName: c.fromName,
        fromEmail: c.fromEmail,
        sections: c.sections,
        ctaUrl: c.ctaUrl,
        status: c.status as CampaignStatus,
        filter: {
          sources: c.filterSources,
          tags: c.filterTags,
          status: c.filterStatus as ContactStatus,
        },
      };
    },

    async setCampaignStatus(id, status, extra) {
      await prisma.campaign.update({
        where: { id },
        data: {
          status,
          ...(extra?.totalRecipients !== undefined
            ? { totalRecipients: extra.totalRecipients }
            : {}),
          ...(extra?.sentAt !== undefined ? { sentAt: extra.sentAt } : {}),
        },
      });
    },

    async finishCampaignIfDone(id) {
      // Tylko gdy kampania faktycznie wysyłała — chroni przed przedwczesnym SENT.
      await prisma.campaign.updateMany({
        where: { id, status: "SENDING" },
        data: { status: "SENT", sentAt: new Date() },
      });
    },

    async bumpCampaignCounts(id, patch: CampaignCountsPatch) {
      await prisma.campaign.update({
        where: { id },
        data: {
          sentCount: { increment: patch.sentCount ?? 0 },
          deliveredCount: { increment: patch.deliveredCount ?? 0 },
          openedCount: { increment: patch.openedCount ?? 0 },
          bouncedCount: { increment: patch.bouncedCount ?? 0 },
          failedCount: { increment: patch.failedCount ?? 0 },
        },
      });
    },

    // ── Odbiorcy (kolejka) ────────────────────────────────────
    async createRecipients(campaignId, contacts) {
      if (contacts.length === 0) return 0;
      const res = await prisma.campaignRecipient.createMany({
        data: contacts.map((c) => ({
          campaignId,
          contactId: c.id,
          email: c.email,
        })),
        skipDuplicates: true,
      });
      return res.count;
    },

    async nextPendingRecipients(campaignId, limit): Promise<PendingRecipient[]> {
      const rows = await prisma.campaignRecipient.findMany({
        where: { campaignId, status: "PENDING" },
        take: limit,
        orderBy: { createdAt: "asc" },
        include: { contact: { select: CONTACT_SELECT } },
      });
      return rows.map((r) => ({
        id: r.id,
        contact: toMailContact(r.contact),
      }));
    },

    async countPendingRecipients(campaignId) {
      return prisma.campaignRecipient.count({
        where: { campaignId, status: "PENDING" },
      });
    },

    async markRecipients(updates: RecipientStatusUpdate[]) {
      if (updates.length === 0) return;
      await prisma.$transaction(
        updates.map((u) =>
          prisma.campaignRecipient.update({
            where: { id: u.id },
            data: {
              status: u.status,
              ...(u.providerMessageId !== undefined
                ? { providerMessageId: u.providerMessageId }
                : {}),
              ...(u.error !== undefined ? { error: u.error } : {}),
              ...(u.sentAt !== undefined ? { sentAt: u.sentAt } : {}),
            },
          }),
        ),
      );
    },

    async updateRecipientByProviderId(providerMessageId, patch) {
      const rec = await prisma.campaignRecipient.findFirst({
        where: { providerMessageId },
        select: { id: true, campaignId: true, email: true },
      });
      if (!rec) return null;
      await prisma.campaignRecipient.update({
        where: { id: rec.id },
        data: {
          ...(patch.status ? { status: patch.status as RecipientStatus } : {}),
          ...(patch.openedAt !== undefined ? { openedAt: patch.openedAt } : {}),
          ...(patch.error !== undefined ? { error: patch.error } : {}),
        },
      });
      return { campaignId: rec.campaignId, contactEmail: rec.email };
    },
  };
}
