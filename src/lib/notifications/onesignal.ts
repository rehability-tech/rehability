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

export async function withOneSignal(cb: (os: OneSignal) => void) {
  if (typeof window === "undefined") return;
  window.OneSignalDeferred = window.OneSignalDeferred || [];
  window.OneSignalDeferred.push(cb);
}
