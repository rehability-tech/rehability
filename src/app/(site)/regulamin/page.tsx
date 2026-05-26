import type { Metadata } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "Regulamin | Rehability",
  description:
    "Regulamin świadczenia usług drogą elektroniczną przez platformę Rehability — kursy VOD, wyjazdy, gabinet.",
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
                §1. Postanowienia ogAllne
              </h2>
              <p>
                Niniejszy regulamin okreL�la zasady korzystania z platformy
                Rehability, dostępnej online, w tym z kursAlw VOD, rezerwacji
                campAlw oraz funkcji panelu kursanta. Akceptacja regulaminu jest
                warunkiem zaL�oLLenia konta.
              </p>
            </section>

            <section>
              <h2 className="font-jakarta font-bold text-[22px] md:text-[26px] mb-3 text-[#0B3B4C]">
                §2. Definicje
              </h2>
              <ul className="list-disc pl-6 flex flex-col gap-2">
                <li>
                  <strong>UsL�ugodawca</strong> — Rehability, operator
                  platformy.
                </li>
                <li>
                  <strong>ULLytkownik</strong> — osoba fizyczna posiadająca
                  konto w platformie.
                </li>
                <li>
                  <strong>Kurs VOD</strong> — materiaL� wideo udostępniany w
                  panelu kursanta po opL�aceniu dostępu.
                </li>
                <li>
                  <strong>Wyjazd</strong> — stacjonarne wydarzenie zdrowotne
                  organizowane przez UsL�ugodawcę.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="font-jakarta font-bold text-[22px] md:text-[26px] mb-3 text-[#0B3B4C]">
                §3. Rejestracja konta
              </h2>
              <p>
                Konto zakL�ada się przez logowanie z dostawcą zewnętrznym
                (Google). ULLytkownik zobowiązuje się do podania prawdziwych
                danych oraz nieudostępniania konta osobom trzecim.
              </p>
            </section>

            <section>
              <h2 className="font-jakarta font-bold text-[22px] md:text-[26px] mb-3 text-[#0B3B4C]">
                §4. PL�atnoL�ci
              </h2>
              <p>
                PL�atnoL�ci obsL�ugiwane są przez operatorAlw pL�atnoL�ci
                wskazanych w procesie zakupu. Po zaksięgowaniu wpL�aty dostęp do
                zakupionego zasobu jest aktywowany niezwL�ocznie w panelu
                kursanta.
              </p>
            </section>

            <section>
              <h2 className="font-jakarta font-bold text-[22px] md:text-[26px] mb-3 text-[#0B3B4C]">
                §5. Prawo odstąpienia
              </h2>
              <p>
                Konsument ma prawo odstąpić od umowy zawartej na odlegL�oL�ć w
                terminie 14 dni bez podania przyczyny. Prawo to nie przysL�uguje
                w przypadku treL�ci cyfrowych, do ktAlrych dostęp zostaL�
                udostępniony przed upL�ywem tego terminu po wyraLsnej zgodzie
                konsumenta (art. 38 ust. 13 ustawy o prawach konsumenta).
              </p>
            </section>

            <section>
              <h2 className="font-jakarta font-bold text-[22px] md:text-[26px] mb-3 text-[#0B3B4C]">
                §6. Reklamacje
              </h2>
              <p>
                Reklamacje naleLLy zgL�aszać na adres{" "}
                <a
                  href="mailto:kontakt@rehability.pl"
                  className="font-bold text-[#287D88] hover:underline"
                >
                  kontakt@rehability.pl
                </a>
                . UsL�ugodawca rozpatruje reklamację w terminie 14 dni roboczych
                od jej otrzymania.
              </p>
            </section>

            <section>
              <h2 className="font-jakarta font-bold text-[22px] md:text-[26px] mb-3 text-[#0B3B4C]">
                §7. Prawa autorskie
              </h2>
              <p>
                Wszelkie materiaL�y udostępniane w ramach kursAlw VOD są objęte
                prawem autorskim. Zabrania się ich kopiowania, rozpowszechniania
                ani udostępniania osobom trzecim bez zgody UsL�ugodawcy.
              </p>
            </section>

            <section>
              <h2 className="font-jakarta font-bold text-[22px] md:text-[26px] mb-3 text-[#0B3B4C]">
                §8. Postanowienia koL�cowe
              </h2>
              <p>
                W sprawach nieuregulowanych zastosowanie mają przepisy prawa
                polskiego, w szczegAllnoL�ci Kodeksu cywilnego i ustawy o
                prawach konsumenta. Spory rozstrzygane są przez wL�aL�ciwy sąd
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
