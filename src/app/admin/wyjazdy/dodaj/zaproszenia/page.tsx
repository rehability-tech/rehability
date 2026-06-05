"use client";

import React, {
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import {
  CaretLeft,
  CaretRight,
  CircleNotch,
  Sparkle,
  Image as ImageIcon,
  Heart,
  Heartbeat,
  Leaf,
  Sun,
  Mountains,
  Tree,
  Coffee,
  Waves,
  Star,
  Moon,
  Bed,
  Campfire,
  Drop,
  Wind,
  Snowflake,
  MusicNotes,
  PersonSimpleRun,
  FlowerLotus,
  ForkKnife,
  HandsPraying,
  Crown,
  Flower,
  SmileyWink,
} from "@phosphor-icons/react/dist/ssr";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import BlogCoverPicker from "@/app/admin/blog/dodaj/_components/BlogCoverPicker";

// ─── DEFAULTS ────────────────────────────────────────────────────────────────
const DEFAULT_TITLE = "Pakuj walizki!";
const DEFAULT_SUBJECT = "Zaproszenie na wspólny wyjazd Rehability ✈️";
const DEFAULT_BODY =
  "Cześć {inviteeName},\n\nTwoja znajoma {inviterName} serdecznie zaprasza Cię do wspólnego udziału w wyjeździe {campName}. Czeka na Was wspaniały czas, relaks, świetne jedzenie i niezapomniane wspomnienia!";
const DEFAULT_BUTTON = "Zobacz szczegóły i dołącz";
const DEFAULT_HIGHLIGHT_ICONS = ["FlowerLotus", "ForkKnife", "Sparkle"];
const DEFAULT_HIGHLIGHT_LABELS = ["Relaks i SPA", "Pyszne jedzenie", "Wspólne chwile"];

interface Highlight { emoji: string; label: string; }

// ─── TEMPLATE TAG SYSTEM ─────────────────────────────────────────────────────
interface TagDef {
  name: string;
  label: string;
  bg: string;
  color: string;
  border: string;
}

const TEMPLATE_TAGS: TagDef[] = [
  {
    name: "inviterName",
    label: "Imię zapraszającej",
    bg: "rgba(40,125,136,0.12)",
    color: "#287d88",
    border: "rgba(40,125,136,0.35)",
  },
  {
    name: "campName",
    label: "Nazwa wyjazdu",
    bg: "rgba(3,63,99,0.1)",
    color: "#033f63",
    border: "rgba(3,63,99,0.25)",
  },
  {
    name: "inviteeName",
    label: "Imię zaproszonej",
    bg: "rgba(190,24,93,0.09)",
    color: "#be185d",
    border: "rgba(190,24,93,0.28)",
  },
];

function pillStyle(tag: TagDef): string {
  return [
    `display:inline`,
    `background:${tag.bg}`,
    `color:${tag.color}`,
    `border:1.5px solid ${tag.border}`,
    `border-radius:5px`,
    `padding:1px 7px 2px`,
    `font-size:0.88em`,
    `font-weight:700`,
    `white-space:nowrap`,
    `cursor:default`,
    `user-select:none`,
    `-webkit-user-select:none`,
    `margin:0 1px`,
    `line-height:1.5`,
    `vertical-align:baseline`,
  ].join(";");
}

function templateToHtml(template: string, values: Record<string, string>): string {
  return template
    .replace(/\{(\w+)\}/g, (_, key) => {
      const tag = TEMPLATE_TAGS.find((t) => t.name === key);
      const display = values[key] ?? `{${key}}`;
      if (!tag) return display;
      return `<span contenteditable="false" data-tag="${key}" style="${pillStyle(tag)}">${display}</span>`;
    })
    .replace(/\n/g, "<br>");
}

function htmlToTemplate(el: HTMLElement): string {
  let out = "";
  el.childNodes.forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      out += node.textContent ?? "";
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const elem = node as HTMLElement;
      const tag = elem.dataset.tag;
      if (tag) {
        out += `{${tag}}`;
      } else if (elem.tagName === "BR") {
        out += "\n";
      } else if (elem.tagName === "DIV" || elem.tagName === "P") {
        const inner = htmlToTemplate(elem);
        if (inner) { out += inner + "\n"; }
      } else {
        out += htmlToTemplate(elem);
      }
    }
  });
  return out.replace(/\n+$/, ""); // strip trailing newlines
}

// ─── ICON PICKER DATA ────────────────────────────────────────────────────────
type PhosphorIconFC = React.FC<{
  size?: number;
  weight?: "thin" | "light" | "regular" | "bold" | "fill" | "duotone";
  color?: string;
}>;

