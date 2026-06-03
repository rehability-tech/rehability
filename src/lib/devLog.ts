/**
 * Logger debugowy aktywny WYŁĄCZNIE poza produkcją.
 *
 * Na produkcji (`NODE_ENV === "production"`) wszystkie wywołania są no-opami —
 * nie zaśmiecają logów i nie wyciekają wrażliwych danych (np. nagłówków auth).
 * Do realnych błędów produkcyjnych używaj wprost `console.error` / `console.warn`.
 *
 * Użycie:
 *   import { devLog } from "@/lib/devLog";
 *   devLog.log("PROVIDED", headerAuth);
 *   devLog.warn("coś podejrzanego", payload);
 */
const isDev = process.env.NODE_ENV !== "production";

export const devLog = {
  log: (...args: unknown[]) => {
    if (isDev) console.log(...args);
  },
  warn: (...args: unknown[]) => {
    if (isDev) console.warn(...args);
  },
  error: (...args: unknown[]) => {
    if (isDev) console.error(...args);
  },
};
