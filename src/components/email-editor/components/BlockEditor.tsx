"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { Plus, Trash } from "@phosphor-icons/react/dist/ssr";
import { htmlToTemplate, templateToHtml } from "../lib/templateHelpers";

export interface BlockEditorHandle {
  getContent: () => string;
  setContent: (content: string, values: Record<string, string>) => void;
}

interface BlockEditorProps {
  previewValues: Record<string, string>;
  onFocusBlock: (el: HTMLElement) => void;
  onInput?: () => void;
}

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

const BlockEditor = forwardRef<BlockEditorHandle, BlockEditorProps>(
  ({ previewValues, onFocusBlock, onInput }, ref) => {
    const [blockIds, setBlockIds] = useState<string[]>(() => [uid()]);
    const blockRefs = useRef<Map<string, HTMLDivElement>>(new Map());
    // Queue of idâ†’initialHTML set during setContent, consumed by ref callbacks
    const initQueueRef = useRef<Map<string, string>>(new Map());

    // Sync pill display text when preview names change
    useEffect(() => {
      blockIds.forEach((id) => {
        const el = blockRefs.current.get(id);
        if (!el) return;
        Object.entries(previewValues).forEach(([key, val]) => {
          el.querySelectorAll<HTMLElement>(`[data-tag="${key}"]`).forEach((span) => {
            span.textContent = val;
          });
        });
      });
    }, [previewValues, blockIds]);

    const getContent = useCallback(() => {
      return blockIds
        .map((id) => {
          const el = blockRefs.current.get(id);
          return el ? htmlToTemplate(el) : "";
        })
        .filter((s) => s.trim())
        .join("\n\n");
    }, [blockIds]);

    const setContent = useCallback((content: string, values: Record<string, string>) => {
      const paragraphs = content ? content.split(/\n\n+/) : [""];
      const newIds = paragraphs.map(() => uid());
      newIds.forEach((id, i) => {
        initQueueRef.current.set(id, templateToHtml(paragraphs[i] ?? "", values));
      });
      // Discard refs for old blocks
      blockRefs.current.clear();
      setBlockIds(newIds);
    }, []);

    useImperativeHandle(ref, () => ({ getContent, setContent }), [getContent, setContent]);

    const addBlock = useCallback((afterIdx: number) => {
      const newId = uid();
      setBlockIds((prev) => {
        const next = [...prev];
        next.splice(afterIdx + 1, 0, newId);
        return next;
      });
      // Focus after render
      setTimeout(() => blockRefs.current.get(newId)?.focus(), 30);
    }, []);

    const removeBlock = useCallback((id: string, idx: number) => {
      setBlockIds((prev) => {
        if (prev.length <= 1) return prev;
        const next = prev.filter((_, i) => i !== idx);
        setTimeout(() => {
          const focusIdx = Math.min(idx, next.length - 1);
          blockRefs.current.get(next[focusIdx])?.focus();
        }, 20);
        return next;
      });
      blockRefs.current.delete(id);
    }, []);

    return (
      <div style={{ display: "flex", flexDirection: "column" }}>
        {blockIds.map((id, idx) => (
          <div key={id} className="group relative">
            {/* Block separator above (except first) */}
            {idx > 0 && (
              <div
                style={{
                  height: 1,
                  background: "rgba(40,125,136,0.12)",
                  margin: "5px 0 6px",
                }}
              />
            )}

            {/* Editable paragraph */}
            <div
              ref={(el) => {
                if (el) {
                  blockRefs.current.set(id, el);
                  // Consume pending init HTML (set via setContent)
                  const html = initQueueRef.current.get(id);
                  if (html !== undefined) {
                    el.innerHTML = html;
                    initQueueRef.current.delete(id);
                  }
                } else {
                  blockRefs.current.delete(id);
                }
              }}
              contentEditable
              suppressContentEditableWarning
              onFocus={() => {
                const el = blockRefs.current.get(id);
                if (el) onFocusBlock(el);
              }}
              onInput={() => onInput?.()}
              onKeyDown={(e) => {
                // Enter â†’ new block below
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  addBlock(idx);
                }
                // Backspace on empty block â†’ remove
                if (e.key === "Backspace") {
                  const el = blockRefs.current.get(id);
                  if (el && el.innerHTML === "" && blockIds.length > 1) {
                    e.preventDefault();
                    removeBlock(id, idx);
                  }
                }
              }}
              style={{
                color: "#475569",
                fontSize: 15,
                lineHeight: 1.65,
                outline: "none",
                minHeight: 24,
                paddingBottom: 4,
                cursor: "text",
              }}
            />

            {/* Hover actions */}
            <div
              className="flex items-center gap-3 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity"
              style={{ paddingTop: 2, paddingBottom: 1 }}
            >
              <button
                type="button"
                onClick={() => addBlock(idx)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 3,
                  color: "rgba(40,125,136,0.55)",
                  fontSize: 10,
                  fontWeight: 700,
                  fontFamily: "Montserrat,sans-serif",
                  padding: 0,
                }}
              >
                <Plus size={11} weight="bold" />
                Dodaj akapit
              </button>
              {blockIds.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeBlock(id, idx)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                    color: "rgba(239,68,68,0.6)",
                    fontSize: 10,
                    fontWeight: 700,
                    fontFamily: "Montserrat,sans-serif",
                    padding: 0,
                  }}
                >
                  <Trash size={11} weight="bold" />
                  UsuĹ„
                </button>
              )}
            </div>
          </div>
        ))}

        {/* Bottom underline matching the other editors */}
        <div
          style={{
            height: 2,
            background: "rgba(40,125,136,0.25)",
            borderRadius: 1,
            marginTop: 6,
          }}
        />
      </div>
    );
  },
);
BlockEditor.displayName = "BlockEditor";
export default BlockEditor;

