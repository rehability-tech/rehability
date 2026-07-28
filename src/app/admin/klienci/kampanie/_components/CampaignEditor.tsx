"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  CaretLeft,
  CircleNotch,
  FloppyDisk,
  PaperPlaneTilt,
  PaperPlaneRight,
  Users,
  Lock,
} from "@phosphor-icons/react/dist/ssr";

import EmailEditor, {
  type EmailEditorHandle,
} from "@/components/email-editor/EmailEditor";
import EmailEditorToolbar from "@/components/email-editor/components/EmailEditorToolbar";
import EmailInboxPreviewModal from "@/components/email-editor/components/EmailInboxPreviewModal";
import {
  type EmailSection,
  createCampaignDefaultSections,
} from "@/components/email-editor";
import { useAutoSave } from "@/components/email-editor/hooks/useAutoSave";
import { Button } from "@/components/ui/Button";

const SOURCES = ["Wydarzenia", "VOD", "Newsletter", "Ręczny"];
const EDITABLE_STATUSES = ["DRAFT", "SCHEDULED"];

interface Props {
  campaignId: string | null;
}

export default function CampaignEditor({ campaignId }: Props) {
  const router = useRouter();
  const isEdit = campaignId !== null;

  const [id, setId] = useState<string | null>(campaignId);
  const [isFetching, setIsFetching] = useState(isEdit);
  const [isSaving, setIsSaving] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [fromName, setFromName] = useState("");
  const [ctaUrl, setCtaUrl] = useState("");
  const [sources, setSources] = useState<string[]>([]);
  const [tagsInput, setTagsInput] = useState("");
  const [onlySubscribed, setOnlySubscribed] = useState(true);
  const [sections, setSections] = useState<EmailSection[]>([]);
  const [status, setStatus] = useState("DRAFT");
  const [audienceCount, setAudienceCount] = useState<number | null>(null);

  const editorRef = useRef<EmailEditorHandle>(null);

  const readOnly = !EDITABLE_STATUSES.includes(status);

  const tags = useMemo(
    () =>
      tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    [tagsInput],
  );

  // ── Wczytanie istniejącej kampanii ─────────────────────────────────────────
  useEffect(() => {
    if (!isEdit) {
      setSections(createCampaignDefaultSections());
      return;
    }
    (async () => {
      setIsFetching(true);
      try {
        const res = await fetch(`/api/admin/kampanie/${campaignId}`);
        if (!res.ok) throw new Error();
        const d = await res.json();
        setName(d.name ?? "");
        setSubject(d.subject ?? "");
        setFromName(d.fromName ?? "");
        setCtaUrl(d.ctaUrl ?? "");
        setSources(d.filterSources ?? []);
        setTagsInput((d.filterTags ?? []).join(", "));
        setOnlySubscribed((d.filterStatus ?? "SUBSCRIBED") === "SUBSCRIBED");
        setStatus(d.status ?? "DRAFT");
        setSections(
          Array.isArray(d.sections) && d.sections.length > 0
            ? (d.sections as EmailSection[])
            : createCampaignDefaultSections(),
        );
      } catch {
        toast.error("Nie udało się załadować kampanii.");
        setSections(createCampaignDefaultSections());
      } finally {
        setIsFetching(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaignId]);

  // ── Live liczba odbiorców segmentu ─────────────────────────────────────────
  useEffect(() => {
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await fetch("/api/admin/kampanie/count", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sources,
            tags,
            status: onlySubscribed ? "SUBSCRIBED" : undefined,
          }),
          signal: ctrl.signal,
        });
        if (res.ok) {
          const d = await res.json();
          setAudienceCount(d.count);
        }
      } catch {
        /* abort / network — ignorujemy */
      }
    }, 400);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [sources, tags, onlySubscribed]);

  // ── Zapis ──────────────────────────────────────────────────────────────────
  const buildPayload = useCallback(() => {
    const currentSubject = editorRef.current?.getSubjectTemplate() ?? subject;
    return {
      name: name || "Bez nazwy",
      subject: currentSubject,
      sections,
      fromName: fromName || null,
      ctaUrl: ctaUrl || null,
      filterSources: sources,
      filterTags: tags,
      filterStatus: onlySubscribed ? "SUBSCRIBED" : "SUBSCRIBED",
    };
  }, [name, subject, sections, fromName, ctaUrl, sources, tags, onlySubscribed]);

  const saveData = useCallback(async (): Promise<string | null> => {
    if (sections.length === 0 || readOnly) return id;
    const payload = buildPayload();

    if (id) {
      const res = await fetch(`/api/admin/kampanie/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Błąd zapisu");
      return id;
    }
    const res = await fetch("/api/admin/kampanie", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || "Błąd zapisu");
    setId(result.id);
    window.history.replaceState(null, "", `/admin/klienci/kampanie/${result.id}`);
    return result.id;
  }, [id, sections, buildPayload, readOnly]);

  const { schedule: scheduleAutoSave, status: autoSaveStatus } = useAutoSave(
    () => saveData().then(() => undefined),
    5_000,
  );

  const handleSave = useCallback(async () => {
    if (!name.trim()) {
      toast.error("Podaj nazwę kampanii.");
      return;
    }
    setIsSaving(true);
    try {
      await saveData();
      toast.success("Kampania zapisana!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Błąd serwera.");
    } finally {
      setIsSaving(false);
    }
  }, [name, saveData]);

  // ── Test ───────────────────────────────────────────────────────────────────
  const handleTest = useCallback(async () => {
    setIsTesting(true);
    try {
      const cid = await saveData();
      if (!cid) throw new Error("Najpierw zapisz kampanię.");
      const res = await fetch(`/api/admin/kampanie/${cid}/test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Błąd wysyłki testu");
      toast.success(`Test wysłany na ${d.to}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Błąd wysyłki testu.");
    } finally {
      setIsTesting(false);
    }
  }, [saveData]);

  // ── Wysyłka ─────────────────────────────────────────────────────────────────
  const handleSend = useCallback(async () => {
    if (!name.trim()) {
      toast.error("Podaj nazwę kampanii.");
      return;
    }
    if (!audienceCount || audienceCount === 0) {
      toast.error("Segment jest pusty — wybierz odbiorców.");
      return;
    }
    if (
      !confirm(
        `Wysłać kampanię „${name}" do ${audienceCount} odbiorców? Tej operacji nie można cofnąć.`,
      )
    )
      return;

    setIsSending(true);
    try {
      const cid = await saveData();
      if (!cid) throw new Error("Najpierw zapisz kampanię.");
      const res = await fetch(`/api/admin/kampanie/${cid}/send`, {
        method: "POST",
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Błąd wysyłki");
      toast.success(
        `Wysyłka uruchomiona dla ${d.total} odbiorców. Reszta domykana w tle.`,
      );
      setStatus("SENDING");
      router.push("/admin/klienci/kampanie");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Błąd wysyłki.");
    } finally {
      setIsSending(false);
    }
  }, [name, audienceCount, saveData, router]);

  if (isFetching) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <CircleNotch
          size={40}
          weight="bold"
          className="text-brand-primary animate-spin mb-4"
        />
        <p className="text-gray-500 font-montserrat font-medium">
          Ładowanie kampanii...
        </p>
      </div>
    );
  }

  return (
    <div className="relative animate-in fade-in duration-500 pb-4 max-w-5xl mx-auto">
      <EmailInboxPreviewModal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        sections={sections}
        subject={editorRef.current?.getSubjectTemplate() ?? subject}
        tripContext={{
          title: name,
          description: "",
          location: "",
          startDate: "",
          endDate: "",
        }}
        previewInviterName={fromName || "Rehability"}
        previewInviteeName="Anna Kowalska"
      />

      {/* Header */}
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <Link
            href="/admin/klienci/kampanie"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-secondary/50 hover:text-brand-primary transition-colors mb-2"
          >
            <CaretLeft size={14} weight="bold" />
            Kampanie
          </Link>
          <h2 className="text-xl font-jakarta font-bold text-[#0B3B4C]">
            {isEdit ? "Edytuj kampanię" : "Nowa kampania"}
          </h2>
        </div>
        {readOnly && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-100 text-gray-500 text-xs font-bold">
            <Lock size={14} weight="bold" />
            Wysłana — tylko podgląd
          </span>
        )}
      </div>

      {/* META */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4 p-4 bg-white/60 backdrop-blur-sm rounded-3xl rounded-tr-none border border-gray-100">
        <div className="sm:col-span-2">
          <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
            Nazwa kampanii *
          </label>
          <input
            type="text"
            value={name}
            disabled={readOnly}
            onChange={(e) => setName(e.target.value)}
            placeholder="np. Newsletter wiosenny 2026"
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-[13.5px] text-[#033f63] placeholder:text-gray-300 focus:outline-none focus:border-brand-primary/50 focus:ring-2 focus:ring-brand-primary/10 transition-all bg-white disabled:bg-gray-50"
          />
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
            Nadawca (nazwa)
          </label>
          <input
            type="text"
            value={fromName}
            disabled={readOnly}
            onChange={(e) => setFromName(e.target.value)}
            placeholder="Rehability"
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-[13.5px] text-[#033f63] placeholder:text-gray-300 focus:outline-none focus:border-brand-primary/50 focus:ring-2 focus:ring-brand-primary/10 transition-all bg-white disabled:bg-gray-50"
          />
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
            Link przycisku (CTA)
          </label>
          <input
            type="url"
            value={ctaUrl}
            disabled={readOnly}
            onChange={(e) => setCtaUrl(e.target.value)}
            placeholder="https://rehabilityprudnik.pl/wydarzenia"
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-[13.5px] text-[#033f63] placeholder:text-gray-300 focus:outline-none focus:border-brand-primary/50 focus:ring-2 focus:ring-brand-primary/10 transition-all bg-white disabled:bg-gray-50"
          />
        </div>
      </div>

      {/* AUDYTORIUM */}
      <div className="mb-6 p-4 bg-white/60 backdrop-blur-sm rounded-3xl rounded-tr-none border border-gray-100">
        <div className="flex items-center justify-between gap-3 mb-3">
          <h3 className="text-sm font-bold text-brand-secondary flex items-center gap-2">
            <Users size={18} weight="duotone" className="text-brand-primary" />
            Odbiorcy
          </h3>
          <motion.span
            key={audienceCount}
            initial={{ scale: 0.9, opacity: 0.6 }}
            animate={{ scale: 1, opacity: 1 }}
            className="px-3 py-1.5 rounded-xl bg-brand-primary/10 text-brand-primary text-sm font-bold tabular-nums"
          >
            {audienceCount === null ? "…" : audienceCount} odbiorców
          </motion.span>
        </div>

        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
          Źródła (puste = wszystkie)
        </p>
        <div className="flex flex-wrap gap-2 mb-3">
          {SOURCES.map((s) => {
            const active = sources.includes(s);
            return (
              <button
                key={s}
                type="button"
                disabled={readOnly}
                onClick={() =>
                  setSources((prev) =>
                    prev.includes(s)
                      ? prev.filter((x) => x !== s)
                      : [...prev, s],
                  )
                }
                className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-colors disabled:opacity-50 ${
                  active
                    ? "bg-brand-primary text-white border-brand-primary"
                    : "bg-white text-brand-secondary/60 border-gray-200 hover:bg-gray-50"
                }`}
              >
                {s}
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
              Tagi (po przecinku)
            </label>
            <input
              type="text"
              value={tagsInput}
              disabled={readOnly}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="np. vip, prudnik"
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-[13.5px] text-[#033f63] placeholder:text-gray-300 focus:outline-none focus:border-brand-primary/50 focus:ring-2 focus:ring-brand-primary/10 transition-all bg-white disabled:bg-gray-50"
            />
          </div>
          <label className="flex items-center gap-2.5 self-end pb-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={onlySubscribed}
              disabled={readOnly}
              onChange={(e) => setOnlySubscribed(e.target.checked)}
              className="w-4 h-4 accent-brand-primary"
            />
            <span className="text-[13px] font-medium text-brand-secondary/80">
              Tylko subskrybujący (zalecane)
            </span>
          </label>
        </div>
      </div>

      {/* EDYTOR */}
      <div className="relative">
        <div className="md:pr-14">
          <EmailEditor
            ref={editorRef}
            sections={sections}
            onSectionsChange={readOnly ? () => {} : setSections}
            initialSubject={subject}
            tripContext={{
              title: name,
              description: "",
              location: "",
              startDate: "",
              endDate: "",
            }}
            onInput={readOnly ? undefined : scheduleAutoSave}
          />
        </div>
        {!readOnly && (
          <div className="hidden md:block absolute top-0 bottom-0 right-0 w-14 pointer-events-none">
            <EmailEditorToolbar
              onSave={handleSave}
              isSaving={isSaving}
              autoSaveStatus={autoSaveStatus}
              onPreviewClick={() => setShowPreview(true)}
            />
          </div>
        )}
      </div>

      {/* AKCJE */}
      <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 pt-6 mt-6 border-t border-gray-100">
        <button
          type="button"
          onClick={() => setShowPreview(true)}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-[12px] text-gray-500 font-semibold text-sm hover:bg-gray-100 transition-colors w-full sm:w-auto"
        >
          Podgląd
        </button>

        {!readOnly && (
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button
              variant="secondary"
              onClick={handleTest}
              isLoading={isTesting}
              disabled={isTesting || isSending}
              leftIcon={<PaperPlaneRight size={18} weight="bold" />}
              className="w-full sm:w-auto"
            >
              Wyślij test
            </Button>
            <Button
              variant="secondary"
              onClick={handleSave}
              isLoading={isSaving}
              disabled={isSaving || isSending}
              leftIcon={<FloppyDisk size={18} weight="bold" />}
              className="w-full sm:w-auto"
            >
              Zapisz szkic
            </Button>
            <Button
              onClick={handleSend}
              isLoading={isSending}
              disabled={isSending}
              leftIcon={<PaperPlaneTilt size={18} weight="fill" />}
              className="w-full sm:w-auto"
            >
              Wyślij teraz
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
