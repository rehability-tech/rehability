import { useCallback, useRef, useState } from "react";
import { isUsableImageUrl } from "@/lib/utils";
import type { BlogBlock } from "./useBlogAiGenerator";

/**
 * Pół-automatyczny dobór zdjęć po generacji treści.
 *
 * Generator tworzy bloki `inlineImage` z pustym `url` i opisem (`alt`) jako
 * rekomendacją. Ten hook zatrzymuje przepływ i przeprowadza redaktora przez
 * KOLEJKĘ pickerów Pexels — jeden na każdy taki blok, z frazą wstępną z `alt`.
 *
 * Użycie:
 *   const picker = useInlineImagePicker();
 *   const filled = await picker.pickImagesFor(blocks, onLiveUpdate);
 *   // render: <BlogCoverPicker key={picker.pickerKey} isOpen={picker.state.isOpen} ... />
 *
 * `pickImagesFor` zwraca Promise rozwiązywany dopiero, gdy wszystkie zdjęcia
 * zostaną wybrane LUB pominięte — dzięki temu wołający może spokojnie zapisać.
 */
export interface InlineImagePickerState {
  isOpen: boolean;
  /** Fraza wstępna do wyszukiwarki (z `alt` bloku). */
  query: string;
  /** Numer aktualnego zdjęcia (1-based) i łączna liczba do wyboru. */
  index: number;
  total: number;
}

type OnUpdate = (blocks: BlogBlock[]) => void;

const hasUrl = (b: BlogBlock) =>
  Boolean(b.content && typeof b.content === "object") &&
  isUsableImageUrl((b.content as { url?: unknown }).url);

export function useInlineImagePicker() {
  const [state, setState] = useState<InlineImagePickerState>({
    isOpen: false,
    query: "",
    index: 0,
    total: 0,
  });

  const blocksRef = useRef<BlogBlock[]>([]);
  const queueRef = useRef<string[]>([]); // pozostałe id bloków (bieżący na [0])
  const totalRef = useRef(0);
  const resolveRef = useRef<((blocks: BlogBlock[]) => void) | null>(null);
  const onUpdateRef = useRef<OnUpdate | undefined>(undefined);

  // Przejdź do kolejnego zdjęcia w kolejce albo zakończ (rozwiąż Promise).
  const advance = useCallback(() => {
    const queue = queueRef.current;
    if (queue.length === 0) {
      setState((s) => ({ ...s, isOpen: false }));
      const resolve = resolveRef.current;
      resolveRef.current = null;
      resolve?.(blocksRef.current);
      return;
    }
    const blockId = queue[0];
    const block = blocksRef.current.find((b) => b.id === blockId);
    const query = String(block?.content?.alt ?? "").trim();
    const index = totalRef.current - queue.length + 1;
    setState({ isOpen: true, query, index, total: totalRef.current });
  }, []);

  const pickImagesFor = useCallback(
    (
      blocks: BlogBlock[],
      onUpdate?: OnUpdate,
      // Gdy podane — pytamy WYŁĄCZNIE o ten jeden blok (pauza inline w pętli),
      // żeby nie wracać do zdjęć, które redaktor już świadomie pominął.
      onlyBlockId?: string,
    ): Promise<BlogBlock[]> => {
      blocksRef.current = blocks;
      onUpdateRef.current = onUpdate;
      let pending = blocks.filter((b) => b.type === "inlineImage" && !hasUrl(b));
      if (onlyBlockId) pending = pending.filter((b) => b.id === onlyBlockId);
      if (pending.length === 0) return Promise.resolve(blocks);

      queueRef.current = pending.map((b) => b.id);
      totalRef.current = pending.length;
      return new Promise<BlogBlock[]>((resolve) => {
        resolveRef.current = resolve;
        advance();
      });
    },
    [advance],
  );

  const handleSelect = useCallback(
    (url: string) => {
      const blockId = queueRef.current[0];
      if (blockId) {
        blocksRef.current = blocksRef.current.map((b) =>
          b.id === blockId
            ? { ...b, content: { ...(b.content ?? {}), url } }
            : b,
        );
        onUpdateRef.current?.(blocksRef.current); // podgląd na żywo w edytorze
      }
      queueRef.current = queueRef.current.slice(1);
      advance();
    },
    [advance],
  );

  const handleSkip = useCallback(() => {
    queueRef.current = queueRef.current.slice(1);
    advance();
  }, [advance]);

  return {
    state,
    /** Klucz wymuszający remount pickera między zdjęciami (świeże wyszukiwanie). */
    pickerKey: `inline-img-${state.index}`,
    pickImagesFor,
    handleSelect,
    handleSkip,
  };
}
