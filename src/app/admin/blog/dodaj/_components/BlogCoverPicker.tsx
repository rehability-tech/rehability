"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  X,
  MagnifyingGlass,
  UploadSimple,
  ImageSquare,
  CircleNotch,
  Sparkle,
} from "@phosphor-icons/react/dist/ssr";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useBlogUploadImage } from "../edytor-tresci/_components/lib/useBlogUploadImage";

interface PexelsPhoto {
  id: number;
  thumb: string;
  preview: string;
  full: string;
  alt: string;
  photographer: string;
  photographerUrl: string;
}

interface BlogCoverPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
  defaultQuery?: string;
  /** Tytuł nad modalem (np. „Wybierz okładkę artykułu"). */
  heading?: string;
  subheading?: string;
  /** Gdy true — chowamy X i blokujemy zamykanie tłem (wymuszamy decyzję). */
  mandatory?: boolean;
  /** Gdy podane — pokazuje przycisk „Pomiń" (np. w kolejce doboru zdjęć). */
  onSkip?: () => void;
  /** Endpoint dla zakładki „Wgraj własne" (domyślnie blog). Dla wyjazdów podajemy
   *  endpoint danego wyjazdu, żeby plik trafił we właściwe miejsce. */
  uploadEndpoint?: string;
}

type Tab = "pexels" | "upload";

