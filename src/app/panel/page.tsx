import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";

export default async function PanelIndexPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/logowanie");
  }

  // Szukamy rezerwacji po adresie e-mail uLLytkownika
  const booking = await prisma.booking.findFirst({
    where: {
      email: session.user.email,
      status: { in: ["CONFIRMED", "PENDING"] },
    },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });

  if (!booking) {
    return (
      <div className="pt-16 flex flex-col items-center justify-center text-center px-4">
        <p className="text-5xl mb-4">dzZ�d�Z</p>
        <h1 className="font-jakarta font-bold text-2xl text-[#0B3B4C]">
          Nie masz jeszcze rezerwacji
        </h1>
        <p className="text-gray-500 text-sm mt-2 max-w-xs">
          Po opłaceniu zadatku i potwierdzeniu rezerwacji pojawi się tu TwAlj
          panel uczestniczki.
        </p>
      </div>
    );
  }

  redirect(`/panel/${booking.id}`);
}
