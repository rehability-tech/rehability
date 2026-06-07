"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Envelope,
  Plus,
  PencilSimple,
  Trash,
  CircleNotch,
  Clock,
  Tag,
} from "@phosphor-icons/react/dist/ssr";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Template {
  id: string;
  name: string;
  subject: string;
  category: string;
  status: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

const CATEGORY_LABELS: Record<string, string> = {
  general: "Ogólny",
  invitation: "Zaproszenie",
  reminder: "Przypomnienie",
  welcome: "Powitalny",
  payment: "Płatność",
};

export default function EmailTemplatesList({
  templates: initial,
}: {
  templates: Template[];
}) {
  const router = useRouter();
  const [templates, setTemplates] = useState(initial);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Usunąć szablon „${name}"?`)) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/email-templates/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      setTemplates((prev) => prev.filter((t) => t.id !== id));
      toast.success("Szablon usunięty");
    } catch {
      toast.error("Błąd usuwania szablonu");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-jakarta font-bold text-[#033f63]">
            Szablony Maili
          </h1>
          <p className="text-sm text-gray-400 font-montserrat mt-1">
            Twórz i zarządzaj szablonami wiadomości e-mail
          </p>
        </div>
        <Link href="/admin/klienci/szablony-maili/dodaj">
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-2xl rounded-tr-none bg-brand-primary text-white text-sm font-semibold font-montserrat shadow-[0_4px_15px_0px_rgba(40,125,136,0.3)] hover:scale-[1.02] transition-all relative overflow-hidden group">
            <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-brand-yellow/50 blur-[10px] rounded-full pointer-events-none" />
            <Plus size={16} weight="bold" className="relative z-10" />
            <span className="relative z-10">Nowy szablon</span>
          </button>
        </Link>
      </div>

      {/* Empty state */}
      {templates.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 rounded-3xl rounded-tr-none border border-dashed border-brand-primary/20 bg-white/40">
          <div className="w-16 h-16 rounded-2xl rounded-tr-none bg-brand-primary/10 flex items-center justify-center mb-4">
            <Envelope size={28} className="text-brand-primary/60" />
          </div>
          <p className="text-[#033f63] font-jakarta font-semibold text-lg mb-1">
            Brak szablonów maili
          </p>
          <p className="text-sm text-gray-400 font-montserrat mb-5">
            Utwórz pierwszy szablon, aby zacząć
          </p>
          <Link href="/admin/klienci/szablony-maili/dodaj">
            <button className="flex items-center gap-2 px-4 py-2.5 rounded-2xl rounded-tr-none bg-brand-primary text-white text-sm font-semibold font-montserrat shadow-[0_4px_15px_0px_rgba(40,125,136,0.25)] hover:scale-[1.02] transition-all">
              <Plus size={15} weight="bold" />
              Utwórz szablon
            </button>
          </Link>
        </div>
      )}

      {/* Grid */}
      {templates.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {templates.map((t) => (
            <div
              key={t.id}
              className="bg-white/60 backdrop-blur-sm rounded-3xl rounded-tr-none border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.04)] p-5 flex flex-col gap-3 hover:shadow-[0_8px_30px_rgba(40,125,136,0.1)] transition-all group"
            >
              {/* Top row */}
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl rounded-tr-none bg-brand-primary/10 flex items-center justify-center shrink-0">
                  <Envelope size={18} className="text-brand-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-jakarta font-bold text-[#033f63] text-[15px] leading-tight truncate">
                    {t.name}
                  </p>
                  <p className="text-xs text-gray-400 font-montserrat truncate mt-0.5">
                    {t.subject}
                  </p>
                </div>
                <span
                  className={cn(
                    "shrink-0 text-[10px] font-semibold font-montserrat uppercase tracking-wider px-2 py-0.5 rounded-full",
                    t.status === "ACTIVE"
                      ? "bg-emerald-50 text-emerald-600"
                      : "bg-gray-100 text-gray-400",
                  )}
                >
                  {t.status === "ACTIVE" ? "Aktywny" : "Szkic"}
                </span>
              </div>

              {/* Meta */}
              <div className="flex items-center gap-3 text-[11px] text-gray-400 font-montserrat">
                <span className="flex items-center gap-1">
                  <Tag size={11} />
                  {CATEGORY_LABELS[t.category] ?? t.category}
                </span>
                <span className="flex items-center gap-1">
                  <Clock size={11} />
                  {new Date(t.updatedAt).toLocaleDateString("pl-PL", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 mt-auto pt-2 border-t border-gray-100">
                <Link
                  href={`/admin/klienci/szablony-maili/${t.id}`}
                  className="flex-1"
                >
                  <button className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-brand-primary/8 text-brand-primary text-[12.5px] font-semibold font-montserrat hover:bg-brand-primary/15 transition-colors">
                    <PencilSimple size={13} weight="bold" />
                    Edytuj
                  </button>
                </Link>
                <button
                  onClick={() => handleDelete(t.id, t.name)}
                  disabled={deletingId === t.id}
                  className="flex items-center justify-center w-9 h-9 rounded-xl text-gray-300 hover:text-rose-500 hover:bg-rose-50 transition-colors disabled:opacity-50"
                >
                  {deletingId === t.id ? (
                    <CircleNotch size={14} className="animate-spin" />
                  ) : (
                    <Trash size={14} weight="bold" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
