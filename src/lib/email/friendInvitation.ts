import { getResend, EMAIL_FROM, getAppUrl } from "./resend";
import { generateEmailHtml } from "@/components/email-editor/emailHtmlRenderer";
import type { EmailSection } from "@/components/email-editor/lib/sections";

export interface FriendInvitationParams {
  to: string;
  inviteeName: string;
  inviterName: string;
  campName: string;
  campStart: Date;
  campEnd: Date;
  campLocation: string;
  token: string;
  // Pola customizacji z modelu Trip (opcjonalne – fallback do defaults)
  emailTitle?: string | null;
  emailSubject?: string | null;
  emailBody?: string | null;
  emailButtonText?: string | null;
  emailHeroImage?: string | null;
  emailHighlights?: Array<{ emoji: string; label: string }> | null;
  emailGallery?: string[] | null;
  // Nowy format: sekcje z edytora (WYSIWYG). Gdy obecne — to ONE są wysyłane.
  emailSections?: unknown;
}

// Maps Phosphor icon names (stored in DB) → emoji for email HTML rendering.
// Falls back to the raw value if it's already an emoji (legacy data).
const PHOSPHOR_ICON_EMOJI: Record<string, string> = {
  Heart: "❤️",
  Heartbeat: "💓",
  Leaf: "🌿",
  Sun: "☀️",
  Sparkle: "✨",
  Mountains: "⛰️",
  Tree: "🌲",
  Coffee: "☕",
  Waves: "🌊",
  Star: "⭐",
  Moon: "🌙",
  Bed: "🛏️",
  Campfire: "🔥",
  Drop: "💧",
  Wind: "💨",
  Snowflake: "❄️",
  MusicNotes: "🎵",
  PersonSimpleRun: "🏃‍♀️",
  FlowerLotus: "🪷",
  ForkKnife: "🍽️",
  HandsPraying: "🙏",
  Crown: "👑",
  Flower: "🌸",
  SmileyWink: "😊",
};

function resolveHighlightIcon(value: string): string {
  return PHOSPHOR_ICON_EMOJI[value] ?? value;
}

function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function parseLocation(raw: string): string {
  if (!raw) return "";
  try {
    const obj = JSON.parse(raw);
    if (typeof obj === "object" && obj !== null) {
      const parts = [obj.name, obj.city].filter(Boolean);
      if (parts.length) return parts.join(", ");
    }
  } catch { /* not JSON */ }
  return raw;
}

function substituteVars(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => vars[key] ?? `{${key}}`);
}

