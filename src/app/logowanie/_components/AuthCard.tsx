"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, GoogleLogo } from "@phosphor-icons/react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
// DODANO: Import funkcji signIn z next-auth/react
import { signIn } from "next-auth/react";
import { MOCK_ACCOUNTS } from "@/lib/auth/mockAccounts";

type AuthMode = "login" | "register";

const IS_DEV = process.env.NODE_ENV === "development";

export default function AuthCard() {
  const [mode, setMode] = useState<AuthMode>("login"); // Domyślnie logowanie (biała karta po lewej)
  const [isAccepted, setIsAccepted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDesktop, setIsDesktop] = useState(false);
  const [mockEmail, setMockEmail] = useState(MOCK_ACCOUNTS[0].email);
  const [isMockLoading, setIsMockLoading] = useState(false);

  // Detekcja viewportu — tylko md+ animuje "sliding panel". Na mobile karta jest statyczna w flow.
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const apply = () => setIsDesktop(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  // DODANO: Automatyczny scroll do karty po wejściu na stronę
  useEffect(() => {
    // Krótkie opóźnienie upewnia się, że strona w pełni się wyrenderowała
    const timer = setTimeout(() => {
      const mainElement = document.getElementById("auth-main");
      if (mainElement) {
        mainElement.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Prawdziwa logika logowania
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
      await signIn("google", { callbackUrl: "/panel" });
    } catch (err) {
      console.error("Błąd autentykacji:", err);
      setError("Wystąpił błąd komunikacji z Google. Spróbuj ponownie.");
      setIsLoading(false); // Wyłączamy ładowanie tylko w przypadku błędu
    }
  };

  const handleMockLogin = async () => {
    setError(null);
    try {
      setIsMockLoading(true);
      await signIn("dev-mock", {
        email: mockEmail,
        callbackUrl: "/panel",
      });
    } catch (err) {
      console.error("Mock login error:", err);
      setError("Nie udało się zalogować jako mock user.");
      setIsMockLoading(false);
    }
  };

  const isRegister = mode === "register";

  return (
    <div className="w-full flex flex-col items-center justify-center gap-6 p-4 md:p-0">
      {/* GŁÓWNY KONTENER (MORSKIE TŁO)
          Mobile: działa jak padding dla białej karty, z zachowanym backgroundem.
          Desktop: side-by-side z przesuwającą się białą kartą. */}
      <div className="relative font-montserrat bg-[#76ADB6] w-full max-w-[900px] mx-auto rounded-[40px] md:rounded-[56px] shadow-2xl z-10 flex items-center justify-center md:items-stretch md:justify-start md:flex-row p-3 sm:p-4 md:p-0 overflow-hidden md:h-[475px]">
        {/* DEKORACYJNE LOGO – MOBILE (wycentrowane za białą kartą) */}
        <img
          src="/logotypy/logo-sygnet.svg"
          alt=""
          aria-hidden="true"
          width={340}
          height={340}
          className="md:hidden absolute inset-0 m-auto w-[340px] h-[340px] opacity-30 pointer-events-none z-0"
        />

        {/* DEKORACYJNE LOGO W TLE (LEWA STRONA) — ukryte na mobile */}
        <img
          src="/logotypy/logo-sygnet.svg"
          alt=""
          aria-hidden="true"
          width={400}
          height={450}
          className="hidden md:block absolute -bottom-42 -left-18 w-[400px] h-[450px] pointer-events-none z-0"
        />

        {/* DEKORACYJNE LOGO W TLE (PRAWA STRONA) — ukryte na mobile */}
        <img
          src="/logotypy/logo-sygnet.svg"
          alt=""
          aria-hidden="true"
          width={400}
          height={450}
          className="hidden md:block absolute -bottom-42 -right-18 w-[400px] h-[450px] pointer-events-none z-0"
        />

        {/* ========================================================= */}
        {/* WARSTWA TEKSTOWA W TLE (LEWA I PRAWA STRONA — tylko md+)  */}
        {/* ========================================================= */}

        {/* Lewa strona tła */}
        <div className="hidden md:flex w-1/2 h-full flex-col justify-center items-center text-center text-white z-10 select-none">
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
            <Button
              onClick={() => setMode("login")}
              className="bg-white text-[#76ADB6] font-montserrat font-semibold hover:bg-white active:scale-95 transition-transform"
            >
              Zaloguj się
            </Button>
          </motion.div>
        </div>

        {/* Prawa strona tła */}
        <div className="hidden md:flex w-1/2 h-full flex-col justify-center items-center text-center text-white z-10 select-none">
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
        {/* PRZESUWAJĄCA SIĘ BIAŁA KARTA (md+) / Statyczna karta (mobile) */}
        {/* ========================================================= */}
        <motion.div
          className="relative md:absolute md:top-0 w-full md:w-1/2 md:max-w-none md:h-full bg-white z-20 shadow-xl overflow-hidden flex flex-col justify-center items-center rounded-[40px] md:rounded-[56px] py-8 md:py-0"
          animate={isDesktop ? { left: isRegister ? "50%" : "0%" } : undefined}
          transition={{ type: "spring", stiffness: 280, damping: 30 }}
        >
          <AnimatePresence mode="wait">
            {isRegister ? (
              // --- FORMULARZ REJESTRACJI ---
              <motion.div
                key="register-form"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                className="flex flex-col gap-5 justify-center px-6 md:p-12 items-center text-center w-full text-[#0B3B4C]"
              >
                <h2 className="font-jakarta font-extrabold text-[28px] md:text-[36px] leading-[110%]">
                  Zarejestruj się
                </h2>
                <p className="font-montserrat text-[15px] text-gray-500 leading-[150%] max-w-[280px] md:max-w-full mx-auto">
                  Wybierz metodę rejestracji, aby przejść do panelu
                </p>

                <Button
                  onClick={handleGoogleAuth}
                  isLoading={isLoading}
                  leftIcon={<GoogleLogo size={24} weight="bold" />}
                  className="w-full max-w-[280px]"
                >
                  Rejestracja przez Google
                </Button>

                {error && (
                  <p className="text-red-500 text-xs font-medium">{error}</p>
                )}

                {/* CUSTOMOWY CHECKBOX */}
                <div className="flex items-start gap-3 mt-2 max-w-[280px] md:max-w-full text-left">
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
                    className="font-montserrat text-[12px] text-gray-500 leading-[150%] cursor-pointer select-none"
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
                className="flex flex-col gap-6 justify-center px-6 md:p-0 items-center text-center w-full text-[#0B3B4C]"
              >
                <h2 className="font-jakarta font-extrabold text-[28px] md:text-[36px] leading-[110%]">
                  Zaloguj się
                </h2>
                <p className="font-montserrat text-[15px] text-gray-500 leading-[150%] max-w-[280px] md:max-w-full mx-auto px-3 -mt-4">
                  Wybierz metodę logowania, aby przejść do panelu
                </p>

                <Button
                  onClick={handleGoogleAuth}
                  isLoading={isLoading}
                  leftIcon={<GoogleLogo size={24} weight="bold" />}
                  className="w-full max-w-[280px]"
                >
                  Logowanie przez Google
                </Button>

                {error && (
                  <p className="text-red-500 text-xs font-medium">{error}</p>
                )}

                <p className="font-montserrat text-[12px] text-gray-500 leading-[150%] max-w-[280px] md:max-w-[320px] mx-auto">
                  Logując się, akceptujesz{" "}
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
                  </Link>
                  .
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* MOBILE-ONLY: przełącznik trybu */}
          <div className="md:hidden flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 mt-6">
            <span className="font-montserrat text-[13px] text-gray-500">
              {isRegister ? "Masz już konto?" : "Nie masz jeszcze konta?"}
            </span>
            <button
              type="button"
              onClick={() => setMode(isRegister ? "login" : "register")}
              className="font-montserrat text-[13px] font-bold text-[#76ADB6] hover:underline focus-visible:outline-none"
            >
              {isRegister ? "Zaloguj się" : "Zarejestruj się"}
            </button>
          </div>
        </motion.div>
      </div>

      {/* ========================================================= */}
      {/* DEV-ONLY: Mock Login Panel (omija OAuth lokalnie)         */}
      {/* ========================================================= */}
      {IS_DEV && (
        <div className="w-full max-w-[900px] mx-auto bg-yellow-50 border-2 border-dashed border-yellow-400 rounded-2xl p-4 md:p-6 shadow-lg z-10">
          <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
            <div className="flex flex-col">
              <span className="font-montserrat font-bold text-[14px] text-[#0B3B4C]">
                🛠️ DEV: Mock Login
              </span>
              <span className="font-montserrat text-[12px] text-gray-600">
                Widoczne tylko w trybie development.
              </span>
            </div>

            <select
              value={mockEmail}
              onChange={(e) => setMockEmail(e.target.value)}
              disabled={isMockLoading}
              className="flex-1 font-montserrat text-[13px] px-3 py-2 rounded-lg border border-yellow-400 bg-white text-[#0B3B4C] focus:outline-none focus:ring-2 focus:ring-yellow-400"
            >
              {MOCK_ACCOUNTS.map((acc) => (
                <option key={acc.email} value={acc.email}>
                  {acc.label}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={handleMockLogin}
              disabled={isMockLoading}
              className="font-montserrat font-semibold text-[13px] px-4 py-2 rounded-lg bg-[#0B3B4C] text-white hover:bg-[#76ADB6] transition-colors disabled:opacity-60"
            >
              {isMockLoading ? "Logowanie..." : "Zaloguj jako mock"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
