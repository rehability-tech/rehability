import Image from "next/image";
import {
  CheckCircle,
  Bed,
  ForkKnife,
  Sparkle,
  Person,
  Leaf,
  Gift,
  Heartbeat,
  Brain,
  Drop,
  Mountains,
  Sun,
  HandHeart,
  Campfire,
  Tree,
  Barbell,
} from "@phosphor-icons/react/dist/ssr";
import { FAQ } from "@/components/ui/FAQ";
import { isUsableImageUrl } from "@/lib/utils";

// Bloki na publicznej stronie wpisu renderujemy WIZUALNIE IDENTYCZNIE jak w
// edytorze treści — te same klasy, kolory, typografia i komponenty. Edytorowe
// "chrome" (toolbary, drag-handle, przyciski „dodaj") to tylko afordancje
// edycji i tu nie występuje; sama prezentacja treści jest 1:1.

// Ten sam zestaw ikon co w edytorowym FeaturesGridBlock.
const FEATURE_ICONS: Record<string, React.ElementType> = {
  CheckCircle,
  Bed,
  ForkKnife,
  Sparkle,
  Person,
  Leaf,
  Gift,
  Heartbeat,
  Brain,
  Drop,
  Mountains,
  Sun,
  HandHeart,
  Campfire,
  Tree,
  Barbell,
};

function getYouTubeId(rawUrl: string): string | null {
  return (
    rawUrl.match(
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?\s]+)/,
    )?.[1] ?? null
  );
}

interface Block {
  id?: string;
  type: string;
  content?: Record<string, unknown>;
}

