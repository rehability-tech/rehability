# Brief: Sklep VOD — kompletna ścieżka sprzedaży kursów wideo

Samowystarczalna specyfikacja **frontendu sklepu i pełnego przepływu zakupu**
kursu wideo on-demand (VOD). Zawiera architekturę, model danych, mapę tras,
kompletny kod każdego pliku ścieżki oraz system wizualny. Celem jest odtworzenie
tego samego modułu w innym projekcie na stacku **Next.js (App Router) +
TypeScript + Tailwind + Prisma + Stripe + Framer Motion + Phosphor Icons**.

> Terminologia: „kurs / program", użytkownik = „kursant". UI neutralny płciowo.
> Dostęp jest **per-konto** (`Enrollment`) i **dożywotni** (jednorazowa płatność).

---

## 0. Stack i założenia

| Warstwa | Technologia |
| --- | --- |
| Framework | Next.js 14+ (App Router, RSC + Server Actions/Route Handlers) |
| Język | TypeScript |
| Style | Tailwind CSS (z tokenami brandu w `tailwind.config`) |
| ORM / DB | Prisma + PostgreSQL |
| Płatności | Stripe (PaymentIntent + osadzony **Payment Element**) |
| Auth | NextAuth (`getServerSession`) — zakup wymaga logowania |
| Animacje | Framer Motion (cały ruch UI — nie CSS transitions dla wejść/list) |
| Ikony | `@phosphor-icons/react/dist/ssr` |
| Fonty | nagłówki `font-jakarta`, treść `font-montserrat`, akcent `font-serif italic` |

**Zasada dostępu:** kurs odblokowuje **wyłącznie** rekord `Enrollment`. Płatność
i faktura to osobny `CoursePurchase`. Dostęp nadajemy **idempotentnie w 3
miejscach** (patrz §7): API dla kursów darmowych, webhook Stripe, fallback panelu.

---

## 1. System wizualny (design tokens)

Zmapuj te tokeny na własny brand. W oryginale:

```
--color-secondary : #033f63 / #0B3B4C  → tekst, nagłówki   (klasa: brand-secondary)
--color-primary   : #287D88            → akcenty, przyciski (klasa: brand-primary)
--color-yellow    : #f2d967            → poświata, akcenty  (klasa: brand-yellow)
```

**Znaki rozpoznawcze (stosuj konsekwentnie):**

1. **Glassmorphism** na kartach: `bg-white/60–70 backdrop-blur-xl border border-white/40–50`
   + cień `shadow-[0_20px_60px_-35px_rgba(3,63,99,0.35)]`.
2. **Kształt „kropli"**: główne boksy mają `rounded-[28px] rounded-tr-none`
   (jeden róg ostry). Mniejsze elementy: `rounded-2xl rounded-tr-none` /
   `rounded-tr-[3px]`.
3. **Aktywne elementy** = morskie tło `bg-brand-primary` + biały tekst + **żółta
   poświata** `shadow-[0_4px_15px_0px_rgba(242,217,103,0.35)]` + `border-brand-yellow/30`.
   Wewnątrz często absolutnie pozycjonowana rozmyta żółta kulka:
   `<span className="pointer-events-none absolute -right-1 -bottom-1 size-5 rounded-full bg-brand-yellow/50 blur-[10px]" />`.
4. **Dekoracyjne tło stron** (katalog + checkout — identyczne):
   ```html
   <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
     <div className="absolute inset-0 bg-[linear-gradient(to_bottom,#dafbff_0%,#ffffff_50%,#f5fbfc_100%)] opacity-50" />
     <div className="absolute -top-40 -left-20 w-[420px] h-[420px] rounded-full bg-brand-primary/20 blur-[120px]" />
     <div className="absolute top-1/3 -right-32 w-[380px] h-[380px] rounded-full bg-brand-yellow/25 blur-[120px]" />
   </div>
   ```
5. **Ciemny hero** (strona sprzedażowa): `bg-gradient-to-br from-brand-secondary via-brand-primary to-brand-secondary`
   + overlay radialny z żółtym/morskim glow na `opacity-[0.12]`.

---

## 2. Mapa tras i plików

### Publiczne (sklep)
| Trasa | Plik | Rola |
| --- | --- | --- |
| `/kursy` | `app/(site)/kursy/page.tsx` | Katalog (server; pobiera kursy + enrollmenty) |
| `/kursy` | `_components/KursyHero.tsx` | Hero sklepu |
| `/kursy` | `_components/KursyCatalog.tsx` | Filtry + wyszukiwarka + siatka + paginacja |
| `/kursy` | `_components/CourseCard.tsx` | Karta kursu (cała = Link) |
| `/kursy/[slug]` | `[slug]/page.tsx` | Strona sprzedażowa + JSON-LD |
| `/kursy/[slug]/checkout` | `[slug]/checkout/page.tsx` | Kontener checkoutu (server; prefill z konta) |
| `/kursy/[slug]/checkout` | `_components/CheckoutClient.tsx` | Stepper, walidacja, wywołanie API |
| `/kursy/[slug]/checkout` | `_components/OrderSummary.tsx` | Sticky podsumowanie zamówienia |
| (współdzielony) | `_components/StripePaymentStep.tsx` | Osadzony Stripe Payment Element |
| `/kursy` | `_data/courses.ts` | Typy + stałe (`ORDER_INCLUDES`, `formatCourseDuration`) |

### API
| Endpoint | Plik | Rola |
| --- | --- | --- |
| `POST /api/kursy/create-payment-intent` | `api/kursy/create-payment-intent/route.ts` | Tworzy PaymentIntent (darmowy → od razu Enrollment) |
| `POST /api/webhooks/stripe` | `api/webhooks/stripe/route.ts` | `payment_intent.succeeded` → nadaje dostęp |

### Docelowe (po zakupie — poza tym briefem, ale wymagane jako cel redirectu)
- `/panel/vod` — biblioteka kursanta (+ fallback domykający Enrollment).
- `/panel/vod/[slug]` — odtwarzacz (gating po `Enrollment`).

---

## 3. Model danych (Prisma)

Minimalny zestaw do ścieżki sprzedaży (pełny schemat VOD ma jeszcze moduły,
lekcje, postępy i opinie — poniżej też, bo `Course` je referencuje):

```prisma
model Course {
  id           String   @id @default(cuid())
  slug         String   @unique
  title        String
  category     String
  excerpt      String   @db.Text
  price        Int      @default(0)      // w ZŁOTYCH (int); 0 = darmowy
  durationMin  Int      @default(0)
  rating       Float    @default(0)      // cache z CourseReview
  reviews      Int      @default(0)      // cache z CourseReview
  views        Int      @default(0)
  format       String   @default("sections") // "single" | "sections"
  video        String?
  image        String?
  status       String   @default("PUBLISHED") // DRAFT | PUBLISHED | ARCHIVED
  description  Json?
  content      Json?
  faq          Json?
  // SEO
  metaTitle       String?
  metaDescription String?  @db.Text
  focusKeyword    String?
  ogImage         String?
  canonicalUrl    String?
  noIndex         Boolean  @default(false)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  publishedAt  DateTime?

  modules       CourseModule[]
  enrollments   Enrollment[]
  courseReviews CourseReview[]
  purchases     CoursePurchase[]

  @@index([status])
}

// Dostęp do kursu — JEDYNE źródło prawdy o dostępie. Nadawany idempotentnie.
model Enrollment {
  id          String    @id @default(cuid())
  userId      String
  courseId    String
  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  course      Course    @relation(fields: [courseId], references: [id], onDelete: Cascade)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @default(now()) @updatedAt
  completedAt DateTime?
  watchedSec  Int       @default(0)

  @@unique([userId, courseId])   // ← klucz idempotencji dostępu
  @@index([userId])
}

// Utrwalony rekord zakupu (kwota + snapshot rozliczeniowy do faktur).
// Idempotentny po paymentIntentId. Edycja ceny kursu nie zmienia historii.
model CoursePurchase {
  id              String   @id @default(cuid())
  userId          String
  courseId        String
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  course          Course   @relation(fields: [courseId], references: [id], onDelete: Cascade)
  paymentIntentId String   @unique      // ← klucz idempotencji zakupu
  amount          Int                    // w GROSZACH (amount_received Stripe)
  currency        String   @default("pln")
  buyerType       String?
  buyerName       String?
  buyerEmail      String?
  company         String?
  nip             String?
  address         String?
  postalCode      String?
  city            String?
  createdAt       DateTime @default(now())

  @@index([courseId])
  @@index([userId])
}

model CourseModule {
  id       String   @id @default(cuid())
  courseId String
  course   Course   @relation(fields: [courseId], references: [id], onDelete: Cascade)
  title    String
  order    Int      @default(0)
  lessons  Lesson[]
  @@index([courseId])
}

model Lesson {
  id          String       @id @default(cuid())
  moduleId    String
  module      CourseModule @relation(fields: [moduleId], references: [id], onDelete: Cascade)
  title       String
  description String?      @db.Text
  video       String?
  durationSec Int          @default(0)
  order       Int          @default(0)
  @@index([moduleId])
}

model CourseReview {
  id        String   @id @default(cuid())
  courseId  String
  userId    String
  course    Course   @relation(fields: [courseId], references: [id], onDelete: Cascade)
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  rating    Int
  text      String   @db.Text
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  @@unique([courseId, userId])
  @@index([courseId])
}
```

