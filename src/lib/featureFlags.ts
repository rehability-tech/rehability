// Przełączniki funkcji jeszcze niedomkniętych na produkcję.
// Ustaw na `true`, gdy feature jest gotowy (migracje + UI + testy).
//
// Moduł jest czysty (bez importów server/edge) — można go bezpiecznie
// importować w komponentach klienckich, route'ach API i w proxy (middleware).
//
// - customerBase     → /admin/klienci (zunifikowana baza kontaktów / CRM)
// - emailTemplates   → /admin/klienci/szablony-maili (model EmailTemplate)
// - mailingCampaigns → /admin/klienci/kampanie (moduł mailingowy src/lib/mailer)
export const FEATURES = {
  customerBase: false,
  emailTemplates: true,
  mailingCampaigns: true,
} as const;
