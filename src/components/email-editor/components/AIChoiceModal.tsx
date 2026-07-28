"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Envelope, PencilSimple, Sparkle, Warning } from "@phosphor-icons/react/dist/ssr";

interface AIChoiceModalProps {
  isOpen: boolean;
  onAI: () => void;
  onManual: () => void;
  /** When true shows a warning that existing content will be overwritten */
  showWarning?: boolean;
}

export default function AIChoiceModal({ isOpen, onAI, onManual, showWarning = false }: AIChoiceModalProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="ai-choice-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[300] flex items-center justify-center p-4"
          style={{ background: "rgba(3,63,99,0.45)", backdropFilter: "blur(6px)" }}
        >
          <motion.div
            key="ai-choice-card"
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md overflow-hidden"
            style={{
              background: "linear-gradient(145deg,#ffffff,#f4fafb)",
              borderRadius: "24px 0 24px 24px",
              boxShadow: "0 32px 64px -16px rgba(3,63,99,.32), 0 0 0 1px rgba(40,125,136,.12)",
            }}
          >
            {/* Top gradient stripe */}
            <div style={{ height: 4, background: "linear-gradient(90deg,#287d88,#1d6b76 50%,#f2d967)" }} />

            {/* Yellow glow */}
            <div className="pointer-events-none absolute -top-8 -right-8 w-36 h-36 bg-[#f2d967]/30 blur-[50px] rounded-full" />

            <div className="p-8">
              {/* Icon */}
              <div className="flex justify-center mb-5">
                <div style={{
                  width: 56, height: 56,
                  borderRadius: "16px 0 16px 16px",
                  background: "linear-gradient(135deg,#287d88,#1d6b76)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: "0 8px 24px rgba(242,217,103,.45), 0 4px 12px rgba(40,125,136,.3)",
                }}>
                  <Envelope size={26} weight="fill" color="#fff" />
                </div>
              </div>

              {/* Title */}
              <h2 className="text-center font-jakarta font-bold text-xl text-[#0B3B4C] mb-1">
                E-mail zaproszenia
              </h2>
              <p className="text-center font-montserrat text-sm text-gray-400 mb-5">
                Jak chcesz przygotować treść tego e-maila?
              </p>

              {/* Warning — shown when overwriting existing content */}
              {showWarning && (
                <div className="flex items-start gap-2.5 mb-5 px-4 py-3 rounded-[12px] bg-amber-50 border border-amber-200">
                  <Warning size={16} weight="fill" className="text-amber-500 shrink-0 mt-0.5" />
                  <p className="font-montserrat text-[12px] text-amber-700 leading-relaxed">
                    <strong>Uwaga:</strong> wybór dowolnej opcji <strong>nadpisze</strong> dotychczasową treść e-maila. Tej operacji nie można cofnąć.
                  </p>
                </div>
              )}

              {/* Option: AI */}
              <motion.button
                type="button"
                onClick={onAI}
                whileHover={{ scale: 1.015 }}
                whileTap={{ scale: 0.985 }}
                className="w-full text-left mb-3"
                style={{
                  background: "linear-gradient(135deg,#287d88,#1d6b76)",
                  borderRadius: "16px 0 16px 16px",
                  padding: "18px 20px",
                  border: "1px solid rgba(242,217,103,.35)",
                  boxShadow: "0 6px 20px rgba(242,217,103,.38), 0 2px 8px rgba(40,125,136,.3)",
                  cursor: "pointer",
                  display: "block",
                }}
              >
                <div className="flex items-center gap-3">
                  <div style={{
                    width: 38, height: 38, borderRadius: "10px 0 10px 10px",
                    background: "rgba(255,255,255,.18)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0,
                  }}>
                    <Sparkle size={19} weight="fill" color="#f2d967" />
                  </div>
                  <div>
                    <p className="font-jakarta font-bold text-white text-[15px] leading-tight">
                      Generuj z AI
                    </p>
                    <p className="font-montserrat text-[11px] text-white/70 mt-0.5">
                      Gemini napisze treść na podstawie danych wydarzenia
                    </p>
                  </div>
                </div>
              </motion.button>

              {/* Option: Manual */}
              <motion.button
                type="button"
                onClick={onManual}
                whileHover={{ scale: 1.015 }}
                whileTap={{ scale: 0.985 }}
                className="w-full text-left"
                style={{
                  background: "rgba(40,125,136,.05)",
                  borderRadius: "16px 0 16px 16px",
                  padding: "18px 20px",
                  border: "1.5px solid rgba(40,125,136,.18)",
                  cursor: "pointer",
                  display: "block",
                }}
              >
                <div className="flex items-center gap-3">
                  <div style={{
                    width: 38, height: 38, borderRadius: "10px 0 10px 10px",
                    background: "rgba(40,125,136,.1)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0,
                  }}>
                    <PencilSimple size={19} weight="fill" color="#287d88" />
                  </div>
                  <div>
                    <p className="font-jakarta font-bold text-[#033f63] text-[15px] leading-tight">
                      Piszę samodzielnie
                    </p>
                    <p className="font-montserrat text-[11px] text-gray-400 mt-0.5">
                      Zacznij od domyślnego szablonu i edytuj ręcznie
                    </p>
                  </div>
                </div>
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
