"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  CheckCircle,
  CircleNotch,
  Rocket,
  Warning,
} from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";

interface Props {
  campId: string;
  initialStatus?: string;
  // Persist current SEO state before flipping status (parent handler).
  onBeforePublish?: () => Promise<void> | void;
}

export default function CampPublishControl({
  campId,
  initialStatus,
  onBeforePublish,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const isAlreadyLive = initialStatus === "PUBLISHED";

  const submit = () => {
    startTransition(async () => {
      try {
        if (onBeforePublish) await onBeforePublish();

        const res = await fetch("/api/admin/campy/status", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: campId, status: "PUBLISHED" }),
        });
        const data = await res.json();

        if (!res.ok) {
          // Backend zwraca { error, missing: string[] } przy 400 z guarda
          // validateCampCompleteness — pokazujemy listę braków w toaście.
          if (Array.isArray(data.missing) && data.missing.length > 0) {
            toast.error("Nie można opublikować wyjazdu", {
              description: `Brakuje: ${data.missing.join(", ")}.`,
              duration: 8000,
            });
          } else {
            toast.error(data.error || "Błąd publikacji.");
          }
          return;
        }

        toast.success("Wyjazd opublikowany!");
        router.push("/admin/campy");
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

      <p className="text-[12px] text-gray-500 font-montserrat mb-4 leading-relaxed">
        Po publikacji wyjazd pojawi się na stronie głównej w sekcji
        &bdquo;Najbliższe wyjazdy&rdquo; i będzie dostępny w katalogu campów.
      </p>

      {!isAlreadyLive && (
        <div className="mb-4 flex items-start gap-2 p-3 rounded-[10px] bg-amber-50 border border-amber-100">
          <Warning
            size={14}
            weight="fill"
            className="text-amber-500 mt-0.5 shrink-0"
          />
          <p className="text-[11px] text-amber-700 font-montserrat leading-relaxed">
            Backend sprawdzi kompletność (zdjęcie, lokalizacja, daty, min. 3
            bloki treści itd.) i zablokuje publikację, jeśli czegoś brakuje.
          </p>
        </div>
      )}

      <button
        type="button"
        onClick={submit}
        disabled={isPending}
        className={cn(
          "w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-[12px] text-[13px] font-bold font-montserrat transition shadow-[0_10px_24px_-12px_rgba(40,125,136,0.55)]",
          isPending
            ? "bg-gray-200 text-gray-500 cursor-not-allowed shadow-none"
            : "bg-brand-primary text-white hover:bg-[#1E6068]",
        )}
      >
        {isPending ? (
          <>
            <CircleNotch size={14} weight="bold" className="animate-spin" />
            Przetwarzam…
          </>
        ) : (
          <>
            <Rocket size={14} weight="fill" />
            {isAlreadyLive ? "Aktualizuj publikację" : "Opublikuj teraz"}
          </>
        )}
      </button>
    </div>
  );
}
