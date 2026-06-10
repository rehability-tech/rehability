import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCourseBySlug } from "../../_data/courses";
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
  const course = getCourseBySlug(slug);
  if (!course) notFound();

  return (
    <main className="min-h-screen pt-28 md:pt-32 pb-24">
      <section className="container">
        <CheckoutClient course={course} />
      </section>
    </main>
  );
}
