"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  ArrowCounterClockwise,
  CaretLeft,
  CaretRight,
  CircleNotch,
} from "@phosphor-icons/react/dist/ssr";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/Button";
import EmailEditor, {
  type EmailEditorHandle,
} from "@/components/email-editor/EmailEditor";
import AIChoiceModal from "@/components/email-editor/components/AIChoiceModal";
import EmailEditorToolbar from "@/components/email-editor/components/EmailEditorToolbar";
import EmailInboxPreviewModal from "@/components/email-editor/components/EmailInboxPreviewModal";
import EmailGeneratingAnimation from "@/components/email-editor/components/EmailGeneratingAnimation";
import {
  type EmailSection,
  type TripContext,
  aiToSections,
  createDefaultSections,
  migrateToSections,
  sectionsToLegacy,
} from "@/components/email-editor";
import { parseLocation } from "@/components/email-editor/lib/templateHelpers";
import { useAutoSave } from "@/components/email-editor/hooks/useAutoSave";

// ─────────────────────────────────────────────────────────────────────────────

function ZaproszeniaContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tripId = searchParams.get("id");

  const [isFetching, setIsFetching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const [sections, setSections] = useState<EmailSection[]>([]);
  const [loadedSubject, setLoadedSubject] = useState(
    "Zaproszenie na wspólny wyjazd Rehability ✈️",
  );
  const [showAIModal, setShowAIModal] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const editorRef = useRef<EmailEditorHandle>(null);
  const tripContextRef = useRef<TripContext>({
    title: "",
    description: "",
    location: "",
    startDate: "",
    endDate: "",
  });
  const heroImageRef = useRef("");

  // ── AI generation ──────────────────────────────────────────────────────────

  const runAiGeneration = useCallback(
    async (tripData: TripContext, heroImage: string) => {
      setIsGenerating(true);
      try {
        const res = await fetch("/api/admin/gemini", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "generateInvitationEmail",
            prompt: `Tytuł wyjazdu: ${tripData.title}\nOpis: ${tripData.description || "brak"}\nLokalizacja: ${tripData.location || "brak"}\nDaty: ${tripData.startDate || "do ustalenia"}`,
          }),
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.error || "Błąd AI");
        setSections(aiToSections(result, heroImage));
        if (result.subject) setLoadedSubject(result.subject);
        toast.success("Treść e-maila wygenerowana przez AI!");
      } catch {
        setSections(createDefaultSections());
        toast.error(
          "Nie udało się wygenerować treści AI. Załadowano domyślny szablon.",
        );
      } finally {
        setIsGenerating(false);
      }
    },
    [],
  );

  // ── Fetch trip data ────────────────────────────────────────────────────────

  useEffect(() => {
    if (!tripId) {
      toast.error("Brak ID wyjazdu. Najpierw wypełnij dane podstawowe.");
      router.push("/admin/wyjazdy/dodaj/dane-podstawowe");
      return;
    }
    (async () => {
      setIsFetching(true);
      try {
        const res = await fetch(`/api/admin/wyjazdy/${tripId}`);
        if (!res.ok) throw new Error();
        const data = await res.json();

        tripContextRef.current = {
          title: data.title ?? "",
          description: data.description ?? "",
          location: parseLocation(data.location),
          startDate: data.startDate ?? "",
          endDate: data.endDate ?? "",
        };

        const heroImage: string =
          data.invitationEmailHeroImage ?? data.heroImage ?? "";
        heroImageRef.current = heroImage;

        if (
          Array.isArray(data.invitationEmailSections) &&
          data.invitationEmailSections.length > 0
        ) {
          setSections(data.invitationEmailSections as EmailSection[]);
        } else if (data.invitationEmailBody || data.invitationEmailTitle) {
          setSections(
            migrateToSections({
              invitationEmailTitle: data.invitationEmailTitle,
              invitationEmailBody: data.invitationEmailBody,
              invitationEmailButtonText: data.invitationEmailButtonText,
              invitationEmailHeroImage: heroImage,
              invitationEmailHighlights: Array.isArray(
                data.invitationEmailHighlights,
              )
                ? data.invitationEmailHighlights
                : null,
              invitationEmailGallery: Array.isArray(data.invitationEmailGallery)
                ? data.invitationEmailGallery
                : null,
            }),
          );
        } else {
          // No sections/body — only show the popup if there's truly no trace of a previous visit
          const firstEverVisit =
            !data.lastStage && !data.invitationEmailHeroImage;
          if (firstEverVisit) {
            setShowAIModal(true);
          } else {
            // User was here before but content was cleared / never saved — load defaults silently
            setSections(createDefaultSections());
          }
        }

        if (data.invitationEmailSubject)
          setLoadedSubject(data.invitationEmailSubject);
      } catch {
        toast.error("Nie udało się załadować ustawień e-maila.");
        setSections(createDefaultSections());
      } finally {
        setIsFetching(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripId, router]);

  // ── Save ───────────────────────────────────────────────────────────────────

  const saveData = useCallback(async () => {
    if (!tripId || sections.length === 0) return;
    const subject = editorRef.current?.getSubjectTemplate() ?? loadedSubject;
    const payload = sectionsToLegacy(sections, subject);

    const res = await fetch(`/api/admin/wyjazdy/${tripId}/invitation-email`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || "Błąd zapisu");
  }, [tripId, sections, loadedSubject]);

  const { schedule: scheduleAutoSave, status: autoSaveStatus } = useAutoSave(
    saveData,
    5_000,
  );

  const save = useCallback(async () => {
    if (!tripId) return;
    setIsSaving(true);
    try {
      await saveData();
      toast.success("E-mail zaproszenia zapisany!");
      router.push(`/admin/wyjazdy/dodaj/seo?id=${tripId}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Błąd serwera.");
    } finally {
      setIsSaving(false);
    }
  }, [tripId, saveData, router]);

  // Zapis z toolbara — pokazuje loader, ale NIE przechodzi dalej (zostaje w edytorze).
  const saveInPlace = useCallback(async () => {
    if (!tripId) return;
    setIsSaving(true);
    try {
      await saveData();
      toast.success("Zapisano!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Błąd serwera.");
    } finally {
      setIsSaving(false);
    }
  }, [tripId, saveData]);

  // ── AI modal handlers ──────────────────────────────────────────────────────

  const handleModalAI = useCallback(async () => {
    if (!tripContextRef.current.title) {
      toast.error("Brak danych wyjazdu. Najpierw zapisz dane podstawowe.");
      return;
    }
    setShowAIModal(false);
    await runAiGeneration(tripContextRef.current, heroImageRef.current);
  }, [runAiGeneration]);

  const handleModalManual = useCallback(() => {
    setShowAIModal(false);
    setSections(createDefaultSections());
  }, []);

  // ── Reset email in DB ─────────────────────────────────────────────────────

  const resetEmail = useCallback(async () => {
    if (!tripId) return;
    try {
      await fetch(`/api/admin/wyjazdy/${tripId}/invitation-email`, {
        method: "DELETE",
      });
      setSections([]);
      setShowAIModal(true);
      toast.success("E-mail zresetowany.");
    } catch {
      toast.error("Błąd resetowania.");
    }
  }, [tripId]);

  // ── Loading screens ────────────────────────────────────────────────────────

  if (isFetching) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <CircleNotch
          size={40}
          weight="bold"
          className="text-brand-primary animate-spin mb-4"
        />
        <p className="text-gray-500 font-montserrat font-medium">
          Ładowanie szablonu e-maila...
        </p>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="relative animate-in fade-in duration-500 pb-4">
      {/* Portale — poza warstwą blur */}
      <AIChoiceModal
        isOpen={showAIModal}
        onAI={handleModalAI}
        onManual={handleModalManual}
        showWarning={sections.length > 0}
      />
      <EmailInboxPreviewModal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        sections={sections}
        subject={editorRef.current?.getSubjectTemplate() ?? loadedSubject}
        tripContext={tripContextRef.current}
        previewInviterName="Anna Nowak"
        previewInviteeName="Ania Kowalska"
      />

      {/* ── Warstwa treści — blur podczas generacji ───────────────────────── */}
      <motion.div
        animate={{
          filter:  isGenerating ? "blur(6px)" : "blur(0px)",
          opacity: isGenerating ? 0.45        : 1,
        }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
        style={{ pointerEvents: isGenerating ? "none" : undefined }}
      >
        {/* Mobile sticky toolbar */}
        <div className="md:hidden sticky top-[64px] z-40">
          <EmailEditorToolbar
            onSave={saveInPlace}
            isSaving={isSaving}
            autoSaveStatus={autoSaveStatus}
            onAiClick={() => setShowAIModal(true)}
            onPreviewClick={() => setShowPreview(true)}
          />
        </div>

        {/* Header */}
        <div className="mt-3 md:mt-0 mb-5 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <h2 className="text-xl font-jakarta font-bold text-[#0B3B4C]">
              E-mail zaproszenia
            </h2>
            <p className="text-sm text-gray-400 font-montserrat mt-1">
              Kliknij tekst, aby edytować. Dodawaj i przesuwaj sekcje.
            </p>
          </div>
          <button
            type="button"
            onClick={resetEmail}
            className="self-start flex items-center gap-1.5 text-[11px] font-montserrat font-semibold text-gray-300 hover:text-red-400 transition-colors"
          >
            <ArrowCounterClockwise size={13} weight="bold" />
            Resetuj e-mail
          </button>
        </div>

        {/* Email editor + Desktop pill */}
        <div className="relative">
          <div className="md:pr-14">
            <EmailEditor
              ref={editorRef}
              sections={sections}
              onSectionsChange={setSections}
              initialSubject={loadedSubject}
              tripContext={tripContextRef.current}
              onInput={scheduleAutoSave}
            />
          </div>
          <div className="hidden md:block absolute top-0 bottom-0 right-0 w-14 pointer-events-none">
            <EmailEditorToolbar
              onSave={saveInPlace}
              isSaving={isSaving}
              autoSaveStatus={autoSaveStatus}
              onAiClick={() => setShowAIModal(true)}
              onPreviewClick={() => setShowPreview(true)}
            />
          </div>
        </div>

        {/* Navigation */}
        <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 pt-6 mt-6 border-t border-gray-100">
          <Link
            href={`/admin/wyjazdy/dodaj/edytor-tresci${tripId ? `?id=${tripId}` : ""}`}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-[12px] text-gray-500 font-semibold text-sm hover:bg-gray-100 transition-colors w-full sm:w-auto"
          >
            <CaretLeft size={18} weight="bold" />
            Wstecz
          </Link>
          <Button
            onClick={save}
            isLoading={isSaving}
            disabled={isSaving}
            rightIcon={<CaretRight size={18} weight="bold" />}
            className="w-full sm:w-auto"
          >
            Zapisz i przejdź dalej
          </Button>
        </div>
      </motion.div>

      {/* ── Overlay z animacją generacji ──────────────────────────────────── */}
      <AnimatePresence>
        {isGenerating && (
          <motion.div
            key="generating-overlay"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="absolute inset-0 z-30 flex items-start md:pr-14"
          >
            <div className="w-full">
              <EmailGeneratingAnimation />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function ZaproszeniaCampPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <CircleNotch
            size={40}
            weight="bold"
            className="text-brand-primary animate-spin"
          />
        </div>
      }
    >
      <ZaproszeniaContent />
    </Suspense>
  );
}