**Funkcje domenowe do zaimplementowania** (warstwa `lib/courses-db.ts`, jedyne
źródło danych kursów przez Prisma):

```ts
getCourses(): Promise<Course[]>                       // status = PUBLISHED
getCourseCategories(): Promise<string[]>              // ["Wszystkie", ...unikalne]
getCourseBySlug(slug): Promise<Course | null>
getEnrolledSlugs(userId): Promise<string[]>          // slugi kursów usera
isUserEnrolled(userId, slug): Promise<boolean>
```

---

## 4. Przepływ end-to-end

```
/kursy (katalog)
   │  CourseCard → <Link href="/kursy/[slug]">
   ▼
/kursy/[slug] (sprzedaż)  ── owned? → CTA "Przejdź do panelu"
   │  CTA "Otrzymaj dostęp"
   ▼
/kursy/[slug]/checkout
   │  CheckoutClient: walidacja PL → POST /api/kursy/create-payment-intent
   │     ├─ 401              → krok „Konto" (link do logowania z callbackUrl)
   │     ├─ { alreadyOwned } → window.location = /panel/vod/[slug]
   │     ├─ { free }         → Enrollment nadany w API → /panel/vod?zakup=sukces
   │     └─ { clientSecret } → krok „Płatność" (StripePaymentStep)
   ▼
Stripe.confirmPayment({ return_url: /panel/vod?zakup=sukces })
   ▼
POST /api/webhooks/stripe  (payment_intent.succeeded, metadata.kind = COURSE_PURCHASE)
   │  handleCoursePurchasePaid:
   │    1. Enrollment upsert          (idempotentne — dostęp)
   │    2. CoursePurchase upsert       (idempotentne po paymentIntentId — faktura)
   │    3. sync CRM/kontakt (opcjonalne)
   │    4. powiadomienie + live-feed admina (best-effort — NIE może zwrócić 500)
   ▼
/panel/vod  (fallback: weryfikuje payment_intent ze Stripe i domyka Enrollment,
             gdyby webhook się spóźnił — świeży kurs widoczny od razu)
```

Krok aktywny checkoutu **wynika ze stanu**, nie z licznika:
`activeStep = !isLoggedIn ? 1 (Konto) : clientSecret ? 3 (Płatność) : 2 (Dane)`.

---

## 5. Kod — katalog

### 5.1 `app/(site)/kursy/page.tsx` (server)

```tsx
import type { Metadata } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth";
import { KursyHero } from "./_components/KursyHero";
import { KursyCatalog } from "./_components/KursyCatalog";
import { getCourses, getCourseCategories, getEnrolledSlugs } from "@/lib/courses-db";

export const metadata: Metadata = {
  title: "Platforma VOD – Programy online",
  description: "Autorskie programy. Trenuj we własnym tempie, z dowolnego miejsca.",
  alternates: { canonical: "/kursy" },
};

export default async function KursyPage() {
  const session = await getServerSession(authOptions);
  const [courses, categories, ownedSlugs] = await Promise.all([
    getCourses(),
    getCourseCategories(),
    session?.user?.id ? getEnrolledSlugs(session.user.id) : Promise.resolve([]),
  ]);

  return (
    <main className="relative min-h-screen bg-white">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,#dafbff_0%,#ffffff_50%,#f5fbfc_100%)] opacity-50" />
        <div className="absolute -top-40 -left-20 w-[420px] h-[420px] rounded-full bg-brand-primary/20 blur-[120px]" />
        <div className="absolute top-1/3 -right-32 w-[380px] h-[380px] rounded-full bg-brand-yellow/25 blur-[120px]" />
      </div>
      <KursyHero />
      <KursyCatalog courses={courses} categories={categories} ownedSlugs={ownedSlugs} />
    </main>
  );
}
```

### 5.2 `_components/KursyCatalog.tsx` (client)

Filtr po kategorii + fraza, **sort „wykupione na koniec"**, paginacja (6/str.),
stagger siatki Framer Motion.

```tsx
"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { MagnifyingGlass, CaretLeft, CaretRight } from "@phosphor-icons/react/dist/ssr";
import { CourseCard } from "./CourseCard";
import { type Course } from "../_data/courses";

const PAGE_SIZE = 6;

const gridContainer: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
};

export function KursyCatalog({
  courses, categories, ownedSlugs = [],
}: { courses: Course[]; categories: string[]; ownedSlugs?: string[] }) {
  const owned = useMemo(() => new Set(ownedSlugs), [ownedSlugs]);
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("Wszystkie");
  const [page, setPage] = useState(1);

  const filtered = useMemo<Course[]>(() => {
    const q = query.trim().toLowerCase();
    const matched = courses.filter((c) => {
      const matchesCategory = activeCategory === "Wszystkie" || c.category === activeCategory;
      const matchesQuery = q === "" || c.title.toLowerCase().includes(q) || c.category.toLowerCase().includes(q);
      return matchesCategory && matchesQuery;
    });
    // Wykupione lądują na końcu — najpierw te do kupienia (sort stabilny).
    return matched
      .map((c, i) => ({ c, i, owned: owned.has(c.slug) }))
      .sort((a, b) => Number(a.owned) - Number(b.owned) || a.i - b.i)
      .map((x) => x.c);
  }, [query, activeCategory, courses, owned]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const handleCategory = (c: string) => { setActiveCategory(c); setPage(1); };

  return (
    <section id="katalog" className="container pb-24 scroll-mt-28">
      {/* NAGŁÓWEK + WYSZUKIWARKA */}
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-8">
        <div>
          <span className="inline-flex items-center text-[13px] font-semibold font-montserrat text-brand-primary tracking-wider uppercase mb-3">Katalog</span>
          <h2 className="font-jakarta font-bold text-[30px] md:text-[40px] leading-[1.1] text-brand-secondary">
            Baza <span className="text-brand-primary">programów VOD</span>
          </h2>
        </div>
        <label className="relative block w-full lg:w-[360px] shrink-0">
          <span className="sr-only">Szukaj programu</span>
          <MagnifyingGlass size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-secondary/40 pointer-events-none" />
          <input
            type="search" value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(1); }}
            placeholder="Szukaj programu..."
            className="w-full bg-white border border-gray-200 rounded-[14px] pl-11 pr-4 py-3.5 font-montserrat text-sm text-brand-secondary placeholder:text-brand-secondary/40 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-colors shadow-sm"
          />
        </label>
      </div>

      {/* FILTRY KATEGORII */}
      <div className="flex flex-wrap gap-2 mb-10">
        {categories.map((category) => {
          const isActive = category === activeCategory;
          return (
            <button key={category} type="button" onClick={() => handleCategory(category)}
              className={`px-4 py-1.5 rounded-full text-[13px] font-semibold font-montserrat transition-all duration-200 ${
                isActive ? "bg-brand-primary text-white shadow-md shadow-brand-primary/20"
                         : "bg-white border border-gray-200 text-gray-600 hover:border-brand-primary/40 hover:text-brand-primary"}`}>
              {category}
            </button>
          );
        })}
      </div>

      {/* SIATKA */}
      {pageItems.length > 0 ? (
        <AnimatePresence mode="wait">
          <motion.div key={`${activeCategory}-${query}-${currentPage}`}
            variants={gridContainer} initial="hidden" animate="visible" exit={{ opacity: 0 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {pageItems.map((course, i) => (
              <CourseCard key={course.id} course={course} index={i} owned={owned.has(course.slug)} />
            ))}
          </motion.div>
        </AnimatePresence>
      ) : (
        <p className="text-center font-montserrat text-brand-secondary/60 py-16">
          Brak programów spełniających kryteria. Spróbuj zmienić frazę lub kategorię.
        </p>
      )}

      {/* PAGINACJA */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-14">
          <button type="button" aria-label="Poprzednia strona" disabled={currentPage === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="flex items-center justify-center size-10 rounded-full bg-white border border-gray-200 text-brand-primary disabled:opacity-30 hover:border-brand-primary/40 transition-colors">
            <CaretLeft size={16} weight="bold" />
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
            <button key={n} type="button" onClick={() => setPage(n)}
              className={`size-10 rounded-full font-montserrat text-[14px] font-semibold transition-all ${
                n === currentPage ? "bg-brand-primary text-white shadow-md shadow-brand-primary/20"
                                  : "text-brand-secondary/60 hover:text-brand-primary"}`}>
              {n}
            </button>
          ))}
          <button type="button" aria-label="Następna strona" disabled={currentPage === totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="flex items-center justify-center size-10 rounded-full bg-white border border-gray-200 text-brand-primary disabled:opacity-30 hover:border-brand-primary/40 transition-colors">
            <CaretRight size={16} weight="bold" />
          </button>
        </div>
      )}
    </section>
  );
}
```

