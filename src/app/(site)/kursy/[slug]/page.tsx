import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Star, Clock } from "@phosphor-icons/react/dist/ssr";
import { COURSES, getCourseBySlug } from "../_data/courses";
import { CourseTabs } from "../_components/CourseTabs";

export function generateStaticParams() {
  return COURSES.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const course = getCourseBySlug(slug);
  if (!course) return { title: "Kurs nie znaleziony" };
  return {
    title: `${course.title} – Platforma VOD`,
    description: course.excerpt,
    alternates: { canonical: `/kursy/${course.slug}` },
    openGraph: {
      title: course.title,
      description: course.excerpt,
      url: `/kursy/${course.slug}`,
      images: [{ url: course.image }],
    },
  };
}

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const course = getCourseBySlug(slug);
  if (!course) notFound();

  return (
    <main className="min-h-screen pt-28 md:pt-36 pb-24">
      {/* NAGŁÓWEK */}
      <section className="container">
        <div className="flex flex-col lg:flex-row gap-10 lg:gap-[41px] items-start lg:items-center">
          {/* Lewa kolumna */}
          <div className="flex-1 flex flex-col gap-6 max-w-[592px]">
            <div className="flex flex-col gap-6">
              <span className="inline-flex items-center self-start bg-brand-primary text-white font-montserrat font-medium text-[12px] uppercase px-5 py-[7px] rounded-full">
                {course.category}
              </span>
              <h1 className="font-jakarta font-semibold text-brand-secondary text-[30px] md:text-[36px] leading-[1.2]">
                {course.title}
              </h1>
            </div>

            <p className="font-montserrat text-[16px] leading-[1.7] text-brand-secondary max-w-[546px]">
              {course.excerpt}
            </p>

            <div className="flex gap-8 items-center">
              <div className="flex items-center gap-1">
                <Star size={22} weight="fill" className="text-brand-yellow" />
                <span className="font-montserrat font-medium text-[16px] text-black/50">
                  {course.rating.toFixed(1)} ({course.reviews})
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock
                  size={26}
                  weight="duotone"
                  className="text-brand-primary"
                />
                <span className="font-montserrat font-medium text-[16px] text-black/50">
                  {course.durationMin} min
                </span>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <Link
                href={`/kursy/${course.slug}/checkout`}
                className="bg-brand-primary text-white font-montserrat font-semibold text-[15px] px-5 py-2.5 rounded-3xl rounded-tr-[2px] transition-colors hover:bg-brand-secondary"
              >
                Otrzymaj dostęp
              </Link>
              <span className="font-montserrat font-semibold text-[24px] text-brand-primary">
                {course.price} PLN
              </span>
            </div>
          </div>

          {/* Obraz */}
          <div className="relative w-full lg:w-[479px] aspect-[479/365] rounded-[22px] overflow-hidden shadow-[0_30px_70px_-35px_rgba(3,63,99,0.45)] shrink-0">
            <Image
              src={course.image}
              alt={course.title}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 479px"
              className="object-cover"
            />
          </div>
        </div>
      </section>

      {/* ZAKŁADKI */}
      <section className="container mt-16">
        <CourseTabs course={course} />
      </section>
    </main>
  );
}
