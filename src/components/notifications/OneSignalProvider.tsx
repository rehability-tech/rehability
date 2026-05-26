"use client";

import { useEffect, useRef } from "react";
import Script from "next/script";
// POPRAWKA: Zmiana importu na naszą nową, bezpieczną funkcję
import { getOneSignal } from "@/lib/notifications/onesignal";

const APP_ID = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;

interface Props {
  userId: string;
}

/**
 * Inicjalizuje OneSignal Web SDK i synchronizuje playerId użytkownika z backendem.
 *
 * - Wpina się raz, na poziomie layoutu (admin oraz /panel).
 * - Po zalogowaniu wywołuje OneSignal.login(userId) — przypisuje urządzenie do konta.
 * - Słucha zmian subscription i przy każdym opt-in/opt-out aktualizuje
 * user.oneSignalPlayerId + user.isNotificationEnabled w bazie.
 */
export default function OneSignalProvider({ userId }: Props) {
  const lastSyncedRef = useRef<{ id: string | null; opted: boolean } | null>(
    null,
  );

  useEffect(() => {
    if (!APP_ID || !userId) return;

    // POPRAWKA: Zamiana withOneSignal na asynchroniczne wywołanie getOneSignal
    async function initAndSync() {
      const OneSignal = await getOneSignal();
      if (!OneSignal) return;

      try {
        await OneSignal.login(userId);

        const syncPrefs = async (id: string | null, opted: boolean) => {
          const last = lastSyncedRef.current;
          if (last && last.id === id && last.opted === opted) return;
          lastSyncedRef.current = { id, opted };

          await fetch("/api/user/notification-preferences", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              oneSignalPlayerId: id,
              isNotificationEnabled: opted,
            }),
          });
        };

        const sub = OneSignal.User.PushSubscription;
        await syncPrefs(sub.id ?? null, sub.optedIn);

        sub.addEventListener("change", (e) => {
          syncPrefs(e.current.id ?? null, e.current.optedIn);
        });
      } catch (err) {
        console.error("[OneSignal] init/login error:", err);
      }
    }

    initAndSync();
  }, [userId]);

  if (!APP_ID) return null;

  return (
    <Script
      id="onesignal-sdk"
      src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js"
      strategy="afterInteractive"
      onLoad={() => {
        window.OneSignalDeferred = window.OneSignalDeferred || [];
        window.OneSignalDeferred.push(async (OneSignal) => {
          await OneSignal.init({
            appId: APP_ID,
            allowLocalhostAsSecureOrigin: true,
          });
        });
      }}
    />
  );
}
