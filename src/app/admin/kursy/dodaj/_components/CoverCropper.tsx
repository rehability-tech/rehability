"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toBlob } from "html-to-image";
import {
  X,
  Crop,
  CircleNotch,
  Check,
  MagnifyingGlassPlus,
  MagnifyingGlassMinus,
  ArrowsOutCardinal,
} from "@phosphor-icons/react/dist/ssr";
import { toast } from "sonner";
import { useBlogUploadImage } from "@/app/admin/blog/dodaj/edytor-tresci/_components/lib/useBlogUploadImage";

// Okładka kadrowana do 16:10 (jak podgląd w panelu i karta katalogu).
const ASPECT = 16 / 10;
const OUT_W = 1280; // szerokość wyjściowego obrazu (→ 1280×800)
const MAX_ZOOM = 3;

interface CoverCropperProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (url: string) => void;
  /** Źródłowy obraz do skadrowania (musi być z naszej domeny / CORS-friendly). */
  src: string;
}

export default function CoverCropper({
  isOpen,
  onClose,
  onApply,
  src,
}: CoverCropperProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const vpRef = useRef<HTMLDivElement>(null);
  const [vp, setVp] = useState({ w: 0, h: 0 });
  const [nat, setNat] = useState({ w: 0, h: 0 });
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [busy, setBusy] = useState(false);
  const drag = useRef<{ px: number; py: number; ox: number; oy: number } | null>(
    null,
  );

  // Pomiar viewportu (zmienia się z szerokością modala / oknem).
  useEffect(() => {
    if (!isOpen) return;
    const measure = () => {
      const el = vpRef.current;
      if (el) setVp({ w: el.clientWidth, h: el.clientHeight });
    };
    measure();
    const id = window.setTimeout(measure, 50); // po animacji wejścia
    window.addEventListener("resize", measure);
    return () => {
      window.clearTimeout(id);
      window.removeEventListener("resize", measure);
    };
  }, [isOpen, mounted]);

  // Wymiary naturalne źródła.
  useEffect(() => {
    if (!isOpen || !src) return;
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => setNat({ w: img.naturalWidth, h: img.naturalHeight });
    img.src = src;
  }, [isOpen, src]);

  // Reset przy każdym otwarciu / zmianie źródła.
  useEffect(() => {
    if (isOpen) {
      setZoom(1);
      setOffset({ x: 0, y: 0 });
    }
  }, [isOpen, src]);

  // Skala „cover" (przy zoom=1 obraz dokładnie wypełnia kadr).
  const coverScale =
    vp.w && nat.w ? Math.max(vp.w / nat.w, vp.h / nat.h) : 0;
  const dispW = nat.w * coverScale * zoom;
  const dispH = nat.h * coverScale * zoom;

  // Trzymamy obraz tak, by ZAWSZE wypełniał kadr (bez prześwitów).
  const clamp = useCallback(
    (o: { x: number; y: number }, dW: number, dH: number) => ({
      x: Math.min(0, Math.max(vp.w - dW, o.x)),
      y: Math.min(0, Math.max(vp.h - dH, o.y)),
    }),
    [vp.w, vp.h],
  );

  useEffect(() => {
    setOffset((o) => clamp(o, dispW, dispH));
  }, [dispW, dispH, clamp]);

  const applyZoom = (next: number) => {
    const nz = Math.min(MAX_ZOOM, Math.max(1, next));
    const cx = vp.w / 2;
    const cy = vp.h / 2;
    const ratio = nz / zoom;
    const ndW = nat.w * coverScale * nz;
    const ndH = nat.h * coverScale * nz;
    setOffset((o) =>
      clamp({ x: cx - (cx - o.x) * ratio, y: cy - (cy - o.y) * ratio }, ndW, ndH),
    );
    setZoom(nz);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    drag.current = { px: e.clientX, py: e.clientY, ox: offset.x, oy: offset.y };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current) return;
    setOffset(
      clamp(
        {
          x: drag.current.ox + (e.clientX - drag.current.px),
          y: drag.current.oy + (e.clientY - drag.current.py),
        },
        dispW,
        dispH,
      ),
    );
  };
  const onPointerUp = () => {
    drag.current = null;
  };

  const { upload } = useBlogUploadImage((url) => {
    onApply(url);
    setBusy(false);
    toast.success("Okładka dopasowana ✨");
    onClose();
  });

  const apply = async () => {
    const node = vpRef.current;
    if (!node || !vp.w) return;
    setBusy(true);
    try {
      // Dwa przebiegi — pierwsze renderowanie potrafi pominąć świeżo wczytany obraz.
      await toBlob(node, { pixelRatio: OUT_W / vp.w, cacheBust: true });
      const blob = await toBlob(node, {
        pixelRatio: OUT_W / vp.w,
        cacheBust: true,
      });
      if (!blob) throw new Error("blob");
      upload(
        new File([blob], `okladka-kadr-${Date.now()}.png`, {
          type: "image/png",
        }),
      );
    } catch {
      setBusy(false);
      toast.error("Nie udało się zapisać kadru. Spróbuj ponownie.");
    }
  };

  if (!mounted || !isOpen) return null;

  return createPortal(
    <AnimatePresence>
      <motion.div
        key="cover-cropper"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-brand-secondary/40 backdrop-blur-md"
        onClick={busy ? undefined : onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40, scale: 0.97 }}
          transition={{ type: "spring", damping: 26, stiffness: 280 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full sm:max-w-2xl flex flex-col bg-white/95 backdrop-blur-2xl border border-white/60 rounded-t-3xl sm:rounded-3xl sm:rounded-tr-none shadow-[0_20px_60px_-15px_rgba(3,63,99,0.4)] overflow-hidden"
        >
          <div className="pointer-events-none absolute -top-10 -right-10 w-40 h-40 bg-brand-yellow/40 blur-[60px] rounded-full" />

          {/* header */}
          <div className="relative flex items-center justify-between gap-4 px-5 sm:px-7 pt-5 pb-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 shrink-0 rounded-2xl rounded-tr-none bg-brand-primary flex items-center justify-center text-white shadow-[0_4px_15px_0px_rgba(242,217,103,0.35)]">
                <Crop size={22} weight="duotone" />
              </div>
              <div>
                <h3 className="text-lg font-jakarta font-bold text-brand-secondary leading-tight">
                  Dopasuj kadr okładki
                </h3>
                <p className="text-[12.5px] text-gray-500 font-montserrat mt-0.5 inline-flex items-center gap-1.5">
                  <ArrowsOutCardinal size={14} weight="bold" />
                  Przeciągnij, aby przesunąć · suwakiem przybliż
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-brand-secondary transition-colors disabled:opacity-40"
            >
              <X size={18} weight="bold" />
            </button>
          </div>

          {/* body — kadr */}
          <div className="p-5 sm:p-7">
            <div className="relative">
              <div
                ref={vpRef}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
                className="relative w-full aspect-[16/10] overflow-hidden rounded-[20px] rounded-tr-none bg-brand-secondary/10 cursor-grab active:cursor-grabbing touch-none select-none"
              >
                {src && coverScale > 0 && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={src}
                    alt=""
                    crossOrigin="anonymous"
                    draggable={false}
                    style={{
                      position: "absolute",
                      left: offset.x,
                      top: offset.y,
                      width: dispW,
                      height: dispH,
                      maxWidth: "none",
                      userSelect: "none",
                    }}
                  />
                )}
              </div>

              {/* Prowadnice „trójpodziału" — POZA kadrowanym węzłem (nie trafiają do eksportu). */}
              <div className="pointer-events-none absolute inset-0 rounded-[20px] rounded-tr-none ring-1 ring-white/40">
                <div className="absolute inset-y-0 left-1/3 w-px bg-white/25" />
                <div className="absolute inset-y-0 left-2/3 w-px bg-white/25" />
                <div className="absolute inset-x-0 top-1/3 h-px bg-white/25" />
                <div className="absolute inset-x-0 top-2/3 h-px bg-white/25" />
              </div>
            </div>

            {/* Zoom */}
            <div className="flex items-center gap-3 mt-4">
              <button
                type="button"
                onClick={() => applyZoom(zoom - 0.2)}
                disabled={zoom <= 1}
                className="flex items-center justify-center size-9 shrink-0 rounded-xl border border-gray-200 text-brand-secondary/70 hover:text-brand-primary hover:border-brand-primary/40 transition-colors disabled:opacity-30"
              >
                <MagnifyingGlassMinus size={16} weight="bold" />
              </button>
              <input
                type="range"
                min={1}
                max={MAX_ZOOM}
                step={0.01}
                value={zoom}
                onChange={(e) => applyZoom(Number(e.target.value))}
                className="flex-1 accent-brand-primary"
              />
              <button
                type="button"
                onClick={() => applyZoom(zoom + 0.2)}
                disabled={zoom >= MAX_ZOOM}
                className="flex items-center justify-center size-9 shrink-0 rounded-xl border border-gray-200 text-brand-secondary/70 hover:text-brand-primary hover:border-brand-primary/40 transition-colors disabled:opacity-30"
              >
                <MagnifyingGlassPlus size={16} weight="bold" />
              </button>
            </div>
          </div>

          {/* footer */}
          <div className="relative flex items-center justify-end gap-3 px-5 sm:px-7 py-4 border-t border-gray-100 bg-white/60">
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-montserrat font-semibold text-[13px] text-brand-secondary bg-white border border-gray-200 hover:border-brand-primary/40 transition-colors disabled:opacity-40"
            >
              Anuluj
            </button>
            <button
              type="button"
              onClick={apply}
              disabled={busy || coverScale === 0}
              className="group relative inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-montserrat font-bold text-[13px] text-white bg-brand-primary border border-brand-yellow/30 shadow-[0_6px_18px_-6px_rgba(40,125,136,0.5)] disabled:opacity-60 transition-all overflow-hidden"
            >
              <span className="pointer-events-none absolute -right-2 -bottom-2 size-8 rounded-full bg-brand-yellow/50 blur-[12px]" />
              <span className="relative inline-flex items-center gap-2">
                {busy ? (
                  <CircleNotch size={16} weight="bold" className="animate-spin" />
                ) : (
                  <Check size={16} weight="bold" />
                )}
                {busy ? "Zapisuję…" : "Ustaw kadr"}
              </span>
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body,
  );
}

export { ASPECT as COVER_ASPECT };
