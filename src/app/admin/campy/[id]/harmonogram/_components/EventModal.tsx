"use client";

import React, { useEffect, useState, useTransition } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { X, Trash, FloppyDisk, CircleNotch } from "@phosphor-icons/react/dist/ssr";
import type { CampEventType } from "@prisma/client";
import { cn } from "@/lib/utils";
import { createEvent, updateEvent, type EventInput } from "@/app/actions/camp-events";
import type { SerializedEvent } from "./TimeGrid";
import { ICON_OPTIONS } from "./TimeGrid";

export interface EventDraft {
  id?: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string | null;
  type: CampEventType;
  icon: string | null;
}

interface Props {
  campId: string;
  initial: EventDraft;
  isEdit: boolean;
  onClose: () => void;
  onSaved: (event: SerializedEvent) => void;
  onDelete?: () => void;
}

const TYPES: { value: CampEventType; label: string }[] = [
  { value: "GENERAL", label: "Ogólne" },
  { value: "MEAL", label: "Posiłek" },
  { value: "ACTIVITY", label: "Aktywność" },
  { value: "WELLNESS_FREE", label: "Wellness" },
  { value: "ANNOUNCEMENT", label: "Ogłoszenie" },
];

function isoToInputValue(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function inputValueToISO(value: string): string {
  return new Date(value).toISOString();
}

export default function EventModal({
  campId,
  initial,
  isEdit,
  onClose,
  onSaved,
  onDelete,
}: Props) {
  const [title, setTitle] = useState(initial.title);
  const [description, setDescription] = useState(initial.description);
  const [startTime, setStartTime] = useState(isoToInputValue(initial.startTime));
  const [endTime, setEndTime] = useState(
    initial.endTime ? isoToInputValue(initial.endTime) : "",
  );
  const [type, setType] = useState<CampEventType>(initial.type);
  const [icon, setIcon] = useState<string | null>(initial.icon);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      toast.error("Podaj tytuł wydarzenia");
      return;
    }

    const payload: EventInput = {
      title: trimmedTitle,
      description: description.trim() || null,
      startTime: new Date(inputValueToISO(startTime)),
      endTime: endTime ? new Date(inputValueToISO(endTime)) : null,
      type,
      icon: icon || null,
      isPublished: true,
      sortOrder: 0,
    };

    startTransition(async () => {
      const res = isEdit && initial.id
        ? await updateEvent(initial.id, payload)
        : await createEvent(campId, payload);

      if (!res.ok) {
        toast.error(res.error);
        return;
      }

      const saved: SerializedEvent = {
        id: res.data.id,
        title: payload.title,
        description: payload.description ?? null,
        startTime: payload.startTime.toISOString(),
        endTime: payload.endTime ? payload.endTime.toISOString() : null,
        type: payload.type,
        icon: payload.icon ?? null,
        isPublished: payload.isPublished ?? true,
        sortOrder: payload.sortOrder ?? 0,
      };

      toast.success(isEdit ? "Zaktualizowano punkt" : "Dodano punkt");
      onSaved(saved);
    });
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
        onClick={onClose}
        className="fixed inset-0 z-[200] bg-brand-secondary/40 backdrop-blur-sm"
      />

      <motion.aside
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", stiffness: 320, damping: 34 }}
        className="fixed top-0 right-0 bottom-0 z-[201] w-full sm:w-[480px] bg-white/95 backdrop-blur-2xl border-l border-white/40 shadow-[0_30px_80px_-20px_rgba(3,63,99,0.35)] flex flex-col"
      >
        <header className="flex items-center justify-between px-6 py-5 border-b border-brand-secondary/10 shrink-0">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-brand-secondary/50 font-bold">
              Harmonogram
            </p>
            <h2 className="font-jakarta text-[18px] font-bold text-brand-secondary leading-tight mt-0.5">
              {isEdit ? "Edytuj punkt" : "Nowy punkt"}
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Zamknij"
            className="w-10 h-10 rounded-2xl bg-white border border-brand-secondary/10 hover:bg-brand-secondary/5 flex items-center justify-center text-brand-secondary transition"
          >
            <X size={18} weight="bold" />
          </button>
        </header>

        <form onSubmit={submit} className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          <div>
            <label className="text-[11px] uppercase tracking-wider font-bold text-brand-secondary/50">
              Tytuł
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="np. Poranna joga w plenerze"
              className="mt-1.5 w-full bg-white border border-brand-secondary/15 rounded-2xl px-4 py-3 text-[14px] text-brand-secondary placeholder:text-brand-secondary/30 focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
              maxLength={120}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] uppercase tracking-wider font-bold text-brand-secondary/50">
                Od
              </label>
              <input
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="mt-1.5 w-full bg-white border border-brand-secondary/15 rounded-2xl px-3 py-3 text-[13px] text-brand-secondary focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
                required
              />
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-wider font-bold text-brand-secondary/50">
                Do (opcjonalnie)
              </label>
              <input
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="mt-1.5 w-full bg-white border border-brand-secondary/15 rounded-2xl px-3 py-3 text-[13px] text-brand-secondary focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] uppercase tracking-wider font-bold text-brand-secondary/50">
              Typ
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as CampEventType)}
              className="mt-1.5 w-full bg-white border border-brand-secondary/15 rounded-2xl px-4 py-3 text-[14px] text-brand-secondary focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
            >
              {TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] uppercase tracking-wider font-bold text-brand-secondary/50">
              Ikona
            </label>
            <div className="mt-1.5 grid grid-cols-5 gap-2">
              <button
                type="button"
                onClick={() => setIcon(null)}
                className={cn(
                  "aspect-square rounded-2xl border flex flex-col items-center justify-center gap-0.5 transition",
                  icon === null
                    ? "bg-brand-primary text-white border-brand-primary shadow-[0_8px_20px_-8px_rgba(40,125,136,0.5)]"
                    : "bg-white border-brand-secondary/10 text-brand-secondary/60 hover:border-brand-primary/40",
                )}
              >
                <X size={18} weight="bold" />
                <span className="text-[9px] font-bold">Auto</span>
              </button>
              {ICON_OPTIONS.map((opt) => {
                const active = icon === opt.value;
                return (
                  <button
                    type="button"
                    key={opt.value}
                    onClick={() => setIcon(opt.value)}
                    title={opt.label}
                    className={cn(
                      "aspect-square rounded-2xl border flex flex-col items-center justify-center gap-0.5 transition",
                      active
                        ? "bg-brand-primary text-white border-brand-primary shadow-[0_8px_20px_-8px_rgba(40,125,136,0.5)]"
                        : "bg-white border-brand-secondary/10 text-brand-secondary/60 hover:border-brand-primary/40 hover:text-brand-primary",
                    )}
                  >
                    {opt.node}
                    <span className="text-[9px] font-bold">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="text-[11px] uppercase tracking-wider font-bold text-brand-secondary/50">
              Opis (opcjonalnie)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Krótki opis dla uczestniczek"
              rows={3}
              maxLength={500}
              className="mt-1.5 w-full bg-white border border-brand-secondary/15 rounded-2xl px-4 py-3 text-[14px] text-brand-secondary placeholder:text-brand-secondary/30 focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 resize-none"
            />
            <p className="text-[10px] text-brand-secondary/40 mt-1 text-right">
              {description.length} / 500
            </p>
          </div>
        </form>

        <footer className="px-6 py-4 border-t border-brand-secondary/10 shrink-0 flex items-center justify-between gap-3">
          {isEdit && onDelete ? (
            <button
              type="button"
              onClick={onDelete}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-red-600 hover:bg-red-50 text-[13px] font-bold transition"
            >
              <Trash size={15} weight="duotone" />
              Usuń
            </button>
          ) : (
            <span />
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-[13px] font-bold text-brand-secondary/60 hover:text-brand-secondary hover:bg-brand-secondary/5 transition"
            >
              Anuluj
            </button>
            <button
              type="submit"
              onClick={submit}
              disabled={pending}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-primary text-white text-[13px] font-bold shadow-[0_8px_20px_-6px_rgba(40,125,136,0.5)] hover:bg-brand-secondary transition disabled:opacity-60"
            >
              {pending ? (
                <CircleNotch size={15} weight="bold" className="animate-spin" />
              ) : (
                <FloppyDisk size={15} weight="bold" />
              )}
              {isEdit ? "Zapisz zmiany" : "Dodaj punkt"}
            </button>
          </div>
        </footer>
      </motion.aside>
    </>
  );
}
