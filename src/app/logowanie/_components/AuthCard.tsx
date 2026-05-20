"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, GoogleLogo } from "@phosphor-icons/react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
// DODANO: Import funkcji signIn z next-auth/react
import { signIn } from "next-auth/react";

type AuthMode = "login" | "register";

export default function AuthCard() {
  const [mode, setMode] = useState<AuthMode>("register"); // Domyślnie rejestracja (biała karta po prawej)
  const [isAccepted, setIsAccepted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // DODANO: Prawdziwa logika logowania
  const handleGoogleAuth = async () => {
    setError(null);

    // Walidacja tylko w trybie rejestracji
    if (mode === "register" && !isAccepted) {
      setError("Proszę zaakceptować politykę prywatności i regulamin.");
      return;
    }

    try {
      setIsLoading(true);
      // Uruchomienie logowania przez Google.
      // callbackUrl wskazuje, gdzie użytkownik ma zostać przekierowany po udanym logowaniu.
      // Zmień "/panel-kursanta" na ścieżkę, która u Ciebie pasuje.
      await signIn("google", { callbackUrl: "/panel-kursanta" });
    } catch (err) {
      console.error("Błąd autentykacji:", err);
      setError("Wystąpił błąd komunikacji z Google. Spróbuj ponownie.");
      setIsLoading(false); // Wyłączamy ładowanie tylko w przypadku błędu
    }
  };

  const isRegister = mode === "register";

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      {/* GŁÓWNY KONTENER (MORSKIE TŁO) */}
      <div className="relative font-montserrat h-[475px] bg-[#76ADB6] w-[900px] mx-auto rounded-[56px] overflow-hidden shadow-2xl z-10 flex">
        {/* DEKORACYJNE LOGO W TLE (LEWA STRONA) */}
        <img
          src="/logotypy/logo-sygnet.svg"
          alt=""
          aria-hidden="true"
          className="absolute -bottom-42 -left-18 w-[400px] h-[450px] pointer-events-none z-0"
        />

        {/* DEKORACYJNE LOGO W TLE (PRAWA STRONA) */}
        <img
          src="/logotypy/logo-sygnet.svg"
          alt=""
          aria-hidden="true"
          className="absolute -bottom-42 -right-18 w-[400px] h-[450px] pointer-events-none z-0"
        />

        {/* ========================================================= */}
        {/* WARSTWA TEKSTOWA W TLE (LEWA I PRAWA STRONA)             */}
        {/* ========================================================= */}

        {/* Lewa strona tła (Widoczna, gdy biała karta jest po prawej) */}
        <div className="w-1/2 h-full flex flex-col justify-center items-center text-center text-white z-10 select-none">
          <motion.div
            animate={{
              opacity: isRegister ? 1 : 0,
              scale: isRegister ? 1 : 0.9,
            }}
            transition={{ duration: 0.5, ease: [0.25, 1, 0.5, 1] }}
            className="flex flex-col gap-6 items-center"
          >
            <h2 className="font-montserrat font-bold text-[32px] leading-[110%]">
              Witamy w Rehability
            </h2>
            <p className="font-montserrat text-base text-white/80 leading-[170%] -mt-4">
              Masz już konto?
            </p>
            {/* Przycisk przełączający bez hovera */}
            <Button
              onClick={() => setMode("login")}
              className="bg-white text-[#76ADB6] font-montserrat font-semibold hover:bg-white active:scale-95 transition-transform"
            >
              Zaloguj się
            </Button>
          </motion.div>
        </div>

        {/* Prawa strona tła (Widoczna, gdy biała karta jest po lewej) */}
        <div className="w-1/2 h-full flex flex-col justify-center items-center text-center text-white z-10 select-none">
          <motion.div
            animate={{
              opacity: !isRegister ? 1 : 0,
              scale: !isRegister ? 1 : 0.9,
            }}
            transition={{ duration: 0.5, ease: [0.25, 1, 0.5, 1] }}
            className="flex flex-col gap-6 items-center"
          >
            <h2 className="font-montserrat font-bold text-[32px] leading-[110%]">
              Nowy w Rehability?
            </h2>
            <p className="font-montserrat text-base text-white/80 leading-[170%] -mt-4">
              Stwórz konto i dołącz do nas!
            </p>
            <Button
              onClick={() => setMode("register")}
              className="bg-white text-[#76ADB6] font-montserrat font-semibold hover:bg-white active:scale-95 transition-transform"
            >
              Zarejestruj się
            </Button>
          </motion.div>
        </div>

        {/* ========================================================= */}
        {/* PRZESUWAJĄCA SIĘ BIAŁA KARTA (SLIDING PANEL)             */}
        {/* ========================================================= */}
        <motion.div
          className="absolute top-0 h-full w-1/2 bg-white z-20 shadow-xl overflow-hidden flex flex-col justify-center items-center "
          animate={{
            left: isRegister ? "50%" : "0%",
            borderRadius: isRegister
              ? "50px 56px 56px 50px"
              : "56px 50px 50px 56px",
          }}
          transition={{ type: "spring", stiffness: 280, damping: 30 }}
        >
          {/* AnimatePresence zapewnia płynne przenikanie się formularzy wewnątrz karty */}
          <AnimatePresence mode="wait">
            {isRegister ? (
              // --- FORMULARZ REJESTRACJI ---
              <motion.div
                key="register-form"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                className="flex flex-col gap-5 justify-center p-12 items-center text-center w-full text-[#0B3B4C]"
              >
                <h2 className="font-jakarta font-extrabold text-[36px] leading-[110%]">
                  Zarejestruj się
                </h2>
                <p className="font-montserrat text-[15px] text-gray-500 leading-[150%] max-w-full">
                  Wybierz metodę rejestracji, aby przejść do panelu kursanta
                </p>

                <Button
                  onClick={handleGoogleAuth}
                  isLoading={isLoading}
                  leftIcon={<GoogleLogo size={24} weight="bold" />}
                >
                  Zarejestruj się przez Google
                </Button>

                {error && (
                  <p className="text-red-500 text-xs font-medium">{error}</p>
                )}

                {/* CUSTOMOWY CHECKBOX */}
                <div className="flex items-start gap-3 mt-2 max-w-full">
                  <div className="relative flex items-center shrink-0 mt-0.5">
                    <input
                      type="checkbox"
                      id="register-terms"
                      checked={isAccepted}
                      onChange={(e) => setIsAccepted(e.target.checked)}
                      className="peer absolute w-5 h-5 opacity-0 z-10 cursor-pointer"
                    />
                    <div className="w-[18px] h-[18px] rounded-[6px] border-2 border-gray-300 peer-checked:bg-[#76ADB6] peer-checked:border-[#76ADB6] flex items-center justify-center transition-colors pointer-events-none z-0">
                      <div
                        className={`text-white transition-all duration-200 flex items-center justify-center ${isAccepted ? "opacity-100 scale-100" : "opacity-0 scale-75"}`}
                      >
                        <Check size={14} weight="bold" />
                      </div>
                    </div>
                  </div>

                  <label
                    htmlFor="register-terms"
                    className="font-montserrat text-[12px] text-gray-500 leading-[150%] text-left cursor-pointer select-none"
                  >
                    Akceptuję{" "}
                    <Link
                      href="/polityka-prywatnosci"
                      className="font-bold text-[#0B3B4C] hover:text-[#76ADB6] transition-colors"
                    >
                      politykę prywatności
                    </Link>{" "}
                    oraz{" "}
                    <Link
                      href="/regulamin"
                      className="font-bold text-[#0B3B4C] hover:text-[#76ADB6] transition-colors"
                    >
                      regulamin
                    </Link>{" "}
                    korzystania z platformy
                  </label>
                </div>
              </motion.div>
            ) : (
              // --- FORMULARZ LOGOWANIA ---
              <motion.div
                key="login-form"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.25 }}
                className="flex flex-col gap-6 justify-center items-center text-center w-full text-[#0B3B4C]"
              >
                <h2 className="font-jakarta font-extrabold text-[36px] leading-[110%]">
                  Zaloguj się
                </h2>
                <p className="font-montserrat text-[15px] text-gray-500 leading-[150%] max-w-full px-3 -mt-4">
                  Wybierz metodę logowania, aby przejść do panelu kursanta
                </p>

                <Button
                  onClick={handleGoogleAuth}
                  isLoading={isLoading}
                  leftIcon={<GoogleLogo size={24} weight="bold" />}
                >
                  Zaloguj się przez Google
                </Button>

                {error && (
                  <p className="text-red-500 text-xs font-medium">{error}</p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </main>
  );
}
