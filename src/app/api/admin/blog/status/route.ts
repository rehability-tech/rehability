import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { z } from "zod";

const bodySchema = z.object({
  id: z.string().min(1),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
});

export async function PATCH(req: Request) {
  try {
    const { isAuthorized, response } = await requireAdmin();
    if (!isAuthorized) return response as NextResponse;

    const body = await req.json();
    const { id, status } = bodySchema.parse(body);

    const post = await prisma.post.update({
      where: { id },
      data: {
        status,
        publishedAt: status === "PUBLISHED" ? new Date() : undefined,
      },
    });

    return NextResponse.json(post);
  } catch (error: any) {
    console.error("Błąd zmiany statusu:", error);
    if (error?.issues) {
      return NextResponse.json({ error: error.issues[0]?.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}
