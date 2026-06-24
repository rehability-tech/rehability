"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  CalendarBlank,
  CheckCircle,
  CircleNotch,
  Clock,
  Rocket,
  Warning,
} from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";

type Mode = "now" | "schedule";

interface Props {
  postId: string;
  initialPublishedAt?: string | null;
  initialStatus?: string;
  // Optional: persist meta SEO before publishing so the live page doesn't
  // ship with stale meta. Called from the parent component.
  onBeforePublish?: () => Promise<void> | void;
}

function localDatetimeInputValue(date: Date) {
  // <input type="datetime-local"> wants "YYYY-MM-DDTHH:mm" in *local* time
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate(),
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function defaultScheduleDateTime(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(9, 0, 0, 0);
  return localDatetimeInputValue(d);
}

export default function PublishControl({
  postId,
  initialPublishedAt,
  initialStatus,
  onBeforePublish,
}: Props) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>(
    initialStatus === "SCHEDULED" ? "schedule" : "now",
  );
  const [scheduledAt, setScheduledAt] = useState<string>(() => {
    if (initialPublishedAt) {
      const d = new Date(initialPublishedAt);
      if (!Number.isNaN(d.getTime()) && d.getTime() > Date.now()) {
        return localDatetimeInputValue(d);
      }
    }
    return defaultScheduleDateTime();
  });
  const [isPending, startTransition] = useTransition();

  const isAlreadyLive = initialStatus === "PUBLISHED";

  const futureDate = useMemo(() => {
    const d = new Date(scheduledAt);
    return Number.isNaN(d.getTime()) ? null : d;
  }, [scheduledAt]);

  const isDateInPast =
    mode === "schedule" && (!futureDate || futureDate.getTime() <= Date.now());

  const submit = () => {
    startTransition(async () => {
      try {
        if (onBeforePublish) await onBeforePublish();

        const body =
          mode === "now"
            ? { id: postId, status: "PUBLISHED" }
            : {
                id: postId,
                status: "SCHEDULED",
                publishedAt: futureDate?.toISOString(),
              };

        const res = await fetch("/api/admin/blog/status", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Błąd publikacji.");

        toast.success(
          mode === "now"
            ? "Artykuł opublikowany!"
            : `Publikacja zaplanowana na ${futureDate?.toLocaleString("pl-PL", {
                day: "numeric",
                month: "long",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}`,
        );

        router.push("/admin/blog/lista");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Błąd publikacji.");
      }
    });
  };

  return (
    <div className="bg-white border border-gray-200 rounded-[16px] p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-semibold font-montserrat text-gray-500 uppercase tracking-wider">
          Publikacja
        </span>
        {isAlreadyLive && (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
            <CheckCircle size={11} weight="fill" />
            Live
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 p-1 rounded-[12px] bg-gray-50 border border-gray-100 mb-4">
        <ModeButton
          active={mode === "now"}
          onClick={() => setMode("now")}
          icon={<Rocket size={14} weight="duotone" />}
          label="Od razu"
        />
        <ModeButton
          active={mode === "schedule"}
          onClick={() => setMode("schedule")}
          icon={<Clock size={14} weight="duotone" />}
          label="Zaplanuj"
        />
      </div>

      {mode === "schedule" && (
        <div className="mb-4">
          <label
            htmlFor="scheduledAt"
            className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1"
          >
            Data i godzina publikacji
          </label>
          <div className="relative mt-1.5">
            <CalendarBlank
              size={16}
              weight="duotone"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-primary pointer-events-none"
            />
            <input
              id="scheduledAt"
              type="datetime-local"
              value={scheduledAt}
              min={localDatetimeInputValue(new Date())}
              onChange={(e) => setScheduledAt(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 rounded-[10px] bg-gray-50 border border-gray-200 text-[13px] text-[#0B3B4C] font-montserrat focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-colors"
            />
          </div>
          {isDateInPast ? (
            <p className="mt-2 inline-flex items-center gap-1.5 text-[11px] text-rose-600 font-montserrat">
              <Warning size={12} weight="fill" />
              Data musi być w przyszłości — wsteczna publikacja jest zablokowana.
            </p>
          ) : (
            <p className="mt-2 text-[11px] text-gray-400 font-montserrat">
              Cron uruchomi publikację po przekroczeniu tej daty.
            </p>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={submit}
        disabled={isPending || (mode === "schedule" && isDateInPast)}
        className={cn(
          "w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-[12px] text-[13px] font-bold font-montserrat transition shadow-[0_10px_24px_-12px_rgba(40,125,136,0.55)]",
          isPending || (mode === "schedule" && isDateInPast)
            ? "bg-gray-200 text-gray-500 cursor-not-allowed shadow-none"
            : mode === "now"
              ? "bg-brand-primary text-white hover:bg-[#1E6068]"
              : "bg-[#0B3B4C] text-white hover:bg-brand-primary",
        )}
      >
        {isPending ? (
          <>
            <CircleNotch size={14} weight="bold" className="animate-spin" />
            Przetwarzam…
          </>
        ) : mode === "now" ? (
          <>
            <Rocket size={14} weight="fill" />
            Opublikuj teraz
          </>
        ) : (
          <>
            <Clock size={14} weight="fill" />
            Zaplanuj publikację
          </>
        )}
      </button>
    </div>
  );
}

function ModeButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "text-[12.5px] font-bold py-2 rounded-[10px] transition inline-flex items-center justify-center gap-1.5",
        active
          ? "bg-brand-primary text-white shadow-[0_6px_16px_-6px_rgba(40,125,136,0.5)]"
          : "text-gray-500 hover:text-[#0B3B4C]",
      )}
    >
      {icon}
      {label}
    </button>
  );
}
