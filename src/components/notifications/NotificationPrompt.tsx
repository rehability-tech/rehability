"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BellRinging, X } from "@phosphor-icons/react/dist/ssr";
// Zmieniony import - korzystamy teraz z niezawodnego pobierania
import { getOneSignal } from "@/lib/notifications/onesignal";

// Po ilu dniach od ostatniego pytania możemy zapytać ponownie.
const REMIND_AFTER_DAYS = 14;
// Po ilu dniach od rejestracji (czyli braku promptedAt) zaczynamy pytać.
const FIRST_PROMPT_AFTER_DAYS = 0; // 0 = od razu po wejściu

interface Preferences {
  isNotificationEnabled: boolean;
  notificationPromptedAt: string | null;
  oneSignalPlayerId: string | null;
}

interface Props {
  /** Jeśli true — pomija logikę czasową i pokazuje modal (np. po wpłacie zadatku). */
  force?: boolean;
}

export default function NotificationPrompt({ force = false }: Props) {
  const [visible, setVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function check() {
      try {
        const res = await fetch("/api/user/notification-preferences");
        if (!res.ok) return;
        const { preferences } = (await res.json()) as {
          preferences: Preferences | null;
        };

        if (!preferences) return;
        if (preferences.isNotificationEnabled) return;
        if (cancelled) return;

        if (force) {
          setVisible(true);
          return;
        }

        const promptedAt = preferences.notificationPromptedAt
          ? new Date(preferences.notificationPromptedAt).getTime()
          : null;
        const now = Date.now();
        const dayMs = 24 * 60 * 60 * 1000;

        if (promptedAt === null) {
          if (now - dayMs * FIRST_PROMPT_AFTER_DAYS >= 0) setVisible(true);
        } else if (now - promptedAt >= REMIND_AFTER_DAYS * dayMs) {
          setVisible(true);
        }
      } catch {
        // ignoruj — milcząca degradacja, prompt po prostu się nie pokaże
      }
    }

    check();
    return () => {
      cancelled = true;
    };
  }, [force]);

  async function markPrompted() {
    await fetch("/api/user/notification-preferences", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markPrompted: true }),
    });
  }

  async function handleEnable() {
    setSubmitting(true);

    try {
      // 1. Oznaczamy, że zapytaliśmy (niezależnie od wyniku)
      await markPrompted();

      // 2. Pobieramy instancję bezpiecznie (czekając w razie potrzeby)
      const OneSignal = await getOneSignal();

      if (!OneSignal) {
        console.warn(
          "[NotificationPrompt] OneSignal niedostępny. Prawdopodobnie AdBlock.",
        );
        return; // Zamykamy modal (w finally), bez rzucania błędów użytkownikowi
      }

      // 3. Prosimy przeglądarkę o uprawnienia (Natywny Popup)
      await OneSignal.Notifications.requestPermission();

      // 4. Jeśli zgoda udzielona - rejestrujemy playerId w bazie
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
        }
      }
    } catch (err) {
      console.error("[NotificationPrompt] handleEnable failed:", err);
    } finally {
      setVisible(false);
      setSubmitting(false);
    }
  }

  async function handleLater() {
    setSubmitting(true);
    try {
      await markPrompted();
    } catch (err) {
      console.error(
        "[NotificationPrompt] handleLater markPrompted failed:",
        err,
      );
    } finally {
      setVisible(false);
      setSubmitting(false);
    }
  }

  return (
    <AnimatePresence>
      {visible && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] bg-brand-secondary/40 backdrop-blur-sm"
            onClick={handleLater}
          />
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[301] w-[92%] max-w-md rounded-3xl rounded-tr-none bg-white/90 backdrop-blur-2xl border border-white/60 shadow-[0_30px_80px_-20px_rgba(3,63,99,0.35)] overflow-hidden"
          >
            <button
              onClick={handleLater}
              aria-label="Zamknij"
              className="absolute top-3 right-3 w-9 h-9 rounded-xl bg-white/70 hover:bg-white border border-white/40 flex items-center justify-center text-brand-secondary transition"
            >
              <X size={16} weight="bold" />
            </button>

            <div className="p-6 pb-5">
              <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-primary to-brand-secondary flex items-center justify-center text-white shadow-[0_8px_24px_-6px_rgba(40,125,136,0.5)] mb-4">
                <BellRinging size={26} weight="fill" />
                <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-brand-yellow shadow-[0_0_12px_rgba(242,217,103,0.7)]" />
              </div>

              <h2 className="font-jakarta font-bold text-[20px] text-brand-secondary leading-tight">
                Włącz powiadomienia
              </h2>
              <p className="font-montserrat text-[13px] text-brand-secondary/70 mt-2 leading-relaxed">
                Dzięki temu nie przegapisz: przypomnienia o opłacie pozostałej
                kwoty, potwierdzenia rezerwacji slotu SPA oraz wiadomości od
                organizatora wyjazdu.
              </p>
            </div>

            <div className="px-6 pb-6 flex flex-col gap-2">
              <button
                onClick={handleEnable}
                disabled={submitting}
                className="w-full h-12 rounded-2xl bg-brand-primary text-white font-bold text-[14px] shadow-[0_8px_20px_-6px_rgba(40,125,136,0.5)] hover:shadow-[0_12px_28px_-8px_rgba(40,125,136,0.65)] transition disabled:opacity-50"
              >
                Włącz powiadomienia
              </button>
              <button
                onClick={handleLater}
                disabled={submitting}
                className="w-full h-11 rounded-2xl bg-white/70 hover:bg-white text-brand-secondary/70 font-medium text-[13px] border border-white/60 transition disabled:opacity-50"
              >
                Może później
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
