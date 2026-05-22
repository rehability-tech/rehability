import { CheckCircle } from "@phosphor-icons/react/dist/ssr";
import Image from "next/image";
import BlogFaqBlock from "./BlogFaqBlock";

const PHOSPHOR_ICONS: Record<string, string> = {
  Heartbeat:
    "M12 21.593c-5.63-5.539-11-10.297-11-14.402C1 4.151 2.798 2 5 2c1.322 0 2.952.85 4 2.25C10.048 2.85 11.678 2 13 2c2.202 0 4 2.151 4 5.191 0 4.105-5.37 8.863-11 14.402z",
  Leaf: "M6 21c0-13.5 9-18 9-18",
  Sun: "M12 17a5 5 0 100-10 5 5 0 000 10z",
  Person: "M12 12a5 5 0 100-10 5 5 0 000 10zm-7 9a7 7 0 0114 0",
  Sparkle: "M12 2l2.4 7.4H22l-6.4 4.6 2.4 7.4L12 17l-6 4.4 2.4-7.4L2 9.4h7.6z",
  Mountains: "M2 20l7-14 4 8 3-6 6 12H2z",
  Tree: "M12 2l4 8H8l4-8zM8 10l-4 10h16L16 10",
  Bed: "M3 7v13M21 7v13M3 14h18M7 7a2 2 0 114 0M13 7a2 2 0 114 0",
  Campfire: "M12 2c0 6-6 8-6 14a6 6 0 0012 0c0-6-6-8-6-14z",
};

function BlockIcon({ name }: { name: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      className="w-6 h-6"
      aria-hidden="true"
    >
      <path
        d={PHOSPHOR_ICONS[name] || PHOSPHOR_ICONS["Sparkle"]}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

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
    case "heading":
      return (
        <h2
          key={key}
          className="font-jakarta font-bold text-[#0B3B4C] text-[22px] sm:text-[26px] leading-snug mt-10 mb-4 first:mt-0"
          dangerouslySetInnerHTML={{ __html: (c.text as string) || "" }}
        />
      );

    case "paragraph":
      return (
        <div
          key={key}
          className="font-montserrat text-gray-600 text-[15px] leading-[1.85] mb-5 [&_span]:text-inherit"
          dangerouslySetInnerHTML={{ __html: (c.text as string) || "" }}
        />
      );

    case "highlight":
      return (
        <blockquote
          key={key}
          className="border-l-4 border-brand-primary pl-5 py-2 my-6 bg-brand-primary/[0.03] rounded-r-xl"
        >
          <div
            className="font-jakarta font-semibold text-[#0B3B4C] text-[17px] leading-relaxed"
            dangerouslySetInnerHTML={{ __html: (c.text as string) || "" }}
          />
        </blockquote>
      );

    case "spacer":
      return <div key={key} className="h-10" aria-hidden="true" />;

    case "bulletList": {
      const items = (c.items as Array<{ id?: string; text?: string }>) || [];
      return (
        <ul key={key} className="flex flex-col gap-3 my-5">
          {items.map((item, i) => (
            <li key={item.id || i} className="flex items-start gap-3">
              <CheckCircle
                size={20}
                weight="fill"
                className="text-brand-primary shrink-0 mt-0.5"
              />
              <div
                className="font-montserrat text-gray-600 text-[15px] leading-[1.7] flex-1 [&_p]:m-0"
                dangerouslySetInnerHTML={{ __html: item.text || "" }}
              />
            </li>
          ))}
        </ul>
      );
    }

    case "featuresGrid": {
      const items =
        (c.items as Array<{ id?: string; icon?: string; text?: string }>) || [];
      return (
        <div
          key={key}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 my-6"
        >
          {items.map((item, i) => (
            <div
              key={item.id || i}
              className="bg-brand-primary/5 rounded-2xl p-5 flex flex-col gap-3"
            >
              <div className="w-10 h-10 rounded-xl bg-brand-primary/10 flex items-center justify-center text-brand-primary">
                <BlockIcon name={item.icon || "Sparkle"} />
              </div>
              <div
                className="font-montserrat text-[14px] text-[#0B3B4C] leading-snug font-medium"
                dangerouslySetInnerHTML={{ __html: item.text || "" }}
              />
            </div>
          ))}
        </div>
      );
    }

    case "faq":
      return (
        <BlogFaqBlock
          key={key}
          items={
            (c.items as Array<{ id: string; question: string; answer: string }>) ||
            []
          }
        />
      );

    case "inlineImage": {
      const url = (c.url as string) || "";
      const alt = (c.alt as string) || "";
      if (!url) return null;
      return (
        <figure key={key} className="my-8">
          <div className="relative w-full rounded-2xl overflow-hidden bg-gray-100">
            <Image
              src={url}
              alt={alt}
              width={1600}
              height={900}
              sizes="(max-width: 768px) 100vw, 768px"
              className="w-full h-auto object-cover max-h-[500px]"
              loading="lazy"
            />
          </div>
          {alt && (
            <figcaption className="text-center font-montserrat text-[12px] text-gray-400 mt-2">
              {alt}
            </figcaption>
          )}
        </figure>
      );
    }

    case "videoEmbed": {
      const videoId = getYouTubeId((c.url as string) || "");
      if (!videoId) return null;
      return (
        <div
          key={key}
          className="my-8 aspect-video w-full rounded-2xl overflow-hidden bg-gray-100"
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
  return <div>{blocks.map((b, i) => renderBlock(b, i))}</div>;
}
