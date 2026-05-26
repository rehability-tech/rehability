"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { DownloadSimple, X } from "@phosphor-icons/react/dist/ssr";

export default function PWAInstallPrompt() {
  // Przechowujemy natywny event instalacji z przeglądarki
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // 1. Sprawdzamy, czy użytkownik trwale odrzucił instalację
    const isDismissed = localStorage.getItem("pwa-dismissed") === "true";

    // PWA jest już zainstalowane na urządzeniu (tryb standalone)
    const isStandalone = window.matchMedia(
      "(display-mode: standalone)",
    ).matches;

    if (isDismissed || isStandalone) {
      return;
    }

    // 2. Przechwytywanie natywnego zdarzenia instalacji PWA
    const handleBeforeInstallPrompt = (e: Event) => {
      // Zapobiegamy domyślnemu paskowi na dole ekranu w Chrome/Android
      e.preventDefault();
      // Zapisujemy event, aby wywołać go po kliknięciu w nasz przycisk
      setDeferredPrompt(e);
      // Pokazujemy nasz customowy popup
      setVisible(true);
    };

    // 3. Nasłuchiwanie na udaną instalację
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

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    // Wywołujemy natywny prompt przeglądarki
    deferredPrompt.prompt();

    // Czekamy na decyzję użytkownika w systemowym oknie
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setVisible(false);
    }

    // Po każdej interakcji czyścimy zachowany event
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    // Trwałe zapisanie odmowy w pamięci przeglądarki
    localStorage.setItem("pwa-dismissed", "true");
    setVisible(false);
    setDeferredPrompt(null);
  };

  return (
    <AnimatePresence>
      {visible && (
        <>
          {/* Tło blurujące */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] bg-brand-secondary/40 backdrop-blur-sm"
            onClick={handleDismiss}
          />

          {/* Główny Modal */}
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[301] w-[92%] max-w-md rounded-3xl rounded-tr-none bg-white/90 backdrop-blur-2xl border border-white/60 shadow-[0_30px_80px_-20px_rgba(3,63,99,0.35)] overflow-hidden"
          >
            <button
              onClick={handleDismiss}
              aria-label="Zamknij"
              className="absolute top-3 right-3 w-9 h-9 rounded-xl bg-white/70 hover:bg-white border border-white/40 flex items-center justify-center text-brand-secondary transition"
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
                Dodaj Rehability do ekranu głównego swojego urządzenia. Zyskaj
                szybszy dostęp do panelu, powiadomień i harmonogramu wyjazdu.
              </p>
            </div>

            <div className="px-6 pb-6 flex flex-col gap-2">
              <button
                onClick={handleInstall}
                className="w-full h-12 rounded-2xl bg-brand-primary text-white font-bold text-[14px] shadow-[0_8px_20px_-6px_rgba(40,125,136,0.5)] hover:shadow-[0_12px_28px_-8px_rgba(40,125,136,0.65)] transition"
              >
                Zainstaluj teraz
              </button>
              <button
                onClick={handleDismiss}
                className="w-full h-11 rounded-2xl bg-white/70 hover:bg-white text-brand-secondary/70 font-medium text-[13px] border border-white/60 transition"
              >
                Nie, dziękuję
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
