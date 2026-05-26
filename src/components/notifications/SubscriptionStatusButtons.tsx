"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  BellRinging,
  BellSlash,
  CheckCircle,
  DownloadSimple,
  Warning,
} from "@phosphor-icons/react/dist/ssr";
import { getOneSignal } from "@/lib/notifications/onesignal";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

type PermState = "unsupported" | "default" | "granted" | "denied";

function readPermission(): PermState {
  if (typeof window === "undefined") return "unsupported";
  if (!("Notification" in window)) return "unsupported";
  return Notification.permission as PermState;
}

export default function SubscriptionStatusButtons() {
  const [perm, setPerm] = useState<PermState>("default");
  const [working, setWorking] = useState(false);

  const [installEvent, setInstallEvent] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  // --- Stan uprawnień do powiadomień ---
  useEffect(() => {
    setPerm(readPermission());

    async function initOneSignal() {
      const OneSignal = await getOneSignal();
      if (OneSignal) {
        OneSignal.User.PushSubscription.addEventListener("change", () => {
          setPerm(readPermission());
        });
      }
    }

    initOneSignal();
  }, []);

  // --- PWA install prompt ---
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

    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", () => {
      setInstallEvent(null);
      setIsStandalone(true);
    });

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  async function handleEnable() {
    if (working) return;
    if (perm === "unsupported") {
      toast.error("Twoja przeglądarka nie wspiera powiadomień");
      return;
    }
    if (perm === "denied") {
      toast.error(
        "Powiadomienia są zablokowane w przeglądarce — odblokuj je w ustawieniach strony (kłódka obok adresu).",
        { duration: 6000 },
      );
      return;
    }

    setWorking(true);

    try {
      const OneSignal = await getOneSignal();
      if (!OneSignal) {
        toast.error(
          "Brak dostępu do OneSignal. Sprawdź, czy nie używasz AdBlocka.",
        );
        return;
      }

      const result = await Notification.requestPermission();
      setPerm(result as PermState);

      if (result === "granted") {
        const sub = OneSignal.User.PushSubscription;
        if (!sub.optedIn) await sub.optIn();

        const playerId = sub.id;

        if (playerId) {
          // Zapisujemy wygenerowane ID do bazy
          await fetch("/api/user/notification-preferences", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              isNotificationEnabled: true,
              oneSignalPlayerId: playerId,
            }),
          });
        }

        toast.success("Powiadomienia włączone");
      } else if (result === "denied") {
        toast.error("Odrzucono prośbę o powiadomienia");
      }
    } catch (err) {
      console.error("[SubscriptionStatusButtons] requestPermission:", err);
      toast.error("Nie udało się włączyć powiadomień");
    } finally {
      setWorking(false);
    }
  }

  async function handleInstall() {
    if (installEvent) {
      await installEvent.prompt();
      const { outcome } = await installEvent.userChoice;
      if (outcome === "accepted") setInstallEvent(null);
      return;
    }

    if (isIOS) {
      toast.info(
        "Na iPhone: kliknij ikonę 'Udostępnij' (kwadrat ze strzałką) na dole ekranu, a potem 'Do ekranu początkowego'.",
        { duration: 9000 },
      );
      return;
    }

    toast.info(
      "Otwórz menu przeglądarki (⋮ w prawym górnym rogu) i wybierz 'Zainstaluj aplikację' lub 'Dodaj do ekranu głównego'.",
      { duration: 9000 },
    );
  }

  const showInstallButton = !isStandalone;

  return (
    <div className="flex flex-col gap-3 mb-6">
      {perm === "granted" && (
        <button
          disabled
          className="flex-1 flex items-center gap-3 p-4 rounded-2xl bg-brand-primary/5 border border-brand-primary/20 cursor-not-allowed"
        >
          <div className="w-11 h-11 rounded-xl bg-brand-primary text-white flex items-center justify-center shrink-0 shadow-[0_4px_15px_rgba(242,217,103,0.35)]">
            <CheckCircle size={22} weight="fill" />
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="font-jakarta font-bold text-[14px] text-brand-primary">
              Powiadomienia aktywne
            </p>
            <p className="font-montserrat text-[12px] text-brand-primary/70 mt-0.5">
              Otrzymasz wszystkie ważne alerty na tym urządzeniu.
            </p>
          </div>
        </button>
      )}

      {perm === "default" && (
        <button
          onClick={handleEnable}
          disabled={working}
          className="flex-1 flex items-center gap-3 p-4 rounded-2xl bg-white/80 backdrop-blur-md border border-white/60 hover:bg-white transition shadow-[0_4px_18px_-10px_rgba(3,63,99,0.18)] disabled:opacity-60 text-left"
        >
          <div className="w-11 h-11 rounded-xl bg-brand-secondary/5 text-brand-secondary/60 flex items-center justify-center shrink-0">
            <BellSlash size={22} weight="duotone" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-jakarta font-bold text-[14px] text-brand-secondary">
              {working ? "Włączanie..." : "Aktywuj powiadomienia"}
            </p>
            <p className="font-montserrat text-[12px] text-brand-secondary/60 mt-0.5">
              Włącz, żeby nie przegapić ważnych wiadomości.
            </p>
          </div>
          <BellRinging
            size={18}
            weight="bold"
            className="text-brand-secondary/40 shrink-0"
          />
        </button>
      )}

      {perm === "denied" && (
        <button
          onClick={handleEnable}
          className="flex-1 flex items-center gap-3 p-4 rounded-2xl bg-amber-50 border border-amber-200 hover:bg-amber-100 transition text-left"
        >
          <div className="w-11 h-11 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
            <Warning size={22} weight="fill" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-jakarta font-bold text-[14px] text-amber-700">
              Powiadomienia zablokowane
            </p>
            <p className="font-montserrat text-[12px] text-amber-700/80 mt-0.5">
              Odblokuj je w ustawieniach przeglądarki (kłódka obok adresu).
            </p>
          </div>
        </button>
      )}

      {perm === "unsupported" && (
        <div className="flex-1 flex items-center gap-3 p-4 rounded-2xl bg-brand-secondary/5 border border-brand-secondary/10">
          <div className="w-11 h-11 rounded-xl bg-brand-secondary/10 text-brand-secondary/50 flex items-center justify-center shrink-0">
            <BellSlash size={22} weight="duotone" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-jakarta font-bold text-[14px] text-brand-secondary/70">
              Powiadomienia niedostępne
            </p>
            <p className="font-montserrat text-[12px] text-brand-secondary/50 mt-0.5">
              Twoja przeglądarka nie wspiera tej funkcji.
            </p>
          </div>
        </div>
      )}

      {showInstallButton && (
        <button
          onClick={handleInstall}
          className="flex-1 flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-br from-brand-primary to-brand-secondary text-white hover:shadow-[0_12px_30px_-8px_rgba(40,125,136,0.55)] transition shadow-[0_8px_20px_-6px_rgba(40,125,136,0.45)] text-left relative overflow-hidden"
        >
          <div className="absolute bottom-0 right-0 w-16 h-16 rounded-full bg-brand-yellow/50 blur-[16px]" />
          <div className="relative w-11 h-11 rounded-xl bg-white/20 text-white flex items-center justify-center shrink-0 backdrop-blur-md">
            <DownloadSimple size={22} weight="fill" />
          </div>
          <div className="relative flex-1 min-w-0">
            <p className="font-jakarta font-bold text-[14px] text-white">
              Zainstaluj aplikację
            </p>
            <p className="font-montserrat text-[12px] text-white/80 mt-0.5">
              {installEvent
                ? "Dodaj Rehability do ekranu głównego."
                : isIOS
                  ? "Pokaż instrukcję dla iPhone."
                  : "Pokaż jak zainstalować ręcznie."}
            </p>
          </div>
        </button>
      )}
    </div>
  );
}
