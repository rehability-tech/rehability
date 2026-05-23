"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  Brain,
  ArrowsClockwise,
  WarningCircle,
  Warning,
  Lightbulb,
  CheckCircle,
  CircleNotch,
  Sparkle,
  Info,
  Wrench,
} from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";
import type { SeoAiAnalysis, SeoSeverity } from "@/lib/seo/utils";

interface Props {
  analysis: SeoAiAnalysis | null;
  isLoading: boolean;
  error: string | null;
  onRefresh: () => void;
  onFix: () => void;
  isFixing: boolean;
  // Treść loading state — "wyjazdu" dla campów, "artykułu" dla bloga.
  contentLabel?: string;
}

const SEVERITY_META: Record<
  SeoSeverity,
  { label: string; icon: React.ElementType; tone: string; bg: string }
> = {
  critical: {
    label: "Krytyczne",
    icon: WarningCircle,
    tone: "text-red-600",
    bg: "bg-red-50 border-red-100",
  },
  warning: {
    label: "Ważne",
    icon: Warning,
    tone: "text-amber-600",
    bg: "bg-amber-50 border-amber-100",
  },
  info: {
    label: "Wskazówka",
    icon: Lightbulb,
    tone: "text-sky-600",
    bg: "bg-sky-50 border-sky-100",
  },
};