export default function BlogCoverPicker({
  isOpen,
  onClose,
  onSelect,
  defaultQuery = "",
  heading = "Wybierz okładkę artykułu",
  subheading = "Zaciągnij zdjęcie z Pexels albo wgraj własne — trafi prosto do naszego magazynu.",
  mandatory = false,
  onSkip,
  uploadEndpoint,
}: BlogCoverPickerProps) {
  const [mounted, setMounted] = useState(false);
  const [tab, setTab] = useState<Tab>("pexels");
  const [query, setQuery] = useState(defaultQuery);
  const [photos, setPhotos] = useState<PexelsPhoto[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [importingId, setImportingId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  // Rozwiązana (angielska) fraza zwrócona przez backend — używamy jej do load-more.
  const resolvedQueryRef = useRef<string>("");
  const lastQueryRef = useRef<string>("");
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const { upload, isUploading } = useBlogUploadImage((url) => {
    onSelect(url);
  }, uploadEndpoint);

  useEffect(() => setMounted(true), []);

  const runSearch = useCallback(async (q: string) => {
    const term = q.trim();
    if (!term) return;
    lastQueryRef.current = term;
    setIsSearching(true);
    setSearchError(null);
    setPhotos([]);
    setPage(1);
    setTotalResults(0);
    try {
      const res = await fetch(
        `/api/admin/pexels?query=${encodeURIComponent(term)}&page=1`,
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Błąd wyszukiwania zdjęć.");
      resolvedQueryRef.current = data.query || term;
      setPhotos(data.photos || []);
      setTotalResults(data.totalResults || 0);
      if ((data.photos || []).length === 0) {
        setSearchError("Brak wyników. Spróbuj innej frazy.");
      }
    } catch (err) {
      setSearchError(
        err instanceof Error ? err.message : "Nie udało się pobrać zdjęć.",
      );
      setPhotos([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const loadMore = useCallback(async () => {
    if (isSearching || isLoadingMore) return;
    const nextPage = page + 1;
    setIsLoadingMore(true);
    try {
      const res = await fetch(
        `/api/admin/pexels?query=${encodeURIComponent(
          resolvedQueryRef.current,
        )}&page=${nextPage}`,
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Błąd ładowania zdjęć.");
      setPhotos((prev) => {
        const seen = new Set(prev.map((p) => p.id));
        const fresh = (data.photos || []).filter(
          (p: PexelsPhoto) => !seen.has(p.id),
        );
        return [...prev, ...fresh];
      });
      setPage(nextPage);
    } catch {
      /* po cichu — user ma już widoczne wyniki */
    } finally {
      setIsLoadingMore(false);
    }
  }, [isSearching, isLoadingMore, page]);

  // Po otwarciu z domyślną frazą — odpalamy wyszukiwanie raz.
  useEffect(() => {
    if (!isOpen) return;
    setQuery(defaultQuery);
    setPhotos([]);
    setSearchError(null);
    setTab("pexels");
    setPage(1);
    setTotalResults(0);
    if (defaultQuery.trim() && lastQueryRef.current !== defaultQuery.trim()) {
      runSearch(defaultQuery);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const hasMore = photos.length > 0 && photos.length < totalResults;

  // Infinite scroll — gdy sentinel wpadnie w widok, dociągamy kolejną stronę.
  useEffect(() => {
    if (!hasMore || tab !== "pexels") return;
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMore();
      },
      { rootMargin: "250px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [hasMore, tab, loadMore]);

  const handleImportPexels = async (photo: PexelsPhoto) => {
    setImportingId(photo.id);
    try {
      const res = await fetch("/api/admin/blog/import-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: photo.full,
          filename: lastQueryRef.current || photo.alt,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Błąd importu zdjęcia.");
      onSelect(data.url);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Nie udało się dodać zdjęcia.",
      );
    } finally {
      setImportingId(null);
    }
  };

  const handleClose = () => {
    if (importingId !== null || isUploading) return;
    onClose();
  };

  if (!mounted || !isOpen) return null;

  return createPortal(
    <AnimatePresence>
      <motion.div
        key="cover-picker"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-brand-secondary/40 backdrop-blur-md"
        onClick={mandatory ? undefined : handleClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40, scale: 0.97 }}
          transition={{ type: "spring", damping: 26, stiffness: 280 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full sm:max-w-3xl max-h-[92vh] sm:max-h-[85vh] flex flex-col bg-white/95 backdrop-blur-2xl border border-white/60 rounded-t-3xl sm:rounded-3xl sm:rounded-tr-none shadow-[0_20px_60px_-15px_rgba(3,63,99,0.4)] overflow-hidden"
        >
          {/* żółta poświata */}
          <div className="pointer-events-none absolute -top-10 -right-10 w-40 h-40 bg-brand-yellow/40 blur-[60px] rounded-full" />

          {/* header */}
          <div className="relative flex items-start justify-between gap-4 px-5 sm:px-7 pt-5 pb-4 border-b border-gray-100">
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 shrink-0 rounded-2xl rounded-tr-none bg-brand-primary flex items-center justify-center text-white shadow-[0_4px_15px_0px_rgba(242,217,103,0.35)]">
                <ImageSquare size={22} weight="duotone" />
              </div>
              <div>
                <h3 className="text-lg font-jakarta font-bold text-brand-secondary leading-tight">
                  {heading}
                </h3>
                <p className="text-[12.5px] text-gray-500 font-montserrat mt-0.5 max-w-md">
                  {subheading}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {onSkip && (
                <button
                  type="button"
                  onClick={onSkip}
                  className="px-3 py-1.5 rounded-full text-[12px] font-semibold font-montserrat text-gray-400 hover:bg-gray-100 hover:text-brand-secondary transition-colors"
                >
                  Pomiń
                </button>
              )}
              {!mandatory && (
                <button
                  type="button"
                  onClick={handleClose}
                  className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-brand-secondary transition-colors"
                >
                  <X size={18} weight="bold" />
                </button>
              )}
            </div>
          </div>

          {/* tabs */}
          <div className="flex gap-2 px-5 sm:px-7 pt-4">
            <TabButton
              active={tab === "pexels"}
              onClick={() => setTab("pexels")}
              icon={<MagnifyingGlass size={16} weight="bold" />}
              label="Biblioteka Pexels"
            />
            <TabButton
              active={tab === "upload"}
              onClick={() => setTab("upload")}
              icon={<UploadSimple size={16} weight="bold" />}
              label="Wgraj własne"
            />
          </div>

          {/* body */}
          <div className="flex-1 overflow-y-auto custom-scrollbar px-5 sm:px-7 py-5">
            {tab === "pexels" ? (
              <>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    runSearch(query);
                  }}
                  className="flex gap-2 mb-4"
                >
                  <div className="relative flex-1">
                    <MagnifyingGlass
                      size={18}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="np. fizjoterapia, joga, zdrowy kręgosłup..."
                      className="w-full bg-gray-50 border border-gray-200 text-brand-secondary text-sm rounded-[14px] pl-10 pr-4 py-3 font-montserrat focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-colors"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isSearching || !query.trim()}
                    className="flex items-center justify-center gap-1.5 px-5 py-3 bg-brand-primary text-white rounded-[14px] font-semibold text-sm shadow-[0_6px_16px_-6px_rgba(40,125,136,0.5)] hover:bg-[#1E6068] transition-colors shrink-0 disabled:opacity-40"
                  >
                    {isSearching ? (
                      <CircleNotch
                        size={16}
                        weight="bold"
                        className="animate-spin"
                      />
                    ) : (
                      <MagnifyingGlass size={16} weight="bold" />
                    )}
                    <span className="hidden sm:inline">Szukaj</span>
                  </button>
                </form>

                {isSearching && photos.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                    <CircleNotch
                      size={32}
                      weight="bold"
                      className="animate-spin mb-3 text-brand-primary"
                    />
                    <p className="text-sm font-montserrat">Szukam zdjęć...</p>
                  </div>
                )}

                {!isSearching && photos.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-16 text-center text-gray-400">
                    <Sparkle
                      size={30}
                      weight="duotone"
                      className="mb-3 text-brand-primary/50"
                    />
                    <p className="text-sm font-montserrat max-w-xs">
                      {searchError ||
                        "Wpisz frazę i wyszukaj zdjęcia z darmowej biblioteki Pexels."}
                    </p>
                  </div>
                )}

                {photos.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {photos.map((photo) => {
                      const isImporting = importingId === photo.id;
                      return (
                        <button
                          key={photo.id}
                          type="button"
                          onClick={() => handleImportPexels(photo)}
                          disabled={importingId !== null}
                          className="group relative aspect-[4/3] overflow-hidden rounded-2xl rounded-tr-none border border-gray-100 bg-gray-100 disabled:cursor-not-allowed"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={photo.thumb}
                            alt={photo.alt}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            loading="eager"
                          />
                          <div className="absolute inset-0 bg-brand-secondary/0 group-hover:bg-brand-secondary/30 transition-colors" />
                          <div className="absolute bottom-0 inset-x-0 px-2 py-1.5 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-[10px] text-white/90 font-montserrat truncate block">
                              © {photo.photographer}
                            </span>
                          </div>
                          {isImporting && (
                            <div className="absolute inset-0 flex items-center justify-center bg-white/70 backdrop-blur-[2px]">
                              <CircleNotch
                                size={26}
                                weight="bold"
                                className="animate-spin text-brand-primary"
                              />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* sentinel + loader dla infinite scroll */}
                {photos.length > 0 && (
                  <div
                    ref={sentinelRef}
                    className="flex items-center justify-center py-6"
                  >
                    {isLoadingMore ? (
                      <CircleNotch
                        size={24}
                        weight="bold"
                        className="animate-spin text-brand-primary"
                      />
                    ) : hasMore ? (
                      <button
                        type="button"
                        onClick={loadMore}
                        className="text-[12px] font-semibold font-montserrat text-brand-primary/70 hover:text-brand-primary transition-colors"
                      >
                        Załaduj więcej zdjęć
                      </button>
                    ) : (
                      <span className="text-[11px] font-montserrat text-gray-300">
                        To już wszystkie wyniki
                      </span>
                    )}
                  </div>
                )}
              </>
            ) : (
              <label
                className={cn(
                  "relative flex flex-col items-center justify-center gap-3 w-full min-h-[260px] rounded-2xl rounded-tr-none border-2 border-dashed cursor-pointer transition-colors text-center px-4 py-10",
                  isUploading
                    ? "border-brand-primary/60 bg-brand-primary/[0.08]"
                    : "border-brand-primary/30 bg-brand-primary/5 hover:border-brand-primary/60 hover:bg-brand-primary/[0.08]",
                )}
              >
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  disabled={isUploading}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) upload(f);
                    e.currentTarget.value = "";
                  }}
                />
                {isUploading ? (
                  <>
                    <CircleNotch
                      size={34}
                      weight="bold"
                      className="text-brand-primary animate-spin"
                    />
                    <span className="text-sm font-montserrat font-semibold text-brand-primary">
                      Przesyłanie zdjęcia...
                    </span>
                  </>
                ) : (
                  <>
                    <div className="w-16 h-16 rounded-2xl rounded-tr-none bg-brand-primary/10 flex items-center justify-center text-brand-primary">
                      <UploadSimple size={30} weight="duotone" />
                    </div>
                    <div>
                      <p className="text-sm font-montserrat font-bold text-brand-secondary">
                        Przeciągnij lub kliknij, aby wybrać zdjęcie
                      </p>
                      <p className="text-[12px] font-montserrat text-brand-secondary/50 mt-0.5">
                        JPG / PNG / WEBP — najlepiej 1200×630 px
                      </p>
                    </div>
                  </>
                )}
              </label>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body,
  );
}

function TabButton({
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
        "relative flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-sm font-semibold font-montserrat transition-colors",
        active
          ? "text-brand-primary"
          : "text-gray-400 hover:text-brand-secondary",
      )}
    >
      {icon}
      {label}
      {active && (
        <motion.div
          layoutId="cover-picker-tab"
          className="absolute -bottom-px inset-x-0 h-0.5 bg-brand-primary rounded-full"
        />
      )}
    </button>
  );
}