function renderBlock(block: Block, index: number) {
  const { type, content, id } = block;
  const key = id || String(index);
  const c = (content ?? {}) as Record<string, unknown>;

  switch (type) {
    // Edytor: HeadingBlock → RichTextInput "text-2xl md:text-3xl font-jakarta font-bold ..."
    case "heading":
      return (
        <h2
          key={key}
          className="font-jakarta font-bold text-[#0B3B4C] text-2xl md:text-3xl leading-[1.2]"
          dangerouslySetInnerHTML={{ __html: (c.text as string) || "" }}
        />
      );

    // Edytor: ParagraphBlock → RichTextInput "text-gray-600 font-montserrat text-base leading-[1.7]"
    case "paragraph":
      return (
        <div
          key={key}
          className="font-montserrat text-gray-600 text-base leading-[1.7] [&_p]:m-0 [&_p+p]:mt-3"
          dangerouslySetInnerHTML={{ __html: (c.text as string) || "" }}
        />
      );

    // Edytor: HighlightBlock → "border-l-4 border-brand-primary pl-4 py-1" + tekst jakarta medium
    case "highlight":
      return (
        <div
          key={key}
          className="w-full border-l-4 border-brand-primary pl-4 py-1"
        >
          <div
            className="font-jakarta font-medium text-lg text-[#0B3B4C] leading-relaxed [&_p]:m-0"
            dangerouslySetInnerHTML={{ __html: (c.text as string) || "" }}
          />
        </div>
      );

    // Edytor: SpacerBlock to dashed placeholder (afordancja). Na froncie to po
    // prostu pusta przerwa wizualna o zbliżonej wysokości.
    case "spacer":
      return <div key={key} className="h-16" aria-hidden="true" />;

    // Edytor: BulletListBlock → CheckCircle size 24 fill #287D88, gap-4, text-base
    case "bulletList": {
      const items = (c.items as Array<{ id?: string; text?: string }>) || [];
      return (
        <ul key={key} className="w-full flex flex-col gap-3">
          {items.map((item, i) => (
            <li key={item.id || i} className="flex items-start gap-4 w-full">
              <CheckCircle
                size={24}
                weight="fill"
                className="text-[#287D88] shrink-0 mt-1"
              />
              <div
                className="flex-1 font-montserrat text-gray-600 text-base leading-[1.7] [&_p]:m-0 [&_p+p]:mt-2"
                dangerouslySetInnerHTML={{ __html: item.text || "" }}
              />
            </li>
          ))}
        </ul>
      );
    }

    // Edytor: FeaturesGridBlock → morskie karty (#287D88), biały tekst, biała
    // okrągła ikona, grid 1/2/3 kolumny, gap-5.
    case "featuresGrid": {
      const items =
        (c.items as Array<{ id?: string; icon?: string; text?: string }>) || [];
      return (
        <div
          key={key}
          className="flex flex-row flex-wrap gap-5 w-full justify-around gap-y-9"
        >
          {items.map((item, i) => {
            const Icon = FEATURE_ICONS[item.icon || ""] || Sparkle;
            return (
              <div
                key={item.id || i}
                className="flex flex-col items-start gap-4 p-5 w-full bg-[#287D88] rounded-[20px] shadow-sm max-w-[280px]"
              >
                <div className="w-12 h-12 flex items-center justify-center rounded-full bg-white/10 shrink-0">
                  <Icon size={24} weight="duotone" className="text-white" />
                </div>
                <div
                  className="w-full font-montserrat font-medium text-[14px] leading-relaxed text-white [&_span]:!text-white [&_p]:m-0"
                  dangerouslySetInnerHTML={{ __html: item.text || "" }}
                />
              </div>
            );
          })}
        </div>
      );
    }

    // Sekcja FAQ — używa współdzielonego komponentu FAQ.tsx (ten sam wygląd, co
    // numerowany akordeon w edytorze: 01/02…, morski przycisk +/−).
    case "faq": {
      const items =
        (c.items as Array<{
          id?: string;
          question?: string;
          answer?: string;
        }>) || [];
      if (items.length === 0) return null;
      // FAQ.tsx ma własny `container px-4`; -mx-4 niweluje px-4 artykułu, by
      // krawędzie FAQ pokrywały się z resztą treści (a nie były węższe).
      return (
        <div key={key} className="-mx-4">
          <FAQ
            titlePrefix=""
            titleHighlight=""
            items={items.map((it) => ({
              question: it.question || "",
              answer: it.answer || "",
            }))}
          />
        </div>
      );
    }

    // Edytor: BlogInlineImageBlock → zdjęcie w zaokrąglonym boksie z ramką,
    // object-contain max-h-[500px]. Pomijamy puste/placeholderowe url-e.
    case "inlineImage": {
      const url = (c.url as string) || "";
      const alt = (c.alt as string) || "";
      if (!isUsableImageUrl(url)) return null;
      return (
        <figure
          key={key}
          className="relative w-full rounded-2xl overflow-hidden bg-gray-50 border border-gray-100"
        >
          <Image
            src={url}
            alt={alt}
            width={1600}
            height={900}
            sizes="(max-width: 768px) 100vw, 768px"
            className="w-full h-auto object-contain max-h-[500px]"
            loading="lazy"
          />
        </figure>
      );
    }

    // Edytor: BlogTableBlock → caption (jakarta semibold), bordered table,
    // header bg-brand-primary/5, komórki text-sm px-2 py-1.5. Komórki to HTML.
    case "table": {
      const caption = (c.caption as string) || "";
      const headers = (c.headers as string[]) || [];
      const rows = (c.rows as string[][]) || [];
      if (headers.length === 0 && rows.length === 0) return null;
      return (
        <figure key={key} className="w-full flex flex-col gap-3">
          {caption && (
            <figcaption className="font-jakarta font-semibold text-[#0B3B4C] text-sm px-2">
              {caption}
            </figcaption>
          )}
          <div className="w-full overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full border-collapse text-left">
              {headers.length > 0 && (
                <thead>
                  <tr className="bg-brand-primary/5">
                    {headers.map((h, i) => (
                      <th
                        key={i}
                        scope="col"
                        className="font-montserrat font-semibold text-[#0B3B4C] text-sm px-2 py-1.5 border-b border-r border-gray-200 last:border-r-0 align-top [&_span]:text-inherit"
                        dangerouslySetInnerHTML={{ __html: h || "" }}
                      />
                    ))}
                  </tr>
                </thead>
              )}
              <tbody>
                {rows.map((row, ri) => (
                  <tr key={ri}>
                    {(row || []).map((cell, ci) => (
                      <td
                        key={ci}
                        className="font-montserrat text-gray-600 text-sm px-2 py-1.5 border-b border-r border-gray-100 last:border-r-0 align-top [&_span]:text-inherit"
                        dangerouslySetInnerHTML={{ __html: cell || "" }}
                      />
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </figure>
      );
    }

    case "videoEmbed": {
      const videoId = getYouTubeId((c.url as string) || "");
      if (!videoId) return null;
      return (
        <div
          key={key}
          className="aspect-video w-full rounded-2xl overflow-hidden bg-gray-100"
        >
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${videoId}`}
            title={(c.title as string) || "Wideo"}
            loading="lazy"
            allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full"
          />
        </div>
      );
    }

    default:
      return null;
  }
}

export function BlogBlockRenderer({ blocks }: { blocks: Block[] }) {
  if (!Array.isArray(blocks) || blocks.length === 0) {
    return (
      <p className="font-montserrat text-gray-400 text-center py-12">
        Treść artykułu jest niedostępna.
      </p>
    );
  }
  // Ten sam rytm pionowy co w edytorze (BlogBlockBuilder: flex flex-col gap-2).
  return (
    <div className="flex flex-col gap-3">
      {blocks.map((b, i) => renderBlock(b, i))}
    </div>
  );
}
