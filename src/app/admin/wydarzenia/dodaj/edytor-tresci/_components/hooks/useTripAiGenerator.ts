import { useState } from "react";
import { safeUuid, isUsableImageUrl } from "@/lib/utils";
import { geminiFetch, type RateStatus } from "@/lib/gemini/clientRateLimiter";

// Kolejka pickerów zdjęć (współdzielona z blogiem) — pauza na ręczny wybór
// grafiki dla bloków inlineImage, dla których AI nie ma realnego zdjęcia.
type PickImagesFor = (
  blocks: any[],
  onUpdate?: (blocks: any[]) => void,
  onlyBlockId?: string,
) => Promise<any[]>;

export type BlockType =
  | "heading"
  | "paragraph"
  | "featuresGrid"
  | "pricingList"
  | "highlight"
  | "spacer"
  | "bulletList"
  | "faq"
  | "videoEmbed"
  | "inlineImage"
  | "map"
  | "bookingOptions";
export interface TripBlock {
  id: string;
  type: BlockType;
  content: any; // Tu ląduje dynamiczny JSON z danymi bloku
  isGenerating?: boolean; // Używane tylko w UI do pokazywania loadera AI
}
// Twarde fakty wydarzenia podawane agentom AI. Bez nich copywriter zmyśla
// konkrety (adresy, godziny, czas trwania, udogodnienia), bo z samego promptu
// użytkownika nie zna ani lokalizacji, ani terminu, ani ceny.
function buildTripFacts(trip: any): string {
  if (!trip) return "";

  let locationName = "";
  let locationCity = "";
  try {
    const loc =
      typeof trip.location === "string" && trip.location.trim().startsWith("{")
        ? JSON.parse(trip.location)
        : trip.location;
    if (loc && typeof loc === "object") {
      locationName = loc.name || "";
      locationCity = loc.city || "";
    } else if (typeof trip.location === "string") {
      locationName = trip.location;
    }
  } catch {
    if (typeof trip.location === "string") locationName = trip.location;
  }

  const fmtDate = (d: any) => {
    if (!d) return "";
    const date = new Date(d);
    return isNaN(date.getTime())
      ? ""
      : date.toLocaleDateString("pl-PL", {
          day: "numeric",
          month: "long",
          year: "numeric",
        });
  };

  const start = fmtDate(trip.startDate);
  const end = fmtDate(trip.endDate);
  const term = start && end && start !== end ? `${start} – ${end}` : start;

  const lines = [
    trip.title ? `- Tytuł: ${trip.title}` : "",
    locationName ? `- Obiekt / miejsce: ${locationName}` : "",
    locationCity ? `- Miejscowość: ${locationCity}` : "",
    term ? `- Termin: ${term}` : "",
    // Deadline zapisów to fakt sprzedażowy (buduje pilność) — ale tylko wtedy,
    // gdy admin faktycznie go ustawił. Bez tej linii AI zmyślało własne terminy.
    trip.registrationDeadline
      ? `- Zapisy przyjmujemy do (włącznie): ${fmtDate(trip.registrationDeadline)} — po tym dniu formularz rezerwacji znika`
      : "",
    trip.capacity ? `- Liczba miejsc: ${trip.capacity}` : "",
    trip.price ? `- Cena: ${trip.price} zł za osobę` : "",
    trip.deposit ? `- Zadatek: ${trip.deposit} zł` : "",
    typeof trip.allowBringFriend === "boolean"
      ? `- Opcja "zabierz osobę towarzyszącą": ${trip.allowBringFriend ? "włączona" : "wyłączona"}`
      : "",
    trip.description ? `- Opis od organizatora: ${trip.description}` : "",
  ].filter(Boolean);

  if (lines.length === 0) return "";

  return `\n\nDANE WYDARZENIA (jedyne wiarygodne fakty — nie wymyślaj innych):\n${lines.join("\n")}`;
}

