"use client";

import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  PencilSimple,
  Sparkle,
  Tag,
  X,
  CalendarBlank,
} from "@phosphor-icons/react/dist/ssr";
import {
  ScheduleEntry,
  STATUS_DOT,
  STATUS_LABELS,
  formatDisplayDate,
} from "./types";
import Portal from "@/components/ui/Portal";

interface Props {
  entry: ScheduleEntry | null;
  onClose: () => void;
}

export default function EntryDetailModal({ entry, onClose }: Props) {
  const router = useRouter();

  return (
    <Portal>
    <AnimatePresence>
      {entry && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/20 backdrop-blur-md px-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative bg-white w-full max-w-md rounded-[28px] p-7 shadow-2xl overflow-hidden border border-white/50"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Bardzo delikatny dekoracyjny gradient */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-brand-primary/[0.03] rounded-full blur-3xl pointer-events-none" />

            {/* Zamknij - POPRAWIONY Z-INDEX (z-50) */}
            <button
              type="button"
              onClick={onClose}
              className="absolute top-5 right-5 p-2 bg-gray-50 hover:bg-gray-100 rounded-full text-brand-secondary/40 hover:text-brand-secondary transition-colors z-50 cursor-pointer"
            >
              <X size={16} weight="bold" />
            </button>

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <span className="inline-block text-[10px] font-bold uppercase tracking-wider font-montserrat px-3 py-1.5 rounded-lg bg-brand-primary/10 text-brand-primary">
                  {entry.category}
                </span>
                <p className="flex items-center gap-1.5 text-[11px] font-bold text-brand-secondary/40 font-montserrat mr-8">
                  <CalendarBlank size={14} />
                  {formatDisplayDate(entry.scheduledDate)}
                </p>
              </div>

              <h3 className="text-[18px] font-jakarta font-bold text-brand-secondary leading-snug mb-3">
                {entry.title}
              </h3>

              <p className="text-[13px] text-brand-secondary/60 font-montserrat leading-relaxed mb-5">
                {entry.topic}
              </p>

              {entry.keywords.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pb-5 mb-5 border-b border-gray-100/60">
                  {entry.keywords.map((kw) => (
                    <span
                      key={kw}
                      className="flex items-center gap-1 text-[10px] font-bold font-montserrat text-brand-secondary/50 bg-gray-50 border border-gray-100 px-2 py-1 rounded-lg"
                    >
                      <Tag size={10} weight="fill" />
                      {kw}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-2 pb-5 mb-5 border-b border-gray-100/60">
                <span
                  className={`w-2 h-2 rounded-full ${STATUS_DOT[entry.status]}`}
                />
                <span className="text-[11px] font-bold uppercase tracking-wider text-brand-secondary/50 font-montserrat">
                  {STATUS_LABELS[entry.status]}
                </span>
              </div>

              {/* Przyciski Akcji */}
              <div className="flex flex-col gap-2.5">
                {entry.postId ? (
                  <>
                    <button
                      onClick={() =>
                        router.push(
                          `/admin/blog/dodaj/edytor-tresci?id=${entry.postId}`,
                        )
                      }
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-brand-primary text-white text-[13px] font-semibold font-montserrat rounded-xl hover:bg-[#1E6068] transition-colors"
                    >
                      <PencilSimple size={16} weight="bold" />
                      Kontynuuj edycję artykułu
                    </button>
                    <button
                      onClick={() =>
                        router.push(`/admin/blog/dodaj/seo?id=${entry.postId}`)
                      }
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-50 text-brand-secondary text-[13px] font-semibold font-montserrat rounded-xl hover:bg-gray-100 transition-colors"
                    >
                      Przejdź do SEO i publikacji
                    </button>
                  </>
                ) : (
                  <div className="flex gap-3">
                    <button
                      onClick={() =>
                        router.push(
                          `/admin/blog/dodaj/dane-podstawowe?scheduleId=${entry.id}`,
                        )
                      }
                      className="flex-1 flex items-center justify-center gap-2 px-2 py-3 bg-gray-50 text-brand-secondary text-[12px] font-semibold font-montserrat rounded-xl hover:bg-gray-100 transition-colors"
                    >
                      <PencilSimple size={16} weight="bold" />
                      Napisz sam
                    </button>
                    <button
                      onClick={() =>
                        router.push(
                          `/admin/blog/dodaj/dane-podstawowe?scheduleId=${entry.id}&autogenerate=true`,
                        )
                      }
                      className="group flex-[1.2] flex items-center justify-center gap-2 px-2 py-3 bg-gradient-to-r from-brand-primary to-[#1E6068] text-white text-[12px] font-semibold font-montserrat rounded-xl hover:opacity-90 transition-all shadow-[0_8px_20px_-6px_rgba(40,125,136,0.4)]"
                    >
                      <Sparkle
                        size={14}
                        weight="fill"
                        className="text-brand-yellow/90 group-hover:scale-110 transition-transform"
                      />
                      Wygeneruj przez AI
                    </button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
    </Portal>
  );
}
