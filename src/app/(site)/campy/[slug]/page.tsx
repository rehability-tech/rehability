import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import CampPageClient from "./_components/CampPageClient";
import type { BlockNoteBlock } from "./_components/SingleCampBlocksNoteRenderer";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function SingleCampPage({ params }: Props) {
  const { slug } = await params;

  const camp = await prisma.camp.findUnique({
    where: { id: slug },
  });

  if (!camp) notFound();

  // Prisma trzyma `blocks` jako Json — normalizujemy do tablicy bloków
  // BlockNote, której oczekuje renderer po stronie klienta.
  const blocks: BlockNoteBlock[] = Array.isArray(camp.blocks)
    ? (camp.blocks as unknown as BlockNoteBlock[])
    : [];

  return (
    <CampPageClient
      campId={camp.id}
      title={camp.title}
      subtitle={camp.subtitle || "Zanurz się w holistycznym świecie odpoczynku"}
      tags={camp.tags?.length ? camp.tags : []}
      heroImage={camp.heroImage || "/images/static/camp.png"}
      blocks={blocks}
    />
  );
}
