# Brief: Kreator OG image (grafiki Open Graph 1200×630)

Moduł do **składania grafik Open Graph w przeglądarce** — bez backendowego renderu.
Admin wybiera zdjęcie tła (Pexels lub własne), wpisuje tytuł/etykietę, dobiera
motyw i kolory elementów, a komponent renderuje żywy podgląd w proporcji OG
(1200×630) i eksportuje go do PNG-a metodą **DOM → obraz** (`html-to-image`).
Gotowy plik trafia do magazynu (Vercel Blob), a zwrócony URL ląduje w polu
`ogImage` danej strony SEO.

Wspólny dla trzech obszarów: **blog, wydarzenia, kursy**.

---

## 1. Mapa plików

| Plik | Rola |
| --- | --- |
| [src/components/admin/seo/OgImageCreator.tsx](../src/components/admin/seo/OgImageCreator.tsx) | Serce modułu — modal z podglądem, kontrolkami i eksportem do PNG. |
| [src/components/admin/seo/OgImageCreatorButton.tsx](../src/components/admin/seo/OgImageCreatorButton.tsx) | Przycisk „Stwórz w kreatorze" — otwiera modal, przekazuje wartości startowe. |
| [src/components/admin/seo/OgImageUploadButton.tsx](../src/components/admin/seo/OgImageUploadButton.tsx) | Alternatywa: wgranie własnego, gotowego pliku OG (bez kreatora). |
| [src/app/admin/blog/dodaj/edytor-tresci/_components/lib/useBlogUploadImage.ts](../src/app/admin/blog/dodaj/edytor-tresci/_components/lib/useBlogUploadImage.ts) | Hook uploadu pliku → endpoint → URL. |
| [src/app/api/admin/blog/upload/route.ts](../src/app/api/admin/blog/upload/route.ts) | Endpoint zapisujący plik do Vercel Blob, zwraca `{ url }`. |
| `BlogCoverPicker` | Picker zdjęcia tła (Pexels / własne) — reużyty z modułu bloga. |

### Miejsca użycia (`OgImageCreatorButton` + `OgImageUploadButton`)

- [src/app/admin/blog/dodaj/seo/page.tsx](../src/app/admin/blog/dodaj/seo/page.tsx) — pole „OG Image (Social Media)".
- [src/app/admin/wydarzenia/dodaj/seo/page.tsx](../src/app/admin/wydarzenia/dodaj/seo/page.tsx)
- [src/app/admin/kursy/dodaj/_components/CourseWizard.tsx](../src/app/admin/kursy/dodaj/_components/CourseWizard.tsx)

---

## 2. Architektura / przepływ

```
[OgImageCreatorButton]  ← wartości startowe (title, category, image, subtitle)
        │ open
        ▼
[OgImageCreator]  ── podgląd w <div ref=previewRef> (proporcja 40/21 = 1200×630)
        │
        ├─ BlogCoverPicker → zdjęcie tła (Pexels / upload)
        │
        ├─ handleDownload → toPng(node, {pixelRatio:2}) → <a download> (lokalny PNG)
        │
        └─ handleApply   → toBlob(node, {pixelRatio:2}) → File
                              → useBlogUploadImage.upload(file)
                                  → POST /api/admin/blog/upload
                                      → Vercel Blob put()
                                      → { url }
                              → onApply(url)  → setOgImage(url) w stronie SEO
```

### Kluczowe decyzje techniczne (i dlaczego)

1. **Render po stronie klienta z DOM**, nie `next/og`/`ImageResponse`. Admin
   widzi *dokładnie* to, co wyeksportuje (WYSIWYG), i może iterować bez round-tripów.
2. **Logo Rehability wklejone inline jako ścieżki SVG** (`LOGO_SVG_PATHS`), a nie
   `<img src="/logotypy/...">`. `html-to-image` potrafi wywalić się na fetchu
   zewnętrznych/lokalnych zasobów z błędem `[object Event]` — inline eliminuje
   ten fetch. Ton logo sterowany filtrem CSS (`brightness/invert/…`).
