// Przełączniki funkcji jeszcze niedomkniętych na produkcję.
// Ustaw na `true`, gdy feature jest gotowy (migracje + UI + testy).
//
// Moduł jest czysty (bez importów server/edge) — można go bezpiecznie
// importować w komponentach klienckich, route'ach API i w proxy (middleware).
//
// - customerBase   → /admin/klienci (CRM 360° klienta)
// - emailTemplates → /admin/klienci/szablony-maili (wymaga migracji modelu EmailTemplate)
export const FEATURES = {
  customerBase: false,
  emailTemplates: false,
} as const;
