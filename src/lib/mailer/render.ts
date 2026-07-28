/**
 * Adapter renderowania HTML kampanii.
 *
 * Łączy generyczny `MailCampaign`/`MailContact` z konkretnym silnikiem
 * renderującym aplikacji (edytor maili Rehability). To punkt wymiany przy
 * przenoszeniu modułu — w innym projekcie podstawiasz własną funkcję `RenderCampaign`.
 */
import { generateEmailHtml } from "@/components/email-editor/emailHtmlRenderer";
import type { EmailSection } from "@/components/email-editor/lib/sections";
import type { MailCampaign, MailContact } from "./types";
import { substituteContactVars } from "./unsubscribe";

export function renderCampaignHtml(
  campaign: MailCampaign,
  contact: MailContact,
  ctx: { unsubscribeUrl: string; appUrl: string; fromName: string },
): string {
  const sections = Array.isArray(campaign.sections)
    ? (campaign.sections as EmailSection[])
    : [];

  return generateEmailHtml(sections, {
    // Kampania nie jest powiązana z wydarzeniem — neutralny kontekst.
    tripContext: {
      title: campaign.subject,
      description: "",
      location: "",
      startDate: "",
      endDate: "",
    },
    inviterName: campaign.fromName || ctx.fromName,
    inviteeName: contact.name ?? "",
    invitationUrl: campaign.ctaUrl || ctx.appUrl,
    ctaUrl: campaign.ctaUrl || ctx.appUrl,
    unsubscribeUrl: ctx.unsubscribeUrl,
    vars: {
      name: contact.name ?? "",
      email: contact.email,
    },
  });
}

/** Renderuje temat z podstawionymi zmiennymi kontaktu. */
export function renderSubject(
  campaign: MailCampaign,
  contact: MailContact,
): string {
  return substituteContactVars(campaign.subject, contact);
}