3. **Brak cacheBust na zdjęciu tła.** Doklejanie `?t=…` do URL psuje CORS na
   zewnętrznych zdjęciach (Pexels) → „Failed to fetch". Zamiast tego zdjęcie ma
   `crossOrigin="anonymous"`.
4. **„Rozgrzewanie" węzła** — `renderNode()` robi pierwszy przebieg `toPng`
   zanim wykonamy właściwy eksport; pierwszy render bywa niekompletny (świeżo
   wczytane fonty/obrazy).
5. **`pixelRatio: 2`** → podgląd ma proporcję 1200×630, a eksport 2× = ostre OG.
6. **Tony elementów niezależne od motywu** — logo / tekst tagu / tło tagu /
   tekst dobiera się osobnymi swatchami, żeby dopasować do jasnych lub ciemnych zdjęć.

---

## 3. Zależności (npm)

```json
{
  "html-to-image": "DOM → PNG/Blob (toPng, toBlob)",
  "framer-motion": "animacja modala (wymóg projektu — cały ruch w FM)",
  "@phosphor-icons/react": "ikony (import z /dist/ssr)",
  "sonner": "toasty",
  "@vercel/blob": "magazyn plików (endpoint uploadu)"
}
```

---

## 4. Kod

### 4.1 `OgImageCreator.tsx` — modal + podgląd + eksport

> Serce modułu. Poniżej pełny plik. Uwaga na dwie stałe wklejone inline:
> `LOGO_SVG_PATHS` (ścieżki SVG logo) i `THEMES` (gradienty motywów).

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toBlob, toPng } from "html-to-image";
import {
  X,
  ImageSquare,
  DownloadSimple,
  CircleNotch,
  Check,
  PlayCircle,
  PaintBrush,
  TextAa,
} from "@phosphor-icons/react/dist/ssr";
import { toast } from "sonner";
import BlogCoverPicker from "@/app/admin/blog/dodaj/_components/BlogCoverPicker";
import { useBlogUploadImage } from "@/app/admin/blog/dodaj/edytor-tresci/_components/lib/useBlogUploadImage";

type Theme = "morski" | "ciemny" | "jasny";
type Align = "bottom" | "center";
/** Ton elementu na grafice — do dopasowania do jasnych/ciemnych zdjęć. */
type Tone = "light" | "dark" | "accent";

const TONE_HEX: Record<Tone, string> = {
  light: "#ffffff",
  dark: "#033f63",
  accent: "#f2d967",
};

// Ścieżki logo Rehability (public/logotypy/logo-primary.svg) wklejone inline,
// żeby html-to-image nie musiał ich fetchować (źródło błędu [object Event]).
// UWAGA: podmień na ścieżki SWOJEGO logo. viewBox musi pasować (tu 0 0 130 39).
const LOGO_SVG_PATHS = `<path d="M20.0598 2.67798C…" fill="#287D88"/> … /* pełne ścieżki w pliku źródłowym */`;

const THEMES: Record<
  Theme,
  { overlay: string; text: string; sub: string; badge: string }
> = {
  morski: {
    overlay:
      "linear-gradient(to top, rgba(3,63,99,0.92) 0%, rgba(40,125,136,0.45) 45%, rgba(3,63,99,0.15) 100%)",
    text: "#ffffff",
    sub: "rgba(255,255,255,0.75)",
    badge: "rgba(255,255,255,0.16)",
  },
  ciemny: {
    overlay:
      "linear-gradient(to top, rgba(8,15,20,0.92) 0%, rgba(8,15,20,0.45) 50%, rgba(8,15,20,0.1) 100%)",
    text: "#ffffff",
    sub: "rgba(255,255,255,0.7)",
    badge: "rgba(255,255,255,0.14)",
  },
  jasny: {
    overlay:
      "linear-gradient(to top, rgba(255,255,255,0.96) 0%, rgba(255,255,255,0.7) 40%, rgba(255,255,255,0.1) 100%)",
    text: "#033f63",
    sub: "rgba(3,63,99,0.6)",
    badge: "rgba(3,63,99,0.08)",
  },
};

