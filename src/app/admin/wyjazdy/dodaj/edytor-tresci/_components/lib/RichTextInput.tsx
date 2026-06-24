"use client";

import React from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus"; // <-- TO JEST KLUCZ DO SUKCESU
import StarterKit from "@tiptap/starter-kit";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import { Placeholder } from "@tiptap/extensions";
import { TextB, Circle } from "@phosphor-icons/react/dist/ssr";

interface RichTextInputProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  /**
   * Gdy podane: Enter (bez Shift) NIE wstawia nowej linii, tylko wywołuje ten
   * callback — używane w listach punktowanych, by Enter tworzył kolejny punkt.
   * Shift+Enter nadal robi miękki łamacz linii w obrębie punktu.
   */
  onEnter?: () => void;
  /** Ustaw fokus na tym polu po zamontowaniu (np. świeżo dodany punkt listy). */
  autoFocus?: boolean;
  /** Tekst podpowiedzi widoczny, gdy pole jest puste (np. „Nowy nagłówek"). */
  placeholder?: string;
}

export default function RichTextInput({
  value,
  onChange,
  className = "",
  onEnter,
  autoFocus = false,
  placeholder,
}: RichTextInputProps) {
  // Ref trzyma najświeższy callback — editorProps domyka się tylko raz.
  const onEnterRef = React.useRef(onEnter);
  onEnterRef.current = onEnter;

  const editor = useEditor({
    extensions: [
      StarterKit,
      TextStyle,
      Color,
      ...(placeholder ? [Placeholder.configure({ placeholder })] : []),
    ],
    content: value || "",
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: `outline-none min-h-[24px] cursor-text ${className}`,
      },
      handleKeyDown(_view, event) {
        if (
          onEnterRef.current &&
          event.key === "Enter" &&
          !event.shiftKey &&
          !event.isComposing
        ) {
          event.preventDefault();
          onEnterRef.current();
          return true;
        }
        return false;
      },
      // Czyszczenie wklejanej treści: twarde spacje → zwykłe i usunięcie pustych
      // akapitów (źródło „nieusuwalnego" whitespace'u po wklejeniu z Worda/web).
      transformPastedHTML(html) {
        return html
          .replace(/ /g, " ")
          .replace(/&nbsp;/gi, " ")
          .replace(/<p[^>]*>(?:\s|&nbsp;|<br\s*\/?>)*<\/p>/gi, "");
      },
      transformPastedText(text) {
        return text
          .replace(/ /g, " ")
          .replace(/[ \t]+\n/g, "\n")
          .replace(/\n{3,}/g, "\n\n")
          .trim();
      },
    },
  });

  React.useEffect(() => {
    if (autoFocus && editor) editor.commands.focus("end");
  }, [autoFocus, editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className="w-full relative">
      <BubbleMenu
        editor={editor}
        className="flex items-center gap-1 bg-white shadow-lg border border-gray-100 rounded-xl p-1.5 z-50"
      >
        {/* POGRUBIENIE */}
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-1.5 rounded-md transition-colors ${
            editor.isActive("bold")
              ? "bg-brand-primary text-white"
              : "text-gray-600 hover:bg-gray-100"
          }`}
          title="Pogrubienie (Ctrl+B)"
        >
          <TextB size={18} weight="bold" />
        </button>

        <div className="w-px h-5 bg-gray-200 mx-1" />

        {/* KOLORY */}
        <button
          onClick={() => editor.chain().focus().setColor("#0B3B4C").run()}
          className="p-1.5 rounded-md hover:bg-gray-100 transition-colors"
          title="Ustaw ciemny granat"
        >
          <Circle size={18} weight="fill" color="#0B3B4C" />
        </button>

        <button
          onClick={() => editor.chain().focus().setColor("#287D88").run()}
          className="p-1.5 rounded-md hover:bg-gray-100 transition-colors"
          title="Ustaw główny brandowy"
        >
          <Circle size={18} weight="fill" color="#287D88" />
        </button>

        <button
          onClick={() => editor.chain().focus().unsetColor().run()}
          className="p-1.5 rounded-md hover:bg-gray-100 transition-colors text-xs font-bold text-gray-400"
          title="Usuń kolor"
        >
          Reset
        </button>
      </BubbleMenu>

      <EditorContent editor={editor} />
    </div>
  );
}