const ICON_COMPONENTS: Record<string, PhosphorIconFC> = {
  Heart, Heartbeat, Leaf, Sun, Sparkle, Mountains, Tree, Coffee, Waves, Star,
  Moon, Bed, Campfire, Drop, Wind, Snowflake, MusicNotes, PersonSimpleRun,
  FlowerLotus, ForkKnife, HandsPraying, Crown, Flower, SmileyWink,
};

const ICON_OPTIONS: { name: string; label: string }[] = [
  { name: "Heart", label: "Serce" }, { name: "Heartbeat", label: "Zdrowie" },
  { name: "Leaf", label: "Natura" }, { name: "Sun", label: "Słońce" },
  { name: "Sparkle", label: "Magia" }, { name: "Mountains", label: "Góry" },
  { name: "Tree", label: "Las" }, { name: "Coffee", label: "Kawa" },
  { name: "Waves", label: "Morze" }, { name: "Star", label: "Gwiazda" },
  { name: "Moon", label: "Wieczór" }, { name: "Bed", label: "Nocleg" },
  { name: "Campfire", label: "Ognisko" }, { name: "Drop", label: "Woda" },
  { name: "Wind", label: "Powietrze" }, { name: "Snowflake", label: "Zima" },
  { name: "MusicNotes", label: "Muzyka" }, { name: "PersonSimpleRun", label: "Ruch" },
  { name: "FlowerLotus", label: "Relaks" }, { name: "ForkKnife", label: "Jedzenie" },
  { name: "HandsPraying", label: "Medytacja" }, { name: "Crown", label: "Premium" },
  { name: "Flower", label: "Kwiat" }, { name: "SmileyWink", label: "Zabawa" },
];