interface OgImageCreatorProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (url: string) => void;
  initialTitle?: string;
  initialCategory?: string;
  initialImage?: string;
  /** Domyślny podtytuł — różny dla kursów / bloga / wydarzeń. */
  initialSubtitle?: string;
}

export default function OgImageCreator({
  isOpen,
  onClose,
  onApply,
  initialTitle = "",
  initialCategory = "",
  initialImage = "",
  initialSubtitle = "Rehability",
}: OgImageCreatorProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [title, setTitle] = useState(initialTitle);
  const [subtitle, setSubtitle] = useState(initialSubtitle);
  const [category, setCategory] = useState(initialCategory || "Fizjoterapia");
  const [image, setImage] = useState(initialImage);
  const [theme, setTheme] = useState<Theme>("morski");
  const [align, setAlign] = useState<Align>("bottom");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  // Tony elementów (logo / etykieta / tekst) — niezależne od motywu, do ręcznego
  // dopasowania pod jasne lub ciemne zdjęcie tła.
  const [logoTone, setLogoTone] = useState<Tone>("light");
  const [badgeTone, setBadgeTone] = useState<Tone>("accent");
  const [textTone, setTextTone] = useState<Tone>("light");
  // Kolor tła tagu (renderowany z 60% opacity + blur). "transparent" = brak tła.
  const [badgeBg, setBadgeBg] = useState<string>("#033f63");

  // Zmiana motywu ustawia rozsądne domyślne tony (jasne zdjęcie → ciemne napisy).
  useEffect(() => {
    const dark = theme !== "jasny";
    setLogoTone(dark ? "light" : "dark");
    setTextTone(dark ? "light" : "dark");
    setBadgeTone(dark ? "accent" : "dark");
  }, [theme]);

  // Po otwarciu odśwież dane wejściowe.
  useEffect(() => {
    if (isOpen) {
      setTitle(initialTitle);
      setCategory(initialCategory || "Fizjoterapia");
      setImage(initialImage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const previewRef = useRef<HTMLDivElement>(null);

  const { upload } = useBlogUploadImage((url) => {
    onApply(url);
    setBusy(false);
    toast.success("OG image ustawiony ✨");
    onClose();
  });

  const t = THEMES[theme];

  // Wartości pochodne tonów.
  const badgeColor = TONE_HEX[badgeTone];
  const textMain = TONE_HEX[textTone === "accent" ? "light" : textTone];
  const textSub =
    textTone === "dark" ? "rgba(3,63,99,0.62)" : "rgba(255,255,255,0.78)";
  // SVG logo recolorujemy filtrem: białe / morski (oryginał) / granat.
  const logoFilter =
    logoTone === "light"
      ? "brightness(0) invert(1)"
      : logoTone === "dark"
        ? "brightness(0) saturate(100%) invert(17%) sepia(46%) saturate(1900%) hue-rotate(175deg) brightness(95%) contrast(98%)"
        : "none";

  // „Rozgrzewa" węzeł (pierwszy przebieg potrafi pominąć świeżo wczytane
  // fonty/obrazy). Bez cacheBust — doklejanie query stringu psuje CORS na
  // zewnętrznych zdjęciach (Pexels) i daje „Failed to fetch".
  const renderNode = async () => {
    const node = previewRef.current;
    if (!node) throw new Error("Brak podglądu do wyeksportowania.");
    await toPng(node, { pixelRatio: 2 });
    return node;
  };

  const handleApply = async () => {
    setBusy(true);
    try {
      const node = await renderNode();
      const blob = await toBlob(node, { pixelRatio: 2 });
      if (!blob) throw new Error("blob");
      const file = new File([blob], `og-image-kursu-${Date.now()}.png`, {
        type: "image/png",
      });
      upload(file); // callback ustawi URL i zamknie
    } catch (e) {
      setBusy(false);
      console.error("OG image render error:", e);
      toast.error(
        "Nie udało się wygenerować grafiki OG. Sprawdź zdjęcie tła i spróbuj ponownie.",
      );
    }
  };

  const handleDownload = async () => {
    setBusy(true);
    try {
      const node = await renderNode();
      const dataUrl = await toPng(node, { pixelRatio: 2 });
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `og-image-kursu-${Date.now()}.png`;
      a.click();
    } catch (e) {
      console.error("OG image download error:", e);
      toast.error("Nie udało się pobrać grafiki OG.");
    } finally {
      setBusy(false);
    }
  };

  if (!mounted || !isOpen) return null;

  return createPortal(
    <AnimatePresence>
      <motion.div
        key="og-image-creator"
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
          className="relative w-full sm:max-w-4xl max-h-[94vh] sm:max-h-[88vh] flex flex-col bg-white/95 backdrop-blur-2xl border border-white/60 rounded-t-3xl sm:rounded-3xl sm:rounded-tr-none shadow-[0_20px_60px_-15px_rgba(3,63,99,0.4)] overflow-hidden"
        >
          <div className="pointer-events-none absolute -top-10 -right-10 w-40 h-40 bg-brand-yellow/40 blur-[60px] rounded-full" />

          {/* header */}
          <div className="relative flex items-center justify-between gap-4 px-5 sm:px-7 pt-5 pb-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 shrink-0 rounded-2xl rounded-tr-none bg-brand-primary flex items-center justify-center text-white shadow-[0_4px_15px_0px_rgba(242,217,103,0.35)]">
                <PaintBrush size={22} weight="duotone" />
              </div>
              <div>
                <h3 className="text-lg font-jakarta font-bold text-brand-secondary leading-tight">
                  Kreator OG image
                </h3>
                <p className="text-[12.5px] text-gray-500 font-montserrat mt-0.5">
                  Złóż grafikę Open Graph (1200×630) do udostępnień w social
                  media i wynikach wyszukiwania.
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

          {/* body */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-5 sm:p-7 grid lg:grid-cols-[1fr_280px] gap-6">
            {/* PODGLĄD (węzeł do eksportu) — proporcje OG 1200×630 */}
            <div>
              <div
                ref={previewRef}
                className="relative w-full aspect-[40/21] overflow-hidden rounded-[20px] rounded-tr-none"
                style={{ backgroundColor: "#0B3B4C" }}
              >
                {image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={image}
                    alt=""
                    crossOrigin="anonymous"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                )}
                {/* overlay motywu */}
                <div
                  className="absolute inset-0"
                  style={{ backgroundImage: t.overlay }}
                />

                {/* badge kategorii */}
                <div
                  className="absolute top-4 left-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider"
                  style={{
                    backgroundColor: hexToRgba(badgeBg, 0.6),
                    color: badgeColor,
                    backdropFilter: badgeBg === "transparent" ? undefined : "blur(6px)",
                    WebkitBackdropFilter:
                      badgeBg === "transparent" ? undefined : "blur(6px)",
                  }}
                >
                  <PlayCircle size={13} weight="fill" />
                  {category}
                </div>

                {/* logo — SVG inline (bez fetcha, niezawodne w eksporcie);
                    ton sterowany filtrem przez logoTone (białe / morski / granat) */}
                <svg
                  viewBox="0 0 130 39"
                  role="img"
                  aria-label="Rehability"
                  className="absolute top-4 right-4 h-7 w-auto"
                  style={{ opacity: 0.95, filter: logoFilter }}
                  dangerouslySetInnerHTML={{ __html: LOGO_SVG_PATHS }}
                />

                {/* tekst */}
                <div
                  className={`absolute inset-x-0 px-6 ${
                    align === "center"
                      ? "top-1/2 -translate-y-1/2 text-center"
                      : "bottom-5"
                  }`}
                >
                  <h2
                    className="font-jakarta font-bold leading-[1.1]"
                    style={{
                      color: textMain,
                      fontSize: "clamp(22px, 4.2vw, 34px)",
                    }}
                  >
                    {title || "Tytuł Twojego kursu"}
                  </h2>
                  <p
                    className="font-montserrat text-[13px] mt-2"
                    style={{ color: textSub }}
                  >
                    {subtitle}
                  </p>
                </div>
              </div>

              {/* akcje na zdjęciu */}
              <button
                type="button"
                onClick={() => setPickerOpen(true)}
                className="mt-3 inline-flex items-center gap-2 text-[13px] font-bold text-brand-primary"
              >
                <ImageSquare size={16} weight="duotone" />
                {image ? "Zmień zdjęcie tła" : "Wybierz zdjęcie tła (Pexels / własne)"}
              </button>

              {/* Kolory elementów — pod podglądem */}
              <div className="mt-5 pt-4 border-t border-gray-100">
                <span className="font-montserrat font-bold text-[12px] text-brand-secondary/70">
                  Kolory elementów
                </span>
                <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-5">
                  <SwatchSelect<Tone>
                    label="Logo"
                    value={logoTone}
                    onChange={setLogoTone}
                    options={[
                      { value: "light", swatch: "#ffffff", title: "Białe" },
                      { value: "accent", swatch: "#287d88", title: "Morski" },
                      { value: "dark", swatch: "#033f63", title: "Granat" },
                    ]}
                  />
                  <SwatchSelect<Tone>
                    label="Tekst tagu"
                    value={badgeTone}
                    onChange={setBadgeTone}
                    options={[
                      { value: "light", swatch: "#ffffff", title: "Białe" },
                      { value: "accent", swatch: "#f2d967", title: "Żółte" },
                      { value: "dark", swatch: "#033f63", title: "Granat" },
                    ]}
                  />
                  <SwatchSelect<string>
                    label="Tło tagu"
                    value={badgeBg}
                    onChange={setBadgeBg}
                    options={[
                      { value: "#033f63", swatch: "#033f63", title: "Granat" },
                      { value: "#287d88", swatch: "#287d88", title: "Morski" },
                      { value: "#000000", swatch: "#000000", title: "Czarny" },
                      { value: "#ffffff", swatch: "#ffffff", title: "Białe" },
                      { value: "transparent", swatch: "transparent", title: "Brak" },
                    ]}
                  />
                  <SwatchSelect<Tone>
                    label="Tekst"
                    value={textTone}
                    onChange={setTextTone}
                    options={[
                      { value: "light", swatch: "#ffffff", title: "Białe" },
                      { value: "dark", swatch: "#033f63", title: "Granat" },
                    ]}
                  />
                </div>
              </div>
            </div>

            {/* KONTROLKI */}
            <div className="flex flex-col gap-4">
              <label className="flex flex-col gap-1.5">
                <span className="font-montserrat font-semibold text-[12px] text-gray-500 inline-flex items-center gap-1.5">
                  <TextAa size={14} weight="bold" /> Tytuł
                </span>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Tytuł kursu"
                  className={ctrlCls}
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="font-montserrat font-semibold text-[12px] text-gray-500">
                  Podtytuł
                </span>
                <input
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  className={ctrlCls}
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="font-montserrat font-semibold text-[12px] text-gray-500">
                  Etykieta (kategoria)
                </span>
                <input
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className={ctrlCls}
                />
              </label>

              <div className="flex flex-col gap-1.5">
                <span className="font-montserrat font-semibold text-[12px] text-gray-500">
                  Motyw
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {(["morski", "ciemny", "jasny"] as Theme[]).map((th) => (
                    <button
                      key={th}
                      type="button"
                      onClick={() => setTheme(th)}
                      className={`py-2 rounded-xl text-[12px] font-semibold capitalize transition-colors border ${
                        theme === th
                          ? "bg-brand-primary text-white border-brand-yellow/30"
                          : "bg-white text-brand-secondary/60 border-gray-200 hover:border-brand-primary/40"
                      }`}
                    >
                      {th}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="font-montserrat font-semibold text-[12px] text-gray-500">
                  Pozycja tekstu
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {(
                    [
                      { v: "bottom", l: "Dół" },
                      { v: "center", l: "Środek" },
                    ] as { v: Align; l: string }[]
                  ).map((a) => (
                    <button
                      key={a.v}
                      type="button"
                      onClick={() => setAlign(a.v)}
                      className={`py-2 rounded-xl text-[12px] font-semibold transition-colors border ${
                        align === a.v
                          ? "bg-brand-primary text-white border-brand-yellow/30"
                          : "bg-white text-brand-secondary/60 border-gray-200 hover:border-brand-primary/40"
                      }`}
                    >
                      {a.l}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* footer */}
          <div className="relative flex items-center justify-between gap-3 px-5 sm:px-7 py-4 border-t border-gray-100 bg-white/60">
            <button
              type="button"
              onClick={handleDownload}
              disabled={busy}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-montserrat font-semibold text-[13px] text-brand-secondary bg-white border border-gray-200 hover:border-brand-primary/40 transition-colors disabled:opacity-40"
            >
              <DownloadSimple size={16} weight="bold" />
              Pobierz PNG
            </button>
            <button
              type="button"
              onClick={handleApply}
              disabled={busy}
              className="group relative inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-montserrat font-bold text-[13px] text-white bg-brand-primary border border-brand-yellow/30 shadow-[0_6px_18px_-6px_rgba(40,125,136,0.5)] disabled:opacity-60 transition-all overflow-hidden"
            >
              <span className="pointer-events-none absolute -right-2 -bottom-2 size-8 rounded-full bg-brand-yellow/50 blur-[12px]" />
              <span className="relative inline-flex items-center gap-2">
                {busy ? (
                  <CircleNotch size={16} weight="bold" className="animate-spin" />
                ) : (
                  <Check size={16} weight="bold" />
                )}
                {busy ? "Generuję…" : "Ustaw jako OG image"}
              </span>
            </button>
          </div>
        </motion.div>
      </motion.div>

      {/* Picker tła */}
      <BlogCoverPicker
        isOpen={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(url) => {
          setImage(url);
          setPickerOpen(false);
        }}
        defaultQuery={category || "fizjoterapia"}
        heading="Wybierz zdjęcie tła"
        subheading="Zdjęcie z Pexels lub własne — posłuży jako tło grafiki OG."
      />
    </AnimatePresence>,
    document.body,
  );
}

const ctrlCls =
  "w-full h-11 px-3.5 rounded-xl border border-gray-200 bg-white font-montserrat text-[13.5px] text-brand-secondary placeholder:text-gray-300 outline-none focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10 transition-all";

/** Hex → rgba ze sterowaną przejrzystością (do tła tagu). */
function hexToRgba(hex: string, a: number): string {
  if (hex === "transparent") return "transparent";
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

/**
 * Wybór koloru elementu jako rząd kółek (bez podpisów — nazwa w tooltipie).
 * Aktywny stan = obwódka (ring), nie wypełnienie, więc nigdy nie zlewa się z
 * kolorem swatcha.
 */
function SwatchSelect<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: { value: T; swatch: string; title: string }[];
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="font-montserrat font-semibold text-[12px] text-gray-500">
        {label}
      </span>
      <div className="flex items-center gap-2">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            title={o.title}
            onClick={() => onChange(o.value)}
            className={`relative size-7 rounded-full transition-all ${
              value === o.value
                ? "ring-2 ring-brand-primary ring-offset-2 ring-offset-white scale-110"
                : "ring-1 ring-black/10 hover:scale-105"
            }`}
            style={{
              backgroundColor: o.swatch === "transparent" ? "#ffffff" : o.swatch,
            }}
          >
            {o.swatch === "transparent" && (
              <span className="absolute left-1/2 top-1/2 h-px w-5 -translate-x-1/2 -translate-y-1/2 rotate-45 bg-red-400" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
```

> **Uwaga:** pełne ścieżki `LOGO_SVG_PATHS` (długi ciąg `<path .../>`) są w
> pliku źródłowym [OgImageCreator.tsx](../src/components/admin/seo/OgImageCreator.tsx).
> Przy przenoszeniu do innego projektu podmień je na ścieżki własnego logo
> (wyeksportuj SVG, skopiuj zawartość `<svg>` bez otoczki, dopasuj `viewBox`).

### 4.2 `OgImageCreatorButton.tsx` — wrapper-przycisk

```tsx
"use client";

import { useState } from "react";
import { PaintBrush } from "@phosphor-icons/react/dist/ssr";
import OgImageCreator from "./OgImageCreator";

/**
 * Przycisk otwierający kreator grafiki OG (1200×630) — wspólny dla bloga,
 * wydarzeń i kursów. Składa grafikę ze zdjęcia tła + tytułu/etykiety i wgrywa
 * gotowy PNG do magazynu, zwracając URL do pola `ogImage`.
 */
export default function OgImageCreatorButton({
  onApply,
  title = "",
  category = "",
  image = "",
  subtitle,
}: {
  onApply: (url: string) => void;
  title?: string;
  category?: string;
  image?: string;
  subtitle?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-[12px] bg-brand-primary/10 hover:bg-brand-primary/20 text-brand-primary text-sm font-semibold font-montserrat transition-colors"
      >
        <PaintBrush size={16} weight="duotone" />
        Stwórz w kreatorze
      </button>
      <OgImageCreator
        isOpen={open}
        onClose={() => setOpen(false)}
        onApply={(url) => {
          onApply(url);
          setOpen(false);
        }}
        initialTitle={title}
        initialCategory={category}
        initialImage={image}
        initialSubtitle={subtitle}
      />
    </>
  );
}
```

### 4.3 `OgImageUploadButton.tsx` — wgranie gotowego pliku

```tsx
"use client";

import { useRef } from "react";
import { UploadSimple, CircleNotch } from "@phosphor-icons/react/dist/ssr";
import { useBlogUploadImage } from "@/app/admin/blog/dodaj/edytor-tresci/_components/lib/useBlogUploadImage";

/**
 * Przycisk wgrania własnego zdjęcia OG (Social Media). Plik leci do Vercel Blob
 * przez wspólny endpoint uploadu, a zwrócony URL trafia do pola `ogImage`.
 */
export default function OgImageUploadButton({
  onUploaded,
}: {
  onUploaded: (url: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { upload, isUploading } = useBlogUploadImage(onUploaded);

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={isUploading}
        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-[12px] bg-brand-primary/10 hover:bg-brand-primary/20 text-brand-primary text-sm font-semibold font-montserrat transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isUploading ? (
          <CircleNotch size={16} weight="bold" className="animate-spin" />
        ) : (
          <UploadSimple size={16} weight="bold" />
        )}
        {isUploading ? "Przesyłanie..." : "Wgraj własne zdjęcie"}
      </button>
      <input
        ref={inputRef}
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
    </div>
  );
}
```

### 4.4 `useBlogUploadImage.ts` — hook uploadu

```ts
import { useState } from "react";

export function useBlogUploadImage(
  onUploadSuccess: (url: string) => void,
  endpoint: string = "/api/admin/blog/upload",
) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const upload = async (file: File) => {
    setIsUploading(true);
    setUploadError(null);
    try {
      const res = await fetch(`${endpoint}?filename=${encodeURIComponent(file.name)}`, {
        method: "POST",
        body: file,
      });
      if (!res.ok) throw new Error("Błąd podczas przesyłania");
      const data = await res.json();
      onUploadSuccess(data.url);
    } catch {
      setUploadError("Nie udało się przesłać zdjęcia. Sprawdź plik.");
    } finally {
      setIsUploading(false);
    }
  };

  return { upload, isUploading, uploadError };
}
```

### 4.5 Endpoint `POST /api/admin/blog/upload`

```ts
import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { validateImageUpload } from "@/lib/uploads/validateImageUpload";

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const { isAuthorized, response } = await requireAdmin();
    if (!isAuthorized) return response as NextResponse;

    const { searchParams } = new URL(request.url);
    const filename = searchParams.get("filename");
    if (!filename) {
      return NextResponse.json({ error: "Brak nazwy pliku" }, { status: 400 });
    }

    const check = validateImageUpload(request, filename);
    if (!check.ok) return check.response;

    const extension = filename.includes(".") ? `.${filename.split(".").pop()}` : "";
    const seoFilename = `blog-image-${slugify(filename.replace(/\.[^/.]+$/, ""))}${extension}`;

    const blob = await put(seoFilename, request.body as any, {
      access: "public",
      addRandomSuffix: true,
    });

    return NextResponse.json({ success: true, url: blob.url });
  } catch (error) {
    console.error("Błąd uploadu zdjęcia bloga:", error);
    return NextResponse.json({ error: "Błąd przesyłania pliku" }, { status: 500 });
  }
}
```

---

## 5. Jak podpiąć (integracja w stronie SEO)

W formularzu SEO trzymasz stan `ogImage` (string URL). Dokładasz oba przyciski
obok pola input:

```tsx
import OgImageUploadButton from "@/components/admin/seo/OgImageUploadButton";
import OgImageCreatorButton from "@/components/admin/seo/OgImageCreatorButton";

// ...w formularzu:
<input
  value={ogImage}
  onChange={(e) => setOgImage(e.target.value)}
  placeholder="https://... lub /images/..."
/>

<div className="flex flex-wrap items-center gap-2">
  {/* Wariant A: wgranie gotowego pliku */}
  <OgImageUploadButton onUploaded={setOgImage} />

  {/* Wariant B: złożenie grafiki w kreatorze */}
  <OgImageCreatorButton
    onApply={setOgImage}
    title={metaTitle || postTitle}   // sensowny prefill tytułu
    category="Blog"                  // etykieta na grafice
    image={ogImage}                  // wznów z aktualnego tła, jeśli jest
    subtitle="Artykuł · Rehability"  // podtytuł zależny od obszaru
  />
</div>

{ogImage && (
  <img src={ogImage} alt="OG Image preview" className="h-[120px] w-full object-cover" />
)}
```

Podtytuł/etykieta różnią się per obszar:
- **blog** → `category="Blog"`, `subtitle="Artykuł · Rehability"`
- **wydarzenia** → np. `category="Wydarzenie"`, `subtitle="Wydarzenie · Rehability"`
- **kursy** → np. `category="Kurs"`, `subtitle="Kurs · Rehability"`

Zapisane URL trafia do metadanych strony (Next.js `metadata.openGraph.images`).

---

## 6. Przenoszenie do innego projektu (checklist)

1. Skopiuj 3 komponenty (`OgImageCreator`, `OgImageCreatorButton`,
   `OgImageUploadButton`) + hook `useBlogUploadImage`.
2. Podmień **`LOGO_SVG_PATHS`** i `viewBox` na własne logo (inline SVG!).
3. Dostosuj **`THEMES`** (gradienty) i **`TONE_HEX`** do palety marki.
4. Podmień picker tła — tu `BlogCoverPicker` (Pexels + upload). Można wstawić
   dowolny selektor zwracający URL (`onSelect(url)`).
5. Zapewnij endpoint uploadu zwracający `{ url }` (tu Vercel Blob; może być S3,
   Cloudinary itd.) — wskaż go drugim argumentem `useBlogUploadImage(cb, endpoint)`.
6. Klasy `brand-*`, `font-jakarta`, `font-montserrat` → mapuj na własny theme
   Tailwinda albo zastąp wartościami z palety.

## 7. Znane pułapki (WAŻNE)

- **`[object Event]` przy eksporcie** → prawie zawsze to fetch zewnętrznego
  zasobu (logo/font/obraz) w `html-to-image`. Trzymaj logo inline, fonty załaduj
  wcześniej, obrazom daj `crossOrigin="anonymous"`.
- **„Failed to fetch" na zdjęciu Pexels** → NIE dodawaj cacheBust (`?t=…`) do URL
  tła; to psuje CORS. Zamiast tego `renderNode()` robi „rozgrzewkowy" przebieg.
- **Rozmycie eksportu** → `pixelRatio: 2` przy proporcji podglądu 1200×630 daje
  ostre 1200×630 (podgląd renderowany w połowie rozmiaru).
- **Modal przez `createPortal` do `document.body`** + `mounted`-guard, żeby nie
  renderować po stronie serwera (SSR-safe).