### 5.3 `_components/CourseCard.tsx` (client)

Cała karta = `<Link>`. Serce (ulubione) blokuje nawigację. Plakietka
„Odblokowane" ma pierwszeństwo. Cena → pill gdy `owned`.

```tsx
"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Star, Clock, ArrowRight, Heart, LockSimpleOpen } from "@phosphor-icons/react/dist/ssr";
import { formatCourseDuration, type Course } from "../_data/courses";
import { useFavorites } from "@/app/_components/FavoritesProvider";

export function CourseCard({ course, index = 0, owned = false }:
  { course: Course; index?: number; owned?: boolean }) {
  const { isFavorite, toggle } = useFavorites();
  const liked = isFavorite(course.id);
  const [heartHover, setHeartHover] = useState(false);

  const toggleLike = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation(); // karta jest Link → blokuj nawigację
    toggle(course.id);
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.55, delay: (index % 6) * 0.06, ease: [0.22, 0.61, 0.36, 1] }}
      className="group h-full">
      <Link href={`/kursy/${course.slug}`}
        className="relative flex flex-col h-full rounded-[28px] bg-white/70 backdrop-blur-xl border border-white/40 shadow-[0_20px_60px_-25px_rgba(3,63,99,0.25)] overflow-hidden">
        {/* MINIATURA */}
        <div className="relative h-[210px] overflow-hidden">
          <Image src={course.image} alt={course.title} fill
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw" className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-brand-secondary/70 via-brand-secondary/10 to-transparent" />
          <div className="absolute top-4 left-4 right-4 flex items-start justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-white/80 backdrop-blur-md text-brand-secondary border border-white/40">
              {course.category}
            </span>
            <motion.button type="button" onClick={toggleLike} aria-pressed={liked}
              whileHover={{ scale: 1.15, rotate: -6 }} whileTap={{ scale: 0.8 }}
              onHoverStart={() => setHeartHover(true)} onHoverEnd={() => setHeartHover(false)}
              transition={{ type: "spring", stiffness: 400, damping: 15 }}
              className={`flex items-center justify-center size-8 rounded-full backdrop-blur-md border border-white/40 transition-colors ${liked || heartHover ? "bg-white" : "bg-white/80"}`}>
              <Heart size={16} weight={liked || heartHover ? "fill" : "bold"}
                className={liked || heartHover ? "text-rose-500" : "text-brand-primary"} />
            </motion.button>
          </div>
          {/* Ocena lub „Nowość" */}
          <div className="absolute bottom-4 left-4 inline-flex items-center gap-1.5 text-white text-[11px] font-semibold bg-white/15 backdrop-blur-md border border-white/20 px-2.5 py-1 rounded-full">
            <Star size={12} weight="fill" className="text-brand-yellow" />
            {course.reviews > 0 ? (<>{course.rating.toFixed(1)}<span className="text-white/70 font-medium">({course.reviews})</span></>) : "Nowość"}
          </div>
          {owned && (
            <span className="absolute bottom-4 right-4 inline-flex items-center gap-1 text-white text-[10px] font-bold bg-emerald-500/90 backdrop-blur-md border border-white/20 px-2 py-1 rounded-full">
              <LockSimpleOpen size={11} weight="fill" /> Odblokowane
            </span>
          )}
        </div>
        {/* TREŚĆ */}
        <div className="flex flex-col flex-1 p-6 gap-4">
          <div className="flex items-center gap-2 text-[12px] text-brand-secondary/60">
            <Clock size={14} weight="duotone" className="text-brand-primary" />
            <span className="font-medium">{formatCourseDuration(course.durationMin)} materiału</span>
          </div>
          <h3 className="font-jakarta text-[19px] font-bold text-brand-secondary leading-snug line-clamp-2 min-h-[52px]">{course.title}</h3>
          {course.excerpt && <p className="font-montserrat text-[13px] leading-relaxed text-brand-secondary/55 line-clamp-2 -mt-1">{course.excerpt}</p>}
          <div className="mt-auto flex items-center justify-between pt-4 border-t border-brand-secondary/5">
            {owned ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200/70 pl-2 pr-3 py-1 font-montserrat font-bold text-[12px] text-emerald-600">
                <LockSimpleOpen size={13} weight="fill" /> Odblokowane
              </span>
            ) : (
              <div>
                <p className="text-[10px] uppercase tracking-wider text-brand-secondary/40 font-bold">Cena</p>
                <p className="font-jakarta text-[22px] font-bold text-brand-primary leading-none mt-1">{course.price} <span className="text-[15px]">PLN</span></p>
              </div>
            )}
            <span className="inline-flex items-center gap-2 text-[13px] font-bold text-brand-primary group-hover:gap-3 transition-all">
              {owned ? "Zobacz szczegóły" : "Poznaj szczegóły"} <ArrowRight size={16} weight="bold" />
            </span>
          </div>
        </div>
      </Link>
    </motion.article>
  );
}
```

> `useFavorites` (ulubione w localStorage + migracja po logowaniu) jest opcjonalne —
> jeśli nie potrzebujesz „serca", usuń `motion.button` i provider.

---

## 6. Kod — strona sprzedażowa i checkout

### 6.1 `app/(site)/kursy/[slug]/page.tsx` (server) — skrót istotnej logiki

Pełna strona ma ciemny hero + cover + zakładki + końcowe CTA + **JSON-LD**
(Course / FAQPage / BreadcrumbList). Kluczowe: świadomość `owned` przełącza CTA
i ukrywa cenę.