function PhosphorIcon({ name, size = 24, weight = "duotone", color }: {
  name: string; size?: number;
  weight?: "thin" | "light" | "regular" | "bold" | "fill" | "duotone";
  color?: string;
}) {
  const C: PhosphorIconFC = ICON_COMPONENTS[name] ?? Sparkle;
  return <C size={size} weight={weight} color={color} />;
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function formatDateRange(start: string, end: string): string {
  if (!start) return "Termin do ustalenia";
  try {
    const fmt = new Intl.DateTimeFormat("pl-PL", { day: "numeric", month: "long", year: "numeric" });
    if (end) return `${fmt.format(new Date(start))} – ${fmt.format(new Date(end))}`;
    return fmt.format(new Date(start));
  } catch { return start; }
}

function parseLocation(raw: unknown): string {
  if (!raw) return "";
  try {
    const obj = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (typeof obj === "object" && obj !== null) {
      const parts = [(obj as Record<string, string>).name, (obj as Record<string, string>).city].filter(Boolean);
      if (parts.length) return parts.join(", ");
    }
  } catch { /* fall through */ }
  return typeof raw === "string" ? raw : "";
}

// ─── EDITABLE SPAN (only for highlights labels & button) ─────────────────────
const EditableSpan = React.forwardRef<HTMLSpanElement, React.HTMLAttributes<HTMLSpanElement>>(
  (props, ref) => (
    <span
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      {...props}
      style={{
        outline: "none",
        borderBottom: "2px dashed rgba(40,125,136,0.45)",
        cursor: "text",
        minWidth: "4px",
        display: "inline",
        ...props.style,
      }}
      title="Kliknij, aby edytować"
    />
  ),
);
EditableSpan.displayName = "EditableSpan";

// ─── IMAGE SLOTS ─────────────────────────────────────────────────────────────
const GALLERY_HINTS = ["Atmosfera miejsca", "Aktywność / atrakcja", "Wspólna chwila"];

function GallerySlot({ src, index, onClick }: { src: string; index: number; onClick: () => void }) {
  return (
    <div role="button" tabIndex={0} onClick={onClick} onKeyDown={(e) => e.key === "Enter" && onClick()}
      style={{ position: "relative", cursor: "pointer" }}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={`Galeria ${index + 1}`} style={{ width: "100%", aspectRatio: "16/7", objectFit: "cover", borderRadius: "10px 0 10px 10px", display: "block" }} />
      ) : (
        <div style={{ width: "100%", aspectRatio: "16/7", background: "linear-gradient(135deg,#f4fafb,#e6f3f5)", border: "1.5px dashed #a8cdd2", borderRadius: "10px 0 10px 10px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4 }}>
          <ImageIcon size={16} weight="duotone" color="#5da6af" />
          <span style={{ fontSize: 9, color: "#5da6af", fontWeight: 700, fontFamily: "Montserrat,sans-serif", textAlign: "center", lineHeight: 1.3, padding: "0 4px" }}>{GALLERY_HINTS[index]}</span>
        </div>
      )}
      <div style={{ position: "absolute", bottom: 4, right: 4, background: src ? "rgba(255,255,255,0.92)" : "rgba(40,125,136,0.9)", color: src ? "#287d88" : "#fff", borderRadius: 5, padding: "2px 6px", fontSize: 9, fontWeight: 700, fontFamily: "Montserrat,sans-serif", pointerEvents: "none" }}>
        {src ? "✏ Zmień" : "＋"}
      </div>
    </div>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
function ZaproszeniaContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tripId = searchParams.get("id");

  const [isFetching, setIsFetching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Preview names — both are "display only" for the admin preview
  const [previewInviterName, setPreviewInviterName] = useState("Anna Nowak");
  const [previewInviteeName, setPreviewInviteeName] = useState("Ania Kowalska");

  const [heroImage, setHeroImage] = useState("");
  const [gallery, setGallery] = useState(["", "", ""]);
  const [highlightIcons, setHighlightIcons] = useState<string[]>([...DEFAULT_HIGHLIGHT_ICONS]);

  const [pickerOpenFor, setPickerOpenFor] = useState<number | null>(null);
  const [iconPickerFor, setIconPickerFor] = useState<number | null>(null);
  const [iconPickerPos, setIconPickerPos] = useState({ x: 0, y: 0 });

  const tripContextRef = useRef({ title: "", description: "", location: "", startDate: "", endDate: "" });

  // ContentEditable refs — initialized imperatively via emailKey
  const titleRef = useRef<HTMLDivElement>(null);
  const subjectRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLSpanElement>(null);
  const labelRefs = useRef<Array<HTMLSpanElement | null>>([null, null, null]);

  // Tracks which editor was last focused (for tag insertion)
  const lastFocusedEditorRef = useRef<HTMLElement | null>(null);

  const [emailKey, setEmailKey] = useState(0);
  const loadedRef = useRef({
    title: DEFAULT_TITLE,
    subject: DEFAULT_SUBJECT,
    body: DEFAULT_BODY,
    buttonText: DEFAULT_BUTTON,
    labels: [...DEFAULT_HIGHLIGHT_LABELS],
  });

  // Shared preview values
  const getPreviewValues = useCallback((): Record<string, string> => ({
    inviterName: previewInviterName,
    campName: tripContextRef.current.title || "Nazwa wyjazdu",
    inviteeName: previewInviteeName,
  }), [previewInviterName, previewInviteeName]);

  // ── FETCH ──────────────────────────────────────────────────────────────────
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

        setHeroImage(data.invitationEmailHeroImage ?? data.heroImage ?? "");

        const loadedH: Highlight[] = Array.isArray(data.invitationEmailHighlights)
          ? (data.invitationEmailHighlights as Highlight[])
          : DEFAULT_HIGHLIGHT_ICONS.map((icon, i) => ({ emoji: icon, label: DEFAULT_HIGHLIGHT_LABELS[i] }));

        const padded = Array.isArray(data.invitationEmailGallery) ? [...(data.invitationEmailGallery as string[])] : [];
        while (padded.length < 3) padded.push("");
        setGallery(padded.slice(0, 3));

        // Auto-upgrade old body format (just extra text without tags) → prepend default intro
        const rawBody: string = data.invitationEmailBody ?? "";
        const hasNewFormat = rawBody.includes("{inviteeName}") || rawBody.includes("{inviterName}");
        const bodyToLoad = hasNewFormat || !rawBody
          ? (rawBody || DEFAULT_BODY)
          : `Cześć {inviteeName},\n\nTwoja znajoma {inviterName} serdecznie zaprasza Cię do wspólnego udziału w wyjeździe {campName}. ${rawBody}`;

        loadedRef.current = {
          title: data.invitationEmailTitle ?? DEFAULT_TITLE,
          subject: data.invitationEmailSubject ?? DEFAULT_SUBJECT,
          body: bodyToLoad,
          buttonText: data.invitationEmailButtonText ?? DEFAULT_BUTTON,
          labels: loadedH.map((h) => h.label),
        };
        setHighlightIcons(loadedH.map((h) => h.emoji));
        setEmailKey((k) => k + 1);
      } catch {
        toast.error("Nie udało się załadować ustawień e-maila.");
      } finally {
        setIsFetching(false);
      }
    })();
  }, [tripId, router]);

  // ── INIT CONTENT EDITABLE after data load / AI ────────────────────────────
  useEffect(() => {
    if (emailKey === 0) return;
    const values = getPreviewValues();
    const { title, subject, body, buttonText, labels } = loadedRef.current;

    if (titleRef.current)
      titleRef.current.innerHTML = templateToHtml(title, values);
    if (subjectRef.current)
      subjectRef.current.innerHTML = templateToHtml(subject, values);
    if (bodyRef.current)
      bodyRef.current.innerHTML = templateToHtml(body, values);
    if (buttonRef.current) buttonRef.current.innerText = buttonText;
    labels.forEach((label, i) => {
      if (labelRefs.current[i]) labelRefs.current[i]!.innerText = label;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [emailKey]);

  // ── SYNC inviterName pills live ────────────────────────────────────────────
  useEffect(() => {
    [titleRef.current, subjectRef.current, bodyRef.current].forEach((el) => {
      el?.querySelectorAll<HTMLElement>('[data-tag="inviterName"]').forEach((span) => {
        span.textContent = previewInviterName;
      });
    });
  }, [previewInviterName]);

  // ── SYNC inviteeName pills live ────────────────────────────────────────────
  useEffect(() => {
    [titleRef.current, subjectRef.current, bodyRef.current].forEach((el) => {
      el?.querySelectorAll<HTMLElement>('[data-tag="inviteeName"]').forEach((span) => {
        span.textContent = previewInviteeName;
      });
    });
  }, [previewInviteeName]);

  // ── AI GENERATION ─────────────────────────────────────────────────────────
  const generateWithAI = useCallback(async () => {
    const { title, description, location } = tripContextRef.current;
    if (!title) {
      toast.error("Brak danych wyjazdu. Najpierw zapisz dane podstawowe.");
      return;
    }
    setIsGenerating(true);
    try {
      const res = await fetch("/api/admin/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generateInvitationEmail",
          prompt: `Tytuł wyjazdu: ${title}\nOpis: ${description || "brak"}\nLokalizacja: ${location || "brak"}`,
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Błąd AI");

      const aiH: Highlight[] = Array.isArray(result.highlights)
        ? result.highlights
        : DEFAULT_HIGHLIGHT_ICONS.map((icon, i) => ({ emoji: icon, label: DEFAULT_HIGHLIGHT_LABELS[i] }));

      // AI generates just the body text — prepend our default intro with template tags
      const aiBody = result.body ?? "";
      const hasNewFormat = aiBody.includes("{inviteeName}") || aiBody.includes("{inviterName}");
      const bodyToLoad = hasNewFormat
        ? aiBody
        : `Cześć {inviteeName},\n\nTwoja znajoma {inviterName} serdecznie zaprasza Cię do wspólnego udziału w wyjeździe {campName}. ${aiBody}`;

      loadedRef.current = {
        title: result.emailTitle ?? DEFAULT_TITLE,
        subject: result.subject ?? DEFAULT_SUBJECT,
        body: bodyToLoad,
        buttonText: result.buttonText ?? DEFAULT_BUTTON,
        labels: aiH.map((h) => h.label),
      };
      setHighlightIcons(aiH.map((h) => h.emoji));
      setEmailKey((k) => k + 1);
      toast.success("Treść e-maila wygenerowana przez AI!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Błąd generowania AI.");
    } finally {
      setIsGenerating(false);
    }
  }, []);

  // ── TAG INSERTION ─────────────────────────────────────────────────────────
  const insertTag = useCallback((tagName: string) => {
    const el = lastFocusedEditorRef.current;
    if (!el) {
      toast.info("Kliknij najpierw w pole, do którego chcesz wstawić zmienną.");
      return;
    }
    const tagDef = TEMPLATE_TAGS.find((t) => t.name === tagName);
    if (!tagDef) return;

    const values: Record<string, string> = {
      inviterName: previewInviterName,
      campName: tripContextRef.current.title || "Nazwa wyjazdu",
      inviteeName: previewInviteeName,
    };

    const pill = document.createElement("span");
    pill.setAttribute("contenteditable", "false");
    pill.setAttribute("data-tag", tagName);
    pill.textContent = values[tagName] ?? tagName;
    pill.style.cssText = pillStyle(tagDef);

    el.focus();
    const sel = window.getSelection();
    if (sel?.rangeCount && el.contains(sel.getRangeAt(0).commonAncestorContainer)) {
      const range = sel.getRangeAt(0);
      range.deleteContents();
      range.insertNode(pill);
      range.setStartAfter(pill);
      range.collapse(true);
      sel.removeAllRanges();
      sel.addRange(range);
    } else {
      el.appendChild(pill);
    }
  }, [previewInviterName, previewInviteeName]);

  // ── IMAGE PICKER ──────────────────────────────────────────────────────────
  const handlePickerSelect = useCallback((url: string) => {
    if (typeof pickerOpenFor === "number")
      setGallery((prev) => prev.map((u, i) => (i === pickerOpenFor ? url : u)));
    setPickerOpenFor(null);
  }, [pickerOpenFor]);

  // ── SAVE ──────────────────────────────────────────────────────────────────
  const save = useCallback(async () => {
    if (!tripId) return;
    setIsSaving(true);
    try {
      const titleTemplate = titleRef.current ? htmlToTemplate(titleRef.current) : DEFAULT_TITLE;
      const subjectTemplate = subjectRef.current ? htmlToTemplate(subjectRef.current) : DEFAULT_SUBJECT;
      const bodyTemplate = bodyRef.current ? htmlToTemplate(bodyRef.current) : DEFAULT_BODY;
      const highlights = highlightIcons.map((icon, i) => ({
        emoji: icon,
        label: labelRefs.current[i]?.innerText ?? DEFAULT_HIGHLIGHT_LABELS[i],
      }));

      const res = await fetch(`/api/admin/wyjazdy/${tripId}/invitation-email`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invitationEmailTitle: titleTemplate,
          invitationEmailSubject: subjectTemplate,
          invitationEmailBody: bodyTemplate,
          invitationEmailButtonText: buttonRef.current?.innerText ?? DEFAULT_BUTTON,
          invitationEmailHeroImage: heroImage || undefined,
          invitationEmailHighlights: highlights,
          invitationEmailGallery: gallery.filter(Boolean),
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Błąd zapisu");
      toast.success("E-mail zaproszenia zapisany!");
      router.push(`/admin/wyjazdy/dodaj/seo?id=${tripId}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Błąd serwera.");
    } finally {
      setIsSaving(false);
    }
  }, [tripId, heroImage, gallery, highlightIcons, router]);

  // ── RENDER ────────────────────────────────────────────────────────────────
  if (isFetching) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <CircleNotch size={40} weight="bold" className="text-brand-primary animate-spin mb-4" />
        <p className="text-gray-500 font-montserrat font-medium">Ładowanie szablonu e-maila...</p>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500">

      {/* ── NAGŁÓWEK ── */}
      <div className="mb-5 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-jakarta font-bold text-[#0B3B4C]">E-mail zaproszenia</h2>
          <p className="text-sm text-gray-400 font-montserrat mt-1">
            Kliknij dowolny tekst w podglądzie, aby edytować. Wstaw zmienne przyciskami poniżej.
          </p>
        </div>
        <button
          type="button"
          onClick={generateWithAI}
          disabled={isGenerating || isFetching}
          className="flex items-center gap-2 px-4 py-2.5 rounded-[12px] font-semibold text-sm border border-[#287d88]/30 text-[#287d88] bg-[#287d88]/5 hover:bg-[#287d88]/10 transition-colors disabled:opacity-50 shrink-0"
        >
          {isGenerating
            ? <CircleNotch size={16} weight="bold" className="animate-spin" />
            : <Sparkle size={16} weight="fill" />}
          Generuj treść AI
        </button>
      </div>

      {/* ── EMAIL COMPOSER HEADER ── */}
      <div className="mb-4 rounded-[18px] border border-gray-200 bg-white shadow-sm overflow-hidden">

        {/* Od */}
        <div className="flex items-center gap-4 px-4 py-3 border-b border-gray-100">
          <span className="w-24 shrink-0 text-[10px] font-bold uppercase tracking-widest text-gray-400 font-montserrat">Od</span>
          <span className="text-sm text-gray-500 font-montserrat select-none">noreply@rehability.pl</span>
        </div>

        {/* Zapraszająca — preview {inviterName} */}
        <div className="flex items-center gap-4 px-4 py-3 border-b border-gray-100">
          <span className="w-24 shrink-0 text-[10px] font-bold uppercase tracking-widest text-gray-400 font-montserrat">Zapraszająca</span>
          <div className="flex items-center gap-1.5 bg-[#287d88]/[0.08] border border-[#287d88]/20 rounded-full px-3 py-1">
            <span className="w-5 h-5 rounded-full bg-[#287d88]/20 flex items-center justify-center text-[10px] font-bold text-[#287d88] shrink-0">
              {previewInviterName.charAt(0).toUpperCase() || "A"}
            </span>
            <input
              type="text"
              value={previewInviterName}
              onChange={(e) => setPreviewInviterName(e.target.value)}
              className="bg-transparent text-sm font-semibold text-[#287d88] font-montserrat focus:outline-none w-32 sm:w-44"
              placeholder="Anna Nowak"
            />
          </div>
          <span className="ml-auto text-[10px] text-gray-300 font-montserrat shrink-0 hidden sm:block">podgląd {"{inviterName}"}</span>
        </div>

        {/* Zaproszona — preview {inviteeName} */}
        <div className="flex items-center gap-4 px-4 py-3 border-b border-gray-100">
          <span className="w-24 shrink-0 text-[10px] font-bold uppercase tracking-widest text-gray-400 font-montserrat">Zaproszona</span>
          <div className="flex items-center gap-1.5 bg-[#be185d]/[0.07] border border-[#be185d]/20 rounded-full px-3 py-1">
            <span className="w-5 h-5 rounded-full bg-[#be185d]/15 flex items-center justify-center text-[10px] font-bold text-[#be185d] shrink-0">
              {previewInviteeName.charAt(0).toUpperCase() || "A"}
            </span>
            <input
              type="text"
              value={previewInviteeName}
              onChange={(e) => setPreviewInviteeName(e.target.value)}
              className="bg-transparent text-sm font-semibold text-[#be185d] font-montserrat focus:outline-none w-32 sm:w-44"
              placeholder="Ania Kowalska"
            />
          </div>
          <span className="ml-auto text-[10px] text-gray-300 font-montserrat shrink-0 hidden sm:block">podgląd {"{inviteeName}"}</span>
        </div>

        {/* Temat — contentEditable z tagami */}
        <div className="px-4 pt-3.5 pb-3">
          <div className="flex items-start gap-4">
            <span className="w-24 shrink-0 text-[10px] font-bold uppercase tracking-widest text-gray-400 font-montserrat mt-[3px]">Temat</span>
            <div
              ref={subjectRef}
              contentEditable
              suppressContentEditableWarning
              onFocus={() => { lastFocusedEditorRef.current = subjectRef.current; }}
              className="flex-1 min-w-0 text-[15px] font-semibold text-[#0B3B4C] font-montserrat focus:outline-none leading-relaxed"
              style={{ wordBreak: "break-word" }}
            />
          </div>
        </div>
      </div>

      {/* ── PASEK ZMIENNYCH ── */}
      <div className="mb-5 flex flex-wrap items-center gap-2 p-3 bg-gray-50 border border-gray-200 rounded-[12px]">
        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 font-montserrat mr-1 hidden sm:block">
          Wstaw
        </span>
        {TEMPLATE_TAGS.map((tag) => (
          <button
            key={tag.name}
            type="button"
            onClick={() => insertTag(tag.name)}
            style={{
              background: tag.bg,
              color: tag.color,
              border: `1.5px solid ${tag.border}`,
            }}
            className="flex items-center gap-1 px-3 py-1 rounded-[6px] text-xs font-bold font-montserrat cursor-pointer hover:opacity-80 active:scale-95 transition-all"
          >
            <span className="text-[10px] opacity-60">＋</span>
            {tag.label}
          </button>
        ))}
        <span className="text-[10px] text-gray-400 font-montserrat ml-1 hidden sm:block">
          — kliknij w pole, potem wstaw zmienną
        </span>
      </div>

      {/* ── E-MAIL INLINE ── */}
      <div className="overflow-x-auto -mx-2 sm:mx-0">
        <div
          key={emailKey}
          style={{
            minWidth: 320,
            maxWidth: 600,
            margin: "0 auto",
            padding: "28px 12px",
            backgroundColor: "#eef4f5",
            backgroundImage: "radial-gradient(circle at 0% 0%,rgba(40,125,136,.22) 0%,transparent 45%),radial-gradient(circle at 100% 32%,rgba(242,217,103,.28) 0%,transparent 48%),radial-gradient(circle at 50% 100%,rgba(40,125,136,.12) 0%,transparent 55%)",
            borderRadius: 16,
            fontFamily: "'Montserrat','Helvetica Neue',Helvetica,Arial,sans-serif",
          }}
        >
          {/* Logo */}
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="https://wkel0sdzlinz0k7a.public.blob.vercel-storage.com/logotypes/logo-email.png" alt="Rehability" style={{ width: 120, height: "auto", margin: "0 auto" }} />
          </div>

          {/* Karta */}
          <div style={{ backgroundColor: "#fff", borderRadius: "24px 0 24px 24px", boxShadow: "0 18px 40px -16px rgba(3,63,99,.18)" }}>
            {/* Hero — statyczny podgląd zdjęcia z ustawień wyjazdu */}
            {heroImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={heroImage} alt="Hero" style={{ width: "100%", aspectRatio: "600/220", objectFit: "cover", borderRadius: "24px 0 0 0", display: "block" }} />
            ) : (
              <div style={{ width: "100%", aspectRatio: "600/220", background: "linear-gradient(135deg,#e8f6f7,#cde9ec 45%,#e2f3f5)", borderRadius: "24px 0 0 0", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ textAlign: "center" }}>
                  <p style={{ margin: 0, color: "#94b5b9", fontSize: 12, fontFamily: "Montserrat,sans-serif" }}>Zdjęcie hero z wyjazdu</p>
                </div>
              </div>
            )}

            <div style={{ padding: "clamp(20px,5vw,40px) clamp(16px,6vw,44px)" }}>

              {/* Tytuł — edytowalny */}
              <div
                ref={titleRef}
                contentEditable
                suppressContentEditableWarning
                onFocus={() => { lastFocusedEditorRef.current = titleRef.current; }}
                style={{
                  margin: "0 0 18px",
                  color: "#033f63",
                  fontSize: "clamp(18px,4vw,24px)",
                  fontWeight: 800,
                  textAlign: "center",
                  lineHeight: 1.25,
                  letterSpacing: "-.01em",
                  outline: "none",
                  borderBottom: "2px dashed rgba(3,63,99,0.18)",
                  cursor: "text",
                  minHeight: 28,
                  paddingBottom: 4,
                }}
              />

              {/* Treść — edytowalny (obejmuje powitanie + główny tekst) */}
              <div
                ref={bodyRef}
                contentEditable
                suppressContentEditableWarning
                onFocus={() => { lastFocusedEditorRef.current = bodyRef.current; }}
                style={{
                  margin: "0 0 22px",
                  color: "#475569",
                  fontSize: 15,
                  lineHeight: 1.6,
                  outline: "none",
                  borderBottom: "2px dashed rgba(40,125,136,0.25)",
                  cursor: "text",
                  minHeight: 28,
                  paddingBottom: 4,
                }}
              />

              {/* Szczegóły */}
              <div style={{ backgroundColor: "#f3f8f9", borderLeft: "4px solid #287d88", borderRadius: "16px 0 16px 16px", padding: "18px 20px", marginBottom: 26 }}>
                <p style={{ margin: "0 0 3px", color: "#287d88", fontSize: 10, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase" }}>Kiedy</p>
                <p style={{ margin: "0 0 12px", color: "#033f63", fontSize: 14, fontWeight: 600 }}>{formatDateRange(tripContextRef.current.startDate, tripContextRef.current.endDate)}</p>
                <p style={{ margin: "0 0 3px", color: "#287d88", fontSize: 10, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase" }}>Gdzie</p>
                <p style={{ margin: 0, color: "#033f63", fontSize: 14, fontWeight: 600 }}>{tripContextRef.current.location || "Zakopane, Hotel Górski"}</p>
              </div>

              {/* Highlights */}
              <p style={{ margin: "0 0 14px", color: "#287d88", fontSize: 10, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", textAlign: "center" }}>Co Cię czeka</p>
              <div style={{ display: "flex", justifyContent: "space-around", marginBottom: 26, gap: 8 }}>
                {[0, 1, 2].map((i) => (
                  <div key={i} style={{ textAlign: "center", flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                    <button
                      type="button"
                      title="Kliknij, aby zmienić ikonę"
                      onClick={(e) => {
                        const rect = (e.currentTarget as HTMLButtonElement).getBoundingClientRect();
                        setIconPickerPos({ x: Math.max(8, Math.min(rect.left - 60, window.innerWidth - 320)), y: rect.bottom + 8 });
                        setIconPickerFor(i);
                      }}
                      style={{ background: "linear-gradient(135deg,#287d88,#1d6b76)", border: "none", borderRadius: 14, width: 54, height: 54, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 4px 14px rgba(40,125,136,.35)", position: "relative", flexShrink: 0 }}
                    >
                      <PhosphorIcon name={highlightIcons[i] ?? "Sparkle"} size={26} weight="fill" color="#fff" />
                      <span style={{ position: "absolute", top: -4, right: -4, width: 16, height: 16, borderRadius: "50%", background: "#f2d967", border: "2px solid #fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 7, fontWeight: 900, color: "#7a6008" }}>✏</span>
                    </button>
                    <EditableSpan ref={(el) => { labelRefs.current[i] = el; }} style={{ color: "#033f63", fontSize: 11, fontWeight: 600, lineHeight: 1.4 }} />
                  </div>
                ))}
              </div>

              {/* Galeria */}
              <p style={{ margin: "0 0 10px", color: "#287d88", fontSize: 10, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", textAlign: "center" }}>Klimat wyjazdu</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 7, marginBottom: 26 }}>
                {gallery.map((url, i) => (
                  <GallerySlot key={i} src={url} index={i} onClick={() => setPickerOpenFor(i)} />
                ))}
              </div>

              {/* Ważność */}
              <div style={{ backgroundColor: "#fef9e7", border: "1px solid #f7e6b0", borderRadius: 12, padding: "11px 15px", marginBottom: 26 }}>
                <p style={{ margin: 0, color: "#8a6d1a", fontSize: 12, lineHeight: 1.5 }}>
                  ⏳ <strong>To zaproszenie jest ważne 24 godziny.</strong> Po tym czasie miejsce wraca do puli.
                </p>
              </div>

              {/* CTA */}
              <div style={{ textAlign: "center" }}>
                <EditableSpan ref={buttonRef} style={{ display: "inline-block", backgroundColor: "#287d88", color: "#fff", fontSize: 14, fontWeight: 700, padding: "14px 32px", borderRadius: "14px 0 14px 14px", border: "1px solid rgba(242,217,103,.4)", boxShadow: "0 6px 18px rgba(242,217,103,.45)", cursor: "text" }} />
              </div>
            </div>
          </div>

          {/* Stopka */}
          <div style={{ textAlign: "center", paddingTop: 20 }}>
            <p style={{ margin: "0 0 5px", color: "#8aa0a6", fontSize: 11, lineHeight: 1.5 }}>
              Otrzymujesz tę wiadomość, ponieważ <strong>{previewInviterName}</strong> wpisała Twój adres e-mail.
            </p>
            <p style={{ margin: 0, color: "#8aa0a6", fontSize: 11 }}>© 2026 Rehability. Wszystkie prawa zastrzeżone.</p>
          </div>
        </div>
      </div>

      {/* ── NAWIGACJA ── */}
      <div className="flex items-center justify-between pt-6 mt-6 border-t border-gray-100">
        <Link href={`/admin/wyjazdy/dodaj/edytor-tresci${tripId ? `?id=${tripId}` : ""}`}
          className="flex items-center gap-2 px-5 py-2.5 rounded-[12px] text-gray-500 font-semibold text-sm hover:bg-gray-100 transition-colors">
          <CaretLeft size={18} weight="bold" />Wstecz
        </Link>
        <Button onClick={save} isLoading={isSaving} disabled={isSaving} rightIcon={<CaretRight size={18} weight="bold" />}>
          Zapisz i przejdź dalej
        </Button>
      </div>

      {/* ── PICKERS ── */}
      <BlogCoverPicker
        isOpen={pickerOpenFor !== null}
        onClose={() => setPickerOpenFor(null)}
        onSelect={handlePickerSelect}
        defaultQuery={tripContextRef.current.title}
        heading={`Klimat wyjazdu — zdjęcie ${typeof pickerOpenFor === "number" ? pickerOpenFor + 1 : ""}`}
        subheading="Zaciągnij zdjęcie z Pexels albo wgraj własne."
        uploadEndpoint="/api/admin/blog/upload"
      />

      {iconPickerFor !== null && (
        <>
          <div style={{ position: "fixed", inset: 0, zIndex: 999 }} onClick={() => setIconPickerFor(null)} />
          <div style={{ position: "fixed", top: iconPickerPos.y, left: iconPickerPos.x, zIndex: 1000, background: "#fff", borderRadius: 14, boxShadow: "0 8px 32px rgba(3,63,99,.18)", border: "1px solid rgba(40,125,136,.12)", padding: 10, display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 3 }}>
            {ICON_OPTIONS.map((opt) => {
              const isSel = highlightIcons[iconPickerFor] === opt.name;
              return (
                <button key={opt.name} type="button" title={opt.label}
                  onClick={(e) => { e.stopPropagation(); setHighlightIcons((prev) => prev.map((v, idx) => idx === iconPickerFor ? opt.name : v)); setIconPickerFor(null); }}
                  style={{ width: 38, height: 38, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 8, border: isSel ? "2px solid #287d88" : "2px solid transparent", background: isSel ? "linear-gradient(135deg,#287d88,#1d6b76)" : "transparent", cursor: "pointer", transition: "all .12s" }}>
                  <PhosphorIcon name={opt.name} size={20} weight={isSel ? "fill" : "duotone"} color={isSel ? "#fff" : "#64748b"} />
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

export default function ZaproszeniaCampPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[400px]"><CircleNotch size={40} weight="bold" className="text-brand-primary animate-spin" /></div>}>
      <ZaproszeniaContent />
    </Suspense>
  );
}
