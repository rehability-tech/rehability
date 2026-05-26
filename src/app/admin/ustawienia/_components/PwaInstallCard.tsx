"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  DownloadSimple,
  CheckCircle,
  DeviceMobile,
  ShareNetwork,
} from "@phosphor-icons/react/dist/ssr";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function PwaInstallCard() {
  const [installEvent, setInstallEvent] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIosHelp, setShowIosHelp] = useState(false);
  const [working, setWorking] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone ===
        true;
    setIsStandalone(standalone);

    const ua = window.navigator.userAgent;
    setIsIOS(/iPhone|iPad|iPod/i.test(ua) && !/CriOS|FxiOS/i.test(ua));

    function handler(e: Event) {
      e.preventDefault();
      setInstallEvent(e as BeforeInstallPromptEvent);
    }

    function installed() {
      setInstallEvent(null);
      setIsStandalone(true);
      toast.success("Aplikacja została zainstalowana");
    }

    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", installed);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", installed);
    };
  }, []);

  async function handleInstall() {
    if (working) return;

    if (installEvent) {
      setWorking(true);
      try {
        await installEvent.prompt();
        const { outcome } = await installEvent.userChoice;
        if (outcome === "accepted") {
          setInstallEvent(null);
        }
      } catch (err) {
        console.error("[PwaInstallCard] prompt:", err);
      } finally {
        setWorking(false);
      }
      return;
    }

    if (isIOS) {
      setShowIosHelp((v) => !v);
      return;
    }

    toast.info(
      "Otwórz menu przeglądarki (⋮) i wybierz 'Zainstaluj aplikację' lub 'Dodaj do ekranu głównego'.",
      { duration: 9000 },
    );
  }

  // === Stan: już zainstalowane ===
  if (isStandalone) {
    return (
      <div className="relative overflow-hidden rounded-3xl rounded-tr-none border border-brand-primary/20 bg-brand-primary/[0.04] backdrop-blur-2xl shadow-[0_10px_30px_-10px_rgba(3,63,99,0.08)]">
        <div className="absolute -bottom-6 -right-4 w-32 h-32 bg-brand-yellow/40 blur-[28px] rounded-full pointer-events-none" />
        <div className="relative p-5 sm:p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-brand-primary text-white flex items-center justify-center shrink-0 shadow-[0_4px_15px_0px_rgba(242,217,103,0.45)] border border-brand-yellow/30">
              <CheckCircle size={24} weight="fill" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-jakarta font-bold text-[15px] sm:text-[16px] text-brand-secondary leading-tight">
                Aplikacja zainstalowana
              </h3>
              <p className="font-montserrat text-[12px] sm:text-[13px] text-brand-secondary/65 mt-1 leading-relaxed">
                Korzystasz z Rehability w trybie standalone. Możesz odpinać
                aplikację z poziomu systemu operacyjnego.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // === Stan: do zainstalowania ===
  return (
    <div className="relative overflow-hidden rounded-3xl rounded-tr-none border border-white/60 bg-white/70 backdrop-blur-2xl shadow-[0_10px_30px_-10px_rgba(3,63,99,0.08)]">
      <div className="relative p-5 sm:p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-brand-secondary/5 text-brand-secondary/60 flex items-center justify-center shrink-0">
            <DeviceMobile size={24} weight="duotone" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-jakarta font-bold text-[15px] sm:text-[16px] text-brand-secondary leading-tight">
              Zainstaluj aplikację
            </h3>
            <p className="font-montserrat text-[12px] sm:text-[13px] text-brand-secondary/65 mt-1 leading-relaxed">
              {installEvent
                ? "Dodaj Rehability do ekranu głównego, żeby otwierać panel jednym kliknięciem."
                : isIOS
                  ? "Na iPhone instalacja odbywa się przez Safari. Pokaż instrukcję."
                  : "Otwórz menu przeglądarki i wybierz „Zainstaluj aplikację”."}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleInstall}
          disabled={working}
          className="mt-5 w-full h-12 rounded-2xl bg-brand-primary text-white font-jakarta font-semibold text-[14px] shadow-[0_8px_20px_-6px_rgba(40,125,136,0.5)] hover:shadow-[0_12px_28px_-8px_rgba(40,125,136,0.65)] transition disabled:opacity-60 border border-brand-yellow/30 flex items-center justify-center gap-2"
        >
          <DownloadSimple size={18} weight="fill" />
          {working
            ? "Otwieram..."
            : installEvent
              ? "Zainstaluj teraz"
              : isIOS
                ? showIosHelp
                  ? "Ukryj instrukcję"
                  : "Pokaż instrukcję dla iPhone"
                : "Pokaż jak zainstalować"}
        </button>

        {isIOS && showIosHelp && (
          <div className="mt-4 p-4 rounded-2xl bg-brand-secondary/5 border border-brand-secondary/10 font-montserrat text-[12px] text-brand-secondary/80 leading-relaxed">
            <ol className="space-y-2 list-decimal pl-4">
              <li>
                Otwórz tę stronę w przeglądarce <strong>Safari</strong>.
              </li>
              <li>
                Kliknij ikonę <ShareNetwork className="inline" size={14} />{" "}
                <strong>Udostępnij</strong> na dole ekranu.
              </li>
              <li>
                Wybierz <strong>„Do ekranu początkowego”</strong>.
              </li>
              <li>
                Potwierdź <strong>„Dodaj”</strong> w prawym górnym rogu.
              </li>
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}