```tsx
export default async function CourseDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const course = await getCourseBySlug(slug);
  if (!course) notFound();

  const session = await getServerSession(authOptions);
  const owned = session?.user?.id ? await isUserEnrolled(session.user.id, slug) : false;
  const panelHref = `/panel/vod/${course.slug}`;

  // JSON-LD Course + Offer (rich snippets); aggregateRating tylko gdy reviews > 0.
  const courseJsonLd = {
    "@context": "https://schema.org", "@type": "Course",
    name: course.title, description: course.metaDescription?.trim() || course.excerpt,
    inLanguage: "pl-PL",
    offers: { "@type": "Offer", category: "Paid", price: course.price, priceCurrency: "PLN",
      availability: "https://schema.org/InStock", url: absoluteUrl(`/kursy/${course.slug}/checkout`) },
    ...(course.reviews > 0 ? { aggregateRating: { "@type": "AggregateRating",
      ratingValue: course.rating, reviewCount: course.reviews, bestRating: 5, worstRating: 1 } } : {}),
  };

  return (
    <main className="bg-white">
      {!course.noIndex && (
        <script type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(courseJsonLd) }} />
      )}
      {/* HERO ciemny gradientowy … cena + CTA: */}
      <div className="leading-none">
        {owned ? (
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-md border border-brand-yellow/30 pl-2.5 pr-4 py-2 font-montserrat font-semibold text-[13px] text-white shadow-[0_4px_15px_0px_rgba(242,217,103,0.25)]">
            <LockSimpleOpen size={16} weight="fill" className="text-brand-yellow" /> Masz już dostęp
          </span>
        ) : (
          <>
            <p className="text-[10px] uppercase tracking-wider text-white/40 font-bold mb-1">Cena dożywotnia</p>
            <p className="font-jakarta text-[26px] font-bold text-white leading-none">{course.price} <span className="text-[15px] font-semibold text-white/70">PLN</span></p>
          </>
        )}
      </div>
      <Link href={owned ? panelHref : `/kursy/${course.slug}/checkout`}
        className="group relative inline-flex items-center gap-2 bg-white text-brand-secondary font-montserrat font-bold text-[14px] px-5 py-2.5 rounded-2xl rounded-tr-[3px] border border-brand-yellow/30 shadow-[0_8px_22px_0px_rgba(242,217,103,0.45)] hover:shadow-[0_10px_30px_0px_rgba(242,217,103,0.6)] transition-all overflow-hidden">
        <span className="pointer-events-none absolute -right-2 -bottom-2 size-9 rounded-full bg-brand-yellow/50 blur-[14px]" />
        {owned ? "Przejdź do panelu" : "Otrzymaj dostęp"} <ArrowRight size={16} weight="bold" />
      </Link>
      {/* … cover, CourseTabs, końcowe CTA (analogiczny wariant owned) … */}
    </main>
  );
}
```

### 6.2 `app/(site)/kursy/[slug]/checkout/page.tsx` (server)

```tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { ArrowLeft, ShieldCheck } from "@phosphor-icons/react/dist/ssr";
import { authOptions } from "@/lib/auth/auth";
import { getCourseBySlug } from "@/lib/courses-db";
import { CheckoutClient } from "../../_components/CheckoutClient";

export const metadata: Metadata = { title: "Zamówienie – Platforma VOD", robots: { index: false, follow: false } };

export default async function CheckoutPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const course = await getCourseBySlug(slug);
  if (!course) notFound();

  const session = await getServerSession(authOptions);
  const isLoggedIn = !!session?.user?.email;
  const loginUrl = `/logowanie?callbackUrl=${encodeURIComponent(`/kursy/${slug}/checkout`)}`;
  const account = isLoggedIn ? { name: session!.user!.name ?? "", email: session!.user!.email ?? "" } : null;

  return (
    <main className="relative min-h-screen pt-28 md:pt-32 pb-24 overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,#dafbff_0%,#ffffff_50%,#f5fbfc_100%)] opacity-50" />
        <div className="absolute -top-40 -left-20 w-[420px] h-[420px] rounded-full bg-brand-primary/20 blur-[120px]" />
        <div className="absolute top-1/4 -right-32 w-[380px] h-[380px] rounded-full bg-brand-yellow/25 blur-[120px]" />
      </div>
      <section className="container">
        <Link href={`/kursy/${course.slug}`}
          className="group inline-flex items-center gap-2 mb-6 font-montserrat text-[13px] font-semibold text-brand-secondary/60 hover:text-brand-primary transition-colors">
          <span className="flex items-center justify-center size-7 rounded-full bg-white/70 backdrop-blur-md border border-white/50 shadow-sm group-hover:-translate-x-0.5 transition-transform">
            <ArrowLeft size={14} weight="bold" />
          </span>
          Wróć do kursu
        </Link>
        <div className="flex flex-col gap-3 mb-2">
          <h1 className="font-jakarta font-bold text-brand-secondary text-[28px] md:text-[36px] leading-[1.15]">Finalizacja zamówienia</h1>
          <p className="inline-flex items-center gap-2 font-montserrat text-[14px] text-brand-secondary/60">
            <ShieldCheck size={17} weight="fill" className="text-brand-primary" />
            Bezpieczna płatność · dożywotni dostęp natychmiast po zakupie
          </p>
        </div>
        <CheckoutClient course={course} isLoggedIn={isLoggedIn} loginUrl={loginUrl} account={account} />
      </section>
    </main>
  );
}
```

### 6.3 `_components/CheckoutClient.tsx` (client) — SERCE ŚCIEŻKI

Stepper (4 kroki, responsywny) · toggle nabywcy (osoba/firma) · walidacja PL
(NIP z sumą kontrolną, kod `00-000`, email) z animowanym shake pól · wywołanie
API i rozgałęzienie odpowiedzi · osadzenie Payment Element.