// Skrót już napisanych bloków — przekazujemy go copywriterowi, żeby kolejne
// akapity nie powtarzały w kółko tych samych korzyści (każdy blok powstaje
// w osobnym zapytaniu i bez tego wszystkie zbiegają się do jednej treści).
function summarizeWrittenBlocks(blocks: TripBlock[]): string {
  const written = blocks
    .filter((b) => !b.isGenerating && b.content)
    .flatMap((b) => {
      const c: any = b.content;
      if (typeof c.text === "string" && c.text.trim()) {
        return [`${b.type}: ${c.text.replace(/<[^>]+>/g, "").slice(0, 160)}`];
      }
      if (Array.isArray(c.items) && c.items.length > 0) {
        const heads = c.items
          .slice(0, 4)
          .map((it: any) =>
            String(it.question || it.name || it.text || "")
              .replace(/<[^>]+>/g, "")
              .slice(0, 80),
          )
          .filter(Boolean);
        return heads.length ? [`${b.type}: ${heads.join(" | ")}`] : [];
      }
      return [];
    });

  if (written.length === 0) return "";

  return `\n\nJUŻ NAPISANE BLOKI (NIE powtarzaj tych samych zdań, korzyści ani zwrotów — napisz coś nowego):\n${written
    .map((w) => `- ${w}`)
    .join("\n")}`;
}

