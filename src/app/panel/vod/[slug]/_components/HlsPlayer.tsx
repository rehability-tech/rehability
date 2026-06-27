"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type HlsType from "hls.js";
import {
  Play,
  Pause,
  SpeakerHigh,
  SpeakerSlash,
  CornersOut,
  CornersIn,
} from "@phosphor-icons/react/dist/ssr";

function fmtTime(t: number): string {
  if (!isFinite(t) || t < 0) return "0:00";
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

type VideoWithFs = HTMLVideoElement & {
  webkitEnterFullscreen?: () => void;
};

// Screen Orientation API z metodą lock() — nie ma jej w domyślnych typach lib.dom.
type LockableOrientation = ScreenOrientation & {
  lock?: (orientation: "landscape") => Promise<void>;
};

/** Blokada ekranu w poziomie (tylko Android/Chromium, w pełnym ekranie). */
function lockLandscape() {
  const o = screen.orientation as LockableOrientation | undefined;
  o?.lock?.("landscape").catch(() => {});
}
/** Zdjęcie blokady → powrót do pionu (gdy wychodzimy z pełnego ekranu). */
function unlockOrientation() {
  try {
    screen.orientation?.unlock?.();
  } catch {
    /* brak wsparcia (np. iOS Safari) — ignorujemy */
  }
}

/**
 * Własny odtwarzacz HLS (hls.js + natywny HLS na Safari/iOS).
 * Minimalne kontrolki: play/pauza, czas (pasek), głośność, pełny ekran.
 * Pełny ekran na mobile blokuje orientację landscape (jak na YouTube),
 * a wyjście z pełnego ekranu przywraca pion.
 */
export function HlsPlayer({
  src,
  isHls,
  poster,
  autoPlay = false,
  startAt = 0,
  onPlay,
  onPause,
  onEnded,
  onProgress,
  overlay,
}: {
  src: string;
  isHls: boolean;
  poster?: string;
  /** Czy po załadowaniu od razu odtwarzać. Zmiana lekcji ładuje wideo bez autoplaya. */
  autoPlay?: boolean;
  /** Sekunda, od której wznowić odtwarzanie (postęp single). 0 = od początku. */
  startAt?: number;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  /** Throttlowany postęp oglądania (sekundy, długość) — do zapisu postępu single. */
  onProgress?: (seconds: number, duration: number) => void;
  /** Nakładka renderowana WEWNĄTRZ playera (widoczna też w pełnym ekranie). */
  overlay?: React.ReactNode;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Wznowienie pozycji następuje raz (po wczytaniu metadanych).
  const seekedRef = useRef(false);
  // Throttle zapisu postępu — ostatnia raportowana sekunda.
  const lastReportRef = useRef(0);

  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [cur, setCur] = useState(0);
  const [dur, setDur] = useState(0);
  const [fs, setFs] = useState(false);
  const [showCtrls, setShowCtrls] = useState(true);

  // Źródło: hls.js (Android/desktop) lub natywny HLS (Safari/iOS).
  // hls.js ładujemy leniwie (dynamic import) — nie trafia do SSR ani initial bundle.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    let hls: HlsType | null = null;
    let cancelled = false;
    const canNative = video.canPlayType("application/vnd.apple.mpegurl");

    (async () => {
      if (isHls && !canNative) {
        const Hls = (await import("hls.js")).default;
        if (cancelled) return;
        if (Hls.isSupported()) {
          hls = new Hls({ enableWorker: true });
          hls.loadSource(src);
          hls.attachMedia(video);
        } else {
          video.src = src;
        }
      } else {
        video.src = src;
      }
      // Autoplay tylko gdy świadomie chcemy grać (pierwszy klik ▶ lub kontynuacja
      // „następna lekcja"). Zwykła zmiana lekcji ładuje wideo zapauzowane (duży ▶).
      if (autoPlay) video.play().catch(() => {});
    })();

    return () => {
      cancelled = true;
      hls?.destroy();
    };
  }, [src, isHls, autoPlay]);

  // Zdarzenia <video>.
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onPlayEv = () => {
      setPlaying(true);
      onPlay?.();
    };
    const onPauseEv = () => {
      setPlaying(false);
      onPause?.();
    };
    const onEndedEv = () => {
      setPlaying(false);
      onEnded?.();
    };
    const onTime = () => {
      setCur(v.currentTime);
      // Raport postępu nie częściej niż co 10 s (oraz przy cofnięciu czasu).
      const t = Math.floor(v.currentTime);
      if (onProgress && (t >= lastReportRef.current + 10 || t < lastReportRef.current)) {
        lastReportRef.current = t;
        onProgress(t, v.duration || 0);
      }
    };
    const onMeta = () => {
      setDur(v.duration || 0);
      setReady(true);
      // Wznowienie pozycji (postęp single) — raz, jeśli sensowne.
      if (
        !seekedRef.current &&
        startAt > 1 &&
        v.duration &&
        startAt < v.duration - 2
      ) {
        seekedRef.current = true;
        try {
          v.currentTime = startAt;
        } catch {
          /* niektóre źródła nie pozwalają seekować przed buforowaniem */
        }
      }
    };
    const onVol = () => {
      setMuted(v.muted);
      setVolume(v.volume);
    };
    v.addEventListener("play", onPlayEv);
    v.addEventListener("pause", onPauseEv);
    v.addEventListener("ended", onEndedEv);
    v.addEventListener("timeupdate", onTime);
    v.addEventListener("loadedmetadata", onMeta);
    v.addEventListener("durationchange", onMeta);
    v.addEventListener("volumechange", onVol);
    return () => {
      v.removeEventListener("play", onPlayEv);
      v.removeEventListener("pause", onPauseEv);
      v.removeEventListener("ended", onEndedEv);
      v.removeEventListener("timeupdate", onTime);
      v.removeEventListener("loadedmetadata", onMeta);
      v.removeEventListener("durationchange", onMeta);
      v.removeEventListener("volumechange", onVol);
    };
  }, [onPlay, onPause, onEnded, onProgress, startAt]);

  // Stan pełnego ekranu (Fullscreen API) + sterowanie orientacją.
  // Wejście w pełny ekran → blokada landscape; wyjście → powrót do pionu.
  useEffect(() => {
    const onFs = () => {
      const active = !!document.fullscreenElement;
      setFs(active);
      if (active) lockLandscape();
      else unlockOrientation();
    };
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  const enterFs = useCallback(() => {
    const el = wrapRef.current;
    const v = videoRef.current as VideoWithFs | null;
    if (document.fullscreenElement) return;
    if (el?.requestFullscreen) {
      // Blokada orientacji musi nastąpić po wejściu w pełny ekran.
      el.requestFullscreen()
        .then(lockLandscape)
        .catch(() => {});
    } else if (v?.webkitEnterFullscreen) {
      v.webkitEnterFullscreen(); // iPhone — natywny pełny ekran <video>
    }
  }, []);

  const exitFs = useCallback(() => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  }, []);

  const toggleFs = () =>
    document.fullscreenElement ? exitFs() : enterFs();

  // Auto-ukrywanie kontrolek podczas odtwarzania.
  const poke = useCallback(() => {
    setShowCtrls(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      if (videoRef.current && !videoRef.current.paused) setShowCtrls(false);
    }, 2600);
  }, []);
  useEffect(() => {
    poke();
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [poke]);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) v.play().catch(() => {});
    else v.pause();
  };
  const toggleMute = () => {
    const v = videoRef.current;
    if (v) v.muted = !v.muted;
  };
  const onSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = videoRef.current;
    if (v) v.currentTime = Number(e.target.value);
  };
  const onVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = videoRef.current;
    if (!v) return;
    const val = Number(e.target.value);
    v.volume = val;
    v.muted = val === 0;
  };

  const rangeCls =
    "h-1 cursor-pointer appearance-none rounded-full bg-white/30 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:size-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-moz-range-thumb]:size-3 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-white";

  return (
    <div
      ref={wrapRef}
      className="absolute inset-0 select-none bg-black"
      onMouseMove={poke}
      onTouchStart={poke}
    >
      <video
        ref={videoRef}
        poster={poster}
        playsInline
        className="absolute inset-0 h-full w-full object-contain"
        onClick={togglePlay}
      />

      {/* Duży play na pauzie (chowamy, gdy jest nakładka końcowa) */}
      {ready && !playing && !overlay && (
        <button
          type="button"
          onClick={togglePlay}
          aria-label="Odtwórz"
          className="absolute inset-0 flex items-center justify-center"
        >
          <span className="flex size-16 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm">
            <Play size={30} weight="fill" className="translate-x-0.5" />
          </span>
        </button>
      )}

      {/* Nakładka (np. następna lekcja / prośba o opinię) — w środku playera,
          więc widoczna także w pełnym ekranie. */}
      {overlay}

      {/* Pasek kontrolek */}
      <div
        className={`absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/70 to-transparent px-3 pb-2.5 pt-8 transition-opacity duration-300 ${
          showCtrls ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        {/* Pasek czasu */}
        <input
          type="range"
          min={0}
          max={dur || 0}
          step="any"
          value={cur}
          onChange={onSeek}
          aria-label="Pasek czasu"
          style={{
            background: `linear-gradient(to right, var(--color-primary, #287d88) ${
              dur > 0 ? (cur / dur) * 100 : 0
            }%, rgba(255,255,255,0.3) ${dur > 0 ? (cur / dur) * 100 : 0}%)`,
          }}
          className={`w-full ${rangeCls}`}
        />
        <div className="mt-1.5 flex items-center gap-3 text-white">
          <button
            type="button"
            onClick={togglePlay}
            aria-label={playing ? "Pauza" : "Odtwórz"}
            className="shrink-0"
          >
            {playing ? (
              <Pause size={22} weight="fill" />
            ) : (
              <Play size={22} weight="fill" />
            )}
          </button>

          <span className="font-montserrat text-[12px] tabular-nums text-white/90">
            {fmtTime(cur)} / {fmtTime(dur)}
          </span>

          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={toggleMute}
              aria-label={muted ? "Włącz dźwięk" : "Wycisz"}
              className="shrink-0"
            >
              {muted || volume === 0 ? (
                <SpeakerSlash size={20} weight="fill" />
              ) : (
                <SpeakerHigh size={20} weight="fill" />
              )}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={muted ? 0 : volume}
              onChange={onVolume}
              aria-label="Głośność"
              style={{
                background: `linear-gradient(to right, #ffffff ${
                  (muted ? 0 : volume) * 100
                }%, rgba(255,255,255,0.3) ${(muted ? 0 : volume) * 100}%)`,
              }}
              className={`hidden w-20 sm:block ${rangeCls}`}
            />
            <button
              type="button"
              onClick={toggleFs}
              aria-label="Pełny ekran"
              className="shrink-0"
            >
              {fs ? (
                <CornersIn size={20} weight="bold" />
              ) : (
                <CornersOut size={20} weight="bold" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
