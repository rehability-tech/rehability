import { getResend, EMAIL_FROM, getAppUrl } from "./resend";

export interface FriendInvitationParams {
  to: string;
  inviteeName: string;
  inviterName: string;
  campName: string;
  campStart: Date;
  campEnd: Date;
  campLocation: string;
  token: string;
}

/** Minimalny escape, bo dane (imiona, nazwa wyjazdu) pochodzą od użytkowniczek. */
function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** "12 czerwca 2026 – 16 czerwca 2026" (albo skrót, gdy ten sam rok/miesiąc). */
function formatCampDate(start: Date, end: Date): string {
  const full = new Intl.DateTimeFormat("pl-PL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return `${full.format(start)} – ${full.format(end)}`;
}

function renderHtml(params: {
  inviteeName: string;
  inviterName: string;
  campName: string;
  campDate: string;
  campLocation: string;
  invitationLink: string;
  currentYear: number;
}): string {
  const {
    inviteeName,
    inviterName,
    campName,
    campDate,
    campLocation,
    invitationLink,
    currentYear,
  } = params;

  const greeting = inviteeName ? `Cześć <strong>${esc(inviteeName)}</strong>,` : "Cześć,";

  return `<!doctype html>
<html lang="pl">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <title>Zaproszenie na wyjazd</title>
    <style>
      body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
      table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
      img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
      @media screen and (max-width: 600px) {
        .container { width: 100% !important; padding: 0 16px !important; }
        .content-box { padding: 32px 24px !important; }
        .btn { display: block !important; width: 100% !important; text-align: center !important; box-sizing: border-box; }
      }
    </style>
  </head>
  <body style="margin:0; padding:0; background-color:#f7fafb; font-family:'Helvetica Neue', Helvetica, Arial, sans-serif; -webkit-font-smoothing:antialiased;">
    <div style="display:none; max-height:0; overflow:hidden; opacity:0; font-size:1px; line-height:1px; color:#f7fafb;">
      ${esc(inviterName)} zaprasza Cię na wyjazd ${esc(campName)} — dołącz do wspólnego wyjazdu!
    </div>

    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:#f7fafb; padding:40px 0;">
      <tr>
        <td align="center">
          <table class="container" border="0" cellpadding="0" cellspacing="0" width="600" style="max-width:600px; width:100%;">
            <!-- LOGO + żółty akcent -->
            <tr>
              <td align="center" style="padding-bottom:24px;">
                <h1 style="margin:0; color:#287d88; font-size:24px; font-weight:bold; letter-spacing:2px;">REHABILITY</h1>
                <div style="width:42px; height:4px; background-color:#f2d967; border-radius:999px; margin:10px auto 0;"></div>
              </td>
            </tr>

            <!-- KARTA -->
            <tr>
              <td class="content-box" style="background-color:#ffffff; border-radius:24px; padding:48px; border:1px solid #e2e8f0; box-shadow:0 8px 30px -12px rgba(3,63,99,0.10);">
                <p style="margin:0 0 8px 0; text-align:center; color:#287d88; font-size:13px; font-weight:bold; letter-spacing:1px; text-transform:uppercase;">Masz zaproszenie</p>
                <h2 style="margin:0 0 24px 0; color:#033f63; font-size:24px; font-weight:bold; text-align:center;">Pakuj walizki! ✈️</h2>

                <p style="margin:0 0 16px 0; color:#475569; font-size:16px; line-height:1.6;">${greeting}</p>
                <p style="margin:0 0 28px 0; color:#475569; font-size:16px; line-height:1.6;">
                  Twoja znajoma <strong>${esc(inviterName)}</strong> zaprasza Cię do wspólnego udziału w wyjeździe
                  <strong style="color:#033f63;">${esc(campName)}</strong>. Czeka na Was relaks, świetne jedzenie i niezapomniane wspomnienia!
                </p>

                <!-- SZCZEGÓŁY -->
                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:#f8fafc; border-radius:16px; border:1px solid #eef2f6; margin-bottom:24px;">
                  <tr>
                    <td style="padding:22px;">
                      <p style="margin:0 0 4px 0; color:#94a3b8; font-size:12px; font-weight:bold; letter-spacing:0.5px; text-transform:uppercase;">📅 Kiedy</p>
                      <p style="margin:0 0 18px 0; color:#0f172a; font-size:15px; font-weight:600;">${esc(campDate)}</p>
                      <p style="margin:0 0 4px 0; color:#94a3b8; font-size:12px; font-weight:bold; letter-spacing:0.5px; text-transform:uppercase;">📍 Gdzie</p>
                      <p style="margin:0; color:#0f172a; font-size:15px; font-weight:600;">${esc(campLocation)}</p>
                    </td>
                  </tr>
                </table>

                <!-- WAŻNOŚĆ 24h -->
                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:#fef9e7; border:1px solid #f7e6b0; border-radius:12px; margin-bottom:32px;">
                  <tr>
                    <td style="padding:14px 18px;">
                      <p style="margin:0; color:#8a6d1a; font-size:13px; line-height:1.5;">
                        ⏳ <strong>To zaproszenie jest ważne 24 godziny.</strong> Po tym czasie miejsce wraca do puli.
                      </p>
                    </td>
                  </tr>
                </table>

                <!-- CTA -->
                <table border="0" cellpadding="0" cellspacing="0" width="100%">
                  <tr>
                    <td align="center">
                      <a href="${invitationLink}" class="btn" style="display:inline-block; background-color:#287d88; color:#ffffff; text-decoration:none; font-size:15px; font-weight:bold; padding:16px 36px; border-radius:12px; border:1px solid #1f646d; box-shadow:0 6px 16px -6px rgba(40,125,136,0.6);">
                        Zobacz szczegóły i dołącz
                      </a>
                    </td>
                  </tr>
                </table>

                <p style="margin:24px 0 0 0; color:#94a3b8; font-size:12px; line-height:1.5; text-align:center; word-break:break-all;">
                  Jeśli przycisk nie działa, skopiuj ten link:<br />
                  <a href="${invitationLink}" style="color:#287d88; text-decoration:underline;">${invitationLink}</a>
                </p>
              </td>
            </tr>

            <!-- STOPKA -->
            <tr>
              <td align="center" style="padding-top:32px;">
                <p style="margin:0 0 8px 0; color:#94a3b8; font-size:13px;">
                  Otrzymujesz tę wiadomość, ponieważ ${esc(inviterName)} wpisała Twój adres e-mail przy rezerwacji wyjazdu.
                </p>
                <p style="margin:0; color:#94a3b8; font-size:13px;">&copy; ${currentYear} Rehability. Wszystkie prawa zastrzeżone.</p>
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
  campName: string;
  campDate: string;
  campLocation: string;
  invitationLink: string;
}): string {
  return [
    `${params.inviterName} zaprasza Cię na wyjazd "${params.campName}".`,
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

/**
 * Wysyła e-mail zaproszenia "zabierz przyjaciółkę". Best-effort:
 * brak RESEND_API_KEY = log + cichy no-op (nie wywala wołającego).
 */
export async function sendFriendInvitationEmail(
  params: FriendInvitationParams,
): Promise<void> {
  const resend = getResend();
  if (!resend) return;

  const invitationLink = `${getAppUrl()}/zaproszenie/${params.token}`;
  const campDate = formatCampDate(params.campStart, params.campEnd);
  const currentYear = new Date().getFullYear();

  const { error } = await resend.emails.send({
    from: EMAIL_FROM,
    to: params.to,
    subject: `${params.inviterName} zaprasza Cię na wyjazd ${params.campName} ✈️`,
    html: renderHtml({
      inviteeName: params.inviteeName,
      inviterName: params.inviterName,
      campName: params.campName,
      campDate,
      campLocation: params.campLocation,
      invitationLink,
      currentYear,
    }),
    text: renderText({
      inviterName: params.inviterName,
      campName: params.campName,
      campDate,
      campLocation: params.campLocation,
      invitationLink,
    }),
  });

  if (error) {
    console.error("[email] Resend zwrócił błąd przy zaproszeniu:", error);
  }
}
