import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import Stripe from "stripe";
import { authOptions } from "@/lib/auth/auth";
import {
  getVodOverview,
  getCourses,
  enrollUserInCourse,
  recordCoursePurchaseFromStripe,
} from "@/lib/courses-db";
import { showSandboxContent } from "@/lib/sandbox/context";
import { VodClient } from "./_components/VodClient";

export const metadata = {
  title: "Platforma VOD – Panel",
};

export const dynamic = "force-dynamic";

export default async function VodPage({
  searchParams,
}: {
  searchParams: Promise<{
    payment_intent?: string;
    redirect_status?: string;
  }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/logowanie?callbackUrl=/panel/vod");
  }
  const userId = session.user.id;

  // Dostęp nadaje webhook Stripe (payment_intent.succeeded). Tu robimy bezpieczny
  // fallback: gdy webhook się spóźnił, weryfikujemy PaymentIntent z powrotu Stripe
  // i — jeśli opłacony i należy do tego użytkownika — domykamy zapis idempotentnie,
  // zanim pobierzemy bibliotekę (żeby świeżo kupiony kurs był od razu widoczny).
  const { payment_intent: paymentIntentId, redirect_status: redirectStatus } =
    await searchParams;

  if (
    paymentIntentId &&
    redirectStatus === "succeeded" &&
    process.env.STRIPE_SECRET_KEY
  ) {
    try {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
      const pi = await stripe.paymentIntents.retrieve(paymentIntentId);
      const meta = pi.metadata || {};
      if (
        pi.status === "succeeded" &&
        meta.kind === "COURSE_PURCHASE" &&
        meta.userId === userId &&
        meta.courseId
      ) {
        await enrollUserInCourse(userId, meta.courseId);
        // Domknij też rekord zakupu, gdy webhook go jeszcze nie zapisał
        // (idempotentne po paymentIntentId).
        await recordCoursePurchaseFromStripe(pi);
      }
    } catch (err) {
      console.error("[panel/vod] Weryfikacja PaymentIntent Stripe:", err);
    }
  }

  // Katalog „do kupienia" respektuje podgląd piaskownicy; kursy już posiadane
  // (overview) idą przez Enrollment, więc nie podlegają filtrowaniu.
  const includeSandbox = await showSandboxContent(session);

  const [overview, catalog] = await Promise.all([
    getVodOverview(userId),
    getCourses({ includeSandbox }),
  ]);

  // Brak kupionych kursów → tryb „locked" (sekcje nauki pod nakładką), ale
  // bibliotekę pokazujemy zawsze: kursy posiadane + cały katalog do kupienia.
  const locked = overview.courses.length === 0;

  return (
    // useSearchParams (popup sukcesu, ?widok=moje) wymaga granicy Suspense.
    <Suspense fallback={null}>
      <VodClient
        courses={overview.courses}
        catalog={catalog}
        locked={locked}
        progressByCourse={overview.progressByCourse}
        lessonsDone={overview.lessonsDone}
        lessonsTotal={overview.lessonsTotal}
      />
    </Suspense>
  );
}
