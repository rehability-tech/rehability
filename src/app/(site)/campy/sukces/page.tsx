import Link from "next/link";
import { prisma } from "@/lib/prisma";
import SuccessAnimation from "./_components/SuccessAnimation";

export const metadata = {
  title: "Rezerwacja potwierdzona | Rehability",
  robots: { index: false, follow: false },
};

type Props = {
  searchParams: Promise<{
    session_id?: string;
    payment_intent?: string;
  }>;
};

const BOOKING_SELECT = {
  id: true,
  name: true,
  email: true,
  status: true,
  amountPaid: true,
  camp: {
    select: {
      id: true,
      title: true,
      location: true,
      startDate: true,
      endDate: true,
      heroImage: true,
    },
  },
} as const;

async function getBooking(
  paymentIntentId: string | undefined,
  sessionId: string | undefined,
) {
  if (paymentIntentId) {
    return prisma.booking.findFirst({
      where: { stripePaymentIntentId: paymentIntentId },
      select: BOOKING_SELECT,
    });
  }
  if (sessionId) {
    return prisma.booking.findFirst({
      where: { stripeSessionId: sessionId },
      select: BOOKING_SELECT,
    });
  }
  return null;
}

function firstName(full: string | null): string {
  if (!full) return "Kochana";
  return full.trim().split(" ")[0] || "Kochana";
}

function formatDateRange(start: Date, end: Date) {
  const sameMonth =
    start.getMonth() === end.getMonth() &&
    start.getFullYear() === end.getFullYear();
  if (sameMonth) {
    return `${start.getDate()}–${end.getDate()} ${start.toLocaleDateString(
      "pl-PL",
      { month: "long", year: "numeric" },
    )}`;
  }
  return `${start.toLocaleDateString("pl-PL", {
    day: "numeric",
    month: "short",
  })} – ${end.toLocaleDateString("pl-PL", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })}`;
}

export default async function CampSuccessPage({ searchParams }: Props) {
  const { session_id, payment_intent } = await searchParams;
  const booking = await getBooking(payment_intent, session_id);

  const name = firstName(booking?.name ?? null);
  const isConfirmed =
    booking?.status === "DEPOSIT_PAID" || booking?.status === "FULLY_PAID";
  const amountPaid = booking?.amountPaid
    ? (booking.amountPaid / 100).toLocaleString("pl-PL", {
        style: "currency",
        currency: "PLN",
        maximumFractionDigits: 0,
      })
    : null;

  const panelHref = booking ? `/panel/${booking.id}` : "/panel";

  return (
    <main className="relative min-h-screen font-montserrat overflow-hidden flex items-center justify-center">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,#dafbff_0%,#ffffff_60%)]" />
        <div className="absolute -top-32 left-1/4 w-[520px] h-[520px] rounded-full bg-brand-primary/25 blur-[140px]" />
        <div className="absolute top-1/3 -right-40 w-[480px] h-[480px] rounded-full bg-emerald-300/25 blur-[140px]" />
        <div className="absolute -bottom-40 left-0 w-[480px] h-[480px] rounded-full bg-brand-yellow/25 blur-[140px]" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24 flex justify-center">
        <SuccessAnimation
          name={name}
          isConfirmed={isConfirmed}
          panelHref={panelHref}
          campTitle={booking?.camp.title ?? null}
          dateRange={
            booking?.camp
              ? formatDateRange(booking.camp.startDate, booking.camp.endDate)
              : null
          }
          location={booking?.camp.location ?? null}
          amountPaidLabel={amountPaid}
        />
      </div>

      <div className="absolute bottom-6 left-0 right-0 text-center text-[11px] text-brand-secondary/40">
        Potwierdzenie wysłaliśmy też na podany adres e-mail. Sprawdź spam,
        gdyby nie dotarło.
      </div>

      <BookingFallback
        hasSession={!!(session_id || payment_intent)}
        hasBooking={!!booking}
      >
        <Link
          href="/campy"
          className="inline-flex items-center justify-center px-5 py-3 rounded-2xl bg-white/70 backdrop-blur-md border border-white/40 text-brand-secondary text-[13px] font-semibold hover:bg-white transition"
        >
          Wróć do listy wyjazdów
        </Link>
      </BookingFallback>
    </main>
  );
}

function BookingFallback({
  hasSession,
  hasBooking,
  children,
}: {
  hasSession: boolean;
  hasBooking: boolean;
  children: React.ReactNode;
}) {
  if (hasSession && hasBooking) return null;
  return (
    <div className="absolute top-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 px-4">
      <p className="text-[12px] text-brand-secondary/60 text-center max-w-md">
        Nie udało nam się znaleźć Twojej rezerwacji w tej sesji. Spróbuj
        odświeżyć stronę za chwilę albo wróć do listy wyjazdów.
      </p>
      {children}
    </div>
  );
}