```tsx
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Check, User, Buildings, ArrowRight, ArrowLeft, SignIn, UserCircle,
  CircleNotch, WarningCircle, CreditCard, ShieldCheck,
} from "@phosphor-icons/react/dist/ssr";
import { OrderSummary } from "./OrderSummary";
import StripePaymentStep from "@/app/(site)/wydarzenia/[slug]/_components/StripePaymentStep";
import type { Course } from "../_data/courses";

type BuyerType = "private" | "company";
const STEPS = ["Konto", "Dane do płatności", "Płatność", "Podsumowanie"];

// — Walidacja polskich danych —
const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
const isValidPostal = (v: string) => /^\d{2}-\d{3}$/.test(v.trim());
function isValidNip(v: string) {
  const d = v.replace(/[\s-]/g, "");
  if (!/^\d{10}$/.test(d)) return false;
  const w = [6, 5, 7, 2, 3, 4, 5, 6, 7];
  return w.reduce((a, x, i) => a + x * Number(d[i]), 0) % 11 === Number(d[9]);
}

type FormShape = { name: string; company: string; nip: string; email: string; address: string; postal: string; city: string };
type FieldErrors = Partial<Record<keyof FormShape, string>>;

function validatePaymentData(buyer: BuyerType, form: FormShape): FieldErrors {
  const e: FieldErrors = {};
  if (buyer === "company") {
    if (!form.company.trim()) e.company = "Podaj pełną nazwę firmy.";
    if (!isValidNip(form.nip)) e.nip = "Nieprawidłowy NIP — wpisz 10 cyfr.";
  } else if (!form.name.trim()) e.name = "Podaj imię i nazwisko.";
  if (!isValidEmail(form.email)) e.email = "Nieprawidłowy adres email.";
  if (!form.address.trim()) e.address = "Podaj adres.";
  if (!isValidPostal(form.postal)) e.postal = "Kod pocztowy w formacie 00-000.";
  if (!form.city.trim()) e.city = "Podaj miasto.";
  return e;
}

export function CheckoutClient({
  course, isLoggedIn = true, loginUrl = "/logowanie", account = null,
}: {
  course: Course; isLoggedIn?: boolean; loginUrl?: string;
  account?: { name: string; email: string } | null;
}) {
  const [buyer, setBuyer] = useState<BuyerType>("private");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [returnUrl, setReturnUrl] = useState("");
  const [form, setForm] = useState<FormShape>({
    name: account?.name ?? "", company: "", nip: "", email: account?.email ?? "",
    address: "", postal: "", city: "",
  });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const set = (k: keyof FormShape) => (v: string) => {
    setForm((f) => ({ ...f, [k]: v }));
    setFieldErrors((errs) => (errs[k] ? { ...errs, [k]: undefined } : errs));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError(null);

    const errs = validatePaymentData(buyer, form);
    if (Object.values(errs).some(Boolean)) {
      setFieldErrors(errs);
      setError("Popraw zaznaczone pola, zanim przejdziesz do płatności.");
      return;
    }
    setFieldErrors({});
    setLoading(true);
    try {
      const res = await fetch("/api/kursy/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: course.slug, buyerType: buyer, company: form.company, nip: form.nip,
          name: form.name, email: form.email, address: form.address, postal: form.postal, city: form.city,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setError(data.error || "Nie udało się rozpocząć płatności."); return; }

      if (data.alreadyOwned) { window.location.href = `/panel/vod/${course.slug}`; return; }
      if (data.free) { window.location.href = `/panel/vod?zakup=sukces`; return; }
      if (data.clientSecret) {
        // Stripe dokleja payment_intent + redirect_status do return_url.
        setReturnUrl(`${window.location.origin}/panel/vod?zakup=sukces`);
        setClientSecret(data.clientSecret);
        return;
      }
      setError("Nie udało się rozpocząć płatności.");
    } catch {
      setError("Wystąpił błąd. Spróbuj ponownie za chwilę.");
    } finally {
      setLoading(false);
    }
  };

  // Krok aktywny wynika ZE STANU (nie z licznika).
  const activeStep = !isLoggedIn ? 1 : clientSecret ? 3 : 2;
  const isStepClickable = (step: number) => step < activeStep && step !== 1;
  const goToStep = (step: number) => {
    if (!isStepClickable(step)) return;
    if (step === 2 && clientSecret) { setClientSecret(null); setError(null); } // powrót z Płatności do formularza
  };

  const buyerOptions = [
    { id: "private" as const, label: "Osoba prywatna", icon: <User size={16} weight="bold" /> },
    { id: "company" as const, label: "Firma", icon: <Buildings size={16} weight="bold" /> },
  ];

  return (
    <div className="flex flex-col gap-8">
      <Stepper activeStep={activeStep} onStepClick={goToStep} isStepClickable={isStepClickable} />

      <div className="flex flex-col lg:flex-row gap-8 lg:gap-10 items-start justify-center">
        {!isLoggedIn ? (
          /* KROK „Konto" — logowanie z callbackUrl na checkout */
          <div className="flex-1 max-w-[731px] w-full flex flex-col gap-6 bg-white/60 backdrop-blur-xl border border-white/50 rounded-[28px] rounded-tr-none shadow-[0_20px_60px_-35px_rgba(3,63,99,0.35)] p-6 md:p-8">
            <div className="border-b border-brand-primary/10 pb-5">
              <h2 className="font-jakarta font-bold text-[20px] text-brand-secondary">Konto</h2>
              <p className="font-montserrat text-[13px] text-brand-secondary/50 mt-1">Zaloguj się, aby kontynuować — dostęp przypiszemy do Twojego konta.</p>
            </div>
            <div className="flex flex-col items-center text-center gap-4 py-4">
              <span className="relative flex items-center justify-center size-14 rounded-2xl rounded-tr-none bg-brand-primary/10 text-brand-primary">
                <span className="pointer-events-none absolute inset-0 rounded-2xl rounded-tr-none bg-brand-yellow/20 blur-lg" />
                <UserCircle size={30} weight="duotone" className="relative" />
              </span>
              <Link href={loginUrl}
                className="group relative inline-flex items-center justify-center gap-2 bg-brand-primary text-white font-montserrat font-bold text-[15px] px-7 py-3.5 rounded-2xl rounded-tr-[3px] border border-brand-yellow/30 shadow-[0_10px_30px_-8px_rgba(40,125,136,0.6)] hover:shadow-[0_12px_34px_0px_rgba(242,217,103,0.55)] transition-all overflow-hidden">
                <span className="pointer-events-none absolute -right-2 -bottom-2 size-10 rounded-full bg-brand-yellow/50 blur-[14px]" />
                <span className="relative inline-flex items-center gap-2"><SignIn size={18} weight="bold" /> Zaloguj się</span>
              </Link>
            </div>
          </div>
        ) : clientSecret ? (
          /* KROK „Płatność" — osadzony Stripe Payment Element */
          <div className="flex-1 max-w-[731px] w-full flex flex-col gap-6 bg-white/60 backdrop-blur-xl border border-white/50 rounded-[28px] rounded-tr-none shadow-[0_20px_60px_-35px_rgba(3,63,99,0.35)] p-6 md:p-8">
            <div className="flex items-start justify-between gap-3 border-b border-brand-primary/10 pb-5">
              <div>
                <h2 className="font-jakarta font-bold text-[20px] text-brand-secondary inline-flex items-center gap-2">
                  <CreditCard size={20} weight="duotone" className="text-brand-primary" /> Płatność
                </h2>
                <p className="font-montserrat text-[13px] text-brand-secondary/50 mt-1">Wybierz metodę i opłać dostęp — karta, BLIK lub Przelewy24.</p>
              </div>
              <button type="button" onClick={() => { setClientSecret(null); setError(null); }}
                className="shrink-0 inline-flex items-center gap-1.5 font-montserrat font-semibold text-[12.5px] text-brand-secondary/60 hover:text-brand-primary transition-colors">
                <ArrowLeft size={14} weight="bold" /> Zmień dane
              </button>
            </div>
            <span className="inline-flex items-center gap-1.5 self-start text-[11px] font-semibold text-brand-primary bg-brand-primary/10 border border-brand-primary/15 rounded-full px-2.5 py-1">
              <ShieldCheck size={13} weight="fill" /> Szyfrowana płatność Stripe
            </span>
            <StripePaymentStep clientSecret={clientSecret} depositLabel={`${course.price} PLN`} returnUrl={returnUrl} email={form.email} />
          </div>
        ) : (
          /* KROK „Dane do płatności" — formularz */
          <form onSubmit={handleSubmit}
            className="flex-1 max-w-[731px] w-full flex flex-col gap-7 bg-white/60 backdrop-blur-xl border border-white/50 rounded-[28px] rounded-tr-none shadow-[0_20px_60px_-35px_rgba(3,63,99,0.35)] p-6 md:p-8">
            <div className="border-b border-brand-primary/10 pb-5">
              <h2 className="font-jakarta font-bold text-[20px] text-brand-secondary">Dane do płatności</h2>
              <p className="font-montserrat text-[13px] text-brand-secondary/50 mt-1">Wystawimy dokument zakupu na podane dane.</p>
            </div>
            {/* Toggle nabywcy */}
            <div className="inline-flex items-center gap-1.5 self-start p-1 rounded-full bg-white/60 border border-white/60 shadow-sm">
              {buyerOptions.map((opt) => {
                const isActive = buyer === opt.id;
                return (
                  <button key={opt.id} type="button" onClick={() => setBuyer(opt.id)} aria-pressed={isActive}
                    className={`relative inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full font-montserrat font-semibold text-[13px] transition-all overflow-hidden ${
                      isActive ? "bg-brand-primary text-white shadow-[0_4px_15px_0px_rgba(242,217,103,0.35)] border border-brand-yellow/30"
                               : "text-brand-secondary/60 hover:text-brand-secondary"}`}>
                    {isActive && <span className="pointer-events-none absolute -right-1 -bottom-1 size-5 rounded-full bg-brand-yellow/50 blur-[10px]" />}
                    <span className="relative flex items-center gap-1.5">{opt.icon}{opt.label}</span>
                  </button>
                );
              })}
            </div>
            {/* Pola */}
            <div className="flex flex-col gap-5">
              {buyer === "company" ? (
                <div className="flex flex-col sm:flex-row gap-6">
                  <Field label="Pełna nazwa firmy *" value={form.company} onChange={set("company")} error={fieldErrors.company} />
                  <Field label="NIP *" inputMode="numeric" placeholder="0000000000" value={form.nip} onChange={set("nip")} error={fieldErrors.nip} />
                </div>
              ) : (
                <Field label="Imię i nazwisko *" value={form.name} onChange={set("name")} error={fieldErrors.name} />
              )}
              <div className="flex flex-col sm:flex-row gap-6">
                <Field label="Adres email *" type="email" value={form.email} onChange={set("email")} error={fieldErrors.email} />
                <Field label="Adres *" value={form.address} onChange={set("address")} error={fieldErrors.address} />
              </div>
              <div className="flex flex-col sm:flex-row gap-6">
                <Field label="Kod pocztowy *" inputMode="numeric" placeholder="00-000" value={form.postal} onChange={set("postal")} error={fieldErrors.postal} />
                <Field label="Miasto *" value={form.city} onChange={set("city")} error={fieldErrors.city} />
              </div>
            </div>
            <AnimatePresence initial={false}>
              {error && (
                <motion.p key={error} initial={{ opacity: 0, y: -8, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.97 }}
                  transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                  className="inline-flex items-center gap-2 self-start font-montserrat text-[13px] font-semibold text-rose-600 bg-rose-50 border border-rose-200 rounded-xl px-3.5 py-2">
                  <WarningCircle size={16} weight="fill" className="shrink-0" /> {error}
                </motion.p>
              )}
            </AnimatePresence>
            <button type="submit" disabled={loading}
              className="group relative self-start inline-flex items-center gap-2 bg-brand-primary text-white font-montserrat font-bold text-[13px] px-5 py-2.5 rounded-2xl rounded-tr-[3px] border border-brand-yellow/30 shadow-[0_6px_18px_0px_rgba(40,125,136,0.4)] hover:shadow-[0_8px_22px_0px_rgba(242,217,103,0.45)] transition-all overflow-hidden disabled:opacity-70 disabled:cursor-not-allowed">
              <span className="pointer-events-none absolute -right-2 -bottom-2 size-8 rounded-full bg-brand-yellow/50 blur-[12px]" />
              <span className="relative inline-flex items-center gap-2">
                {loading ? (<>Przygotowuję płatność… <CircleNotch size={16} weight="bold" className="animate-spin" /></>)
                         : (<>Przejdź do płatności <ArrowRight size={16} weight="bold" className="group-hover:translate-x-0.5 transition-transform" /></>)}
              </span>
            </button>
          </form>
        )}

        <OrderSummary course={course} />
      </div>
    </div>
  );
}

// — Pole formularza z shake przy błędzie —
function Field({ label, type = "text", placeholder, value, onChange, error, inputMode }: {
  label: string; type?: string; placeholder?: string; value: string;
  onChange: (v: string) => void; error?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
}) {
  return (
    <label className="flex flex-col gap-2 w-full">
      <span className="font-montserrat font-medium text-[12px] tracking-[-0.2px] text-brand-secondary/70">{label}</span>
      <motion.input type={type} inputMode={inputMode} value={value} placeholder={placeholder} aria-invalid={!!error}
        onChange={(e) => onChange(e.target.value)}
        animate={error ? { x: [0, -5, 5, -3, 3, 0] } : { x: 0 }} transition={{ duration: 0.4, ease: "easeInOut" }}
        className={`h-12 px-4 rounded-2xl border bg-white/80 font-montserrat text-[14px] text-brand-secondary placeholder:text-brand-secondary/35 outline-none transition-colors focus:bg-white focus:ring-4 ${
          error ? "border-rose-300 focus:border-rose-400 focus:ring-rose-100"
                : "border-brand-primary/15 focus:border-brand-primary focus:ring-brand-primary/10"}`} />
      <AnimatePresence initial={false}>
        {error && (
          <motion.span key={error} initial={{ opacity: 0, height: 0, y: -4 }} animate={{ opacity: 1, height: "auto", y: 0 }} exit={{ opacity: 0, height: 0, y: -4 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden font-montserrat text-[11.5px] font-medium text-rose-600">{error}</motion.span>
        )}
      </AnimatePresence>
    </label>
  );
}

// — Stepper (mobile: pasek postępu; desktop: pigułki) —
function Stepper({ activeStep, onStepClick, isStepClickable }: {
  activeStep: number; onStepClick?: (s: number) => void; isStepClickable?: (s: number) => boolean;
}) {
  return (
    <>
      <div className="sm:hidden bg-white/60 backdrop-blur-xl border border-white/50 rounded-[20px] rounded-tr-none shadow-[0_12px_30px_-24px_rgba(3,63,99,0.4)] p-4">
        <div className="flex items-center gap-3">
          <span className="relative flex items-center justify-center size-9 shrink-0 rounded-full bg-brand-primary text-white font-jakarta font-bold text-[14px] border border-brand-yellow/30 shadow-[0_4px_15px_0px_rgba(242,217,103,0.35)] overflow-hidden">
            <span className="pointer-events-none absolute -right-1 -bottom-1 size-5 rounded-full bg-brand-yellow/50 blur-[10px]" />
            <span className="relative">{activeStep}</span>
          </span>
          <div className="flex-1 min-w-0">
            <p className="font-montserrat text-[11px] font-semibold uppercase tracking-wider text-brand-secondary/45">Krok {activeStep} z {STEPS.length}</p>
            <p className="font-jakarta font-bold text-[15px] text-brand-secondary leading-tight truncate">{STEPS[activeStep - 1]}</p>
          </div>
        </div>
        <div className="mt-3 h-1.5 w-full rounded-full bg-brand-secondary/10 overflow-hidden">
          <div className="h-full rounded-full bg-gradient-to-r from-brand-primary to-brand-yellow transition-all" style={{ width: `${(activeStep / STEPS.length) * 100}%` }} />
        </div>
      </div>
      <div className="hidden sm:flex items-center gap-3 overflow-x-auto py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {STEPS.map((label, i) => {
          const step = i + 1, isDone = step < activeStep, isActive = step === activeStep;
          const clickable = isStepClickable?.(step) ?? false;
          return (
            <div key={label} className="flex items-center gap-3">
              <button type="button" disabled={!clickable} onClick={clickable ? () => onStepClick?.(step) : undefined} aria-current={isActive ? "step" : undefined}
                className={`relative flex items-center gap-2 shrink-0 rounded-full pl-1.5 pr-4 py-1.5 border transition-colors overflow-hidden ${clickable ? "cursor-pointer hover:border-brand-primary/40" : "cursor-default"} ${
                  isActive ? "bg-brand-primary border-brand-yellow/30 shadow-[0_4px_15px_0px_rgba(242,217,103,0.35)]"
                           : isDone ? "bg-white/70 backdrop-blur-md border-white/60" : "bg-white/40 backdrop-blur-md border-white/50"}`}>
                {isActive && <span className="pointer-events-none absolute -right-1 -bottom-1 size-5 rounded-full bg-brand-yellow/50 blur-[10px]" />}
                <span className={`relative flex items-center justify-center size-7 shrink-0 rounded-full text-[13px] font-bold ${
                  isActive ? "bg-white text-brand-primary" : isDone ? "bg-brand-primary text-white" : "bg-brand-primary/10 text-brand-primary/50"}`}>
                  {isDone ? <Check size={15} weight="bold" /> : step}
                </span>
                <span className={`relative font-montserrat font-semibold text-[13px] whitespace-nowrap ${isActive ? "text-white" : isDone ? "text-brand-secondary" : "text-brand-secondary/45"}`}>{label}</span>
              </button>
              {step < STEPS.length && <span className={`h-px w-6 shrink-0 ${isDone ? "bg-brand-primary/40" : "bg-brand-secondary/15"}`} />}
            </div>
          );
        })}
      </div>
    </>
  );
}
```

