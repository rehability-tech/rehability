"use client";

import React from "react";

interface EmailComposerHeaderProps {
  subjectRef: React.RefObject<HTMLDivElement | null>;
  previewInviterName: string;
  setPreviewInviterName: (v: string) => void;
  previewInviteeName: string;
  setPreviewInviteeName: (v: string) => void;
  onFocusEditor: (el: HTMLElement) => void;
  onInput: () => void;
}

export default function EmailComposerHeader({
  subjectRef,
  previewInviterName,
  setPreviewInviterName,
  previewInviteeName,
  setPreviewInviteeName,
  onFocusEditor,
  onInput,
}: EmailComposerHeaderProps) {
  return (
    <div className="mb-4 rounded-[18px] border border-gray-200 bg-white shadow-sm overflow-hidden">
      {/* Od */}
      <div className="flex items-center gap-4 px-4 py-3 border-b border-gray-100">
        <span className="w-24 shrink-0 text-[10px] font-bold uppercase tracking-widest text-gray-400 font-montserrat">
          Od
        </span>
        <span className="text-sm text-gray-500 font-montserrat select-none">
          noreply@rehability.pl
        </span>
      </div>

      {/* Zapraszająca — preview {"{inviterName}"} */}
      <div className="flex items-center gap-4 px-4 py-3 border-b border-gray-100">
        <span className="w-24 shrink-0 text-[10px] font-bold uppercase tracking-widest text-gray-400 font-montserrat">
          Zapraszająca
        </span>
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
        <span className="ml-auto hidden sm:block text-[10px] text-gray-300 font-montserrat shrink-0">
          podgląd {"{inviterName}"}
        </span>
      </div>

      {/* Zaproszona — preview {"{inviteeName}"} */}
      <div className="flex items-center gap-4 px-4 py-3 border-b border-gray-100">
        <span className="w-24 shrink-0 text-[10px] font-bold uppercase tracking-widest text-gray-400 font-montserrat">
          Zaproszona
        </span>
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
        <span className="ml-auto hidden sm:block text-[10px] text-gray-300 font-montserrat shrink-0">
          podgląd {"{inviteeName}"}
        </span>
      </div>

      {/* Temat */}
      <div className="px-4 pt-3.5 pb-3">
        <div className="flex items-start gap-4">
          <span className="w-24 shrink-0 text-[10px] font-bold uppercase tracking-widest text-gray-400 font-montserrat mt-[3px]">
            Temat
          </span>
          <div
            ref={subjectRef}
            contentEditable
            suppressContentEditableWarning
            onFocus={() => {
              if (subjectRef.current) onFocusEditor(subjectRef.current);
            }}
            onInput={onInput}
            className="flex-1 min-w-0 text-[15px] font-semibold text-[#0B3B4C] font-montserrat focus:outline-none leading-relaxed"
            style={{ wordBreak: "break-word" }}
          />
        </div>
      </div>
    </div>
  );
}
