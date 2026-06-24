import Link from "next/link";
import { CheckCircle, WarningCircle } from "@phosphor-icons/react/dist/ssr";
import { getMailer } from "@/lib/mailer";

export const dynamic = "force-dynamic";

/**
 * Publiczna strona wypisania z listy mailingowej. Link trafia do każdej kampanii
 * (nagłówek List-Unsubscribe + stopka). Wypisanie odbywa się od razu przy wejściu
 * (one-click), zgodnie z oczekiwaniem klientów pocztowych.
 */
export default async function UnsubscribePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const mailer = getMailer();

  const contact = await mailer.findContactByUnsubToken(token);
  let success = false;
  if (contact) {
    if (contact.status !== "UNSUBSCRIBED") {
      try {
        await mailer.unsubscribe(contact.id);
      } catch {
        /* best-effort */
      }
    }
    success = true;
  }

  return (
    <main className="min-h-[70vh] flex items-center justify-center px-4 py-20">
      <div className="w-full max-w-md text-center bg-white/70 backdrop-blur-xl border border-white/80 rounded-3xl rounded-tr-none shadow-[0_18px_40px_-16px_rgba(3,63,99,0.18)] px-8 py-12">
        <div
          className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5 ${
            success
              ? "bg-brand-primary/10 text-brand-primary"
              : "bg-rose-50 text-rose-500"
          }`}
        >
          {success ? (
            <CheckCircle size={36} weight="duotone" />
          ) : (
            <WarningCircle size={36} weight="duotone" />
          )}
        </div>

        <h1 className="text-xl font-bold text-brand-secondary mb-2">
          {success ? "Zostałeś wypisany" : "Nie znaleziono adresu"}
        </h1>
        <p className="text-sm font-medium text-brand-secondary/60 leading-relaxed">
          {success
            ? "Twój adres e-mail został usunięty z naszej listy wysyłkowej. Nie będziesz już otrzymywać wiadomości marketingowych."
            : "Ten link wypisania jest nieprawidłowy lub wygasł. Jeśli problem się powtarza, skontaktuj się z nami."}
        </p>

        <Link
          href="/"
          className="mt-7 inline-flex items-center justify-center px-6 py-2.5 rounded-xl bg-brand-primary text-white text-sm font-bold shadow-[0_4px_15px_0px_rgba(242,217,103,0.35)] border border-brand-yellow/30 hover:opacity-90 transition-opacity"
        >
          Wróć na stronę główną
        </Link>
      </div>
    </main>
  );
}
