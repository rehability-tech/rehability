"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  CircleNotch,
  CheckCircle,
  WarningCircle,
  X,
} from "@phosphor-icons/react/dist/ssr";
import confetti from "canvas-confetti";
import Portal from "@/components/ui/Portal";

type Phase = "processing" | "success" | "timeout";

interface Props {
  bookingId: string;
  onConfirmed?: () => void;
}

const POLL_INTERVAL_MS = 1500;
const POLL_TIMEOUT_MS = 30_000;

const PAID_STATUSES = new Set(["DEPOSIT_PAID", "FULLY_PAID"]);

export default function PaymentSuccessModal({
  bookingId,
  onConfirmed,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const status = searchParams.get("status");

  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<Phase>("processing");
  const [paidStatus, setPaidStatus] = useState<string | null>(null);
  const confettiFiredRef = useRef(false);

  useEffect(() => {
    if (status !== "processing") {
      setOpen(false);
      return;
    }
    setOpen(true);
    setPhase("processing");
    confettiFiredRef.current = false;

    const startedAt = Date.now();
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const poll = async () => {
      if (cancelled) return;

      try {
        const res = await fetch(
          `/api/panel/wydarzenia/${bookingId}/status?t=${Date.now()}`,
          { cache: "no-store" },
        );
        if (res.ok) {
          const data = (await res.json()) as { status: string };
          if (PAID_STATUSES.has(data.status)) {
            setPaidStatus(data.status);
            setPhase("success");
            onConfirmed?.();
            return;
          }
        }
      } catch {
        // ignoruj, spróbujemy ponownie
      }

      if (Date.now() - startedAt > POLL_TIMEOUT_MS) {
        setPhase("timeout");
        return;
      }

      timer = setTimeout(poll, POLL_INTERVAL_MS);
    };

    poll();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [status, bookingId, onConfirmed]);

  // Confetti przy wejściu w fazę success
  useEffect(() => {
    if (phase !== "success" || confettiFiredRef.current) return;
    confettiFiredRef.current = true;

    const fire = (originX: number) => {
      confetti({
        particleCount: 80,
        spread: 70,
        startVelocity: 45,
        origin: { x: originX, y: 0.6 },
        colors: ["#287d88", "#f2d967", "#033f63", "#ffffff"],
      });
    };

    fire(0.3);
    setTimeout(() => fire(0.7), 200);
    setTimeout(() => fire(0.5), 450);
  }, [phase]);

  const handleClose = () => {
    setOpen(false);
    // wyczyść query params, żeby modal nie pojawiał się ponownie przy odświeżeniu
    const newParams = new URLSearchParams(searchParams.toString());
    newParams.delete("status");
    newParams.delete("session_id");
    newParams.delete("payment_intent");
    newParams.delete("payment_intent_client_secret");
    newParams.delete("redirect_status");
    const qs = newParams.toString();
    router.replace(qs ? `?${qs}` : window.location.pathname, { scroll: false });
  };

  const isFullyPaid = paidStatus === "FULLY_PAID";

  return (
    <Portal>
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-brand-secondary/40 backdrop-blur-sm"
          onClick={phase !== "processing" ? handleClose : undefined}
        >
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 280, damping: 26 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-[420px] bg-white/95 backdrop-blur-2xl border border-white/60 rounded-3xl rounded-tr-none shadow-[0_30px_80px_-20px_rgba(3,63,99,0.4)] overflow-hidden"
          >
            {/* żółta poświata */}
            <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-brand-yellow/40 rounded-full blur-2xl pointer-events-none" />

            {/* X tylko po zakończeniu pollingu */}
            {phase !== "processing" && (
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/80 hover:bg-white border border-white/60 flex items-center justify-center text-brand-secondary/60 hover:text-brand-secondary transition z-10"
                aria-label="Zamknij"
              >
                <X size={14} weight="bold" />
              </button>
            )}

            <div className="relative p-8 flex flex-col items-center text-center gap-4">
              {phase === "processing" && (
                <>
                  <div className="w-16 h-16 rounded-full bg-brand-primary/10 flex items-center justify-center">
                    <CircleNotch
                      size={32}
                      weight="bold"
                      className="text-brand-primary animate-spin"
                    />
                  </div>
                  <h2 className="font-jakarta font-extrabold text-[22px] text-brand-secondary leading-tight">
                    Przetwarzamy Twoją płatność...
                  </h2>
                  <p className="font-montserrat text-[13px] text-brand-secondary/60 leading-relaxed max-w-[300px]">
                    To zwykle trwa kilka sekund. Nie zamykaj tej strony — zaraz
                    potwierdzimy rezerwację.
                  </p>
                </>
              )}

              {phase === "success" && (
                <>
                  <motion.div
                    initial={{ scale: 0, rotate: -20 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{
                      type: "spring",
                      stiffness: 240,
                      damping: 14,
                    }}
                    className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-[0_10px_30px_-8px_rgba(16,185,129,0.6)]"
                  >
                    <CheckCircle size={44} weight="fill" className="text-white" />
                  </motion.div>
                  <h2 className="font-jakarta font-extrabold text-[24px] text-brand-secondary leading-tight">
                    {isFullyPaid
                      ? "Wpłata zaksięgowana! 🎉"
                      : "Zadatek zaksięgowany! 🎉"}
                  </h2>
                  <p className="font-montserrat text-[14px] text-brand-secondary/70 leading-relaxed max-w-[320px]">
                    {isFullyPaid
                      ? "Twoje miejsce na wydarzeniu jest w pełni opłacone. Czekamy na Ciebie!"
                      : "Twoje miejsce jest zarezerwowane. Resztę kwoty dopłacisz w panelu."}
                  </p>
                  <button
                    onClick={handleClose}
                    className="mt-2 px-6 py-3 rounded-2xl bg-brand-primary text-white font-bold text-[13px] shadow-[0_6px_18px_-4px_rgba(40,125,136,0.5)] hover:shadow-[0_8px_22px_-4px_rgba(40,125,136,0.6)] transition"
                  >
                    Przejdź do panelu
                  </button>
                </>
              )}

              {phase === "timeout" && (
                <>
                  <div className="w-16 h-16 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center">
                    <WarningCircle
                      size={32}
                      weight="fill"
                      className="text-amber-500"
                    />
                  </div>
                  <h2 className="font-jakarta font-extrabold text-[20px] text-brand-secondary leading-tight">
                    Płatność trwa dłużej niż zwykle
                  </h2>
                  <p className="font-montserrat text-[13px] text-brand-secondary/60 leading-relaxed max-w-[320px]">
                    Twoja płatność może być w trakcie księgowania. Sprawdź email
                    za chwilę — gdy potwierdzimy, status zaktualizuje się
                    automatycznie.
                  </p>
                  <button
                    onClick={handleClose}
                    className="mt-2 px-6 py-3 rounded-2xl bg-white border border-brand-secondary/20 text-brand-secondary font-bold text-[13px] hover:bg-brand-secondary/5 transition"
                  >
                    Rozumiem
                  </button>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
    </Portal>
  );
}
