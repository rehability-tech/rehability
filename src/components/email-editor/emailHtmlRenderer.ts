import type { EmailSection } from "./lib/sections";
import type { TripContext } from "./lib/types";
import { formatDateRange, templateToHtml } from "./lib/templateHelpers";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface EmailRenderContext {
  tripContext: TripContext;
  inviterName: string;
  inviteeName: string;
  invitationUrl: string;
  logoUrl?: string;
  /**
   * Tryb kampanii mailingowej (moduł src/lib/mailer). Gdy podane:
   *  - `ctaUrl` nadpisuje docelowy link przycisków CTA (zamiast invitationUrl),
   *  - `unsubscribeUrl` przełącza stopkę na neutralną z linkiem wypisania (RODO),
   *  - `vars` dorzuca dodatkowe zmienne szablonu (np. {name}, {email}).
   */
  ctaUrl?: string;
  unsubscribeUrl?: string;
  vars?: Record<string, string>;
}

// ─── Icon → emoji fallback for email clients ──────────────────────────────────

const ICON_EMOJI: Record<string, string> = {
  Heart: "❤️", Heartbeat: "💗", Leaf: "🌿", Sun: "☀️", Sparkle: "✨",
  Mountains: "⛰️", Tree: "🌳", Coffee: "☕", Waves: "🌊", Star: "⭐",
  Moon: "🌙", Bed: "🛏️", Campfire: "🔥", Drop: "💧", Wind: "💨",
  Snowflake: "❄️", MusicNotes: "🎵", PersonSimpleRun: "🏃", FlowerLotus: "🪷",
  ForkKnife: "🍴", HandsPraying: "🙏", Crown: "👑", Flower: "🌸", SmileyWink: "😉",
};

// ─── Template variable substitution ──────────────────────────────────────────

function applyVars(
  template: string,
  vars: Record<string, string>,
): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => vars[key] ?? `{${key}}`);
}

// ─── Section renderers ────────────────────────────────────────────────────────

function renderHero(image: string): string {
  if (!image) return "";
  return `
    <img
      src="${image}"
      alt="Wyjazd"
      width="600"
      style="width:100%;max-width:600px;height:auto;aspect-ratio:600/220;object-fit:cover;border-radius:24px 0 0 0;display:block;margin:0 0 24px;"
    />`;
}

function renderTitle(content: string, vars: Record<string, string>): string {
  // Ta sama transformacja co w podglądzie: bez emoji, dane dynamiczne pogrubione (brand-primary).
  const text = templateToHtml(content, vars, { plain: true });
  return `
    <h2 style="margin:0 0 16px;font-size:22px;font-weight:800;color:#0B3B4C;line-height:1.3;font-family:Helvetica,Arial,sans-serif;">
      ${text}
    </h2>`;
}

function renderText(content: string, vars: Record<string, string>): string {
  // templateToHtml(plain) sam zamienia \n na <br>, usuwa emoji i pogrubia tagi.
  const text = templateToHtml(content, vars, { plain: true });
  return `
    <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.7;font-family:Helvetica,Arial,sans-serif;">
      ${text}
    </p>`;
}

function renderDetails(tripContext: TripContext): string {
  const dateRange = formatDateRange(tripContext.startDate, tripContext.endDate);
  return `
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px;border:1px solid #e5f2f3;border-radius:12px;overflow:hidden;">
      <tr>
        <td style="padding:12px 16px;border-bottom:1px solid #e5f2f3;">
          <span style="display:block;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#287d88;font-family:Helvetica,Arial,sans-serif;">Kiedy</span>
          <span style="display:block;font-size:14px;font-weight:600;color:#033f63;margin-top:3px;font-family:Helvetica,Arial,sans-serif;">${dateRange}</span>
        </td>
      </tr>
      ${tripContext.location ? `
      <tr>
        <td style="padding:12px 16px;">
          <span style="display:block;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#287d88;font-family:Helvetica,Arial,sans-serif;">Gdzie</span>
          <span style="display:block;font-size:14px;font-weight:600;color:#033f63;margin-top:3px;font-family:Helvetica,Arial,sans-serif;">${tripContext.location}</span>
        </td>
      </tr>` : ""}
    </table>`;
}

function renderHighlights(icons: string[], labels: string[]): string {
  const items = [0, 1, 2].map((i) => {
    const emoji = ICON_EMOJI[icons[i]] ?? "✨";
    const label = labels[i] ?? "";
    return `
      <td width="33%" style="text-align:center;padding:8px 4px;vertical-align:top;">
        <div style="display:inline-block;width:52px;height:52px;background:linear-gradient(135deg,#287d88,#1d6b76);border-radius:14px;line-height:52px;font-size:24px;text-align:center;">
          ${emoji}
        </div>
        <p style="margin:8px 0 0;font-size:11px;font-weight:600;color:#033f63;line-height:1.3;font-family:Helvetica,Arial,sans-serif;">${label}</p>
      </td>`;
  }).join("");

  return `
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px;">
      <tr>
        <td style="text-align:center;padding:0 0 12px;">
          <span style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#287d88;font-family:Helvetica,Arial,sans-serif;">Co Cię czeka</span>
        </td>
      </tr>
      <tr>${items}</tr>
    </table>`;
}

function renderGallery(images: string[]): string {
  const filled = images.filter(Boolean);
  if (!filled.length) return "";

  const cells = filled.map((src) => `
    <td style="padding:2px;">
      <img src="${src}" alt="" width="180" style="width:100%;max-width:180px;height:110px;object-fit:cover;border-radius:8px;display:block;" />
    </td>
  `).join("");

  return `
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px;">
      <tr>${cells}</tr>
    </table>`;
}

