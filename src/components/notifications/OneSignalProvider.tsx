"use client";

import { useEffect, useRef } from "react";
import Script from "next/script";
import { toast } from "sonner"; // <-- DODANE DO DEBUGOWANIA
import { getOneSignal } from "@/lib/notifications/onesignal";

const APP_ID = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
const IS_DEV = process.env.NODE_ENV === "development";

const debugToast = (message: string) => {
  if (IS_DEV) {
    console.warn(message);
    return;
  }
  toast.error(message);
};

interface Props {
  userId: string;
}

export default function OneSignalProvider({ userId }: Props) {
  const lastSyncedRef = useRef<{ id: string | null; opted: boolean } | null>(
    null,
  );

  useEffect(() => {
    // ---- START DEBUGOWANIA NA TELEFON ----
    if (!APP_ID) {
      debugToast("DEBUG: Zmienna APP_ID jest pusta na Vercelu!");
      return;
    }
    if (!userId) {
      debugToast("DEBUG: Brak userId z sesji!");
      return;
    }
    // ---- KONIEC DEBUGOWANIA ----

    async function initAndSync() {
      const OneSignal = await getOneSignal();
      if (!OneSignal) {
        debugToast("DEBUG: Skrypt się nie załadował z CDN.");
        return;
      }

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
      } catch (err: any) {
        // Pokaże fizyczny błąd inicjalizacji na ekranie telefonu
        debugToast("DEBUG BŁĄD: " + err.message);
      }
    }

    initAndSync();
  }, [userId]);

  if (!APP_ID || IS_DEV) return null;

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
            serviceWorkerPath: "sw.js",
            serviceWorkerParam: { scope: "/" },
          });
        });
      }}
    />
  );
}
