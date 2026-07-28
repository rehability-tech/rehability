"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Envelope } from "@phosphor-icons/react/dist/ssr";
import { motion, AnimatePresence } from "framer-motion";
import type { EmailSection } from "../lib/sections";
import type { TripContext } from "../lib/types";
import { templateToHtml } from "../lib/templateHelpers";
import EmailPreview from "./EmailPreview";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  sections: EmailSection[];
  subject: string;
  tripContext: TripContext;
  previewInviterName: string;
  previewInviteeName: string;
}

export default function EmailInboxPreviewModal({
  isOpen,
  onClose,
  sections,
  subject,
  tripContext,
  previewInviterName,
  previewInviteeName,
}: Props) {
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  const previewValues: Record<string, string> = {
    inviterName: previewInviterName,
    campName: tripContext.title || "Nazwa wydarzenia",
    inviteeName: previewInviteeName,
  };

  const resolvedSubject = subject
    ? templateToHtml(subject, previewValues).replace(/<[^>]+>/g, "")
    : "Zaproszenie na wspólne wydarzenie";

  if (typeof window === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-black/65 backdrop-blur-sm" />

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            onClick={e => e.stopPropagation()}
            className="relative z-10 w-full max-w-[600px] max-h-[90vh] flex flex-col rounded-3xl rounded-tr-none overflow-hidden shadow-[0_40px_100px_rgba(3,63,99,0.40)]"
            style={{ fontFamily: "'Montserrat','Helvetica Neue',Helvetica,Arial,sans-serif" }}
          >
            {/* ── Inbox chrome ─────────────────────────────────────────────── */}
            <div className="bg-[#f1f3f4] border-b border-gray-200/80 px-4 py-3 shrink-0">
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-[#287d88] flex items-center justify-center text-white font-bold text-sm shrink-0">
                    R
                  </div>
                  <div>
                    <p className="text-[12.5px] font-semibold text-gray-800 font-montserrat leading-tight">Rehability</p>
                    <p className="text-[10px] text-gray-400 font-montserrat">
                      noreply@rehability.pl → {previewInviteeName || "adresat"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-white/70 hover:bg-white flex items-center justify-center text-gray-500 transition-colors cursor-pointer border border-gray-200"
                >
                  <X size={15} weight="bold" />
                </button>
              </div>
              <div className="flex items-center gap-2">
                <Envelope size={13} weight="fill" className="text-gray-400 shrink-0" />
                <p className="text-[13px] font-semibold text-gray-900 font-montserrat truncate">
                  {resolvedSubject}
                </p>
              </div>
            </div>

            {/* ── Scrollable email body — identyczny render jak w edytorze ──── */}
            <div className="overflow-y-auto flex-1" style={{ backgroundColor: "#eef4f5" }}>
              <EmailPreview
                readonly
                sections={sections}
                tripContext={tripContext}
                previewValues={previewValues}
                previewInviterName={previewInviterName}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
