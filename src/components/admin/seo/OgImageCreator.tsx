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
const LOGO_SVG_PATHS = `<path d="M20.0598 2.67798C20.0575 4.15454 18.7505 5.34953 17.1406 5.34708C15.5306 5.34463 14.2273 4.14566 14.2296 2.6691C14.2319 1.19255 15.5389 -0.00244871 17.1488 3.76814e-06C18.7588 0.00245624 20.0621 1.20143 20.0598 2.67798Z" fill="#287D88"/><path d="M0 35.2928C0.0850357 35.2085 1.39235 31.6927 5.78373 28.7163C7.29449 27.8555 11.7089 25.8266 17.2806 24.5968C22.8523 23.367 26.2487 20.8112 27.2504 19.6871C28.7438 17.8976 30.7527 13.3378 26.8418 9.4144C26.2579 8.78499 23.8107 7.55237 18.6936 7.65714L18.6886 10.8935C20.9909 10.5969 25.5942 10.8815 25.5888 14.3937C25.5834 17.9059 23.12 18.6629 22.015 19.4258C21.1745 20.0061 18.1231 21.508 12.6418 22.8731C8.49864 23.9455 0.169872 27.931 0 35.2928Z" fill="#287D88"/><path d="M34.5791 38.9477C31.5897 38.2396 24.7653 34.4581 21.3838 24.9971C21.3838 24.9971 20.7031 25.2594 19.6731 25.6228C18.6431 25.9862 17.9858 26.1176 17.9858 26.1176C19.5636 30.7072 25.0912 39.6988 34.5791 38.9477Z" fill="#287D88"/><path d="M9.54641 39C13.8901 35.5032 13.7499 31.071 13.7553 27.5473C13.7553 27.5473 14.3372 27.292 15.1532 27.0385C15.9692 26.785 16.7715 26.603 16.7715 26.603C16.7835 38.4125 11.3111 39.0027 9.54641 39Z" fill="#287D88"/><path d="M15.1755 20.5949C15.9868 20.4108 16.7886 19.9721 16.7886 19.9721L16.8074 7.80925C16.8075 7.73626 16.5869 7.73593 15.7781 7.73469L13.6967 7.73152L13.6989 20.8695C13.6989 20.8695 14.3642 20.779 15.1755 20.5949Z" fill="#287D88"/><path d="M13.6967 7.73152L13.6921 10.724L7.00086 10.7139C2.35358 10.8236 1.03891 14.5975 0.962255 16.6167C-0.671999 8.32274 5.97618 7.64677 8.69679 7.65092C11.4174 7.65506 13.6967 7.73152 13.6967 7.73152Z" fill="#287D88"/><path d="M35.4502 33.9223C34.1469 33.9223 33.0047 33.6679 32.0236 33.1591C31.0571 32.6359 30.3029 31.9236 29.7611 31.0224C29.234 30.1212 28.9704 29.0964 28.9704 27.9481C28.9704 26.7852 29.2266 25.7604 29.7392 24.8737C30.2663 23.9725 30.9839 23.2675 31.8918 22.7588C32.8143 22.25 33.8614 21.9957 35.0329 21.9957C36.1751 21.9957 37.1928 22.2428 38.0861 22.737C38.9793 23.2312 39.6822 23.9289 40.1947 24.8301C40.7073 25.7314 40.9635 26.7925 40.9635 28.0135C40.9635 28.1298 40.9562 28.2606 40.9416 28.4059C40.9416 28.5513 40.9342 28.6894 40.9196 28.8202H31.145V27.0105H39.4699L38.3936 27.5774C38.4082 26.9088 38.2691 26.3201 37.9762 25.8113C37.6834 25.3026 37.2807 24.9028 36.7681 24.6121C36.2702 24.3214 35.6918 24.176 35.0329 24.176C34.3592 24.176 33.7662 24.3214 33.2537 24.6121C32.7558 24.9028 32.3604 25.3098 32.0675 25.8331C31.7893 26.3419 31.6502 26.9451 31.6502 27.6428V28.0789C31.6502 28.7766 31.8113 29.3944 32.1334 29.9322C32.4556 30.47 32.9095 30.8843 33.4953 31.175C34.081 31.4657 34.7546 31.6111 35.5161 31.6111C36.1751 31.6111 36.7681 31.5093 37.2953 31.3058C37.8225 31.1023 38.2911 30.7825 38.7011 30.3465L40.1728 32.0254C39.6456 32.6359 38.9793 33.1083 38.1739 33.4426C37.3832 33.7624 36.4753 33.9223 35.4502 33.9223Z" fill="#287D88"/><path d="M44.1501 33.7696V17.5913H46.8958V25.2662L46.3027 24.3069C46.7127 23.5655 47.3058 22.9986 48.0819 22.6062C48.8727 22.1992 49.7806 21.9957 50.8056 21.9957C51.7428 21.9957 52.5775 22.1774 53.3097 22.5408C54.0565 22.9042 54.6423 23.4638 55.0669 24.2196C55.4916 24.961 55.7039 25.9203 55.7039 27.0977V33.7696H52.9582V27.4466C52.9582 26.4145 52.7093 25.6441 52.2114 25.1354C51.7282 24.6266 51.0472 24.3723 50.1686 24.3723C49.5243 24.3723 48.9532 24.5031 48.4553 24.7647C47.9574 25.0264 47.5694 25.4188 47.2911 25.9421C47.0276 26.4509 46.8958 27.0977 46.8958 27.8827V33.7696H44.1501Z" fill="#287D88"/><path d="M66.9628 33.7696V31.4149L66.809 30.9134V26.7925C66.809 25.993 66.5674 25.3752 66.0842 24.9392C65.6009 24.4886 64.8688 24.2632 63.8876 24.2632C63.2287 24.2632 62.577 24.365 61.9327 24.5685C61.303 24.772 60.7685 25.0554 60.3292 25.4188L59.2529 23.4347C59.8826 22.955 60.6294 22.5989 61.4934 22.3663C62.372 22.1192 63.2799 21.9957 64.2171 21.9957C65.9158 21.9957 67.2264 22.4027 68.1489 23.2167C69.0861 24.0161 69.5547 25.2589 69.5547 26.9451V33.7696H66.9628ZM63.2726 33.9223C62.394 33.9223 61.6252 33.7769 60.9662 33.4862C60.3072 33.1809 59.7947 32.7667 59.4286 32.2434C59.0772 31.7056 58.9015 31.1023 58.9015 30.4337C58.9015 29.7796 59.0552 29.1909 59.3627 28.6676C59.6849 28.1443 60.2047 27.73 60.9223 27.4248C61.6398 27.1195 62.5917 26.9669 63.7778 26.9669H67.1824V28.7766H63.9755C63.0383 28.7766 62.4086 28.9292 62.0865 29.2345C61.7643 29.5252 61.6032 29.8886 61.6032 30.3247C61.6032 30.8189 61.8009 31.2113 62.1963 31.5021C62.5917 31.7928 63.1408 31.9381 63.8437 31.9381C64.5173 31.9381 65.1177 31.7855 65.6449 31.4803C66.1867 31.175 66.5747 30.7244 66.809 30.1284L67.2703 31.7637C67.0067 32.4469 66.5308 32.9774 65.8426 33.3554C65.1689 33.7333 64.3123 33.9223 63.2726 33.9223Z" fill="#287D88"/><path d="M80.1294 33.9223C79.1336 33.9223 78.2477 33.7042 77.4716 33.2682C76.6955 32.8321 76.0804 32.178 75.6265 31.3058C75.1872 30.4191 74.9675 29.2999 74.9675 27.9481C74.9675 26.5817 75.1945 25.4624 75.6484 24.5903C76.117 23.7182 76.7394 23.0713 77.5155 22.6498C78.3063 22.2137 79.1776 21.9957 80.1294 21.9957C81.2862 21.9957 82.304 22.2428 83.1826 22.737C84.0759 23.2312 84.7788 23.9217 85.2913 24.8083C85.8185 25.695 86.082 26.7416 86.082 27.9481C86.082 29.1545 85.8185 30.2011 85.2913 31.0878C84.7788 31.9745 84.0759 32.6722 83.1826 33.1809C82.304 33.6752 81.2862 33.9223 80.1294 33.9223ZM73.6276 33.7696V17.5913H76.3733V24.8301L76.1536 27.9263L76.2415 31.0224V33.7696H73.6276ZM79.8219 31.5893C80.4808 31.5893 81.0666 31.4439 81.5791 31.1532C82.1063 30.8625 82.5236 30.441 82.8311 29.8886C83.1387 29.3362 83.2924 28.6894 83.2924 27.9481C83.2924 27.1922 83.1387 26.5454 82.8311 26.0075C82.5236 25.4552 82.1063 25.0336 81.5791 24.7429C81.0666 24.4522 80.4808 24.3069 79.8219 24.3069C79.1629 24.3069 78.5698 24.4522 78.0427 24.7429C77.5155 25.0336 77.0982 25.4552 76.7906 26.0075C76.4831 26.5454 76.3294 27.1922 76.3294 27.9481C76.3294 28.6894 76.4831 29.3362 76.7906 29.8886C77.0982 30.441 77.5155 30.8625 78.0427 31.1532C78.5698 31.4439 79.1629 31.5893 79.8219 31.5893Z" fill="#287D88"/><path d="M89.2351 33.7696V22.1265H91.9808V33.7696H89.2351ZM90.6189 20.2078C90.1064 20.2078 89.6818 20.0479 89.3449 19.7281C89.0228 19.4083 88.8617 19.0231 88.8617 18.5725C88.8617 18.1073 89.0228 17.7221 89.3449 17.4169C89.6818 17.0971 90.1064 16.9372 90.6189 16.9372C91.1315 16.9372 91.5488 17.0898 91.871 17.3951C92.2078 17.6858 92.3762 18.0565 92.3762 18.5071C92.3762 18.9868 92.2151 19.3938 91.8929 19.7281C91.5708 20.0479 91.1461 20.2078 90.6189 20.2078Z" fill="#287D88"/><path d="M96.1337 33.7696V17.5913H98.8793V33.7696H96.1337Z" fill="#287D88"/><path d="M103.032 33.7696V22.1265H105.778V33.7696H103.032ZM104.416 20.2078C103.903 20.2078 103.479 20.0479 103.142 19.7281C102.82 19.4083 102.659 19.0231 102.659 18.5725C102.659 18.1073 102.82 17.7221 103.142 17.4169C103.479 17.0971 103.903 16.9372 104.416 16.9372C104.929 16.9372 105.346 17.0898 105.668 17.3951C106.005 17.6858 106.173 18.0565 106.173 18.5071C106.173 18.9868 106.012 19.3938 105.69 19.7281C105.368 20.0479 104.943 20.2078 104.416 20.2078Z" fill="#287D88"/><path d="M114.346 33.9223C113.057 33.9223 112.061 33.5952 111.358 32.9411C110.656 32.2725 110.304 31.2913 110.304 29.9976V19.5537H113.05V29.9322C113.05 30.4846 113.189 30.9134 113.467 31.2186C113.76 31.5239 114.163 31.6765 114.675 31.6765C115.29 31.6765 115.803 31.5166 116.213 31.1968L116.982 33.1373C116.66 33.399 116.264 33.5952 115.796 33.726C115.327 33.8569 114.844 33.9223 114.346 33.9223ZM108.371 24.3069V22.1265H116.191V24.3069H108.371Z" fill="#287D88"/><path d="M119.984 38.1522C119.413 38.1522 118.842 38.0577 118.27 37.8687C117.699 37.6798 117.223 37.4181 116.843 37.0838L117.941 35.0779C118.219 35.325 118.534 35.5212 118.885 35.6666C119.237 35.8119 119.596 35.8846 119.962 35.8846C120.46 35.8846 120.862 35.761 121.17 35.5139C121.477 35.2668 121.763 34.8526 122.027 34.2711L122.707 32.7449L122.927 32.4178L127.364 22.1265H130L124.509 34.7072C124.143 35.5793 123.733 36.2698 123.279 36.7786C122.839 37.2873 122.341 37.6434 121.785 37.8469C121.243 38.0504 120.643 38.1522 119.984 38.1522ZM122.4 34.1839L117.106 22.1265H119.962L124.267 32.178L122.4 34.1839Z" fill="#287D88"/>`;

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

                {/* logo Rehability — SVG inline (bez fetcha, niezawodne w eksporcie);
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

              {/* Kolory elementów — pod podglądem; rząd na desktopie, kolumna na mobile */}
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
