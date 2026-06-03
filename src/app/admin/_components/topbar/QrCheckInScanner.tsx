"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  QrCode,
  X,
  CheckCircle,
  WarningCircle,
  SealCheck,
  ArrowRight,
  ArrowsClockwise,
  CircleNotch,
  UserCircle,
} from "@phosphor-icons/react/dist/ssr";
import type { Html5Qrcode } from "html5-qrcode";

const READER_ID = "admin-qr-reader";

type Participant = { id: string; name: string; email: string };

type ScanResult =
  | { status: "success"; participant: Participant }
  | { status: "already"; participant: Participant }
  | { status: "error"; message: string };

/**
 * Skaner QR odprawy (check-in) — dostępny TYLKO na mobile (przycisk md:hidden).
 * Po zeskanowaniu biletu uczestniczki woła API odprawy, oznacza obecność,
 * a uczestniczka dostaje powiadomienie. Pokazuje imię + akcje:
 * „Przejdź do profilu", „Skanuj dalej", „Zakończ skanowanie".
 */
export function QrCheckInScanner({ tripId }: { tripId: string }) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<"scanning" | "processing" | "done">(
    "scanning",
  );
  const [result, setResult] = useState<ScanResult | null>(null);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const lockRef = useRef(false); // chroni przed podwójnym strzałem po dekodzie

  useEffect(() => setMounted(true), []);

  const stopScanner = useCallback(async () => {
    const scanner = scannerRef.current;
    scannerRef.current = null;
    if (!scanner) return;
    try {
      await scanner.stop();
    } catch {
      /* już zatrzymany — ignorujemy */
    }
    try {
      scanner.clear();
    } catch {
      /* noop */
    }
  }, []);

  const handleDecoded = useCallback(
    async (qrToken: string) => {
      if (lockRef.current) return;
      lockRef.current = true;
      await stopScanner();
      setPhase("processing");

      try {
        const res = await fetch(`/api/admin/wyjazdy/${tripId}/check-in`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ qrToken }),
        });
        const data = await res.json();

        if (!res.ok) {
          setResult({
            status: "error",
            message: data?.error ?? "Nie udało się odprawić.",
          });
        } else if (data.alreadyCheckedIn) {
          setResult({ status: "already", participant: data.participant });
        } else {
          setResult({ status: "success", participant: data.participant });
          navigator.vibrate?.(80);
        }
      } catch {
        setResult({
          status: "error",
          message: "Błąd połączenia. Spróbuj ponownie.",
        });
      } finally {
        setPhase("done");
      }
    },
    [tripId, stopScanner],
  );

  const startScanner = useCallback(async () => {
    lockRef.current = false;

    // Czekamy aż element readera pojawi się w DOM — portal + AnimatePresence
    // mogą go wyrenderować z opóźnieniem. Brak elementu spowodowałby rzut błędu
    // przez Html5Qrcode jeszcze przed wywołaniem getUserMedia, więc prompt
    // o kamerę nigdy by się nie pojawił.
    let attempts = 0;
    while (!document.getElementById(READER_ID) && attempts < 20) {
      await new Promise<void>((r) => setTimeout(r, 50));
      attempts++;
    }
    if (!document.getElementById(READER_ID)) {
      setResult({ status: "error", message: "Nie udało się uruchomić skanera." });
      setPhase("done");
      return;
    }

    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      const scanner = new Html5Qrcode(READER_ID, false);
      scannerRef.current = scanner;
      await scanner.start(
        // `ideal` zamiast ścisłego stringa — iOS rzuca błąd przy exact constraint
        // gdy tylna kamera nie jest natychmiast dostępna, co blokuje prompt uprawnień.
        { facingMode: { ideal: "environment" } },
        { fps: 10, qrbox: { width: 230, height: 230 } },
        (decodedText) => {
          void handleDecoded(decodedText);
        },
        () => {
          /* błędy per-klatka (brak kodu w kadrze) — ignorujemy */
        },
      );
    } catch (err) {
      console.error("[QR] start error", err);
      scannerRef.current = null;
      setResult({
        status: "error",
        message:
          "Brak dostępu do kamery. Zezwól na kamerę w ustawieniach przeglądarki.",
      });
      setPhase("done");
    }
  }, [handleDecoded]);

  useEffect(() => {
    if (!open || phase !== "scanning") return;
    void startScanner();
    return () => {
      void stopScanner();
    };
  }, [open, phase, startScanner, stopScanner]);

  const openScanner = () => {
    setResult(null);
    setPhase("scanning");
    setOpen(true);
  };

  const closeScanner = async () => {
    await stopScanner();
    setOpen(false);
    setResult(null);
    setPhase("scanning");
  };

  const scanNext = () => {
    setResult(null);
    setPhase("scanning");
  };

  const goToProfile = async () => {
    if (!result || result.status === "error") return;
    const pid = result.participant.id;
    await stopScanner();
    setOpen(false);
    router.push(`/admin/wyjazdy/${tripId}/uczestnicy/${pid}`);
  };

  return (
    <>
      {/* Przycisk skanera — tylko mobile */}
      <button
        type="button"
        onClick={openScanner}
        aria-label="Skanuj kod QR uczestniczki"
        className="md:hidden flex items-center justify-center w-10 h-10 shrink-0 rounded-full text-brand-secondary/60 hover:text-brand-primary hover:bg-white/60 transition-colors"
      >
        <QrCode size={22} weight="bold" />
      </button>

      {mounted &&
        createPortal(
          <AnimatePresence>
            {open && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[9999] bg-brand-secondary/95 backdrop-blur-sm flex flex-col"
              >
                {/* Pasek górny */}
                <div className="flex items-center justify-between px-5 pt-6 pb-4 text-white shrink-0">
                  <div className="flex items-center gap-2">
                    <SealCheck
                      size={22}
                      weight="fill"
                      className="text-brand-yellow"
                    />
                    <span className="font-jakarta font-bold text-[15px]">
                      Odprawa QR
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={closeScanner}
                    aria-label="Zamknij skaner"
                    className="w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white"
                  >
                    <X size={18} weight="bold" />
                  </button>
                </div>

                {/* TREŚĆ */}
                <div className="flex-1 flex flex-col items-center justify-center px-6 pb-8">
                  {/* WIDOK SKANOWANIA */}
                  {phase === "scanning" && (
                    <div className="w-full flex flex-col items-center">
                      <div className="relative">
                        <div
                          id={READER_ID}
                          className="w-[260px] h-[260px] overflow-hidden rounded-[28px] bg-black/40 [&_video]:object-cover [&_video]:rounded-[28px] [&_#qr-shaded-region]:!hidden"
                        />
                        {/* Delikatna poświata */}
                        <div className="pointer-events-none absolute inset-0 rounded-[28px] shadow-[0_0_0_4px_rgba(242,217,103,0.15)]" />
                        {/* Narożniki celownika */}
                        <div className="pointer-events-none absolute top-0 left-0 w-10 h-10 border-t-[3px] border-l-[3px] border-brand-yellow rounded-tl-[28px]" />
                        <div className="pointer-events-none absolute top-0 right-0 w-10 h-10 border-t-[3px] border-r-[3px] border-brand-yellow rounded-tr-[28px]" />
                        <div className="pointer-events-none absolute bottom-0 left-0 w-10 h-10 border-b-[3px] border-l-[3px] border-brand-yellow rounded-bl-[28px]" />
                        <div className="pointer-events-none absolute bottom-0 right-0 w-10 h-10 border-b-[3px] border-r-[3px] border-brand-yellow rounded-br-[28px]" />
                      </div>
                      <p className="text-white/70 text-[13px] font-montserrat text-center mt-6 max-w-[260px] leading-relaxed">
                        Skieruj aparat na kod QR z biletu uczestniczki, aby
                        potwierdzić jej obecność.
                      </p>
                    </div>
                  )}

                  {/* PRZETWARZANIE */}
                  {phase === "processing" && (
                    <div className="flex flex-col items-center text-white">
                      <CircleNotch
                        size={42}
                        weight="bold"
                        className="animate-spin text-brand-yellow mb-4"
                      />
                      <p className="text-[14px] font-montserrat text-white/80">
                        Potwierdzam obecność...
                      </p>
                    </div>
                  )}

                  {/* WYNIK */}
                  {phase === "done" && result && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      className="w-full max-w-sm bg-white rounded-[28px] rounded-tr-none shadow-2xl p-7 flex flex-col items-center text-center"
                    >
                      {result.status === "success" && (
                        <>
                          <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mb-4">
                            <CheckCircle
                              size={40}
                              weight="fill"
                              className="text-emerald-500"
                            />
                          </div>
                          <p className="text-[11px] font-bold uppercase tracking-widest text-emerald-600 mb-1">
                            Odprawiono ✨
                          </p>
                          <h3 className="font-jakarta font-bold text-[22px] text-brand-secondary leading-tight">
                            {result.participant.name}
                          </h3>
                          <p className="text-[13px] text-brand-secondary/50 font-montserrat mt-1">
                            {result.participant.email}
                          </p>
                        </>
                      )}

                      {result.status === "already" && (
                        <>
                          <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center mb-4">
                            <SealCheck
                              size={40}
                              weight="fill"
                              className="text-amber-500"
                            />
                          </div>
                          <p className="text-[11px] font-bold uppercase tracking-widest text-amber-600 mb-1">
                            Już odprawiona
                          </p>
                          <h3 className="font-jakarta font-bold text-[22px] text-brand-secondary leading-tight">
                            {result.participant.name}
                          </h3>
                          <p className="text-[13px] text-brand-secondary/50 font-montserrat mt-1">
                            Ta osoba została już wcześniej zameldowana.
                          </p>
                        </>
                      )}

                      {result.status === "error" && (
                        <>
                          <div className="w-16 h-16 rounded-full bg-rose-50 flex items-center justify-center mb-4">
                            <WarningCircle
                              size={40}
                              weight="fill"
                              className="text-rose-500"
                            />
                          </div>
                          <p className="text-[11px] font-bold uppercase tracking-widest text-rose-600 mb-1">
                            Nie udało się
                          </p>
                          <p className="text-[15px] text-brand-secondary font-montserrat font-medium leading-snug">
                            {result.message}
                          </p>
                        </>
                      )}

                      {/* PRZYCISKI AKCJI */}
                      <div className="w-full flex flex-col gap-2.5 mt-7">
                        {result.status !== "error" && (
                          <button
                            type="button"
                            onClick={goToProfile}
                            className="relative w-full h-12 flex items-center justify-center gap-2 rounded-2xl bg-brand-primary text-white font-bold text-[14px] shadow-[0_4px_15px_0px_rgba(242,217,103,0.35)] border border-brand-yellow/30 overflow-hidden active:scale-[0.98] transition-transform"
                          >
                            <span className="absolute bottom-1 right-3 w-8 h-8 bg-brand-yellow/50 blur-[10px] rounded-full pointer-events-none" />
                            <UserCircle
                              size={18}
                              weight="bold"
                              className="relative z-10"
                            />
                            <span className="relative z-10">
                              Przejdź do profilu
                            </span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={scanNext}
                          className="w-full h-12 flex items-center justify-center gap-2 rounded-2xl bg-brand-secondary/5 text-brand-secondary font-bold text-[14px] hover:bg-brand-secondary/10 active:scale-[0.98] transition-all"
                        >
                          <ArrowsClockwise size={18} weight="bold" />
                          Skanuj dalej
                        </button>

                        <button
                          type="button"
                          onClick={closeScanner}
                          className="w-full h-11 flex items-center justify-center gap-1.5 rounded-2xl text-brand-secondary/50 font-semibold text-[13px] hover:text-brand-secondary/80 transition-colors"
                        >
                          Zakończ skanowanie
                          <ArrowRight size={15} weight="bold" />
                        </button>
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* STOPKA — „Zakończ" widoczny podczas samego skanowania */}
                {phase === "scanning" && (
                  <div className="px-6 pb-8 shrink-0">
                    <button
                      type="button"
                      onClick={closeScanner}
                      className="w-full h-12 flex items-center justify-center rounded-2xl bg-white/10 text-white font-bold text-[14px] hover:bg-white/20 transition-colors backdrop-blur-md"
                    >
                      Zakończ skanowanie
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
}
