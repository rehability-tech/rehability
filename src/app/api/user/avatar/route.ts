import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";
import { validateImageUpload } from "@/lib/uploads/validateImageUpload";

// POST /api/user/avatar?filename=foto.jpg  (body = plik)
// Wgrywa avatar do Vercel Blob i zapisuje URL w User.image.
export async function POST(request: Request): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const filename = searchParams.get("filename");
    if (!filename) {
      return NextResponse.json({ error: "Brak nazwy pliku" }, { status: 400 });
    }

    // Avatary mniejsze niż hero — limit 5 MB.
    const check = validateImageUpload(request, filename, 5 * 1024 * 1024);
    if (!check.ok) return check.response;

    const extension = filename.includes(".")
      ? `.${filename.split(".").pop()}`
      : "";
    const blob = await put(`avatar-${session.user.id}${extension}`, request.body as any, {
      access: "public",
      addRandomSuffix: true,
    });

    await prisma.user.update({
      where: { id: session.user.id },
      data: { image: blob.url },
    });

    return NextResponse.json({ success: true, url: blob.url });
  } catch (error) {
    console.error("Błąd uploadu avatara:", error);
    return NextResponse.json(
      { error: "Nie udało się przesłać zdjęcia" },
      { status: 500 },
    );
  }
}
