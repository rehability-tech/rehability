"use client";

import { useEffect, useState } from "react";
import { BellRinging, BellSlash } from "@phosphor-icons/react/dist/ssr";
import { withOneSignal } from "@/lib/notifications/onesignal";

interface Preferences {
  isNotificationEnabled: boolean;
  oneSignalPlayerId: string | null;
}

export default function NotificationToggle() {
  const [prefs, setPrefs] = useState<Preferences | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    fetch("/api/user/notification-preferences")
      .then((r) => r.json())
      .then((d) => setPrefs(d.preferences))
      .catch((err) => console.error("Failed to load preferences:", err));
  }, []);

  async function toggle() {
    if (!prefs || pending) return;
    setPending(true);

    if (prefs.isNotificationEnabled) {
      // WYŁĄCZANIE POWIADOMIEŃ
      withOneSignal(async (OneSignal) => {
        try {
          await OneSignal.User.PushSubscription.optOut();

          // API call i state update wewnątrz try, po pomyślnym opt-out
          await fetch("/api/user/notification-preferences", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ isNotificationEnabled: false }),
          });

          setPrefs({ ...prefs, isNotificationEnabled: false });
        } catch (err) {
          console.error("[NotificationToggle] optOut failed:", err);
        } finally {
          setPending(false); // Zwalniamy blokadę przycisku na samym końcu
        }
      });
    } else {
      // WŁĄCZANIE POWIADOMIEŃ
      withOneSignal(async (OneSignal) => {
        try {
          const sub = OneSignal.User.PushSubscription;

          if (sub.id) {
            await sub.optIn();
          } else {
            await OneSignal.Notifications.requestPermission();
          }

          if (OneSignal.Notifications.permission) {
            const playerId = OneSignal.User.PushSubscription.id;

            if (playerId) {
              await fetch("/api/user/notification-preferences", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  isNotificationEnabled: true,
                  oneSignalPlayerId: playerId,
                }),
              });

              setPrefs({
                ...prefs,
                isNotificationEnabled: true,
                oneSignalPlayerId: playerId,
              });
            }
          }
        } catch (err) {
          console.error("[NotificationToggle] enable failed:", err);
        } finally {
          setPending(false);
        }
      });
    }
  }

  if (!prefs) {
    return (
      <div className="h-20 rounded-2xl bg-white/40 animate-pulse border border-white/40" />
    );
  }

  const on = prefs.isNotificationEnabled;

  return (
    <button
      onClick={toggle}
      disabled={pending}
      className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white/70 backdrop-blur-md border border-white/40 hover:bg-white transition shadow-[0_4px_18px_-10px_rgba(3,63,99,0.18)] disabled:opacity-60 text-left"
    >
      <div
        className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition ${
          on
            ? "bg-brand-primary text-white shadow-[0_4px_15px_rgba(242,217,103,0.35)]"
            : "bg-brand-secondary/5 text-brand-secondary/60"
        }`}
      >
        {on ? (
          <BellRinging size={22} weight="fill" />
        ) : (
          <BellSlash size={22} weight="duotone" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-jakarta font-bold text-[14px] text-brand-secondary">
          Powiadomienia push
        </p>
        <p className="font-montserrat text-[12px] text-brand-secondary/60 mt-0.5">
          {on
            ? "Włączone — będziesz dostawać alerty na to urządzenie."
            : "Wyłączone — kliknij, żeby włączyć."}
        </p>
      </div>
      <div
        className={`relative w-12 h-7 rounded-full transition-colors shrink-0 ${on ? "bg-brand-primary" : "bg-brand-secondary/20"}`}
      >
        <span
          className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-all ${on ? "left-[22px]" : "left-0.5"}`}
        />
      </div>
    </button>
  );
}
