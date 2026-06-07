"use client";

import type { TripContext } from "../lib/types";
import type { EmailSection } from "../lib/sections";
import SectionsList from "./SectionsList";

interface EmailPreviewProps {
  sections: EmailSection[];
  tripContext: TripContext;
  previewValues: Record<string, string>;
  previewInviterName: string;
  /** Tryb tylko-do-odczytu (podgląd) — ukrywa narzędzia edycji. */
  readonly?: boolean;
  onSectionsChange?: (sections: EmailSection[]) => void;
  onFocusEditor?: (el: HTMLElement) => void;
  onInput?: () => void;
  onOpenIconPicker?: (sectionId: string, iconIdx: number, rect: DOMRect) => void;
  onOpenGalleryPicker?: (sectionId: string, slotIdx: number) => void;
  onOpenHeroPicker?: (sectionId: string) => void;
}

const noop = () => {};

export default function EmailPreview({
  sections,
  tripContext,
  previewValues,
  previewInviterName,
  readonly = false,
  onSectionsChange = noop,
  onFocusEditor = noop,
  onInput = noop,
  onOpenIconPicker = noop,
  onOpenGalleryPicker = noop,
  onOpenHeroPicker = noop,
}: EmailPreviewProps) {
  return (
    <div className="overflow-x-auto -mx-2 sm:mx-0">
      <div
        style={{
          minWidth: 320,
          maxWidth: 600,
          margin: "0 auto",
          padding: "28px 12px",
          backgroundColor: "#eef4f5",
          backgroundImage:
            "radial-gradient(circle at 0% 0%,rgba(40,125,136,.22) 0%,transparent 45%)," +
            "radial-gradient(circle at 100% 32%,rgba(242,217,103,.28) 0%,transparent 48%)," +
            "radial-gradient(circle at 50% 100%,rgba(40,125,136,.12) 0%,transparent 55%)",
          borderRadius: 16,
          fontFamily: "'Montserrat','Helvetica Neue',Helvetica,Arial,sans-serif",
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://wkel0sdzlinz0k7a.public.blob.vercel-storage.com/logotypes/logo-email.png"
            alt="Rehability"
            style={{ width: 120, height: "auto", margin: "0 auto" }}
          />
        </div>

        {/* White card */}
        <div
          style={{
            backgroundColor: "#fff",
            borderRadius: "24px 0 24px 24px",
            boxShadow: "0 18px 40px -16px rgba(3,63,99,.18)",
            padding: "clamp(20px,5vw,40px) clamp(16px,6vw,44px)",
          }}
        >
          <SectionsList
            sections={sections}
            onChange={onSectionsChange}
            tripContext={tripContext}
            previewValues={previewValues}
            onFocusEditor={onFocusEditor}
            onInput={onInput}
            onOpenIconPicker={onOpenIconPicker}
            onOpenGalleryPicker={onOpenGalleryPicker}
            onOpenHeroPicker={onOpenHeroPicker}
            readonly={readonly}
          />
        </div>

        {/* Stopka */}
        <div style={{ textAlign: "center", paddingTop: 20 }}>
          <p style={{ margin: "0 0 5px", color: "#8aa0a6", fontSize: 11, lineHeight: 1.5 }}>
            Otrzymujesz tÄ™ wiadomoĹ›Ä‡, poniewaĹĽ <strong>{previewInviterName}</strong> wpisaĹ‚a TwĂłj adres e-mail.
          </p>
          <p style={{ margin: 0, color: "#8aa0a6", fontSize: 11 }}>
            Â© 2026 Rehability. Wszystkie prawa zastrzeĹĽone.
          </p>
        </div>
      </div>
    </div>
  );
}