function formatCampDate(start: Date, end: Date): string {
  const full = new Intl.DateTimeFormat("pl-PL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return `${full.format(start)} – ${full.format(end)}`;
}

const DEFAULT_HIGHLIGHTS = [
  { emoji: "🧖‍♀️", label: "Relaks i SPA" },
  { emoji: "🍽️", label: "Pyszne jedzenie" },
  { emoji: "✨", label: "Wspólne chwile" },
];

function renderHtml(params: {
  inviteeName: string;
  inviterName: string;
  campName: string;
  campDate: string;
  campLocation: string;
  invitationLink: string;
  currentYear: number;
  emailTitle: string;
  body: string;
  buttonText: string;
  heroImage: string;
  highlights: Array<{ emoji: string; label: string }>;
  gallery: string[];
}): string {
  const {
    inviteeName,
    inviterName,
    campName,
    campDate,
    campLocation,
    invitationLink,
    currentYear,
    emailTitle,
    body,
    buttonText,
    heroImage,
    highlights,
    gallery,
  } = params;

  // Detect new body format: contains template variables → substitute and render directly.
  // Old format (plain extra text): wrap with hardcoded greeting + invitation sentence.
  const isNewFormat = body.includes("{inviteeName}") || body.includes("{inviterName}") || body.includes("{campName}");
  const resolvedBody = body
    .replace(/\{inviteeName\}/g, esc(inviteeName))
    .replace(/\{inviterName\}/g, `<strong style="color:#287d88;">${esc(inviterName)}</strong>`)
    .replace(/\{campName\}/g, `<strong style="color:#287d88;">${esc(campName)}</strong>`)
    .replace(/\n/g, "<br>");

  const bodyParagraph = isNewFormat
    ? `<p style="margin:0 0 28px 0;color:#475569;font-family:'Montserrat','Helvetica Neue',Helvetica,Arial,sans-serif;font-size:16px;line-height:1.6;">${resolvedBody}</p>`
    : `<p style="margin:0 0 16px 0;color:#475569;font-family:'Montserrat','Helvetica Neue',Helvetica,Arial,sans-serif;font-size:16px;line-height:1.6;">
        ${inviteeName ? `Cześć <strong style="color:#033f63">${esc(inviteeName)}</strong>,` : "Cześć,"}
       </p>
       <p style="margin:0 0 28px 0;color:#475569;font-family:'Montserrat','Helvetica Neue',Helvetica,Arial,sans-serif;font-size:16px;line-height:1.6;">
        Twoja znajoma <strong style="color:#287d88;">${esc(inviterName)}</strong>
        serdecznie zaprasza Cię do wspólnego udziału w wyjeździe
        <strong style="color:#287d88;">${esc(campName)}</strong>.
        ${esc(body)}
       </p>`;

  const heroSection = heroImage
    ? `<tr>
        <td style="line-height:0;font-size:0;">
          <img src="${esc(heroImage)}" alt="Wyjazd Rehability" width="600"
            style="width:100%;max-width:600px;height:240px;object-fit:cover;border-radius:24px 0 0 0;display:block;" />
        </td>
      </tr>`
    : "";

  const highlightsHtml = highlights
    .map(
      (h) => `
      <td width="33.33%" align="center" valign="top" style="padding:0 6px;">
        <div style="font-size:28px;line-height:1;margin-bottom:8px;">${resolveHighlightIcon(h.emoji)}</div>
        <p style="margin:0;color:#033f63;font-family:'Montserrat','Helvetica Neue',Helvetica,Arial,sans-serif;font-size:13px;font-weight:600;line-height:1.4;">
          ${esc(h.label)}
        </p>
      </td>`,
    )
    .join("");

  const galleryRows = gallery
    .filter(Boolean)
    .slice(0, 3)
    .map(
      (url) => `
      <tr>
        <td style="padding:0 0 8px 0;">
          <img src="${esc(url)}" alt="Zdjęcie" width="100%"
            style="width:100%;height:180px;object-fit:cover;border-radius:10px 0 10px 10px;display:block;" />
        </td>
      </tr>`,
    )
    .join("");

  const gallerySectionHtml =
    galleryRows
      ? `<p style="margin:0 0 12px 0;color:#287d88;font-family:'Montserrat','Helvetica Neue',Helvetica,Arial,sans-serif;
           font-size:12px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;text-align:center;">
           Klimat wyjazdu
         </p>
         <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%"
           style="margin-bottom:32px;">
           ${galleryRows}
         </table>`
      : "";

  return `<!doctype html>
<html lang="pl">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <title>Zaproszenie na wyjazd</title>
    <!--[if !mso]><!-->
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
    <!--<![endif]-->
    <style>
      @import url("https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&display=swap");
      body,table,td,a{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;}
      table,td{mso-table-lspace:0pt;mso-table-rspace:0pt;}
      img{-ms-interpolation-mode:bicubic;border:0;height:auto;line-height:100%;outline:none;text-decoration:none;display:block;}
      @media screen and (max-width:600px){
        .container{width:100%!important;}
        .content-box{padding:32px 24px!important;}
        .hero-img{height:180px!important;}
        .btn{display:block!important;width:100%!important;text-align:center!important;box-sizing:border-box!important;}
      }
    </style>
  </head>
  <body style="margin:0;padding:0;background-color:#eef4f5;background-image:radial-gradient(circle at 0% 0%,rgba(40,125,136,0.22) 0%,transparent 45%),radial-gradient(circle at 100% 32%,rgba(242,217,103,0.28) 0%,transparent 48%),radial-gradient(circle at 50% 100%,rgba(40,125,136,0.12) 0%,transparent 55%);font-family:'Montserrat','Helvetica Neue',Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">

    <div style="display:none;max-height:0;overflow:hidden;opacity:0;font-size:1px;line-height:1px;color:#eef4f5;">
      ${esc(inviterName)} zaprasza Cię na wyjazd ${esc(campName)} — dołącz do wspólnego wyjazdu!
    </div>

    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%"
      style="background-color:#eef4f5;background-image:radial-gradient(circle at 0% 0%,rgba(40,125,136,0.22) 0%,transparent 45%),radial-gradient(circle at 100% 32%,rgba(242,217,103,0.28) 0%,transparent 48%),radial-gradient(circle at 50% 100%,rgba(40,125,136,0.12) 0%,transparent 55%);padding:40px 0;">
      <tr>
        <td align="center" style="padding:0 16px;">
          <table class="container" role="presentation" border="0" cellpadding="0" cellspacing="0" width="600" style="max-width:600px;width:100%;">

            <!-- LOGO -->
            <tr>
              <td align="center" style="padding-bottom:28px;">
                <img src="https://wkel0sdzlinz0k7a.public.blob.vercel-storage.com/logotypes/logo-email.png"
                  alt="Rehability" width="160"
                  style="width:160px;max-width:160px;height:auto;margin:0 auto;" />
              </td>
            </tr>

            <!-- KARTA (kształt kropli) -->
            <tr>
              <td>
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%"
                  style="background-color:#ffffff;border-radius:24px 0 24px 24px;box-shadow:0 18px 40px -16px rgba(3,63,99,0.18);">

                  ${heroSection}

                  <!-- TREŚĆ -->
                  <tr>
                    <td class="content-box" style="padding:44px 48px;">
                      <h1 style="margin:0 0 24px 0;color:#033f63;font-family:'Montserrat','Helvetica Neue',Helvetica,Arial,sans-serif;font-size:26px;font-weight:800;text-align:center;line-height:1.25;letter-spacing:-0.01em;">
                        ${esc(emailTitle)}
                      </h1>

                      ${bodyParagraph}

                      <!-- SZCZEGÓŁY -->
                      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%"
                        style="background-color:#f3f8f9;border-left:4px solid #287d88;border-radius:16px 0 16px 16px;margin-bottom:32px;">
                        <tr>
                          <td style="padding:22px 24px;">
                            <p style="margin:0 0 6px 0;color:#287d88;font-family:'Montserrat','Helvetica Neue',Helvetica,Arial,sans-serif;font-size:12px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;">Kiedy</p>
                            <p style="margin:0 0 18px 0;color:#033f63;font-family:'Montserrat','Helvetica Neue',Helvetica,Arial,sans-serif;font-size:16px;font-weight:600;">${esc(campDate)}</p>
                            <p style="margin:0 0 6px 0;color:#287d88;font-family:'Montserrat','Helvetica Neue',Helvetica,Arial,sans-serif;font-size:12px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;">Gdzie</p>
                            <p style="margin:0;color:#033f63;font-family:'Montserrat','Helvetica Neue',Helvetica,Arial,sans-serif;font-size:16px;font-weight:600;">${esc(campLocation)}</p>
                          </td>
                        </tr>
                      </table>

                      <!-- CO CIĘ CZEKA -->
                      <p style="margin:0 0 16px 0;color:#287d88;font-family:'Montserrat','Helvetica Neue',Helvetica,Arial,sans-serif;font-size:12px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;text-align:center;">
                        Co Cię czeka
                      </p>
                      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:32px;">
                        <tr>${highlightsHtml}</tr>
                      </table>

                      ${gallerySectionHtml}

                      <!-- WAŻNOŚĆ 24h -->
                      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%"
                        style="background-color:#fef9e7;border:1px solid #f7e6b0;border-radius:12px;margin-bottom:32px;">
                        <tr>
                          <td style="padding:14px 18px;">
                            <p style="margin:0;color:#8a6d1a;font-family:'Montserrat','Helvetica Neue',Helvetica,Arial,sans-serif;font-size:13px;line-height:1.5;">
                              ⏳ <strong>To zaproszenie jest ważne 24 godziny.</strong> Po tym czasie miejsce wraca do puli.
                            </p>
                          </td>
                        </tr>
                      </table>

                      <!-- PRZYCISK -->
                      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                        <tr>
                          <td align="center">
                            <a href="${invitationLink}" class="btn"
                              style="display:inline-block;background-color:#287d88;color:#ffffff;font-family:'Montserrat','Helvetica Neue',Helvetica,Arial,sans-serif;text-decoration:none;font-size:16px;font-weight:700;padding:17px 38px;border-radius:14px 0 14px 14px;border:1px solid rgba(242,217,103,0.4);box-shadow:0 6px 18px 0 rgba(242,217,103,0.45);">
                              ${esc(buttonText)}
                            </a>
                          </td>
                        </tr>
                      </table>

                      <p style="margin:20px 0 0 0;color:#94a3b8;font-size:12px;line-height:1.5;text-align:center;word-break:break-all;font-family:'Montserrat','Helvetica Neue',Helvetica,Arial,sans-serif;">
                        Jeśli przycisk nie działa, skopiuj ten link:<br/>
                        <a href="${invitationLink}" style="color:#287d88;text-decoration:underline;">${invitationLink}</a>
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- STOPKA -->
            <tr>
              <td align="center" style="padding-top:32px;">
                <p style="margin:0 0 8px 0;color:#8aa0a6;font-family:'Montserrat','Helvetica Neue',Helvetica,Arial,sans-serif;font-size:13px;line-height:1.5;">
                  Otrzymujesz tę wiadomość, ponieważ ${esc(inviterName)} wpisała Twój adres e-mail w naszym panelu zaproszeń.
                </p>
                <p style="margin:0;color:#8aa0a6;font-family:'Montserrat','Helvetica Neue',Helvetica,Arial,sans-serif;font-size:13px;">
                  &copy; ${currentYear} Rehability. Wszystkie prawa zastrzeżone.
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

function renderText(params: {
  inviterName: string;
  inviteeName: string;
  campName: string;
  campDate: string;
  campLocation: string;
  invitationLink: string;
  body: string;
}): string {
  return [
    `${params.inviterName} zaprasza Cię na wyjazd "${params.campName}".`,
    "",
    params.body,
    "",
    `Kiedy: ${params.campDate}`,
    `Gdzie: ${params.campLocation}`,
    "",
    "To zaproszenie jest ważne 24 godziny.",
    "",
    `Dołącz tutaj: ${params.invitationLink}`,
    "",
    "— Rehability",
  ].join("\n");
}

export async function sendFriendInvitationEmail(
  params: FriendInvitationParams,
): Promise<void> {
  const resend = getResend();
  if (!resend) return;

  const invitationLink = `${getAppUrl()}/zaproszenie/${params.token}`;
  const campDate = formatCampDate(params.campStart, params.campEnd);
  const currentYear = new Date().getFullYear();

  const campLocation = parseLocation(params.campLocation);
  const templateVars = {
    inviterName: params.inviterName,
    inviteeName: params.inviteeName,
    campName: params.campName,
  };

  const emailTitle = params.emailTitle?.trim() || "Pakuj walizki!";
  const rawBody =
    params.emailBody?.trim() ||
    "Czeka na Was wspaniały czas, relaks, świetne jedzenie i niezapomniane wspomnienia!";
  const buttonText =
    params.emailButtonText?.trim() || "Zobacz szczegóły i dołącz";
  const heroImage = params.emailHeroImage?.trim() || "";
  const highlights =
    Array.isArray(params.emailHighlights) && params.emailHighlights.length > 0
      ? params.emailHighlights
      : DEFAULT_HIGHLIGHTS;
  const gallery = Array.isArray(params.emailGallery)
    ? params.emailGallery.filter(Boolean)
    : [];

  const subjectTemplate =
    params.emailSubject?.trim() ||
    `Zaproszenie na wyjazd "${params.campName}" ✈️`;
  const subject = substituteVars(subjectTemplate, templateVars);

  // ── Wybór renderera ─────────────────────────────────────────────────────────
  // Jeśli wyjazd ma zapisane sekcje z edytora — renderujemy DOKŁADNIE ten e-mail
  // (WYSIWYG, 1:1 z podglądem). W przeciwnym razie fallback na stary szablon.
  const sections = Array.isArray(params.emailSections)
    ? (params.emailSections as EmailSection[])
    : [];

  const html =
    sections.length > 0
      ? generateEmailHtml(sections, {
          tripContext: {
            title: params.campName,
            description: "",
            location: campLocation,
            startDate: params.campStart.toISOString(),
            endDate: params.campEnd.toISOString(),
          },
          inviterName: params.inviterName,
          inviteeName: params.inviteeName,
          invitationUrl: invitationLink,
        })
      : renderHtml({
          inviteeName: params.inviteeName,
          inviterName: params.inviterName,
          campName: params.campName,
          campDate,
          campLocation,
          invitationLink,
          currentYear,
          emailTitle,
          body: rawBody,
          buttonText,
          heroImage,
          highlights,
          gallery,
        });

  const { error } = await resend.emails.send({
    from: EMAIL_FROM,
    to: params.to,
    subject,
    html,
    text: renderText({
      inviterName: params.inviterName,
      inviteeName: params.inviteeName,
      campName: params.campName,
      campDate,
      campLocation,
      invitationLink,
      body: substituteVars(rawBody, templateVars).replace(/\n/g, "\n"),
    }),
  });

  if (error) {
    console.error("[email] Resend zwrócił błąd przy zaproszeniu:", error);
  }
}
