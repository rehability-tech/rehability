"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  DownloadSimple,
  X,
  Export,
  PlusSquare,
} from "@phosphor-icons/react/dist/ssr";
import { isStandalone, isIOS, isMobileDevice } from "@/lib/pwa/clientEnv";
import { PWA_INSTALL_EVENT } from "@/lib/pwa/triggers";

// ── Kadencja (delikatna): pytamy po 1. logowaniu, potem +3 dni, +7 dni, max 3× ──
const OPTOUT_KEY = "pwa_install_optout"; // twarde "Nie, dziękuję"
const ASKS_KEY = "pwa_install_asks"; // liczba pokazań zakończonych snooze
const SNOOZE_KEY = "pwa_install_snooze_until"; // timestamp — nie pokazuj wcześniej
const MAX_ASKS = 3;
const BACKOFF_DAYS = [3, 7]; // po 1. snooze: 3 dni, po 2.: 7 dni, po 3.: stop
const DAY_MS = 24 * 60 * 60 * 1000;

function getAsks(): number {
  return Number(localStorage.getItem(ASKS_KEY) || 0);
}

/** Czy w ogóle wolno teraz pokazać prompt instalacji. */
function isEligible(): boolean {
  if (localStorage.getItem(OPTOUT_KEY) === "true") return false;
  if (isStandalone()) return false; // już zainstalowane
  if (!isMobileDevice()) return false; // popup tylko na mobile
  if (getAsks() >= MAX_ASKS) return false;
  const snoozeUntil = Number(localStorage.getItem(SNOOZE_KEY) || 0);
  if (Date.now() < snoozeUntil) return false;
  return true;
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<{
    prompt: () => void;
    userChoice: Promise<{ outcome: string }>;
  } | null>(null);
  const [visible, setVisible] = useState(false);
  const [mode, setMode] = useState<"android" | "ios">("android");

  useEffect(() => {
    if (!isEligible()) return;

    // ── iOS: brak beforeinstallprompt → pokazujemy instrukcję po krótkiej chwili ──
    if (isIOS()) {
      setMode("ios");
      const t = setTimeout(() => setVisible(true), 1200);
      return () => clearTimeout(t);
    }

    // ── Android/Chrome: czekamy na natywne zdarzenie instalacji ──
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      if (!isEligible()) return;
      setDeferredPrompt(
        e as unknown as {
          prompt: () => void;
          userChoice: Promise<{ outcome: string }>;
        },
      );
      setMode("android");
      setVisible(true);
    };

    const handleAppInstalled = () => {
      setVisible(false);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);
    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  // Ręczne wyzwolenie z menu profilu — pomija kadencję, ignoruje gdy zainstalowane.
  useEffect(() => {
    const onRequest = () => {
      if (isStandalone()) return;
      setMode(isIOS() ? "ios" : "android");
      setVisible(true);
    };
    window.addEventListener(PWA_INSTALL_EVENT, onRequest);
    return () => window.removeEventListener(PWA_INSTALL_EVENT, onRequest);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setVisible(false);
    // Odrzucenie natywnego okna traktujemy jak snooze (nie nagabujemy od razu).
    if (outcome !== "accepted") snooze();
  };

  // Miękki snooze z narastającym backoffem (3 → 7 dni), po MAX_ASKS stop.
  const snooze = () => {
    const asks = getAsks() + 1;
    localStorage.setItem(ASKS_KEY, String(asks));
    const days = BACKOFF_DAYS[asks - 1];
    if (days) {
      localStorage.setItem(SNOOZE_KEY, String(Date.now() + days * DAY_MS));
    }
    setVisible(false);
  };

  // Twardy opt-out — „Nie, dziękuję".
  const optOut = () => {
    localStorage.setItem(OPTOUT_KEY, "true");
    setVisible(false);
    setDeferredPrompt(null);
  };

  return (
    <AnimatePresence>
      {visible && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] bg-brand-secondary/40 backdrop-blur-sm"
            onClick={snooze}
          />

          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[301] w-[92%] max-w-md rounded-3xl rounded-tr-none bg-white/90 backdrop-blur-2xl border border-white/60 shadow-[0_30px_80px_-20px_rgba(3,63,99,0.35)] overflow-hidden"
          >
            <button
              onClick={snooze}
              aria-label="Zamknij"
              className="absolute top-3 right-3 w-9 h-9 rounded-xl bg-white/70 hover:bg-white border border-white/40 flex items-center justify-center text-brand-secondary transition z-10"
            >
              <X size={16} weight="bold" />
            </button>

            <div className="p-6 pb-5">
              <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-primary to-brand-secondary flex items-center justify-center text-white shadow-[0_8px_24px_-6px_rgba(40,125,136,0.5)] mb-4">
                <DownloadSimple size={26} weight="fill" />
              </div>

              <h2 className="font-jakarta font-bold text-[20px] text-brand-secondary leading-tight">
                Zainstaluj aplikację
              </h2>
              <p className="font-montserrat text-[13px] text-brand-secondary/70 mt-2 leading-relaxed">
                Dodaj Rehability do ekranu głównego — szybszy dostęp do panelu,
                harmonogramu i powiadomień o wyjeździe.
              </p>
            </div>

            {mode === "android" && deferredPrompt ? (
              <div className="px-6 pb-6 flex flex-col gap-2">
                <button
                  onClick={handleInstall}
                  className="w-full h-12 rounded-2xl bg-brand-primary text-white font-bold text-[14px] shadow-[0_8px_20px_-6px_rgba(40,125,136,0.5)] hover:shadow-[0_12px_28px_-8px_rgba(40,125,136,0.65)] transition"
                >
                  Zainstaluj teraz
                </button>
                <button
                  onClick={optOut}
                  className="w-full h-11 rounded-2xl bg-white/70 hover:bg-white text-brand-secondary/70 font-medium text-[13px] border border-white/60 transition"
                >
                  Nie, dziękuję
                </button>
              </div>
            ) : mode === "android" ? (
              // Android bez natywnego prompta (np. ręczne wywołanie) — instrukcja.
              <div className="px-6 pb-6 flex flex-col gap-3">
                <div className="rounded-2xl bg-brand-primary/5 border border-brand-primary/10 p-4">
                  <p className="text-[13px] text-brand-secondary/80 leading-snug">
                    Otwórz menu przeglądarki (<strong>⋮</strong>) i wybierz{" "}
                    <strong>„Zainstaluj aplikację"</strong> lub{" "}
                    <strong>„Dodaj do ekranu głównego"</strong>.
                  </p>
                </div>
                <button
                  onClick={snooze}
                  className="w-full h-12 rounded-2xl bg-brand-primary text-white font-bold text-[14px] shadow-[0_8px_20px_-6px_rgba(40,125,136,0.5)] transition"
                >
                  Rozumiem
                </button>
              </div>
            ) : (
              // ── iOS: instrukcja krok po kroku (Safari nie ma natywnego prompta) ──
              <div className="px-6 pb-6 flex flex-col gap-3">
                <div className="rounded-2xl bg-brand-primary/5 border border-brand-primary/10 p-4 flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-white text-brand-primary border border-brand-primary/15 shrink-0">
                      <Export size={20} weight="bold" />
                    </span>
                    <p className="text-[13px] text-brand-secondary/80 leading-snug">
                      1. Dotknij ikony <strong>Udostępnij</strong> na dolnym
                      pasku Safari.
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-white text-brand-primary border border-brand-primary/15 shrink-0">
                      <PlusSquare size={20} weight="bold" />
                    </span>
                    <p className="text-[13px] text-brand-secondary/80 leading-snug">
                      2. Wybierz <strong>„Do ekranu początkowego"</strong>.
                    </p>
                  </div>
                </div>
                <button
                  onClick={snooze}
                  className="w-full h-12 rounded-2xl bg-brand-primary text-white font-bold text-[14px] shadow-[0_8px_20px_-6px_rgba(40,125,136,0.5)] transition"
                >
                  Rozumiem
                </button>
                <button
                  onClick={optOut}
                  className="w-full h-10 text-brand-secondary/50 hover:text-brand-secondary/80 font-medium text-[12px] transition"
                >
                  Nie przypominaj
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
