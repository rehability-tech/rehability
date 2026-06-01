"use client";

import { EnvelopeSimple, Phone } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";

// ==========================================
// 1. OSOBNY KOMPONENT: EMAIL
// ==========================================
export const EmailCard = ({ email }: { email?: string | null }) => {
  return (
    <a
      href={email ? `mailto:${email}` : "#"}
      className={cn(
        "relative flex-1 group flex items-center gap-4 p-4 sm:p-5 rounded-[24px] transition-all duration-300 border overflow-hidden",
        email
          ? "bg-white/70 backdrop-blur-xl border-white/60 shadow-[0_10px_30px_-10px_rgba(40,125,136,0.45)] hover:bg-white hover:border-brand-primary/30 hover:shadow-[0_16px_40px_-10px_rgba(40,125,136,0.6)] active:scale-[0.98]"
          : "bg-gray-50/50 border-transparent cursor-not-allowed grayscale shadow-[0_8px_30px_-12px_rgba(3,63,99,0.08)]",
      )}
    >
      {/* Subtelny jasny glow w tle karty */}
      <div className="absolute -top-8 -left-8 w-24 h-24 bg-brand-primary/10 blur-[30px] rounded-full pointer-events-none" />

      <div
        className={cn(
          "relative z-10 w-11 h-11 rounded-[14px] flex items-center justify-center shrink-0 transition-colors duration-300",
          email
            ? "bg-brand-primary/10 text-brand-primary group-hover:bg-brand-primary group-hover:text-white"
            : "bg-gray-200 text-gray-400",
        )}
      >
        <EnvelopeSimple size={22} weight={email ? "duotone" : "regular"} />
      </div>
      <div className="relative z-10 flex flex-col min-w-0">
        <span className="text-[10px] font-bold uppercase tracking-widest text-brand-secondary/40 mb-0.5">
          E-mail
        </span>
        <span className="text-[13px] font-semibold text-brand-secondary truncate">
          {email || "Brak danych"}
        </span>
      </div>
    </a>
  );
};

// ==========================================
// 2. OSOBNY KOMPONENT: TELEFON
// ==========================================
export const PhoneCard = ({ phone }: { phone?: string | null }) => {
  return (
    <a
      href={phone ? `tel:${phone.replace(/\s+/g, "")}` : "#"}
      className={cn(
        "relative flex-1 group flex items-center gap-4 p-4 sm:p-5 rounded-[24px] transition-all duration-300 border overflow-hidden",
        phone
          ? "bg-white/70 backdrop-blur-xl border-white/60 shadow-[0_10px_30px_-10px_rgba(40,125,136,0.45)] hover:bg-white hover:border-brand-primary/30 hover:shadow-[0_16px_40px_-10px_rgba(40,125,136,0.6)] active:scale-[0.98]"
          : "bg-gray-50/50 border-transparent cursor-not-allowed grayscale shadow-[0_8px_30px_-12px_rgba(3,63,99,0.08)]",
      )}
    >
      {/* Subtelny glow w tle karty */}
      <div className="absolute -bottom-8 -right-8 w-24 h-24 bg-brand-secondary/5 blur-[30px] rounded-full pointer-events-none" />

      <div
        className={cn(
          "relative z-10 w-11 h-11 rounded-[14px] flex items-center justify-center shrink-0 transition-colors duration-300",
          phone
            ? "bg-brand-secondary/5 text-brand-secondary group-hover:bg-brand-secondary group-hover:text-white"
            : "bg-gray-200 text-gray-400",
        )}
      >
        <Phone size={22} weight={phone ? "duotone" : "regular"} />
      </div>
      <div className="relative z-10 flex flex-col min-w-0">
        <span className="text-[10px] font-bold uppercase tracking-widest text-brand-secondary/40 mb-0.5">
          Telefon
        </span>
        <span className="text-[13px] font-semibold text-brand-secondary truncate">
          {phone || "Brak danych"}
        </span>
      </div>
    </a>
  );
};

// ==========================================
// 3. WSPÓLNY KONTENER
// ==========================================
// Exportujemy je razem jako ContactInfoCard, żebyś nie musiał zmieniać importów w głównym pliku!
export const ContactInfoCard = ({ participant }: { participant: any }) => {
  const email = participant?.email || participant?.user?.email || null;
  const phone = participant?.phone || null;

  return (
    // Układ obok siebie (na mobilce ułożą się w kolumnę dzięki domyślnemu zachowaniu flex w Tailwind bez nadanego sm:flex-row, albo wymuszamy zachowanie obok siebie)
    <div className="flex flex-col sm:flex-row gap-4 max-w-[500px] w-full">
      <EmailCard email={email} />
      <PhoneCard phone={phone} />
    </div>
  );
};
