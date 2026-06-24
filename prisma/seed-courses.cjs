/* Seed: 5 przykładowych kursów VOD do bazy. Idempotentny (usuwa po slug i tworzy na nowo). */
const { PrismaClient } = require("../src/generated/prisma");
const prisma = new PrismaClient();

const mod = (title, order, lessons) => ({
  title,
  order,
  lessons: {
    create: lessons.map((t, i) => ({ title: t, order: i, video: null })),
  },
});

const COURSES = [
  {
    slug: "zdrowy-silny-kregoslup",
    title: "Zdrowy i silny kręgosłup: Program ratunkowy w bólu lędźwi",
    category: "Fizjoterapia",
    excerpt:
      "Specjalistyczny plan, który krok po kroku wyprowadzi Cię z ostrego bólu lędźwiowego i przywróci stabilność kręgosłupa.",
    price: 149,
    durationMin: 120,
    format: "sections",
    image: "/images/kursy/kurs-1.png",
    modules: [
      mod("Moduł 1 · Wprowadzenie", 0, [
        "Jak korzystać z programu",
        "Autodiagnoza — od czego zacząć",
        "Zasady bezpiecznego ćwiczenia w domu",
      ]),
      mod("Moduł 2 · Faza ostra", 1, [
        "Pozycje odciążające kręgosłup",
        "Delikatna mobilizacja lędźwi",
        "Oddech i rozluźnianie napięcia",
      ]),
      mod("Moduł 3 · Stabilizacja", 2, [
        "Aktywacja mięśni głębokich",
        "Ćwiczenia stabilizujące krok po kroku",
        "Plan na cały tydzień",
      ]),
    ],
  },
  {
    slug: "ergonomia-pracy",
    title: "Ergonomia pracy i zdrowa postawa za biurkiem",
    category: "Prewencja",
    excerpt:
      "Naucz się ustawiać stanowisko pracy i ciało tak, by długie godziny przy biurku przestały generować ból i napięcia.",
    price: 119,
    durationMin: 90,
    format: "sections",
    image: "/images/kursy/kurs-2.png",
    modules: [
      mod("Moduł 1 · Stanowisko pracy", 0, [
        "Ustawienie monitora i krzesła",
        "Pozycja dłoni, nadgarstków i stóp",
      ]),
      mod("Moduł 2 · Mikroprzerwy", 1, [
        "Rozciąganie karku i barków",
        "Ćwiczenia na nadgarstki",
        "Reset postawy w 3 minuty",
      ]),
    ],
  },
  {
    slug: "lifting-twarzy-kobido",
    title: "Naturalny lifting twarzy: Podstawy automasażu Kobido",
    category: "Automasaż",
    excerpt:
      'Poznaj sekrety japońskiego „liftingu bez skalpela" — techniki, które ujędrniają owal twarzy i przywracają skórze blask.',
    price: 169,
    durationMin: 60,
    format: "sections",
    image: "/images/kursy/kurs-3.png",
    modules: [
      mod("Moduł 1 · Przygotowanie", 0, [
        "Higiena i olejki do masażu",
        "Mapa napięć twarzy",
      ]),
      mod("Moduł 2 · Techniki Kobido", 1, [
        "Rozluźnianie żuchwy",
        "Ujędrnianie owalu twarzy",
        "Drenaż limfatyczny",
      ]),
      mod("Moduł 3 · Rytuał", 2, ["Wieczorny rytuał 10 minut"]),
    ],
  },
  {
    slug: "wieczorny-reset",
    title: "Wieczorny reset: Rozluźnianie ciała przed snem",
    category: "Relaks i stres",
    excerpt:
      "Zestaw delikatnych technik, które wyciszają układ nerwowy i przygotowują ciało do głębokiego, regenerującego snu.",
    price: 99,
    durationMin: 75,
    format: "sections",
    image: "/images/kursy/kurs-4.png",
    modules: [
      mod("Moduł 1 · Wyciszenie", 0, [
        "Oddech przeponowy",
        "Rozluźnianie karku i barków",
      ]),
      mod("Moduł 2 · Ciało przed snem", 1, [
        "Delikatne rozciąganie bioder",
        "Pozycje regeneracyjne",
        "Skanowanie ciała",
      ]),
    ],
  },
  {
    slug: "mobilnosc-na-co-dzien",
    title: "Mobilność na co dzień: Płynność ruchu w stawach",
    category: "Mobilność",
    excerpt:
      "Codzienna dawka mobilności, dzięki której odzyskasz płynność ruchu i swobodę w stawach.",
    price: 129,
    durationMin: 45,
    format: "single",
    image: "/images/kursy/kurs-5.png",
    modules: [],
  },
];

async function main() {
  for (const c of COURSES) {
    await prisma.course.deleteMany({ where: { slug: c.slug } });
    const { modules, ...data } = c;
    await prisma.course.create({
      data: {
        ...data,
        status: "PUBLISHED",
        ...(modules.length ? { modules: { create: modules } } : {}),
      },
    });
    console.log("✓", c.slug);
  }
  const total = await prisma.course.count();
  console.log("Łącznie kursów w bazie:", total);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
