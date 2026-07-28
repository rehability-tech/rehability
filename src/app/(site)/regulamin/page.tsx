import type { Metadata } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "Regulamin",
  description:
    "Regulamin świadczenia usług drogą elektroniczną — kursy VOD, wydarzenia holistyczne, gabinet fizjoterapeutyczny.",
  alternates: { canonical: "/regulamin" },
};

export default async function RegulaminPage() {
  const session = await getServerSession(authOptions);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#EBF9FA] to-white">
      <Navbar session={session} />

      <main className="flex-grow pt-32 pb-20">
        <article className="container max-w-[800px] mx-auto px-4 text-[#0B3B4C]">
          <header className="mb-10">
            <h1 className="font-jakarta font-extrabold text-[36px] md:text-[48px] leading-[110%] mb-4">
              Regulamin platformy
            </h1>
            <p className="font-montserrat text-[14px] text-gray-500">
              Obowiązuje od: 21 maja 2026
            </p>
          </header>

          <div className="prose-content flex flex-col gap-8 font-montserrat text-[15px] leading-[170%] text-[#0B3B4C]/90">
            <section>
              <h2 className="font-jakarta font-bold text-[22px] md:text-[26px] mb-3 text-[#0B3B4C]">
                §1. Postanowienia ogólne
              </h2>
              <p>
                Niniejszy regulamin określa zasady korzystania z platformy
                Rehability, dostępnej online, w tym z kursów VOD, rezerwacji
                wydarzeń oraz funkcji panelu kursanta. Akceptacja regulaminu jest
                warunkiem założenia konta.
              </p>
            </section>

            <section>
              <h2 className="font-jakarta font-bold text-[22px] md:text-[26px] mb-3 text-[#0B3B4C]">
                §2. Definicje
              </h2>
              <ul className="list-disc pl-6 flex flex-col gap-2">
                <li>
                  <strong>Usługodawca</strong> — Rehability, operator
                  platformy.
                </li>
                <li>
                  <strong>Użytkownik</strong> — osoba fizyczna posiadająca
                  konto w platformie.
                </li>
                <li>
                  <strong>Kurs VOD</strong> — materiał wideo udostępniany w
                  panelu kursanta po opłaceniu dostępu.
                </li>
                <li>
                  <strong>Wydarzenie</strong> — stacjonarne spotkanie zdrowotne
                  (np. weekend regeneracyjny, warsztaty) organizowane przez
                  Usługodawcę.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="font-jakarta font-bold text-[22px] md:text-[26px] mb-3 text-[#0B3B4C]">
                §3. Rejestracja konta
              </h2>
              <p>
                Konto zakłada się przez logowanie z dostawcą zewnętrznym
                (Google). Użytkownik zobowiązuje się do podania prawdziwych
                danych oraz nieudostępniania konta osobom trzecim.
              </p>
            </section>

            <section>
              <h2 className="font-jakarta font-bold text-[22px] md:text-[26px] mb-3 text-[#0B3B4C]">
                §4. Płatności
              </h2>
              <p>
                Płatności obsługiwane są przez operatorów płatności
                wskazanych w procesie zakupu. Po zaksięgowaniu wpłaty dostęp do
                zakupionego zasobu jest aktywowany niezwłocznie w panelu
                kursanta.
              </p>
            </section>

            <section>
              <h2 className="font-jakarta font-bold text-[22px] md:text-[26px] mb-3 text-[#0B3B4C]">
                §5. Prawo odstąpienia
              </h2>
              <p>
                Konsument ma prawo odstąpić od umowy zawartej na odległość w
                terminie 14 dni bez podania przyczyny. Prawo to nie przysługuje
                w przypadku treści cyfrowych, do których dostęp został
                udostępniony przed upływem tego terminu po wyraźnej zgodzie
                konsumenta (art. 38 ust. 13 ustawy o prawach konsumenta).
              </p>
            </section>

            <section>
              <h2 className="font-jakarta font-bold text-[22px] md:text-[26px] mb-3 text-[#0B3B4C]">
                §6. Reklamacje
              </h2>
              <p>
                Reklamacje należy zgłaszać na adres{" "}
                <a
                  href="mailto:biuro@kocikdev.com"
                  className="font-bold text-[#287D88] hover:underline"
                >
                  biuro@kocikdev.com
                </a>
                . Usługodawca rozpatruje reklamację w terminie 14 dni roboczych
                od jej otrzymania.
              </p>
            </section>

            <section>
              <h2 className="font-jakarta font-bold text-[22px] md:text-[26px] mb-3 text-[#0B3B4C]">
                §7. Prawa autorskie
              </h2>
              <p>
                Wszelkie materiały udostępniane w ramach kursów VOD są objęte
                prawem autorskim. Zabrania się ich kopiowania, rozpowszechniania
                ani udostępniania osobom trzecim bez zgody Usługodawcy.
              </p>
            </section>

            <section>
              <h2 className="font-jakarta font-bold text-[22px] md:text-[26px] mb-3 text-[#0B3B4C]">
                §8. Postanowienia końcowe
              </h2>
              <p>
                W sprawach nieuregulowanych zastosowanie mają przepisy prawa
                polskiego, w szczególności Kodeksu cywilnego i ustawy o
                prawach konsumenta. Spory rozstrzygane są przez właściwy sąd
                powszechny.
              </p>
            </section>
          </div>
        </article>
      </main>

      <Footer />
    </div>
  );
}
