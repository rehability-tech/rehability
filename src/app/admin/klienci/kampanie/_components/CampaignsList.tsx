"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  PaperPlaneTilt,
  Plus,
  Users,
  Eye,
  Trash,
  CaretRight,
  CaretLeft,
} from "@phosphor-icons/react/dist/ssr";

interface CampaignRow {
  id: string;
  name: string;
  subject: string;
  status: string;
  totalRecipients: number;
  sentCount: number;
  deliveredCount: number;
  openedCount: number;
  bouncedCount: number;
  filterSources: string[];
  sentAt: string | null;
  updatedAt: string;
}

const STATUS_META: Record<string, { label: string; className: string }> = {
  DRAFT: { label: "Szkic", className: "bg-gray-100 text-gray-500" },
  SCHEDULED: { label: "Zaplanowana", className: "bg-amber-50 text-amber-600" },
  SENDING: { label: "Wysyłka...", className: "bg-blue-50 text-blue-600" },
  SENT: { label: "Wysłana", className: "bg-emerald-50 text-emerald-600" },
  FAILED: { label: "Błąd", className: "bg-rose-50 text-rose-600" },
};

export default function CampaignsList({
  campaigns,
}: {
  campaigns: CampaignRow[];
}) {
  const router = useRouter();
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm("Usunąć tę kampanię? Tej operacji nie można cofnąć.")) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/admin/kampanie/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      toast.success("Kampania usunięta.");
      router.refresh();
    } catch {
      toast.error("Nie udało się usunąć kampanii.");
    } finally {
      setDeleting(null);
    }
  };

  const openRate = (c: CampaignRow) =>
    c.deliveredCount > 0
      ? Math.round((c.openedCount / c.deliveredCount) * 100)
      : 0;

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      {/* NAGŁÓWEK */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/60 backdrop-blur-xl border border-white/80 p-6 rounded-[28px] rounded-tr-none shadow-sm">
        <div>
          <Link
            href="/admin/klienci"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-secondary/50 hover:text-brand-primary transition-colors mb-2"
          >
            <CaretLeft size={14} weight="bold" />
            Baza kontaktów
          </Link>
          <h1 className="font-jakarta font-bold text-2xl text-brand-secondary flex items-center gap-3 flex-wrap">
            <div className="p-2.5 bg-brand-primary/10 text-brand-primary rounded-xl">
              <PaperPlaneTilt size={24} weight="fill" />
            </div>
            Kampanie mailingowe
            <span className="px-3 py-1 bg-white border border-gray-100 rounded-full text-sm text-brand-primary shadow-sm">
              {campaigns.length}
            </span>
          </h1>
        </div>

        <Link
          href="/admin/klienci/kampanie/dodaj"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-primary text-white text-sm font-bold shadow-[0_4px_15px_0px_rgba(242,217,103,0.35)] border border-brand-yellow/30 hover:opacity-90 transition-opacity self-start"
        >
          <Plus size={16} weight="bold" />
          Nowa kampania
        </Link>
      </div>

      {/* LISTA */}
      {campaigns.length === 0 ? (
        <div className="bg-white/50 backdrop-blur-xl border border-white/80 rounded-[28px] rounded-tr-none shadow-sm p-12 text-center">
          <PaperPlaneTilt
            size={40}
            weight="duotone"
            className="text-brand-primary/40 mx-auto mb-4"
          />
          <p className="text-brand-secondary/60 font-medium">
            Brak kampanii. Utwórz pierwszą, aby wysłać wiadomość do swoich
            kontaktów.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {campaigns.map((c, i) => {
            const status = STATUS_META[c.status] ?? STATUS_META.DRAFT;
            return (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.04, 0.3) }}
                className="bg-white/60 backdrop-blur-xl border border-white/80 rounded-3xl rounded-tr-none shadow-sm p-5 flex flex-col gap-4 group"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`inline-flex px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${status.className}`}
                      >
                        {status.label}
                      </span>
                      {c.filterSources.map((s) => (
                        <span
                          key={s}
                          className="text-[10px] font-bold text-brand-secondary/40 uppercase tracking-wide"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                    <h3 className="font-bold text-brand-secondary text-[15px] truncate">
                      {c.name}
                    </h3>
                    <p className="text-xs text-brand-secondary/50 font-medium truncate mt-0.5">
                      {c.subject || "Bez tematu"}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(c.id)}
                    disabled={deleting === c.id}
                    className="shrink-0 w-9 h-9 rounded-xl bg-white border border-gray-200 text-gray-400 hover:text-rose-500 hover:border-rose-200 transition-colors flex items-center justify-center disabled:opacity-50"
                    aria-label="Usuń"
                  >
                    <Trash size={16} weight="bold" />
                  </button>
                </div>

                {/* STATYSTYKI */}
                <div className="flex items-center gap-5 text-sm">
                  <div
                    className="flex items-center gap-1.5 text-brand-secondary/70"
                    title="Odbiorcy"
                  >
                    <Users
                      size={16}
                      weight="duotone"
                      className="text-brand-primary/60"
                    />
                    <span className="font-bold tabular-nums">
                      {c.sentCount}/{c.totalRecipients}
                    </span>
                  </div>
                  <div
                    className="flex items-center gap-1.5 text-brand-secondary/70"
                    title="Open rate"
                  >
                    <Eye
                      size={16}
                      weight="duotone"
                      className="text-emerald-500/70"
                    />
                    <span className="font-bold tabular-nums">
                      {openRate(c)}%
                    </span>
                  </div>
                  {c.bouncedCount > 0 && (
                    <span className="text-xs font-bold text-rose-500">
                      {c.bouncedCount} odbić
                    </span>
                  )}
                </div>

                <Link
                  href={`/admin/klienci/kampanie/${c.id}`}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-gray-200 text-brand-secondary text-sm font-bold hover:bg-brand-primary hover:text-white hover:border-brand-primary transition-all self-start"
                >
                  {c.status === "DRAFT" ? "Edytuj" : "Szczegóły"}
                  <CaretRight size={15} weight="bold" />
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
