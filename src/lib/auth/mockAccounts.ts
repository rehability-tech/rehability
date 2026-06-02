/**
 * Lista kont do dev-only "Mock Login" (provider `dev-mock`).
 * Musi odpowiadać kluczom w `MOCK_USERS` w `auth.ts`.
 * Jedno źródło prawdy dla formularza /logowanie oraz formularza rezerwacji na stronie campa.
 */
export const MOCK_ACCOUNTS: Array<{ email: string; label: string }> = [
  { email: "biuro@kocikdev.com", label: "Admin (biuro@kocikdev.com)" },
  { email: "piotr.eher@gmail.com", label: "Klient (piotr.eher@gmail.com)" },
  { email: "mch.kocik@gmail.com", label: "Klient (mch.kocik@gmail.com)" },
];
