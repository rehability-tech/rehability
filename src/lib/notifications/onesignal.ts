// Współdzielone typy + util do komunikacji z OneSignal Web SDK po stronie klienta.

declare global {
  interface Window {
    OneSignalDeferred?: Array<(os: OneSignal) => void>;
    OneSignal?: OneSignal;
  }
}

// Skrócony interfejs SDK v16 — tylko fragmenty których faktycznie używamy.
export interface OneSignal {
  init(opts: {
    appId: string;
    allowLocalhostAsSecureOrigin?: boolean;
    serviceWorkerParam?: { scope: string };
    serviceWorkerPath?: string;
  }): Promise<void>;
  login(externalId: string): Promise<void>;
  logout(): Promise<void>;
  User: {
    PushSubscription: {
      id: string | null | undefined;
      optedIn: boolean;
      addEventListener(
        event: "change",
        cb: (e: {
          current: { id: string | null | undefined; optedIn: boolean };
        }) => void,
      ): void;
      optIn(): Promise<void>;
      optOut(): Promise<void>;
    };
  };
  Notifications: {
    permission: boolean;
    permissionNative: NotificationPermission;
    requestPermission(): Promise<NotificationPermission>;
  };
  Slidedown: {
    promptPush(opts?: { force?: boolean }): Promise<void>;
  };
}

// @/lib/notifications/onesignal.ts

// ... Twoje interfejsy pozostają bez zmian ...

// Usuń stare withOneSignal i wklej to:
export async function getOneSignal(): Promise<OneSignal | null> {
  if (typeof window === "undefined") return null;

  // Jeśli już jest dostępny, od razu zwracamy
  if (window.OneSignal) return window.OneSignal;

  // Jeśli ładuje się z opóźnieniem (defer/async), sprawdzamy co 500ms (max 3 sekundy)
  return new Promise((resolve) => {
    let attempts = 0;
    const timer = setInterval(() => {
      attempts++;
      if (window.OneSignal) {
        clearInterval(timer);
        resolve(window.OneSignal);
      } else if (attempts >= 6) {
        clearInterval(timer);
        resolve(null); // Timeout po 3 sekundach
      }
    }, 500);
  });
}