### 6.4 `_components/OrderSummary.tsx` (client)

```tsx
"use client";

import Image from "next/image";
import { Clock, CheckCircle, Star } from "@phosphor-icons/react/dist/ssr";
import { formatCourseDuration, ORDER_INCLUDES, type Course } from "../_data/courses";

export function OrderSummary({ course }: { course: Course }) {
  return (
    <div className="w-full lg:w-[407px] shrink-0 lg:sticky lg:top-28">
      <div className="bg-white/60 backdrop-blur-xl border border-white/50 rounded-[28px] rounded-tr-none shadow-[0_20px_60px_-35px_rgba(3,63,99,0.35)] p-6 flex flex-col gap-6">
        <div className="flex items-end justify-between border-b border-brand-primary/10 pb-4">
          <h2 className="font-jakarta font-bold text-[20px] text-brand-secondary">Twoje zamówienie</h2>
          <span className="inline-flex items-center gap-1 bg-white/70 border border-white/60 rounded-full px-2.5 py-1 shadow-sm">
            <Star size={13} weight="fill" className="text-brand-yellow" />
            <span className="font-montserrat font-semibold text-[12px] text-brand-secondary">{course.rating.toFixed(1)}</span>
          </span>
        </div>
        <div className="flex gap-4 items-stretch">
          <div className="relative size-[112px] rounded-2xl rounded-tr-none overflow-hidden shrink-0 shadow-[0_12px_30px_-16px_rgba(3,63,99,0.5)]">
            <Image src={course.image} alt={course.title} fill sizes="112px" className="object-cover" />
          </div>
          <div className="flex flex-col justify-between flex-1 min-w-0 py-0.5">
            <h3 className="font-montserrat font-semibold text-[15px] text-brand-secondary leading-snug line-clamp-3">{course.title}</h3>
            <div className="flex items-center gap-1.5">
              <Clock size={16} weight="duotone" className="text-brand-primary" />
              <span className="font-montserrat font-medium text-[12px] text-brand-secondary/50">{formatCourseDuration(course.durationMin)} materiału</span>
            </div>
          </div>
        </div>
        <div className="bg-brand-primary/[0.07] rounded-[20px] rounded-tr-none p-4 flex flex-col gap-3">
          <span className="font-montserrat font-bold text-[12px] uppercase tracking-wider text-brand-secondary/60">W cenie</span>
          <ul className="flex flex-col gap-2.5">
            {ORDER_INCLUDES.map((item) => (
              <li key={item} className="flex items-center gap-2.5">
                <CheckCircle size={18} weight="fill" className="text-brand-primary shrink-0" />
                <span className="font-montserrat text-[14px] text-brand-secondary/80">{item}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex items-end justify-between border-t border-brand-primary/10 pt-4">
          <div>
            <p className="font-montserrat text-[12px] text-brand-secondary/50">Razem do zapłaty</p>
            <p className="font-montserrat text-[11px] text-brand-secondary/40">Dostęp dożywotni · jednorazowo</p>
          </div>
          <p className="font-jakarta font-bold text-[28px] text-brand-primary leading-none">{course.price} <span className="text-[16px] font-semibold">PLN</span></p>
        </div>
      </div>
    </div>
  );
}
```

