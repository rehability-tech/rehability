import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { ArrowLeft, ShieldCheck } from "@phosphor-icons/react/dist/ssr";
import { authOptions } from "@/lib/auth/auth";
import { getCourseBySlug } from "@/lib/courses-db";
import { CheckoutClient } from "../../_components/CheckoutClient";

export const metadata: Metadata = {
  title: "Zamówienie – Platforma VOD",
  robots: { index: false, follow: false },
};

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const course = await getCourseBySlug(slug);
  if (!course) notFound();

  const session = await getServerSession(authOptions);
  const isLoggedIn = !!session?.user?.email;
  const loginUrl = `/logowanie?callbackUrl=${encodeURIComponent(`/kursy/${slug}/checkout`)}`;

  return (
    <main className="relative min-h-screen pt-28 md:pt-32 pb-24 overflow-hidden">
      {/* Dekoracyjne tło — spójne z katalogiem /kursy */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,#dafbff_0%,#ffffff_50%,#f5fbfc_100%)] opacity-50" />
        <div className="absolute -top-40 -left-20 w-[420px] h-[420px] rounded-full bg-brand-primary/20 blur-[120px]" />
        <div className="absolute top-1/4 -right-32 w-[380px] h-[380px] rounded-full bg-brand-yellow/25 blur-[120px]" />
      </div>

      <section className="container">
        {/* Powrót do kursu */}
        <Link
          href={`/kursy/${course.slug}`}
          className="group inline-flex items-center gap-2 mb-6 font-montserrat text-[13px] font-semibold text-brand-secondary/60 hover:text-brand-primary transition-colors"
        >
          <span className="flex items-center justify-center size-7 rounded-full bg-white/70 backdrop-blur-md border border-white/50 shadow-sm group-hover:-translate-x-0.5 transition-transform">
            <ArrowLeft size={14} weight="bold" />
          </span>
          Wróć do kursu
        </Link>

        {/* Nagłówek */}
        <div className="flex flex-col gap-3 mb-2">
          <h1 className="font-jakarta font-bold text-brand-secondary text-[28px] md:text-[36px] leading-[1.15]">
            Finalizacja zamówienia
          </h1>
          <p className="inline-flex items-center gap-2 font-montserrat text-[14px] text-brand-secondary/60">
            <ShieldCheck
              size={17}
              weight="fill"
              className="text-brand-primary"
            />
            Bezpieczna płatność · dożywotni dostęp natychmiast po zakupie
          </p>
        </div>

        <CheckoutClient
          course={course}
          isLoggedIn={isLoggedIn}
          loginUrl={loginUrl}
        />
      </section>
    </main>
  );
}
