"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  BellRinging,
  BellSlash,
  CheckCircle,
  Warning,
} from "@phosphor-icons/react/dist/ssr";
// Zmieniony import - tylko getOneSignal
import { getOneSignal } from "@/lib/notifications/onesignal";

type PermState = "unsupported" | "default" | "granted" | "denied";

function readPermission(): PermState {
  if (typeof window === "undefined") return "default";
  if (!("Notification" in window)) return "unsupported";
  return Notification.permission as PermState;
}

export default function NotificationsCard() {
  const [perm, setPerm] = useState<PermState>("default");
  const [isOptedIn, setIsOptedIn] = useState(false);
  const [working, setWorking] = useState(false);

  // 1. Zaktualizowany useEffect używający getOneSignal
  useEffect(() => {
    setPerm(readPermission());

    async function initOneSignalState() {
      const OneSignal = await getOneSignal();
      if (OneSignal) {
        setIsOptedIn(OneSignal.User.PushSubscription.optedIn);

        OneSignal.User.PushSubscription.addEventListener("change", (e) => {
          setPerm(readPermission());
          setIsOptedIn(e.current.optedIn);
        });
      }
    }

    initOneSignalState();
  }, []);

  const isActive = perm === "granted" && isOptedIn;
  const isBlocked = perm === "denied";
  const isUnsupported = perm === "unsupported";

  async function handleToggle() {
    if (working) return;

    if (isUnsupported) {
      toast.error("Twoja przeglądarka nie wspiera powiadomień push");
      return;
    }

    if (isBlocked) {
      toast.error(
        "Powiadomienia są zablokowane w przeglądarce — odblokuj je w ustawieniach strony (kłódka obok adresu).",
        { duration: 6000 },
      );
      return;
    }

    setWorking(true);

    try {
      // 2. Pobieramy instancję bezpiecznie przed samą akcją
      const OneSignal = await getOneSignal();

      if (!OneSignal) {
        toast.error(
          "Brak dostępu do OneSignal. Sprawdź, czy Twój AdBlocker (np. uBlock, Brave) nie blokuje skryptu, i odśwież stronę.",
        );
        return;
      }

      if (isActive) {
        // WYŁĄCZANIE (Opt-out)
        await OneSignal.User.PushSubscription.optOut();

        await fetch("/api/user/notification-preferences", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isNotificationEnabled: false }),
        });

        setIsOptedIn(false);
        toast.success("Powiadomienia wyłączone na tym urządzeniu");
      } else {
        // WŁĄCZANIE (Opt-in)
        const result = await Notification.requestPermission();
        setPerm(result as PermState);

        if (result === "granted") {
          const sub = OneSignal.User.PushSubscription;
          if (!sub.optedIn) await sub.optIn();

          const playerId = sub.id;

          if (playerId) {
            await fetch("/api/user/notification-preferences", {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                isNotificationEnabled: true,
                oneSignalPlayerId: playerId,
              }),
            });
          }

          setIsOptedIn(true);
          toast.success("Powiadomienia włączone");
        } else if (result === "denied") {
          toast.error("Odrzucono prośbę o powiadomienia");
        }
      }
    } catch (err) {
      console.error("[NotificationsCard] toggle:", err);
      toast.error("Nie udało się zmienić ustawienia powiadomień");
    } finally {
      setWorking(false);
    }
  }

  return (
    <div
      className={`relative overflow-hidden rounded-3xl rounded-tr-none border backdrop-blur-2xl transition shadow-[0_10px_30px_-10px_rgba(3,63,99,0.08)] ${
        isActive
          ? "bg-brand-primary/[0.04] border-brand-primary/20"
          : "bg-white/70 border-white/60"
      }`}
    >
      {isActive && (
        <div className="absolute -bottom-6 -right-4 w-32 h-32 bg-brand-yellow/40 blur-[28px] rounded-full pointer-events-none" />
      )}

      <div className="relative p-5 sm:p-6">
        <div className="flex items-start gap-4">
          <div
            className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center shrink-0 transition ${
              isActive
                ? "bg-brand-primary text-white shadow-[0_4px_15px_0px_rgba(242,217,103,0.45)] border border-brand-yellow/30"
                : isBlocked
                  ? "bg-amber-100 text-amber-600"
                  : "bg-brand-secondary/5 text-brand-secondary/60"
            }`}
          >
            {isActive ? (
              <BellRinging size={24} weight="fill" />
            ) : isBlocked ? (
              <Warning size={24} weight="fill" />
            ) : (
              <BellSlash size={24} weight="duotone" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-jakarta font-bold text-[15px] sm:text-[16px] text-brand-secondary leading-tight">
              Powiadomienia push
            </h3>
            <p className="font-montserrat text-[12px] sm:text-[13px] text-brand-secondary/65 mt-1 leading-relaxed">
              {isActive
                ? "Włączone — będziesz dostawać alerty na to urządzenie."
                : isBlocked
                  ? "Zablokowane w przeglądarce. Odblokuj je w ustawieniach strony."
                  : isUnsupported
                    ? "Twoja przeglądarka nie wspiera tej funkcji."
                    : "Wyłączone. Włącz, żeby nie przegapić ważnych wiadomości."}
            </p>
          </div>

          {!isUnsupported && (
            <div
              role="switch"
              aria-checked={isActive}
              className={`relative w-12 h-7 rounded-full shrink-0 transition-colors ${
                isActive ? "bg-brand-primary" : "bg-brand-secondary/20"
              }`}
            >
              <span
                className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-all ${
                  isActive ? "left-[22px]" : "left-0.5"
                }`}
              />
            </div>
          )}
        </div>

        {!isUnsupported && (
          <button
            type="button"
            onClick={handleToggle}
            disabled={working}
            className={`mt-5 w-full h-12 rounded-2xl font-jakarta font-semibold text-[14px] transition disabled:opacity-60 ${
              isActive
                ? "bg-white/80 hover:bg-white text-brand-secondary border border-white/60"
                : isBlocked
                  ? "bg-amber-100 hover:bg-amber-200 text-amber-700"
                  : "bg-brand-primary text-white shadow-[0_8px_20px_-6px_rgba(40,125,136,0.5)] hover:shadow-[0_12px_28px_-8px_rgba(40,125,136,0.65)] border border-brand-yellow/30"
            }`}
          >
            {working
              ? "Pracuję..."
              : isActive
                ? "Wyłącz powiadomienia"
                : isBlocked
                  ? "Jak odblokować?"
                  : "Włącz powiadomienia"}
          </button>
        )}

        {isActive && (
          <div className="mt-3 flex items-center gap-2 text-[12px] text-brand-primary/80 font-montserrat">
            <CheckCircle size={14} weight="fill" />
            <span>Subskrypcja aktywna na tym urządzeniu</span>
          </div>
        )}
      </div>
    </div>
  );
}