### 6.5 `_components/StripePaymentStep.tsx` (client) — osadzony Payment Element

```tsx
"use client";

import React, { useState } from "react";
import { loadStripe, type Stripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { CircleNotch, CreditCard, WarningCircle } from "@phosphor-icons/react/dist/ssr";

const COLORS = { text: "#0B3B4C", accent: "#287D88" } as const;

let stripePromise: Promise<Stripe | null> | null = null;
function getStripe() {
  if (!stripePromise) {
    const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    stripePromise = key ? loadStripe(key) : Promise.resolve(null);
  }
  return stripePromise;
}

interface Props { clientSecret: string; depositLabel: string; returnUrl: string; email?: string }

export default function StripePaymentStep({ clientSecret, depositLabel, returnUrl, email }: Props) {
  return (
    <Elements stripe={getStripe()} options={{
      clientSecret, locale: "pl",
      appearance: { theme: "stripe", variables: {
        colorPrimary: COLORS.accent, colorText: COLORS.text, borderRadius: "12px",
        fontFamily: "Montserrat, system-ui, sans-serif", fontSizeBase: "14px" } },
    }}>
      <PaymentForm depositLabel={depositLabel} returnUrl={returnUrl} email={email} />
    </Elements>
  );
}

function PaymentForm({ depositLabel, returnUrl, email }: { depositLabel: string; returnUrl: string; email?: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const [paying, setPaying] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePay() {
    if (!stripe || !elements) return;
    setPaying(true); setError(null);
    const { error: submitError } = await elements.submit();
    if (submitError) { setError(submitError.message ?? "Sprawdź dane karty."); setPaying(false); return; }
    // Sukces = redirect na return_url (Stripe dokleja payment_intent + redirect_status).
    const { error: confirmError } = await stripe.confirmPayment({ elements, confirmParams: { return_url: returnUrl } });
    if (confirmError) setError(confirmError.message ?? "Płatność nie powiodła się.");
    setPaying(false);
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="relative min-h-[260px]">
        <PaymentElement options={{ layout: { type: "tabs", defaultCollapsed: false },
          ...(email ? { defaultValues: { billingDetails: { email } } } : {}) }} onReady={() => setReady(true)} />
      </div>
      {error && (
        <div className="flex items-start gap-2 text-sm text-rose-600 bg-rose-50 border border-rose-100 rounded-xl px-4 py-3">
          <WarningCircle size={18} weight="fill" className="shrink-0 mt-0.5" /><span>{error}</span>
        </div>
      )}
      <button type="button" onClick={handlePay} disabled={!stripe || !elements || paying || !ready}
        className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl text-white text-sm font-semibold transition disabled:opacity-50"
        style={{ background: COLORS.accent }}>
        {paying ? (<><CircleNotch size={16} weight="bold" className="animate-spin" /> Przetwarzamy płatność…</>)
                : (<><CreditCard size={16} weight="bold" /> Zapłać {depositLabel}</>)}
      </button>
      <p className="text-[11px] text-gray-400 text-center">Dane karty trafiają bezpośrednio do Stripe — nie przechodzą przez nasze serwery.</p>
    </div>
  );
}
```

### 6.6 `_data/courses.ts` (typy + stałe)

```ts
export type Course = {
  id: string; slug: string; title: string; category: string; excerpt: string;
  price: number; durationMin: number; rating: number; reviews: number;
  image: string; videoPending?: boolean;
  metaTitle?: string; metaDescription?: string; focusKeyword?: string;
  ogImage?: string; canonicalUrl?: string; noIndex?: boolean;
  faq?: { q: string; a: string }[];
  // …pola treści zakładek…
};

export function formatCourseDuration(min: number): string {
  if (!min || min <= 0) return "—";
  const h = Math.floor(min / 60), m = min % 60;
  if (h && m) return `${h}h ${m} min`;
  if (h) return `${h}h`;
  return `${m} min`;
}

export const ORDER_INCLUDES: string[] = [
  "Dożywotni dostęp do aplikacji",
  "Treści chronione na panelu kursanta",
  "Natychmiastowy dostęp",
];
```

---

## 7. Kod — API płatności i webhook

### 7.1 `POST /api/kursy/create-payment-intent`

Wymaga logowania → sprawdza istniejący `Enrollment` → kurs darmowy nadaje od
ręki → inaczej tworzy PaymentIntent z pełnym `metadata` (czyta go webhook).

```ts
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { z } from "zod";
import { getServerSession } from "next-auth/next";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getStripe(): Stripe {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) throw new Error("Brak STRIPE_SECRET_KEY.");
  return new Stripe(secret);
}

const BodySchema = z.object({
  slug: z.string().min(1),
  buyerType: z.enum(["private", "company"]).optional(),
  company: z.string().trim().optional(),
  nip: z.string().trim().optional(),
  name: z.string().trim().optional(),
  email: z.string().trim().optional(),
  address: z.string().trim().optional(),
  postal: z.string().trim().optional(),
  city: z.string().trim().optional(),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  const email = session?.user?.email?.toLowerCase();
  if (!userId || !email) {
    return NextResponse.json({ error: "Zaloguj się, aby kupić kurs." }, { status: 401 });
  }

  let rawBody: unknown;
  try { rawBody = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 }); }

  const parsed = BodySchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", issues: parsed.error.flatten() }, { status: 422 });
  }
  const { slug, buyerType, company, nip, name, email: billingEmail, address, postal, city } = parsed.data;

  const course = await prisma.course.findFirst({
    where: { slug, status: "PUBLISHED" },
    select: { id: true, title: true, price: true },
  });
  if (!course) return NextResponse.json({ error: "Ten kurs nie jest już dostępny." }, { status: 404 });

  // Już ma dostęp → nie tworzymy płatności.
  const existing = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId: course.id } }, select: { id: true },
  });
  if (existing) return NextResponse.json({ alreadyOwned: true });

  const amount = Math.round((course.price ?? 0) * 100); // ZŁ → GROSZE

  // Kurs darmowy → dostęp od razu, bez Stripe.
  if (amount <= 0) {
    await prisma.enrollment.upsert({
      where: { userId_courseId: { userId, courseId: course.id } },
      update: {}, create: { userId, courseId: course.id },
    });
    return NextResponse.json({ free: true });
  }

  // Metadata czytane przez webhook.
  const metadata: Record<string, string> = { kind: "COURSE_PURCHASE", courseId: course.id, slug, userId };
  if (buyerType) metadata.buyerType = buyerType;
  if (company) metadata.company = company.slice(0, 400);
  if (nip) metadata.nip = nip.slice(0, 40);
  if (name) metadata.buyerName = name.slice(0, 200);
  if (billingEmail) metadata.buyerEmail = billingEmail.slice(0, 200);
  if (address) metadata.address = address.slice(0, 300);
  if (postal) metadata.postalCode = postal.slice(0, 20);
  if (city) metadata.city = city.slice(0, 120);

  let paymentIntent: Stripe.PaymentIntent;
  try {
    const stripe = getStripe();
    paymentIntent = await stripe.paymentIntents.create({
      amount, currency: "pln", receipt_email: email,
      automatic_payment_methods: { enabled: true }, metadata,
    });
  } catch (err) {
    console.error("[create-payment-intent] Stripe error:", err);
    return NextResponse.json({ error: "Nie udało się utworzyć płatności." }, { status: 502 });
  }

  if (!paymentIntent.client_secret) {
    return NextResponse.json({ error: "Stripe nie zwrócił client_secret." }, { status: 502 });
  }
  return NextResponse.json({ clientSecret: paymentIntent.client_secret, amount });
}
```

