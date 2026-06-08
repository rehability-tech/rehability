"use client";

import Script from "next/script";

const APP_ID = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
const IS_DEV = process.env.NODE_ENV === "development";

interface Props {
  userId: string;
}

export default function OneSignalProvider({ userId }: Props) {
  // W dev nie ładujemy SDK (brak HTTPS / domeny OneSignal); brak APP_ID = no-op.
  if (!APP_ID || IS_DEV) return null;

  return (
    <Script
      id="onesignal-sdk"
      src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js"
      strategy="afterInteractive"
      onLoad={() => {
        window.OneSignalDeferred = window.OneSignalDeferred || [];
        // Wszystko w JEDNEJ kolejce: init -> login -> sync. Dzięki temu nie
        // sięgamy po OneSignal.User zanim init się zakończy (to powodowało
        // "cannot read properties of undefined").
        window.OneSignalDeferred.push(async (OneSignal) => {
          try {
            await OneSignal.init({
              appId: APP_ID,
              allowLocalhostAsSecureOrigin: true,
              serviceWorkerPath: "sw.js",
              serviceWorkerParam: { scope: "/" },
            });

            if (userId) await OneSignal.login(userId);

            // Dedupe — listener 'change' potrafi strzelać wielokrotnie.
            let last: { id: string | null; opted: boolean } | null = null;
            const syncPrefs = async (id: string | null, opted: boolean) => {
              if (last && last.id === id && last.opted === opted) return;
              last = { id, opted };
              await fetch("/api/user/notification-preferences", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  oneSignalPlayerId: id,
                  isNotificationEnabled: opted,
                }),
              });
            };

            const sub = OneSignal.User?.PushSubscription;
            if (!sub) return;

            await syncPrefs(sub.id ?? null, sub.optedIn);
            sub.addEventListener("change", (e) => {
              syncPrefs(e.current.id ?? null, e.current.optedIn);
            });
          } catch (err) {
            // Cicha degradacja — bez toastów dla użytkownika.
            console.error("[OneSignal] init/sync nie powiódł się:", err);
          }
        });
      }}
    />
  );
}
