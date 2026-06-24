"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  CheckCircle,
  ShieldCheck,
  Lightning,
  Devices,
  ArrowRight,
} from "@phosphor-icons/react/dist/ssr";
import confetti from "canvas-confetti";
import Portal from "@/components/ui/Portal";
import { isStandalone } from "@/lib/pwa/clientEnv";
import { triggerInstallPrompt } from "@/lib/pwa/triggers";

/**
 * Sekwencja powitalna po zakupie kursu (zastępuje dawną stronę sukcesu).
 * Klientka wraca na /panel/vod?zakup=sukces — pokazujemy:
 *   1) modal potwierdzenia zakupu (z konfetti),
 *   2) po zamknięciu — prompt instalacji aplikacji, o ile nie jest zainstalowana.
 */
export function PurchaseSuccessFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const isSuccess =
    searchParams.get("zakup") === "sukces" &&
    searchParams.get("redirect_status") !== "failed";

  const [open, setOpen] = useState(isSuccess);
  const confettiFiredRef = useRef(false);

  // Konfetti przy wejściu.
  useEffect(() => {
    if (!open || confettiFiredRef.current) return;
    confettiFiredRef.current = true;

    const fire = (originX: number) => {
      confetti({
        particleCount: 80,
        spread: 70,
        startVelocity: 45,
        origin: { x: originX, y: 0.55 },
        colors: ["#287d88", "#f2d967", "#033f63", "#ffffff"],
      });
    };
    fire(0.3);
    setTimeout(() => fire(0.7), 200);
    setTimeout(() => fire(0.5), 450);
  }, [open]);

  if (!isSuccess) return null;

  // Czyści parametry z URL, żeby modal nie wracał po odświeżeniu.
  const cleanUrl = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("zakup");
    params.delete("payment_intent");
    params.delete("payment_intent_client_secret");
    params.delete("redirect_status");
    const qs = params.toString();
    router.replace(qs ? `?${qs}` : window.location.pathname, { scroll: false });
  };

  const handleContinue = () => {
    setOpen(false);
    cleanUrl();
    // Kolejny krok sekwencji: instalacja aplikacji — tylko gdy nie jest jeszcze
    // zainstalowana (PWAInstallPrompt sam ignoruje wywołanie w trybie standalone).
    if (!isStandalone()) {
      setTimeout(() => triggerInstallPrompt(), 350);
    }
  };

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
            onClick={handleContinue}
          >
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.96 }}
              transition={{ type: "spring", stiffness: 280, damping: 26 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-[440px] bg-white/95 backdrop-blur-2xl border border-white/60 rounded-3xl rounded-tr-none shadow-[0_30px_80px_-20px_rgba(3,63,99,0.4)] overflow-hidden"
            >
              {/* żółta poświata */}
              <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-brand-yellow/40 rounded-full blur-2xl pointer-events-none" />

              <div className="relative p-8 flex flex-col items-center text-center gap-4">
                <motion.div
                  initial={{ scale: 0, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 240, damping: 14 }}
                  className="relative w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-[0_10px_30px_-8px_rgba(16,185,129,0.6)]"
                >
                  <span className="pointer-events-none absolute inset-0 rounded-full bg-emerald-400/40 blur-2xl -z-10" />
                  <CheckCircle size={44} weight="fill" className="text-white" />
                </motion.div>

                <h2 className="font-jakarta font-extrabold text-[24px] text-brand-secondary leading-tight">
                  Płatność zakończona sukcesem! 🎉
                </h2>
                <p className="font-montserrat text-[14px] text-brand-secondary/70 leading-relaxed max-w-[330px]">
                  Dziękujemy za zakup! Kurs został odblokowany na Twojej
                  platformie VOD — masz do niego dożywotni dostęp i możesz zacząć
                  ćwiczyć od razu.
                </p>

                {/* Korzyści */}
                <div className="w-full mt-1 grid grid-cols-3 gap-2.5">
                  {[
                    { icon: ShieldCheck, label: "Dożywotni dostęp" },
                    { icon: Lightning, label: "Dostępny od razu" },
                    { icon: Devices, label: "Każde urządzenie" },
                  ].map(({ icon: Icon, label }) => (
                    <div
                      key={label}
                      className="flex flex-col items-center gap-1.5 bg-brand-primary/5 border border-brand-primary/10 rounded-2xl rounded-tr-none px-2 py-3"
                    >
                      <Icon
                        size={20}
                        weight="fill"
                        className="text-brand-primary"
                      />
                      <span className="font-montserrat text-[10.5px] font-semibold text-brand-secondary/70 leading-tight">
                        {label}
                      </span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={handleContinue}
                  className="group relative mt-3 inline-flex w-full items-center justify-center gap-2 bg-brand-primary text-white font-montserrat font-bold text-[14px] px-6 py-3.5 rounded-2xl rounded-tr-[3px] border border-brand-yellow/30 shadow-[0_8px_24px_-6px_rgba(40,125,136,0.6)] hover:shadow-[0_12px_30px_0px_rgba(242,217,103,0.5)] transition-all overflow-hidden"
                >
                  <span className="pointer-events-none absolute -right-2 -bottom-2 size-10 rounded-full bg-brand-yellow/50 blur-[16px]" />
                  <span className="relative inline-flex items-center gap-2">
                    Przejdź do nauki
                    <ArrowRight
                      size={16}
                      weight="bold"
                      className="group-hover:translate-x-0.5 transition-transform"
                    />
                  </span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Portal>
  );
}
