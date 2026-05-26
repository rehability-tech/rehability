import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";

import ActiveTripDashboard from "./_components/ActiveTripDashboard";
import PendingTripState from "./_components/PendingTripState";
import EmptyTripState from "./_components/EmptyTripState";
import TripCard from "@/app/(site)/wyjazdy/_components/TripCard"; // Karta ofertowa cross-sell

export default async function MyTripsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/logowanie");
  }

  // 1. Pobieramy rezerwacje użytkowniczki z bazy (surowe dane)
  const rawBookings = await prisma.booking.findMany({
    where: { email: session.user.email },
    include: {
      trip: true,
    },
    // Sortowanie: Najpierw te z najbliższą datą wyjazdu
    orderBy: {
      trip: {
        startDate: "asc",
      },
    },
  });

  // NAPRAWA BŁĘDU: Serializacja - zamieniamy obiekty Decimal na zwykłe liczby (Number)
  const bookings = rawBookings.map((booking) => ({
    ...booking,
    amountTotal: Number(booking.amountTotal || 0),
    amountPaid: Number(booking.amountPaid || 0),
    trip: booking.trip
      ? {
          ...booking.trip,
          price: Number(booking.trip.price || 0),
          deposit: Number(booking.trip.deposit || 0),
        }
      : null,
  }));

  // Filtrujemy stany (na zserializowanych danych)
  const activeBookings = bookings.filter(
    (b) => b.status === "DEPOSIT_PAID" || b.status === "FULLY_PAID",
  );

  const pendingBookings = bookings.filter(
    (b) => b.status === "PENDING" || b.status === "PENDING_INVITATION",
  );

  const hasAnyBookings =
    activeBookings.length > 0 || pendingBookings.length > 0;

  // 2. Szukamy "Innych dostępnych wyjazdów" do wyświetlenia na samym dole
  const userTripIds = bookings.map((b) => b.tripId);

  const rawAvailableOtherTrips = await prisma.trip.findMany({
    where: {
      status: "PUBLISHED",
      id: { notIn: userTripIds }, // Wykluczamy te, które już zarezerwowała
    },
    orderBy: { startDate: "asc" },
  });

  // Serializacja również dla ofert na dole strony
  const availableOtherTrips = rawAvailableOtherTrips.map((trip) => ({
    ...trip,
    price: Number(trip.price || 0),
    deposit: Number(trip.deposit || 0),
  }));

  return (
    <div className="w-full animate-in fade-in duration-500">
      <div className="mb-8">
        <h1 className="font-jakarta font-bold text-3xl md:text-4xl text-brand-secondary tracking-tight">
          Moje Wyjazdy
        </h1>
        <p className="text-brand-secondary/60 text-[14px] md:text-[15px] mt-2 font-montserrat max-w-xl leading-relaxed">
          Zarządzaj swoim pobytem, rezerwuj zabiegi SPA i uzupełnij Kartę
          Zdrowia przed wyjazdem.
        </p>
      </div>

      {/* GŁÓWNA SEKCJA: Posiadane wyjazdy (Luksusowe, duże panele) */}
      <div className="mb-16 flex flex-col gap-12">
        {!hasAnyBookings ? (
          <EmptyTripState />
        ) : (
          <>
            {/* Wyświetlamy wielkie panele (Hero) dla wszystkich opłaconych rezerwacji */}
            {activeBookings.map((booking) => (
              <div
                key={booking.id}
                className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100 fill-mode-both"
              >
                <ActiveTripDashboard booking={booking} />
              </div>
            ))}

            {/* Wyświetlamy mniejsze alerty dla rezerwacji nieopłaconych */}
            {pendingBookings.map((booking) => (
              <div
                key={booking.id}
                className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200 fill-mode-both"
              >
                <PendingTripState booking={booking} />
              </div>
            ))}
          </>
        )}
      </div>

      {/* MODUŁ CROSS-SELLING: Inne dostępne Wyjazdy */}
      {availableOtherTrips.length > 0 && (
        <div className="border-t border-brand-secondary/10 pt-10 mt-10">
          <div className="mb-8">
            <h2 className="font-jakarta font-bold text-2xl text-brand-secondary">
              Masz ochotę na kolejny wyjazd?
            </h2>
            <p className="text-brand-secondary/60 text-sm mt-1">
              Zobacz naszą pełną ofertę i zarezerwuj miejsce zanim znikną.
            </p>
          </div>

          <div className="flex flex-col gap-10">
            {availableOtherTrips.map((trip) => (
              <TripCard key={trip.id} trip={trip} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
