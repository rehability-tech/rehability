/**
 * Adapter providera Resend (implementacja `MailProvider`).
 *
 * Jedyny plik modułu importujący SDK `resend`. Wymiana providera = napisanie
 * innego pliku spełniającego ten sam interfejs. Best-effort: brak klucza API
 * nie wywraca aplikacji — zwraca błędy per-wiadomość, a wysyłka jest pomijana.
 */
import { Resend } from "resend";
import type { MailProvider, OutgoingMessage, SendResult } from "../types";

// Resend batch API przyjmuje do 100 wiadomości na wywołanie.
export const RESEND_BATCH_LIMIT = 100;

export function createResendProvider(apiKey?: string): MailProvider {
  const client = apiKey ? new Resend(apiKey) : null;

  return {
    async sendBatch(messages: OutgoingMessage[]): Promise<SendResult[]> {
      if (messages.length === 0) return [];
      if (!client) {
        return messages.map((m) => ({
          to: m.to,
          ok: false,
          error: "RESEND_API_KEY missing — wysyłka pominięta.",
        }));
      }

      try {
        const { data, error } = await client.batch.send(
          messages.map((m) => ({
            from: m.from,
            to: m.to,
            subject: m.subject,
            html: m.html,
            replyTo: m.replyTo,
            headers: m.headers,
          })),
        );

        if (error) {
          return messages.map((m) => ({
            to: m.to,
            ok: false,
            error: error.message ?? "Resend batch error",
          }));
        }

        // Resend zwraca ID w tej samej kolejności co wejście. Normalizujemy
        // kształt (różne wersje SDK: `data` lub `data.data`).
        const raw = data as unknown;
        const ids: Array<{ id?: string }> = Array.isArray(raw)
          ? (raw as Array<{ id?: string }>)
          : ((raw as { data?: Array<{ id?: string }> })?.data ?? []);

        return messages.map((m, i) => ({
          to: m.to,
          ok: true,
          providerMessageId: ids[i]?.id,
        }));
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        return messages.map((m) => ({ to: m.to, ok: false, error: msg }));
      }
    },
  };
}
