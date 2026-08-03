import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Star,
  Clock,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  Lightning,
  Devices,
  VideoCamera,
  LockSimpleOpen,
} from "@phosphor-icons/react/dist/ssr";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth";
import { getCourseBySlug, getCourses, isUserEnrolled } from "@/lib/courses-db";
import { canUseSandbox } from "@/lib/sandbox/context";
import { formatCourseDuration, DEFAULT_FAQ } from "../_data/courses";
import { SITE_NAME, absoluteUrl } from "@/lib/seo/site";
import { CourseTabs } from "../_components/CourseTabs";
import { CourseViewBeacon } from "./_components/CourseViewBeacon";
import { Reveal } from "../../blog/[blogSlug]/_components/Reveal";

export async function generateStaticParams() {
  // Bez `includeSandbox` — kursy z piaskownicy nie mają być prerenderowane
  // ani wchodzić do statycznych ścieżek. Renderują się dynamicznie, dla osób
  // uprawnionych.
  const courses = await getCourses();
  return courses.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  // Metadane liczymy też dla kursów sandbox (żeby tester nie dostał tytułu
  // „Kurs nie znaleziony"), ale niżej twardo wymuszamy na nich noindex.
  const course = await getCourseBySlug(slug, { includeSandbox: true });
  if (!course) return { title: "Kurs nie znaleziony" };

  const title = course.metaTitle?.trim() || course.title;
  const description = course.metaDescription?.trim() || course.excerpt;
  const ogImage = course.ogImage?.trim() || course.image;
  return {
    title: `${title} – Platforma VOD`,
    description,
    keywords: course.focusKeyword?.trim() || undefined,
    alternates: {
      canonical: course.canonicalUrl?.trim() || `/kursy/${course.slug}`,
    },
    // Kurs w piaskownicy nigdy nie trafia do indeksu — niezależnie od `noIndex`.
    robots:
      course.sandbox || course.noIndex
        ? { index: false, follow: false }
        : undefined,
    openGraph: {
      title,
      description,
      url: `/kursy/${course.slug}`,
      images: [{ url: ogImage }],
    },
  };
}

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // Kurs z piaskownicy otwiera się po samym adresie dla osoby uprawnionej —
  // celowo bez wymogu włączonego podglądu, żeby link wysłany testerowi działał
  // od razu. Dla wszystkich pozostałych kurs po prostu nie istnieje.
  const session = await getServerSession(authOptions);
  const includeSandbox = await canUseSandbox(session);

  const course = await getCourseBySlug(slug, { includeSandbox });
  if (!course) notFound();

  // Czy zalogowany użytkownik ma już dostęp → zamiast „Otrzymaj dostęp”
  // pokazujemy „Przejdź do panelu” + status „Odblokowane”.
  const owned = session?.user?.id
    ? await isUserEnrolled(session.user.id, slug)
    : false;
  const panelHref = `/panel/vod/${course.slug}`;

  // Structured data (JSON-LD) — to ono daje rich snippets (gwiazdki, cena,
  // FAQ) i cytowalność przez AI. Pomijamy je dla kursów z noindex. Treść musi
  // odpowiadać temu, co realnie widać na stronie (FAQ = ten sam fallback).
  const canonical =
    course.canonicalUrl?.trim() || absoluteUrl(`/kursy/${course.slug}`);
  const faq = course.faq ?? DEFAULT_FAQ;
  const courseDescription =
    course.metaDescription?.trim() || course.excerpt;

  const courseJsonLd = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: course.title,
    description: courseDescription,
    url: canonical,
    image: course.ogImage?.trim() || course.image,
    inLanguage: "pl-PL",
    ...(course.category ? { about: course.category } : {}),
    // Czas materiału jako ISO 8601 (np. 90 min → "PT90M").
    ...(course.durationMin > 0
      ? { timeRequired: `PT${course.durationMin}M` }
      : {}),
    provider: {
      "@type": "Organization",
      name: SITE_NAME,
      url: absoluteUrl("/"),
    },
    // Kurs jest w 100% online, dostęp dożywotni — wymagane przez Google dla
    // rich resultu „Course".
    hasCourseInstance: {
      "@type": "CourseInstance",
      courseMode: "online",
      courseWorkload:
        course.durationMin > 0 ? `PT${course.durationMin}M` : undefined,
    },
    offers: {
      "@type": "Offer",
      category: "Paid",
      price: course.price,
      priceCurrency: "PLN",
      availability: "https://schema.org/InStock",
      url: absoluteUrl(`/kursy/${course.slug}/checkout`),
    },
    // Gwiazdki w wynikach — tylko gdy są realne opinie (inaczej Google to flaguje).
    ...(course.reviews > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: course.rating,
            reviewCount: course.reviews,
            bestRating: 5,
            worstRating: 1,
          },
        }
      : {}),
  };

  const faqJsonLd =
    faq.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faq.map((item) => ({
            "@type": "Question",
            name: item.q,
            acceptedAnswer: { "@type": "Answer", text: item.a },
          })),
        }
      : null;

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Start", item: absoluteUrl("/") },
      {
        "@type": "ListItem",
        position: 2,
        name: "Kursy",
        item: absoluteUrl("/kursy"),
      },
      { "@type": "ListItem", position: 3, name: course.title, item: canonical },
    ],
  };

  return (
    <>
      {!course.noIndex && (
        <>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(courseJsonLd) }}
          />
          {faqJsonLd && (
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
            />
          )}
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(breadcrumbJsonLd),
            }}
          />
        </>
      )}
      <main className="bg-white">
      {/* Licznik wyświetleń (beacon kliencki — strona jest ISR) */}
      <CourseViewBeacon slug={course.slug} />
      {/* HERO (ciemny gradient — jak w pojedynczym wpisie bloga) */}
      <section className="relative bg-gradient-to-br from-brand-secondary via-brand-primary to-brand-secondary pt-32 pb-28 px-4">
        <div className="absolute inset-0 opacity-[0.12] pointer-events-none bg-[radial-gradient(circle_at_30%_20%,#f2d967_0%,transparent_50%),radial-gradient(circle_at_70%_80%,#287D88_0%,transparent_50%)]" />
        <div className="relative max-w-3xl mx-auto">
          {/* Okruszki */}
          <Reveal
            as="div"
            immediate
            y={12}
            className="mb-6 text-[12px] font-montserrat text-white/50"
          >
            <nav
              aria-label="Okruszki"
              className="flex items-center gap-1.5 min-w-0 w-full"
            >
              <Link
                href="/"
                className="hover:text-white/80 transition-colors shrink-0"
              >
                Start
              </Link>
              <span aria-hidden className="shrink-0">
                ›
              </span>
              <Link
                href="/kursy"
                className="hover:text-white/80 transition-colors shrink-0"
              >
                Kursy
              </Link>
              <span aria-hidden className="shrink-0">
                ›
              </span>
              <span className="text-white/30 truncate min-w-0">
                {course.title}
              </span>
            </nav>
          </Reveal>

          <Reveal as="div" immediate delay={0.08} y={14}>
            <span className="inline-block mb-4 px-3 py-1 rounded-full text-[11px] font-montserrat font-semibold bg-brand-yellow/15 text-brand-yellow border border-brand-yellow/25 tracking-wider uppercase backdrop-blur-md">
              {course.category}
            </span>
          </Reveal>

          <Reveal
            as="h1"
            immediate
            delay={0.16}
            className="font-jakarta font-bold text-white text-[28px] sm:text-[36px] md:text-[44px] leading-[1.15] mb-6"
          >
            {course.title}
          </Reveal>

          <Reveal
            as="p"
            immediate
            delay={0.24}
            className="font-montserrat text-white/70 text-[15px] sm:text-[16px] leading-relaxed mb-8 max-w-2xl"
          >
            {course.excerpt}
          </Reveal>

          {/* Meta: ocena · czas trwania */}
          <Reveal
            as="div"
            immediate
            delay={0.32}
            className="flex flex-wrap items-center gap-x-4 gap-y-2 text-white/60 text-[13px] font-montserrat"
          >
            <span className="flex items-center gap-1.5">
              <Star size={15} weight="fill" className="text-brand-yellow" />
              {course.reviews > 0 ? (
                <>
                  <span className="font-semibold text-white/85">
                    {course.rating.toFixed(1)}
                  </span>
                  ({course.reviews} opinii)
                </>
              ) : (
                <span className="font-semibold text-white/85">Nowość</span>
              )}
            </span>
            <span className="text-white/25" aria-hidden>
              ·
            </span>
            <span className="flex items-center gap-1.5">
              <Clock size={14} weight="bold" />
              {formatCourseDuration(course.durationMin)} materiału
            </span>
          </Reveal>

          {/* Cena + CTA */}
          <Reveal
            as="div"
            immediate
            delay={0.4}
            className="mt-8 flex flex-wrap items-center justify-between gap-5"
          >
            <div className="leading-none">
              {owned ? (
                <span className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-md border border-brand-yellow/30 pl-2.5 pr-4 py-2 font-montserrat font-semibold text-[13px] text-white shadow-[0_4px_15px_0px_rgba(242,217,103,0.25)]">
                  <LockSimpleOpen
                    size={16}
                    weight="fill"
                    className="text-brand-yellow"
                  />
                  Masz już dostęp
                </span>
              ) : (
                <>
                  <p className="text-[10px] uppercase tracking-wider text-white/40 font-bold mb-1">
                    Cena dożywotnia
                  </p>
                  <p className="font-jakarta text-[26px] font-bold text-white leading-none">
                    {course.price}{" "}
                    <span className="text-[15px] font-semibold text-white/70">
                      PLN
                    </span>
                  </p>
                </>
              )}
            </div>
            <Link
              href={owned ? panelHref : `/kursy/${course.slug}/checkout`}
              className="group relative inline-flex items-center gap-2 bg-white text-brand-secondary font-montserrat font-bold text-[14px] px-5 py-2.5 rounded-2xl rounded-tr-[3px] border border-brand-yellow/30 shadow-[0_8px_22px_0px_rgba(242,217,103,0.45)] hover:shadow-[0_10px_30px_0px_rgba(242,217,103,0.6)] transition-all overflow-hidden"
            >
              <span className="pointer-events-none absolute -right-2 -bottom-2 size-9 rounded-full bg-brand-yellow/50 blur-[14px]" />
              {owned ? "Przejdź do panelu" : "Otrzymaj dostęp"}
              <ArrowRight
                size={16}
                weight="bold"
                className="group-hover:translate-x-0.5 transition-transform"
              />
            </Link>
          </Reveal>
        </div>
      </section>

      {/* COVER (wysunięty na hero — jak w blogu) */}
      <Reveal
        as="div"
        immediate
        delay={0.48}
        y={24}
        className="max-w-[800px] mx-auto px-4 -mt-16 sm:-mt-20 relative z-10"
      >
        <div className="relative w-full h-[220px] sm:h-[340px] md:h-[400px] rounded-[28px] rounded-tr-none overflow-hidden shadow-[0_20px_60px_-20px_rgba(11,59,76,0.45)] bg-gray-100">
          <Image
            src={course.image}
            alt={course.title}
            fill
            priority
            sizes="(max-width: 768px) 100vw, 800px"
            className="object-cover"
          />
          {/* Znacznik VOD */}
          <div className="absolute top-4 left-4 inline-flex items-center gap-1.5 bg-white/85 backdrop-blur-xl border border-white/50 rounded-full pl-1.5 pr-3.5 py-1.5 shadow-lg">
            <span className="flex items-center justify-center size-7 rounded-full bg-brand-primary text-white">
              <Lightning size={15} weight="fill" />
            </span>
            <span className="font-montserrat text-[12px] font-semibold text-brand-secondary">
              Program wideo
            </span>
          </div>
        </div>
      </Reveal>

      {/* Informacja: nagrania jeszcze w przygotowaniu */}
      {course.videoPending && (
        <Reveal
          as="div"
          y={16}
          className="max-w-[800px] mx-auto px-4 mt-10"
        >
          <div className="flex items-start gap-3 rounded-[20px] rounded-tr-none bg-amber-50 border border-amber-200/70 p-4 sm:p-5">
            <span className="flex items-center justify-center size-10 shrink-0 rounded-xl rounded-tr-none bg-amber-400/20 text-amber-600">
              <VideoCamera size={20} weight="duotone" />
            </span>
            <div>
              <p className="font-jakarta font-bold text-[15px] text-amber-800">
                Nagrania są jeszcze w przygotowaniu
              </p>
              <p className="font-montserrat text-[13.5px] text-amber-700/90 leading-snug mt-1">
                Program tego kursu jest już dostępny, ale część materiałów wideo
                wciąż dodajemy. Po zakupie otrzymasz dostęp do wszystkich nagrań,
                gdy tylko się pojawią.
              </p>
            </div>
          </div>
        </Reveal>
      )}

      {/* TREŚĆ (zakładki) */}
      <article className="max-w-[800px] mx-auto px-4 pt-12 pb-16">
        <Reveal as="div" y={16}>
          <CourseTabs course={course} />
        </Reveal>

        <div className="mt-10">
          <Link
            href="/kursy"
            className="inline-flex items-center gap-2 text-[13px] font-montserrat font-semibold text-brand-primary hover:text-brand-primary/70 transition-colors"
          >
            <ArrowLeft size={16} weight="bold" />
            Wróć do katalogu
          </Link>
        </div>
      </article>

      {/* CTA KOŃCOWE (jak sekcja „related" w blogu) */}
      <section className="py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="relative flex flex-col gap-7 bg-gradient-to-br from-brand-secondary via-brand-primary to-brand-secondary rounded-[28px] rounded-tr-none p-8 sm:p-10 overflow-hidden shadow-[0_30px_70px_-35px_rgba(3,63,99,0.6)]">
            <div className="absolute inset-0 opacity-[0.14] pointer-events-none bg-[radial-gradient(circle_at_80%_20%,#f2d967_0%,transparent_50%)]" />

            {/* Nagłówek */}
            <div className="relative">
              <p className="text-[11px] uppercase tracking-[0.2em] font-bold text-brand-yellow mb-2">
                Zacznij już dziś
              </p>
              <h2 className="font-jakarta font-bold text-white text-[22px] sm:text-[28px] leading-tight mb-3 max-w-md">
                Odblokuj pełny program i ćwicz we własnym tempie
              </h2>
              <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-white/70 text-[13px] font-montserrat">
                <span className="inline-flex items-center gap-1.5">
                  <ShieldCheck
                    size={15}
                    weight="fill"
                    className="text-brand-yellow"
                  />
                  Dożywotni dostęp
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Lightning
                    size={15}
                    weight="fill"
                    className="text-brand-yellow"
                  />
                  Natychmiastowy dostęp
                </span>
              </div>
            </div>

            {/* Info o aplikacji */}
            <div className="relative flex items-center gap-4 rounded-[20px] rounded-tr-none bg-white/10 backdrop-blur-md border border-white/15 p-4">
              <span className="flex items-center justify-center size-12 shrink-0 rounded-2xl rounded-tr-none bg-white/15 text-brand-yellow">
                <Devices size={24} weight="fill" />
              </span>
              <div>
                <p className="font-jakarta font-bold text-white text-[15px] leading-tight">
                  Ćwicz w aplikacji, gdziekolwiek jesteś
                </p>
                <p className="font-montserrat text-white/65 text-[13px] leading-snug mt-1">
                  Materiały odtworzysz na telefonie, tablecie i komputerze —
                  prosto z chronionego panelu kursanta.
                </p>
              </div>
            </div>

            {/* Przycisk (na dole, pełna szerokość) */}
            <Link
              href={owned ? panelHref : `/kursy/${course.slug}/checkout`}
              className="group relative inline-flex w-full items-center justify-center gap-2 bg-white text-brand-secondary font-montserrat font-bold text-[15px] px-7 py-4 rounded-3xl rounded-tr-[3px] border border-brand-yellow/30 shadow-[0_8px_22px_0px_rgba(242,217,103,0.45)] hover:shadow-[0_12px_34px_0px_rgba(242,217,103,0.65)] hover:-translate-y-0.5 transition-all overflow-hidden"
            >
              <span className="pointer-events-none absolute -right-2 -bottom-2 size-12 rounded-full bg-brand-yellow/50 blur-[16px]" />
              <span className="relative inline-flex items-center gap-2">
                {owned ? (
                  <>
                    <LockSimpleOpen
                      size={17}
                      weight="fill"
                      className="text-brand-primary"
                    />
                    Przejdź do panelu
                  </>
                ) : (
                  <>
                    Otrzymaj dostęp
                    <span className="text-brand-secondary/40">·</span>
                    <span className="text-brand-primary">
                      {course.price} PLN
                    </span>
                  </>
                )}
                <ArrowRight
                  size={17}
                  weight="bold"
                  className="group-hover:translate-x-0.5 transition-transform"
                />
              </span>
            </Link>

            {/* Status odblokowania — pod przyciskiem */}
            {owned && (
              <p className="relative -mt-3 inline-flex items-center justify-center gap-1.5 font-montserrat text-[12.5px] font-semibold text-brand-yellow">
                <LockSimpleOpen size={14} weight="fill" />
                Masz już dostęp — kurs odblokowany na Twoim koncie.
              </p>
            )}
          </div>
        </div>
      </section>
      </main>
    </>
  );
}