function renderValidity(): string {
  return `
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px;">
      <tr>
        <td style="background:#fdf8e7;border:1px solid #f2d967;border-radius:10px;padding:12px 16px;text-align:center;">
          <p style="margin:0;font-size:12px;font-weight:700;color:#7a6008;font-family:Helvetica,Arial,sans-serif;">
            ⏰ Zaproszenie ważne przez 24 godziny od wysłania
          </p>
        </td>
      </tr>
    </table>`;
}

function renderCta(content: string, ctaUrl: string, vars: Record<string, string>): string {
  const label = applyVars(content, vars) || "Zobacz szczegóły i dołącz";
  return `
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0 8px;">
      <tr>
        <td align="center">
          <a
            href="${ctaUrl}"
            style="display:inline-block;background:linear-gradient(135deg,#287d88,#1d6b76);color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:14px 36px;border-radius:50px;font-family:Helvetica,Arial,sans-serif;letter-spacing:.02em;"
          >
            ${label}
          </a>
        </td>
      </tr>
    </table>`;
}

function renderDivider(): string {
  return `<hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0;" />`;
}

// ─── Main renderer ────────────────────────────────────────────────────────────

export function generateEmailHtml(
  sections: EmailSection[],
  ctx: EmailRenderContext,
): string {
  const {
    tripContext,
    inviterName,
    inviteeName,
    invitationUrl,
    // Logo musi być absolutnym URL-em (klient pocztowy nie zaciągnie ścieżki
    // względnej). Plik leży w /public/logotypy/logo-email.png i jest serwowany
    // pod domeną aplikacji. Poprzedni URL do bloba zwracał 404.
    logoUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://www.rehabilityprudnik.pl"}/logotypy/logo-email.png`,
    ctaUrl,
    unsubscribeUrl,
    vars: extraVars,
  } = ctx;

  const vars: Record<string, string> = {
    inviterName,
    inviteeName,
    campName: tripContext.title || "wyjazd Rehability",
    ...(extraVars ?? {}),
  };

  // Tryb kampanii: link CTA z kampanii (fallback do invitationUrl).
  const resolvedCtaUrl = ctaUrl || invitationUrl;

  const sectionsHtml = sections
    .map((section) => {
      switch (section.type) {
        case "hero":       return renderHero(section.image);
        case "image":      return section.image
          ? `<img src="${section.image}" alt="" width="600" style="width:100%;max-width:600px;height:auto;aspect-ratio:16/9;object-fit:cover;border-radius:12px 0 12px 12px;display:block;margin:0 0 20px;" />`
          : "";
        case "title":      return renderTitle(section.content, vars);
        case "text":       return renderText(section.content, vars);
        case "details":    return renderDetails(tripContext);
        case "highlights": return renderHighlights(section.icons, section.labels);
        case "gallery":    return renderGallery(section.images);
        case "validity":   return renderValidity();
        case "cta":        return renderCta(section.content, resolvedCtaUrl, vars);
        case "divider":    return renderDivider();
        default:           return "";
      }
    })
    .join("\n");

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="pl">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${tripContext.title || "Zaproszenie Rehability"}</title>
</head>
<body style="margin:0;padding:0;background-color:#eef4f5;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#eef4f5;">
    <tr>
      <td align="center" style="padding:24px 16px 32px;">

        <!-- Logo -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;margin:0 auto 20px;">
          <tr>
            <td align="center">
              <img src="${logoUrl}" alt="Rehability" width="120" style="display:block;width:120px;height:auto;" />
            </td>
          </tr>
        </table>

        <!-- White card -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;margin:0 auto;">
          <tr>
            <td style="background-color:#ffffff;border-radius:24px 0 24px 24px;padding:32px 36px;box-shadow:0 18px 40px -16px rgba(3,63,99,.18);">
              ${sectionsHtml}
            </td>
          </tr>
        </table>

        <!-- Footer -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;margin:20px auto 0;">
          <tr>
            <td align="center" style="padding:0 16px;">
              ${
                unsubscribeUrl
                  ? `<p style="margin:0 0 5px;color:#8aa0a6;font-size:11px;line-height:1.5;font-family:Helvetica,Arial,sans-serif;">
                Otrzymujesz tę wiadomość, ponieważ Twój adres e-mail znajduje się w naszej bazie kontaktów.
              </p>
              <p style="margin:0 0 5px;color:#8aa0a6;font-size:11px;line-height:1.5;font-family:Helvetica,Arial,sans-serif;">
                Nie chcesz otrzymywać tych wiadomości?
                <a href="${unsubscribeUrl}" style="color:#287d88;text-decoration:underline;">Wypisz się</a>.
              </p>`
                  : `<p style="margin:0 0 5px;color:#8aa0a6;font-size:11px;line-height:1.5;font-family:Helvetica,Arial,sans-serif;">
                Otrzymujesz tę wiadomość, ponieważ <strong>${inviterName}</strong> wpisała Twój adres e-mail.
              </p>`
              }
              <p style="margin:0;color:#8aa0a6;font-size:11px;font-family:Helvetica,Arial,sans-serif;">
                © 2026 Rehability. Wszystkie prawa zastrzeżone.
              </p>
            </td>
          </tr>
        </table>

      </td>
    </tr>
  </table>
</body>
</html>`;
}
