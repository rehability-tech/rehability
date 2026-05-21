import { cache } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import CampPageClient from "./_components/CampPageClient";
import { BlockNoteBlock } from "./_components/SingleCampBlockNoteRenderer";

type Props = {
  params: Promise<{ slug: string }>;
};

const getCamp = cache(async (id: string) => {
  return prisma.camp.findUnique({
    where: { id, status: "PUBLISHED" },
    select: {
      id: true,
      title: true,
      subtitle: true,
      tags: true,
      heroImage: true,
      blocks: true,
    },
  });
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const camp = await getCamp(slug);

  if (!camp) return { title: "Wyjazd | Rehability" };

  return {
    title: `${camp.title} | Rehability`,
    description:
      camp.subtitle ?? "Ekskluzywny wyjazd holistyczny Rehability.",
    openGraph: {
      title: `${camp.title} | Rehability`,
      description:
        camp.subtitle ?? "Ekskluzywny wyjazd holistyczny Rehability.",
      images: camp.heroImage ? [{ url: camp.heroImage }] : [],
    },
  };
}

export default async function SingleCampPage({ params }: Props) {
  const { slug } = await params;
  const camp = await getCamp(slug);

  if (!camp) notFound();

  const blocks = Array.isArray(camp.blocks)
    ? (camp.blocks as unknown as BlockNoteBlock[])
    : [];

  return (
    <CampPageClient
      title={camp.title}
      subtitle={camp.subtitle ?? "Zanurz się w holistycznym świecie odpoczynku"}
      tags={camp.tags}
      heroImage={camp.heroImage ?? "/images/static/camp.png"}
      blocks={blocks}
    />
  );
}