### 7.2 Webhook — `handleCoursePurchasePaid` (fragment `POST /api/webhooks/stripe`)

W handlerze `payment_intent.succeeded` rozgałęź po `pi.metadata.kind`:
```ts
if (pi.metadata?.kind === "COURSE_PURCHASE") await handleCoursePurchasePaid(pi);
```

```ts
async function handleCoursePurchasePaid(pi: Stripe.PaymentIntent) {
  const userId = pi.metadata?.userId;
  const courseId = pi.metadata?.courseId;
  if (!userId || !courseId) {
    console.warn("[stripe-webhook] COURSE_PURCHASE bez userId/courseId", pi.id);
    return;
  }

  // 1. Idempotentne NADANIE DOSTĘPU (webhook może przyjść wielokrotnie).
  await prisma.enrollment.upsert({
    where: { userId_courseId: { userId, courseId } },
    update: {}, create: { userId, courseId },
  });

  // 2. Utrwalenie zakupu (kwota + snapshot rozliczeniowy) — idempotentne po paymentIntentId.
  await prisma.coursePurchase.upsert({
    where: { paymentIntentId: pi.id },
    update: {},
    create: {
      userId, courseId, paymentIntentId: pi.id,
      amount: pi.amount_received ?? pi.amount ?? 0,   // GROSZE
      currency: pi.currency ?? "pln",
      buyerType: pi.metadata.buyerType ?? null,
      buyerName: pi.metadata.buyerName ?? null,
      buyerEmail: pi.metadata.buyerEmail ?? null,
      company: pi.metadata.company ?? null,
      nip: pi.metadata.nip ?? null,
      address: pi.metadata.address ?? null,
      postalCode: pi.metadata.postalCode ?? null,
      city: pi.metadata.city ?? null,
    },
  });

  // 3. (opcjonalnie) sync CRM/kontakt — best-effort.
  // 4. Telemetria (powiadomienie + live-feed) — best-effort: NIGDY nie rzucaj tu 500,
  //    inaczej Stripe ponawia event i dubluje powiadomienia. Dostęp jest już zapisany.
  try {
    const course = await prisma.course.findUnique({ where: { id: courseId }, select: { title: true, slug: true } });
    if (course) {
      await sendNotification({
        userId, title: "🎓 Dostęp do kursu odblokowany",
        message: `Masz już pełny dostęp do kursu „${course.title}".`,
        type: "PAYMENT", link: `/panel/vod/${course.slug}`, push: true,
      }).catch((e) => console.error("[webhook] notify error:", e));
    }
  } catch (err) {
    console.error("[webhook] COURSE_PURCHASE telemetry error:", err);
  }
}
```

> **Weryfikacja podpisu webhooka** (`stripe.webhooks.constructEvent` z
> `STRIPE_WEBHOOK_SECRET` i surowym body) obowiązuje w handlerze nadrzędnym —
> nie pomijaj jej.

### 7.3 Fallback na `/panel/vod` (trzecie miejsce nadania dostępu)

Po powrocie ze Stripe (`?zakup=sukces`, `payment_intent=...`) panel weryfikuje
PaymentIntent ze Stripe i **domyka Enrollment**, gdyby webhook się spóźnił:

```ts
// pseudo: w server-loaderze /panel/vod
const pi = await stripe.paymentIntents.retrieve(searchParams.payment_intent);
if (pi.status === "succeeded" && pi.metadata.kind === "COURSE_PURCHASE"
    && pi.metadata.userId === session.user.id) {
  await prisma.enrollment.upsert({
    where: { userId_courseId: { userId: pi.metadata.userId, courseId: pi.metadata.courseId } },
    update: {}, create: { userId: pi.metadata.userId, courseId: pi.metadata.courseId },
  });
  // (opcjonalnie) też recordCoursePurchase — nadal idempotentne po paymentIntentId
}
```

---

## 8. Zmienne środowiskowe

```
STRIPE_SECRET_KEY                     # serwer (create-payment-intent, webhook)
STRIPE_WEBHOOK_SECRET                 # weryfikacja podpisu webhooka
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY    # klient (Payment Element)
DATABASE_URL                          # Prisma/Postgres
NEXTAUTH_SECRET / NEXTAUTH_URL        # auth
```

Webhook Stripe skieruj na `POST /api/webhooks/stripe`, zdarzenie
`payment_intent.succeeded`.

---

## 9. Checklista wdrożenia w nowym projekcie

1. [ ] Zmapuj tokeny brandu (§1) na `tailwind.config` (`brand-primary/secondary/yellow`) + fonty.
2. [ ] Dodaj modele Prisma (§3): `Course`, `Enrollment`, `CoursePurchase` (+ moduły/lekcje/opinie jeśli potrzebne). `prisma db push`.
3. [ ] Zaimplementuj `lib/courses-db.ts` (5 funkcji z §3).
4. [ ] Katalog: `page.tsx` + `KursyHero` + `KursyCatalog` + `CourseCard` (§5).
5. [ ] Strona sprzedażowa `[slug]/page.tsx` z JSON-LD + świadomością `owned` (§6.1).
6. [ ] Checkout: `checkout/page.tsx` + `CheckoutClient` + `OrderSummary` + `StripePaymentStep` (§6).
7. [ ] API `create-payment-intent` (§7.1) — pamiętaj: cena w ZŁ w bazie → GROSZE dla Stripe (`* 100`).
8. [ ] Webhook `handleCoursePurchasePaid` (§7.2) + weryfikacja podpisu.
9. [ ] Fallback na stronie docelowej redirectu (§7.3).
10. [ ] Env (§8) + rejestracja webhooka w dashboardzie Stripe.
11. [ ] Test: kurs płatny (karta `4242…`, kod `00-000`), kurs darmowy, kurs już posiadany.

---

## 10. Pułapki (przeczytaj przed startem)

- **Dostęp = `Enrollment`, nie płatność.** Nadawany idempotentnie w **3 miejscach**
  (API-free / webhook / fallback). Każda zmiana logiki dostępu musi być spójna we
  wszystkich trzech — inaczej user zapłaci i nie dostanie dostępu (lub odwrotnie).
- **Cena w bazie w ZŁOTYCH (int), Stripe w GROSZACH.** Konwersja `Math.round(price * 100)`.
  `CoursePurchase.amount` trzymaj w groszach (`amount_received`).
- **Webhook nigdy nie może zwrócić 500 po nadaniu dostępu** — telemetria/powiadomienia
  są best-effort w `try/catch`, inaczej Stripe ponawia event i dubluje efekty uboczne.
- **Idempotencja zakupu po `paymentIntentId`** (`@unique`) — webhook i fallback mogą
  trafić ten sam PI; oba robią `upsert`.
- **Zakup wymaga logowania** — `userId` z sesji ląduje w `metadata` PI i to on
  decyduje o właścicielu dostępu (nie email z formularza — ten jest tylko do faktury).
- **`window.location.href`** (twardy reload) po sukcesie zamiast routera Next —
  celowe: odświeża sesję/enrollmenty na panelu. Traci SPA-nawigację, ale gwarantuje
  świeży stan dostępu.
- **Payment Element współdzielony** z innym modułem płatności (w oryginale: wydarzenia) —
  jeśli kopiujesz, wydziel go do wspólnego katalogu (`components/payments/`).
- **`return_url` musi być absolutny** (`${window.location.origin}/…`) — Stripe dokleja
  do niego `payment_intent` i `redirect_status`.
```
