import React from "react";
import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";
import {
  CalendarBlank,
  MapPin,
  WarningCircle,
  CheckCircle,
  AirplaneTilt,
} from "@phosphor-icons/react/dist/ssr";
import AcceptInvitation from "./_components/AcceptInvitation";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ token: string }>;
}

function formatCampDate(start: Date, end: Date): string {
  const fmt = new Intl.DateTimeFormat("pl-PL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return `${fmt.format(start)} – ${fmt.format(end)}`;
}

/** Wspólny shell ze spójnym tłem/glassem dla wszystkich stanów. */
function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative min-h-screen flex items-center justify-center px-4 py-12 font-montserrat overflow-hidden bg-[#F7FAFB]">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -left-20 w-[420px] h-[420px] rounded-full bg-brand-primary/20 blur-[120px]" />
        <div className="absolute top-1/3 -right-32 w-[380px] h-[380px] rounded-full bg-brand-yellow/25 blur-[120px]" />
      </div>
      <div className="w-full max-w-md">{children}</div>
    </main>
  );
}

function InfoState({
  icon,
  title,
  description,
  cta,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  cta?: { href: string; label: string };
}) {
  return (
    <Shell>
      <div className="relative bg-white/70 backdrop-blur-2xl border border-white/50 rounded-3xl rounded-tr-none p-8 text-center shadow-[0_20px_50px_-20px_rgba(3,63,99,0.25)]">
        <div className="flex justify-center mb-5">{icon}</div>
        <h1 className="font-jakarta font-bold text-xl text-brand-secondary mb-2">
          {title}
        </h1>
        <p className="text-sm text-brand-secondary/60 leading-relaxed">
          {description}
        </p>
        {cta && (
          <Link
            href={cta.href}
            className="inline-flex items-center justify-center mt-6 h-12 px-6 rounded-2xl rounded-tr-none bg-brand-primary text-white font-semibold text-sm shadow-[0_4px_15px_0px_rgba(242,217,103,0.35)] border border-brand-yellow/30 hover:scale-[1.02] transition-transform"
          >
            {cta.label}
          </Link>
        )}
      </div>
    </Shell>
  );
}

export default async function InvitationPage({ params }: Props) {
  const { token } = await params;
  const session = await getServerSession(authOptions);

  const invitation = await prisma.booking.findUnique({
    where: { invitationToken: token },
    select: {
      id: true,
      status: true,
      userId: true,
      name: true,
      expiresAt: true,
      invitedBy: { select: { name: true } },
      trip: {
        select: {
          title: true,
          location: true,
          startDate: true,
          endDate: true,
          heroImage: true,
        },
      },
    },
  });

  // 1. Token nie istnieje
  if (!invitation || !invitation.trip) {
    return (
      <InfoState
        icon={<WarningCircle size={56} weight="duotone" className="text-rose-400" />}
        title="Nieprawidłowe zaproszenie"
        description="Ten link jest niepoprawny lub zaproszenie zostało usunięte."
      />
    );
  }

  const isExpired =
    invitation.status === "EXPIRED" ||
    (invitation.expiresAt != null &&
      invitation.expiresAt.getTime() < Date.now());

  // 2. Już przejęte przez tę osobę → dokończ płatność
  if (invitation.userId && session?.user?.id === invitation.userId) {
    return (
      <InfoState
        icon={<CheckCircle size={56} weight="duotone" className="text-brand-primary" />}
        title="Już dołączyłaś 🎉"
        description="To zaproszenie jest już przypisane do Twojego konta. Dokończ płatność zadatku w panelu."
        cta={{ href: "/panel/wydarzenia", label: "Przejdź do panelu" }}
      />
    );
  }

  // 3. Przejęte przez kogoś innego
  if (invitation.userId && session?.user?.id !== invitation.userId) {
    return (
      <InfoState
        icon={<WarningCircle size={56} weight="duotone" className="text-amber-400" />}
        title="Zaproszenie wykorzystane"
        description="To zaproszenie zostało już przyjęte na innym koncie."
      />
    );
  }

  // 4. Wygasłe / nieaktywne
  if (invitation.status !== "PENDING_INVITATION" || isExpired) {
    return (
      <InfoState
        icon={<WarningCircle size={56} weight="duotone" className="text-amber-400" />}
        title="Zaproszenie wygasło"
        description="Minęło 24 h na przyjęcie zaproszenia i miejsce wróciło do puli. Poproś znajomą o ponowne zaproszenie."
      />
    );
  }

  // 5. Stan właściwy — pokaż szczegóły + akceptację
  const inviterName = invitation.invitedBy?.name ?? "Twoja znajoma";
  const isLoggedIn = !!session?.user?.id;

  return (
    <Shell>
      <div className="relative bg-white/70 backdrop-blur-2xl border border-white/50 rounded-3xl rounded-tr-none overflow-hidden shadow-[0_20px_50px_-20px_rgba(3,63,99,0.25)]">
        {/* żółta poświata */}
        <div className="pointer-events-none absolute -bottom-10 -right-8 w-32 h-32 bg-brand-yellow/40 rounded-full blur-2xl" />

        {/* Hero */}
        <div className="relative h-32 bg-brand-primary">
          {invitation.trip.heroImage && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={invitation.trip.heroImage}
              alt={invitation.trip.title}
              className="absolute inset-0 w-full h-full object-cover opacity-40"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-brand-secondary/70 to-transparent" />
          <div className="absolute bottom-4 left-6 flex items-center gap-2 text-white">
            <AirplaneTilt size={22} weight="fill" />
            <span className="text-xs font-semibold uppercase tracking-widest">
              Zaproszenie na wydarzenie
            </span>
          </div>
        </div>

        <div className="relative p-7">
          <p className="text-sm text-brand-secondary/60 mb-1">
            {invitation.name ? `Cześć ${invitation.name.split(" ")[0]},` : "Cześć,"}
          </p>
          <h1 className="font-jakarta font-bold text-xl text-brand-secondary leading-snug mb-1">
            <strong className="text-brand-primary">{inviterName}</strong> zaprasza
            Cię na wspólne wydarzenie
          </h1>
          <p className="font-jakarta font-bold text-lg text-brand-secondary mb-5">
            {invitation.trip.title}
          </p>

          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-3 text-sm text-brand-secondary/80">
              <CalendarBlank size={20} weight="duotone" className="text-brand-primary shrink-0" />
              {formatCampDate(invitation.trip.startDate, invitation.trip.endDate)}
            </div>
            <div className="flex items-center gap-3 text-sm text-brand-secondary/80">
              <MapPin size={20} weight="duotone" className="text-brand-primary shrink-0" />
              {invitation.trip.location}
            </div>
          </div>

          <div className="rounded-2xl bg-brand-yellow/15 border border-brand-yellow/40 px-4 py-3 mb-6">
            <p className="text-xs text-[#8a6d1a] leading-relaxed">
              ⏳ Zaproszenie jest ważne <strong>24 godziny</strong>. Po przyjęciu
              dokończysz rezerwację, opłacając swój zadatek.
            </p>
          </div>

          <AcceptInvitation token={token} isLoggedIn={isLoggedIn} />
        </div>
      </div>
    </Shell>
  );
}
