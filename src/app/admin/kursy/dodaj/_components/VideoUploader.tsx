"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import * as tus from "tus-js-client";
import {
  FilmSlate,
  UploadSimple,
  CircleNotch,
  Trash,
  Warning,
  ArrowsClockwise,
} from "@phosphor-icons/react/dist/ssr";
import { useReportUpload } from "./uploadTracker";

const ACCEPT = "video/mp4,video/quicktime,video/webm,video/x-matroska";
const MAX_BYTES = 2_000_000_000; // 2 GB

type Phase = "idle" | "uploading" | "processing" | "done" | "error";

const isBunny = (url: string) => url.includes("iframe.mediadelivery.net");
// GUID z embed URL Bunny: …/embed/{libraryId}/{guid}. (Wersja kliencka —
// bunny.ts jest server-only, więc nie możemy go tu importować.)
const guidFromEmbed = (url: string) =>
  url.match(/\/embed\/[^/]+\/([^/?#]+)/)?.[1] ?? null;

// Podgląd w kreatorze: wymuś brak autoodtwarzania (Bunny domyślnie startuje
// film sam po załadowaniu/odświeżeniu). Nie zmieniamy zapisanego `value` —
// tylko URL renderowany w iframe podglądu.
const noAutoplaySrc = (url: string) => {
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}autoplay=false&preload=false`;
};

const STATUS_POLL_MS = 4000;

export function VideoUploader({
  value,
  onChange,
  onDuration,
  label = "Wideo kursu",
  hint = "MP4 / MOV / WEBM — przeciągnij plik lub kliknij. Streaming HLS z ochroną Bunny.",
}: {
  value: string;
  onChange: (url: string) => void;
  /** Długość nagrania (sekundy) z Bunny — zgłaszana po zakończeniu kodowania. */
  onDuration?: (seconds: number) => void;
  label?: string;
  hint?: string;
}) {
  const [phase, setPhase] = useState<Phase>(value ? "done" : "idle");
  const [progress, setProgress] = useState(0);
  const [encodeProgress, setEncodeProgress] = useState(0);
  const [videoId, setVideoId] = useState<string | null>(() =>
    isBunny(value) ? guidFromEmbed(value) : null,
  );
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Zgłoś przesyłanie do kreatora (liczy WSZYSTKIE materiały + agreguje postęp;
  // spinner/licznik w pasku akcji + toast po końcu).
  useReportUpload(phase === "uploading", progress);

  // Synchronizacja z zewnętrznym `value` (np. przywrócony szkic z autozapisu):
  // gdy wideo „wpadnie" z zewnątrz, pokaż player; gdy zniknie — wróć do dropzone.
  useEffect(() => {
    if (value && phase === "idle") {
      setVideoId(isBunny(value) ? guidFromEmbed(value) : null);
      setPhase("done");
    } else if (!value && phase === "done") {
      setPhase("idle");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  // Wejście z gotowym `value` (edycja / przywrócony szkic): sprawdź raz status.
  // Jeśli wideo jest już gotowe — od razu odśwież czas materiału (Bunny zna
  // długość). Jeśli jeszcze koduje — przełącz na overlay i polluj.
  useEffect(() => {
    if (phase !== "done" || !videoId) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `/api/admin/kursy/bunny-status?videoId=${encodeURIComponent(videoId)}`,
          { cache: "no-store" },
        );
        const data = await res.json();
        if (cancelled || !res.ok) return;
        if (data.ready) {
          // Gotowe — natychmiastowe odświeżenie czasu materiału.
          if (typeof data.length === "number" && data.length > 0) {
            onDuration?.(data.length);
          }
        } else if (data.notFound) {
          setError(
            "Tego nagrania nie ma w Bunny (materiał testowy lub usunięty). Wgraj plik ponownie.",
          );
          setPhase("error");
        } else if (data.failed) {
          setError(
            "Bunny nie zdołał przetworzyć tego wideo. Spróbuj wgrać ponownie.",
          );
          setPhase("error");
        } else {
          setEncodeProgress(
            typeof data.encodeProgress === "number" ? data.encodeProgress : 0,
          );
          setPhase("processing");
        }
      } catch {
        /* brak statusu — zostaw player */
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId]);

  // Polling statusu w fazie „processing" — przełącz na player przy Finished.
  useEffect(() => {
    if (phase !== "processing" || !videoId) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    const poll = async () => {
      try {
        const res = await fetch(
          `/api/admin/kursy/bunny-status?videoId=${encodeURIComponent(videoId)}`,
          { cache: "no-store" },
        );
        const data = await res.json();
        if (cancelled) return;
        if (res.ok) {
          if (typeof data.encodeProgress === "number") {
            setEncodeProgress(data.encodeProgress);
          }
          if (data.ready) {
            if (typeof data.length === "number" && data.length > 0) {
              onDuration?.(data.length);
            }
            setPhase("done");
            return;
          }
          if (data.notFound) {
            setError(
              "Tego nagrania nie ma w Bunny (materiał testowy lub usunięty). Wgraj plik ponownie.",
            );
            setPhase("error");
            return;
          }
          if (data.failed) {
            setError(
              "Bunny nie zdołał przetworzyć tego wideo. Spróbuj wgrać ponownie.",
            );
            setPhase("error");
            return;
          }
        }
      } catch {
        /* chwilowy błąd sieci — spróbujemy ponownie */
      }
      if (!cancelled) timer = setTimeout(poll, STATUS_POLL_MS);
    };

    poll();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [phase, videoId]);

  const startUpload = async (file: File) => {
    setError(null);
    if (!file.type.startsWith("video/")) {
      setError("To nie jest plik wideo.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("Plik jest za duży (max 2 GB).");
      return;
    }
    setFileName(file.name);
    setPhase("uploading");
    setProgress(0);

    try {
      // 1) Serwer tworzy wideo w Bunny i podpisuje upload.
      const res = await fetch("/api/admin/kursy/bunny-upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: file.name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Błąd inicjalizacji uploadu.");

      // Embed URL i videoId znamy JUŻ TERAZ (Bunny tworzy obiekt wideo przed
      // wysłaniem pliku). Zapisujemy je od razu, dzięki czemu kreator widzi
      // „jest wideo" i odblokowuje „Zakończ i przejdź dalej" — a przesyłanie
      // pliku do Bunny spokojnie kończy się w tle (zgodnie z obietnicą w UI).
      onChange(data.embedUrl);
      setVideoId(data.videoId);

      // 2) Klient wysyła plik bezpośrednio do Bunny (TUS — wznawialny + progres).
      const upload = new tus.Upload(file, {
        endpoint: "https://video.bunnycdn.com/tusupload",
        retryDelays: [0, 3000, 6000, 12000],
        headers: {
          AuthorizationSignature: data.signature,
          AuthorizationExpire: String(data.expire),
          VideoId: data.videoId,
          LibraryId: String(data.libraryId),
        },
        metadata: { filetype: file.type, title: file.name },
        onError: () => {
          // Upload padł — cofnij wcześniejszy zapis URL, żeby w szkicu nie
          // został martwy odnośnik do wideo bez pliku.
          onChange("");
          setVideoId(null);
          setError("Nie udało się przesłać wideo. Spróbuj ponownie.");
          setPhase("error");
        },
        onProgress: (uploaded, total) => {
          setProgress(Math.round((uploaded / total) * 100));
        },
        onSuccess: () => {
          // Wideo jest już w Bunny — zapisujemy embed URL (autozapis szkicu),
          // ale czekamy z playerem aż Bunny zakończy kodowanie (faza processing).
          onChange(data.embedUrl);
          setVideoId(data.videoId);
          setEncodeProgress(0);
          setPhase("processing");
        },
      });
      upload.start();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Nie udało się przesłać wideo.",
      );
      setPhase("error");
    }
  };

  const handleFiles = (files: FileList | null) => {
    const f = files?.[0];
    if (f) startUpload(f);
  };

  const reset = () => {
    onChange("");
    setPhase("idle");
    setProgress(0);
    setEncodeProgress(0);
    setVideoId(null);
    setFileName("");
    setError(null);
  };

  // ───────────────────────────── kawałki UI ─────────────────────────────

  // Akcje wyświetlane NA wideo (prawy górny róg), pojawiają się na hover.
  const hoverActions = () => (
    // transform-gpu = stała warstwa kompozycji NAD iframe (inaczej iframe Bunny
    // przejmuje hit-testing i kliknięcia w przyciski „gasną" po chwili).
    <div className="absolute top-2 right-2 z-20 flex items-center gap-1.5 transform-gpu">
      <motion.button
        type="button"
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        onClick={() => inputRef.current?.click()}
        title="Zmień nagranie"
        className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-black/80 text-white text-[11.5px] font-bold shadow-md hover:bg-black"
      >
        <ArrowsClockwise size={14} weight="bold" />
        Zmień
      </motion.button>
      <motion.button
        type="button"
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        onClick={reset}
        title="Usuń nagranie"
        className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-rose-500 text-white text-[11.5px] font-bold shadow-md hover:bg-rose-600"
      >
        <Trash size={14} weight="bold" />
        Usuń
      </motion.button>
    </div>
  );

  // Odtwarzacz „YouTube-like": iframe Bunny zawsze załadowany, bez autoplay,
  // bez zaokrąglenia/ramki. `loading="lazy"` → poza ekranem się nie ładuje.
  const playerEmbed = () => (
    <div className="group relative w-full aspect-video overflow-hidden rounded-2xl rounded-tr-none border border-gray-200 bg-black shadow-[0_14px_40px_-24px_rgba(3,63,99,0.5)]">
      {isBunny(value) ? (
        <iframe
          src={noAutoplaySrc(value)}
          loading="lazy"
          title="Podgląd nagrania"
          className="absolute inset-0 w-full h-full border-0"
          allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
        />
      ) : (
        <video
          src={value}
          controls
          className="absolute inset-0 w-full h-full object-contain"
        />
      )}
      {hoverActions()}
    </div>
  );

  const progressCard = () => (
    <div className="w-full aspect-video flex flex-col items-center justify-center gap-3 rounded-2xl rounded-tr-none border border-brand-primary/20 bg-brand-primary/[0.05] p-5">
      <CircleNotch size={28} weight="bold" className="text-brand-primary animate-spin" />
      <div className="w-full max-w-xs text-center">
        <p className="font-montserrat font-semibold text-[13px] text-brand-secondary truncate">
          {fileName}
        </p>
        <p className="font-montserrat text-[11.5px] text-brand-secondary/50 mb-2">
          Przesyłanie do Bunny… {progress}%
        </p>
        <div className="h-2 w-full rounded-full bg-brand-secondary/10 overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-brand-primary to-brand-yellow"
            animate={{ width: `${progress}%` }}
            transition={{ ease: "easeOut", duration: 0.2 }}
          />
        </div>
      </div>
    </div>
  );

  // Bunny koduje wideo po uploadzie — pokazujemy WŁASNY overlay zamiast surowej
  // planszy „Processing" z embeda. Przełączenie na player robi polling statusu.
  const processingCard = () => (
    <div className="group relative w-full aspect-video flex flex-col items-center justify-center gap-3 overflow-hidden rounded-2xl rounded-tr-none border border-brand-primary/20 bg-brand-primary/[0.05] p-5 text-center">
      <span className="pointer-events-none absolute -right-7 -bottom-7 size-28 rounded-full bg-brand-yellow/20 blur-[40px]" />
      <span className="relative flex items-center justify-center size-12 rounded-2xl rounded-tr-none bg-brand-primary text-white border border-brand-yellow/30 shadow-[0_8px_22px_-6px_rgba(40,125,136,0.5)]">
        <CircleNotch size={24} weight="bold" className="animate-spin" />
      </span>
      <div className="relative w-full max-w-xs">
        <p className="font-jakarta font-bold text-[14px] text-brand-secondary">
          Przetwarzanie u Bunny…
        </p>
        <p className="font-montserrat text-[11.5px] text-brand-secondary/50 mt-0.5 mb-2">
          Film koduje się do streamingu. Pojawi się tu automatycznie, gdy będzie
          gotowy{encodeProgress > 0 ? ` — ${encodeProgress}%` : ""}.
        </p>
        {encodeProgress > 0 && (
          <div className="h-2 w-full rounded-full bg-brand-secondary/10 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-brand-primary to-brand-yellow"
              animate={{ width: `${encodeProgress}%` }}
              transition={{ ease: "easeOut", duration: 0.3 }}
            />
          </div>
        )}
      </div>
      {/* Można zmienić nagranie nawet w trakcie kodowania. */}
      {hoverActions()}
    </div>
  );

  const dropzone = () => (
    <button
      type="button"
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        handleFiles(e.dataTransfer.files);
      }}
      className={`relative flex flex-col items-center justify-center gap-3 w-full aspect-video rounded-2xl rounded-tr-none border-2 border-dashed transition-colors text-center px-4 py-6 ${
        dragOver
          ? "border-brand-primary/60 bg-brand-primary/[0.08]"
          : error
            ? "border-rose-300 bg-rose-50/60"
            : "border-brand-primary/25 bg-brand-primary/[0.04] hover:border-brand-primary/50 hover:bg-brand-primary/[0.07]"
      }`}
    >
      <span className="flex items-center justify-center size-12 rounded-2xl rounded-tr-none bg-white text-brand-primary border border-brand-primary/10 shadow-sm">
        <UploadSimple size={24} weight="duotone" />
      </span>
      <div>
        <p className="font-montserrat font-bold text-[13.5px] text-brand-secondary">
          Przeciągnij wideo lub kliknij, aby wybrać
        </p>
        <p className="font-montserrat text-[12px] text-brand-secondary/50 mt-0.5 max-w-sm mx-auto">
          {hint}
        </p>
      </div>
      {error && (
        <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-rose-500">
          <Warning size={14} weight="fill" />
          {error}
        </span>
      )}
    </button>
  );

  const viewKey =
    phase === "done" && value
      ? "player"
      : phase === "uploading"
        ? "uploading"
        : phase === "processing"
          ? "processing"
          : "drop";

  return (
    <div className="flex flex-col gap-1.5">
      <span className="font-montserrat font-semibold text-[12px] text-gray-500 inline-flex items-center gap-1.5">
        <FilmSlate size={14} weight="duotone" className="text-brand-primary" />
        {label}
      </span>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={viewKey}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
        >
          {phase === "done" && value
            ? playerEmbed()
            : phase === "uploading"
              ? progressCard()
              : phase === "processing"
                ? processingCard()
                : dropzone()}
        </motion.div>
      </AnimatePresence>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        hidden
        onChange={(e) => {
          handleFiles(e.target.files);
          e.currentTarget.value = "";
        }}
      />
    </div>
  );
}
