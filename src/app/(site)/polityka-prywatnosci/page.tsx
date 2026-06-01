import type { Metadata } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "Polityka prywatności",
  description:
    "Zasady przetwarzania danych osobowych użytkowników platformy oraz informacje wymagane przez RODO.",
  alternates: { canonical: "/polityka-prywatnosci" },
};

export default async function PolitykaPrywatnosciPage() {
  const session = await getServerSession(authOptions);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#EBF9FA] to-white">
      <Navbar session={session} />

      <main className="flex-grow pt-32 pb-20">
        <article className="container max-w-[800px] mx-auto px-4 text-[#0B3B4C]">
          <header className="mb-10">
            <h1 className="font-jakarta font-extrabold text-[36px] md:text-[48px] leading-[110%] mb-4">
              Polityka prywatnoL�ci
            </h1>
            <p className="font-montserrat text-[14px] text-gray-500">
              Ostatnia aktualizacja: 21 maja 2026
            </p>
          </header>

          <div className="prose-content flex flex-col gap-8 font-montserrat text-[15px] leading-[170%] text-[#0B3B4C]/90">
            <section>
              <h2 className="font-jakarta font-bold text-[22px] md:text-[26px] mb-3 text-[#0B3B4C]">
                1. Administrator danych
              </h2>
              <p>
                Administratorem Twoich danych osobowych jest Rehability, z
                siedzibą w Polsce. Kontakt w sprawach związanych z ochroną
                danych:{" "}
                <a
                  href="mailto:kontakt@rehability.pl"
                  className="font-bold text-[#287D88] hover:underline"
                >
                  kontakt@rehability.pl
                </a>
                .
              </p>
            </section>

            <section>
              <h2 className="font-jakarta font-bold text-[22px] md:text-[26px] mb-3 text-[#0B3B4C]">
                2. Zakres przetwarzanych danych
              </h2>
              <p>
                Przetwarzamy dane podane przy rejestracji (imię, nazwisko, adres
                e-mail, awatar z dostawcy logowania), dane wynikające z
                aktywnoL�ci na platformie (zakupy, postępy w kursach VOD,
                rezerwacje wyjazdów) oraz dane techniczne (adres IP, cookies,
                identyfikatory urządzenia) niezbędne do zapewnienia
                bezpieczeL�stwa i prawidL�owego dziaL�ania usL�ugi.
              </p>
            </section>

            <section>
              <h2 className="font-jakarta font-bold text-[22px] md:text-[26px] mb-3 text-[#0B3B4C]">
                3. Cele i podstawa prawna
              </h2>
              <ul className="list-disc pl-6 flex flex-col gap-2">
                <li>
                  L�wiadczenie usL�ug platformy (art. 6 ust. 1 lit. b RODO).
                </li>
                <li>
                  Realizacja obowiązkAlw prawnych, w tym księgowych (art. 6 ust.
                  1 lit. c RODO).
                </li>
                <li>
                  Marketing wL�asnych usL�ug w oparciu o prawnie uzasadniony
                  interes (art. 6 ust. 1 lit. f RODO).
                </li>
                <li>
                  Komunikacja marketingowa na podstawie udzielonej zgody (art. 6
                  ust. 1 lit. a RODO).
                </li>
              </ul>
            </section>

            <section>
              <h2 className="font-jakarta font-bold text-[22px] md:text-[26px] mb-3 text-[#0B3B4C]">
                4. Logowanie przez Google
              </h2>
              <p>
                Korzystając z opcji logowania przez Google przekazujesz nam
                jedynie minimalny zakres danych potrzebny do uwierzytelnienia:
                imię i nazwisko, adres e-mail oraz zdjęcie profilowe. Nie
                otrzymujemy dostępu do Twojego konta Google poza tym zakresem.
              </p>
            </section>

            <section>
              <h2 className="font-jakarta font-bold text-[22px] md:text-[26px] mb-3 text-[#0B3B4C]">
                5. Okres przechowywania
              </h2>
              <p>
                Dane konta przechowujemy przez okres aktywnoL�ci konta oraz
                przez czas wymagany przepisami (np. dla rozliczeL� księgowych —
                5 lat od koL�ca roku obrachunkowego).
              </p>
            </section>

            <section>
              <h2 className="font-jakarta font-bold text-[22px] md:text-[26px] mb-3 text-[#0B3B4C]">
                6. Twoje prawa
              </h2>
              <p>
                Masz prawo do dostępu, sprostowania, usunięcia, ograniczenia
                przetwarzania, przenoszenia danych, sprzeciwu, a takLLe
                wniesienia skargi do Prezesa Urzędu Ochrony Danych Osobowych
                (ul. Stawki 2, 00-193 Warszawa).
              </p>
            </section>

            <section>
              <h2 className="font-jakarta font-bold text-[22px] md:text-[26px] mb-3 text-[#0B3B4C]">
                7. Pliki cookies
              </h2>
              <p>
                Strona uLLywa cookies technicznych (niezbędnych do dziaL�ania)
                oraz analitycznych. Zarządzanie zgodami odbywa się przez baner
                zgody dostępny na dole ekranu.
              </p>
            </section>

            <section>
              <h2 className="font-jakarta font-bold text-[22px] md:text-[26px] mb-3 text-[#0B3B4C]">
                8. Zmiany polityki
              </h2>
              <p>
                Niniejszą politykę moLLemy aktualizować. O istotnych zmianach
                poinformujemy z wyprzedzeniem przez e-mail lub komunikat w
                panelu uLLytkownika.
              </p>
            </section>
          </div>
        </article>
      </main>

      <Footer />
    </div>
  );
}