export default function SeoAiAnalysisCard({
  analysis,
  isLoading,
  error,
  onRefresh,
  onFix,
  isFixing,
  contentLabel = "wyjazdu",
}: Props) {
  const hasFixableRecs =
    !!analysis && analysis.recommendations.length > 0 && analysis.score < 100;
  const fixDisabled = isLoading || isFixing || !hasFixableRecs;

  return (
    <div className="bg-white border border-gray-200 rounded-[16px] p-5 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between mb-4 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-[8px] bg-brand-primary/10 flex items-center justify-center shrink-0">
            <Brain size={15} weight="fill" className="text-brand-primary" />
          </div>
          <span className="text-xs font-semibold font-montserrat text-gray-700 uppercase tracking-wider truncate">
            Analiza SEO przez AI
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={onFix}
            disabled={fixDisabled}
            title={
              !hasFixableRecs
                ? "Brak rekomendacji do naprawy"
                : "Napraw rekomendacje przez AI"
            }
            className={cn(
              "inline-flex items-center gap-1 px-2 py-1 rounded-[8px] text-[11px] font-bold font-montserrat transition-colors",
              fixDisabled
                ? "text-gray-300 bg-gray-50 cursor-not-allowed"
                : "text-brand-primary bg-brand-primary/10 hover:bg-brand-primary hover:text-white",
            )}
          >
            {isFixing ? (
              <CircleNotch size={12} weight="bold" className="animate-spin" />
            ) : (
              <Wrench size={12} weight="bold" />
            )}
            <span>{isFixing ? "Naprawiam…" : "Napraw"}</span>
          </button>

          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading || isFixing}
            title="Przeanalizuj ponownie"
            className={cn(
              "p-1.5 rounded-[8px] transition-colors",
              isLoading || isFixing
                ? "text-gray-300 cursor-not-allowed"
                : "text-gray-400 hover:text-brand-primary hover:bg-brand-primary/10",
            )}
          >
            <ArrowsClockwise
              size={14}
              weight="bold"
              className={isLoading ? "animate-spin" : ""}
            />
          </button>
        </div>
      </div>

      {isLoading && !analysis && <LoadingState contentLabel={contentLabel} />}

      {error && !isLoading && (
        <div className="flex items-start gap-2 p-3 rounded-[10px] bg-red-50 border border-red-100">
          <WarningCircle
            size={16}
            weight="fill"
            className="text-red-500 mt-0.5 shrink-0"
          />
          <div className="flex-1">
            <p className="text-[12px] font-semibold font-montserrat text-red-700">
              Nie udało się przeanalizować
            </p>
            <p className="text-[11px] font-montserrat text-red-600 mt-0.5">
              {error}
            </p>
          </div>
        </div>
      )}

      {analysis && (
        <div className={cn("flex flex-col gap-4", isLoading && "opacity-60")}>
          <ScoreRow score={analysis.score} summary={analysis.summary} />

          {analysis.strengths.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold font-montserrat text-gray-500 uppercase tracking-wider mb-2">
                Co działa dobrze
              </p>
              <ul className="flex flex-col gap-1.5">
                {analysis.strengths.map((s, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-[12px] font-montserrat text-gray-600"
                  >
                    <CheckCircle
                      size={13}
                      weight="fill"
                      className="text-emerald-500 mt-0.5 shrink-0"
                    />
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {analysis.recommendations.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold font-montserrat text-gray-500 uppercase tracking-wider mb-2">
                Rekomendacje ({analysis.recommendations.length})
              </p>
              <div className="flex flex-col gap-2">
                {analysis.recommendations.map((rec, i) => {
                  const meta = SEVERITY_META[rec.severity];
                  const Icon = meta.icon;
                  return (
                    <div
                      key={i}
                      className={cn(
                        "flex items-start gap-2 p-2.5 rounded-[10px] border",
                        meta.bg,
                      )}
                    >
                      <Icon
                        size={14}
                        weight="fill"
                        className={cn(meta.tone, "mt-0.5 shrink-0")}
                      />
                      <div className="flex-1 min-w-0">
                        <p
                          className={cn(
                            "text-[12px] font-semibold font-montserrat leading-tight",
                            meta.tone,
                          )}
                        >
                          {rec.title}
                        </p>
                        <p className="text-[11px] font-montserrat text-gray-600 mt-0.5 leading-snug">
                          {rec.hint}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <RecommendationsDisclaimer score={analysis.score} />
            </div>
          )}
        </div>
      )}

      {!analysis && !isLoading && !error && (
        <EmptyState onRefresh={onRefresh} />
      )}
    </div>
  );
}

function RecommendationsDisclaimer({ score }: { score: number }) {
  const isHighScore = score >= 85;
  return (
    <div
      className={cn(
        "mt-3 flex items-start gap-2 p-2.5 rounded-[10px] border",
        isHighScore
          ? "bg-emerald-50/60 border-emerald-100"
          : "bg-gray-50 border-gray-100",
      )}
    >
      <Info
        size={13}
        weight="fill"
        className={cn(
          "mt-0.5 shrink-0",
          isHighScore ? "text-emerald-500" : "text-gray-400",
        )}
      />
      <p className="text-[11px] font-montserrat text-gray-500 leading-snug">
        {isHighScore ? (
          <>
            <span className="font-semibold text-emerald-600">
              Wynik powyżej 85% — SEO jest gotowe do publikacji.
            </span>{" "}
            Poniższe rekomendacje to opcjonalne wskazówki do dalszej optymalizacji,
            możesz je spokojnie zignorować.
          </>
        ) : (
          <>
            Rekomendacje mają charakter <span className="font-semibold">sugestii</span>{" "}
            — nie wszystkie są krytyczne. Po przekroczeniu progu{" "}
            <span className="font-semibold">85%</span> SEO jest gotowe do publikacji
            i resztę można pominąć.
          </>
        )}
      </p>
    </div>
  );
}

function ScoreRow({ score, summary }: { score: number; summary: string }) {
  const safeScore = Math.max(0, Math.min(100, score));
  const tone =
    safeScore >= 80
      ? { text: "text-emerald-500", bar: "bg-emerald-400" }
      : safeScore >= 50
        ? { text: "text-amber-500", bar: "bg-amber-400" }
        : { text: "text-red-500", bar: "bg-red-400" };

  return (
    <div>
      <div className="flex items-end justify-between mb-2">
        <div>
          <p className="text-[11px] font-semibold font-montserrat text-gray-500 uppercase tracking-wider">
            Wynik AI
          </p>
          <p className="text-[11px] font-montserrat text-gray-500 mt-1 max-w-[230px] leading-snug">
            {summary}
          </p>
        </div>
        <span className={cn("text-[28px] font-jakarta font-bold", tone.text)}>
          {safeScore}
        </span>
      </div>
      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
        <motion.div
          className={cn("h-full rounded-full", tone.bar)}
          initial={{ width: 0 }}
          animate={{ width: `${safeScore}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

function LoadingState({ contentLabel }: { contentLabel: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-6 gap-3">
      <div className="relative w-12 h-12 flex items-center justify-center">
        <motion.div
          animate={{
            boxShadow: [
              "0 0 0 0 rgba(40,125,136,0.0)",
              "0 0 24px 4px rgba(40,125,136,0.6)",
              "0 0 0 0 rgba(40,125,136,0.0)",
            ],
          }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0 rounded-full bg-brand-primary/10"
        />
        <CircleNotch
          size={22}
          weight="bold"
          className="text-brand-primary animate-spin relative"
        />
      </div>
      <p className="text-[12px] font-montserrat text-gray-500 text-center max-w-[220px] leading-snug">
        AI analizuje treść {contentLabel} i przygotowuje rekomendacje…
      </p>
    </div>
  );
}

function EmptyState({ onRefresh }: { onRefresh: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-6 gap-3 text-center">
      <Sparkle size={22} weight="fill" className="text-brand-primary/60" />
      <p className="text-[12px] font-montserrat text-gray-500 max-w-[220px] leading-snug">
        Brak analizy. Uruchom AI, żeby przeanalizować treść pod kątem SEO.
      </p>
      <button
        type="button"
        onClick={onRefresh}
        className="text-[12px] font-semibold font-montserrat text-brand-primary hover:underline"
      >
        Uruchom analizę
      </button>
    </div>
  );
}