export function useTripAiGenerator(
  updateField: (field: any, value: any) => void,
  pickImagesFor?: PickImagesFor,
  tripData?: any,
) {
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiProgress, setAiProgress] = useState({
    isVisible: false,
    phase: "idle" as
      | "idle"
      | "blueprint"
      | "generating"
      | "ratelimit"
      | "images"
      | "done"
      | "error",
    currentBlock: 0,
    totalBlocks: 0,
    message: "",
    countdown: 0,
  });

  // Wspólny handler statusu z geminiFetch — obsługuje limit Gemini (429) oraz
  // ponawianie po błędach: zamiast wywalać blok, czekamy i wznawiamy automatycznie
  // (dokładnie jak generacja bloga). Dzięki temu generacja jest płynna i nie
  // produkuje bloków z błędem.
  const buildStatusHandler =
    (resumeMessage: string) => (status: RateStatus) => {
      if (status.kind === "waiting") {
        const baseMsg =
          status.reason === "ratelimit"
            ? "Ochrona limitu Gemini. Wznawiam automatycznie ☕"
            : `Błąd Gemini — ponawiam próbę (${status.attempt}/${status.maxAttempts})`;
        setAiProgress((prev) => ({
          ...prev,
          phase: "ratelimit",
          message: baseMsg,
          countdown: status.countdown,
        }));
      } else {
        setAiProgress((prev) =>
          prev.phase === "ratelimit"
            ? { ...prev, phase: "generating", message: resumeMessage, countdown: 0 }
            : prev,
        );
      }
    };

  const handleGenerateLandingPage = async (
    prompt: string,
    selectedModel: string,
  ) => {
    setAiProgress({
      isVisible: true,
      phase: "blueprint",
      currentBlock: 0,
      totalBlocks: 0,
      message: "Architekt AI układa plan strony...",
      countdown: 0,
    });

    const tripFacts = buildTripFacts(tripData);

    try {
      const bpRes = await geminiFetch(
        "/api/admin/gemini",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "generateBlueprint",
            prompt: `${prompt}${tripFacts}`,
            model: selectedModel,
          }),
        },
        { onStatus: buildStatusHandler("Architekt AI układa plan strony...") },
      );

      if (!bpRes.ok) throw new Error("Błąd podczas tworzenia planu.");
      const responseData = await bpRes.json();
      const blueprint = Array.isArray(responseData.blueprint)
        ? responseData.blueprint
        : [];
      const meta = responseData.meta;
      if (blueprint.length === 0) {
        throw new Error("AI nie zwróciło planu strony. Spróbuj ponownie.");
      }

      setIsAiModalOpen(false);
      setAiPrompt("");

      setAiProgress({
        isVisible: true,
        phase: "generating",
        currentBlock: 0,
        totalBlocks: blueprint.length,
        message: "Copywriter pisze teksty...",
        countdown: 0,
      });

      if (meta) {
        updateField("subtitle", meta.subtitle || "");
        updateField("tags", meta.tags || []);
      }

      // Cała struktura wskakuje od razu (z shimmerem) — tak jak teraz — a treść
      // dolewamy blok po bloku.
      let currentBlocks: TripBlock[] = blueprint.map((step: any) => ({
        id: safeUuid(),
        type: step.type,
        content: {},
        isGenerating: true,
      }));
      updateField("blocks", currentBlocks);

      for (let i = 0; i < blueprint.length; i++) {
        const step = blueprint[i];
        const blockIdToUpdate = currentBlocks[i].id;
        // Żywy komunikat: co dokładnie agent teraz pisze (jak w panelu bloga).
        setAiProgress((prev) => ({
          ...prev,
          phase: "generating",
          currentBlock: i + 1,
          message: `Blok ${i + 1}/${blueprint.length} · ${step.type}${
            step.topic ? ` – ${step.topic}` : ""
          }`,
        }));

        try {
          const blockRes = await geminiFetch(
            "/api/admin/gemini",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                action: "generateSingleBlock",
                prompt: prompt,
                overallContext: `${prompt}${tripFacts}${summarizeWrittenBlocks(
                  currentBlocks,
                )}`,
                blockType: step.type,
                topic: step.topic,
                model: selectedModel,
              }),
            },
            { onStatus: buildStatusHandler("Copywriter wraca do pracy...") },
          );

          if (!blockRes.ok) throw new Error("Błąd API");
          let blockContent = await blockRes.json();

          // Odkurzacz JSON PRO
          if (
            blockContent.content &&
            typeof blockContent.content === "object" &&
            !Array.isArray(blockContent.content)
          )
            blockContent = blockContent.content;
          if (
            blockContent[step.type] &&
            typeof blockContent[step.type] === "object" &&
            !Array.isArray(blockContent[step.type])
          )
            blockContent = blockContent[step.type];
          if (blockContent.type) delete blockContent.type;
          if (
            ["bulletList", "featuresGrid", "faq", "pricingList"].includes(
              step.type,
            ) &&
            !blockContent.items
          )
            blockContent.items = [];
          if (["heading", "paragraph", "highlight"].includes(step.type)) {
            if (typeof blockContent === "string")
              blockContent = { text: blockContent };
            else if (!blockContent.text)
              blockContent.text =
                "Treść się nie wygenerowała. Usuń i spróbuj ponownie.";
          }
          // AI nigdy nie podaje realnego zdjęcia — prawdziwy URL pochodzi WYŁĄCZNIE
          // z pickera (Pexels / własny upload). Czyścimy cokolwiek wpisało, zostawiając
          // `alt` jako podpowiedź, co ma przedstawiać zdjęcie.
          if (step.type === "inlineImage") {
            blockContent.url = "";
            if (typeof blockContent.alt !== "string") blockContent.alt = "";
          }

          currentBlocks = currentBlocks.map((block) =>
            block.id === blockIdToUpdate
              ? { ...block, content: blockContent, isGenerating: false }
              : block,
          );
          updateField("blocks", currentBlocks);

          // Pauza INLINE na bloku zdjęcia: otwórz picker OD RAZU (z opisem `alt`
          // jako podpowiedzią) i wznów pisanie dopiero po wyborze/pominięciu.
          if (
            pickImagesFor &&
            step.type === "inlineImage" &&
            !isUsableImageUrl(
              currentBlocks.find((b) => b.id === blockIdToUpdate)?.content?.url,
            )
          ) {
            setAiProgress((prev) => ({
              ...prev,
              phase: "images",
              message: "Wybierz zdjęcie do tego miejsca...",
            }));
            currentBlocks = (await pickImagesFor(
              currentBlocks,
              (bs) => updateField("blocks", bs),
              blockIdToUpdate,
            )) as TripBlock[];
            updateField("blocks", currentBlocks);
            setAiProgress((prev) => ({
              ...prev,
              phase: "generating",
              message: "Copywriter pisze teksty...",
            }));
          }
        } catch (err) {
          currentBlocks = currentBlocks.map((block) =>
            block.id === blockIdToUpdate
              ? {
                  ...block,
                  isGenerating: false,
                  content: {
                    text: "Wystąpił błąd ładowania. Usuń ten klocek i spróbuj ponownie.",
                  },
                }
              : block,
          );
          updateField("blocks", currentBlocks);
        }
      }

      setAiProgress((prev) => ({
        ...prev,
        phase: "done",
        message: "Strona wygenerowana pomyślnie!",
      }));
      setTimeout(
        () => setAiProgress((prev) => ({ ...prev, isVisible: false })),
        3000,
      );
    } catch (err) {
      setAiProgress((prev) => ({
        ...prev,
        phase: "error",
        message:
          err instanceof Error ? err.message : "Wystąpił błąd. Spróbuj ponownie.",
      }));
      setTimeout(
        () => setAiProgress((prev) => ({ ...prev, isVisible: false })),
        4000,
      );
    }
  };

  return {
    isAiModalOpen,
    setIsAiModalOpen,
    aiPrompt,
    setAiPrompt,
    aiProgress,
    handleGenerateLandingPage,
  };
}
