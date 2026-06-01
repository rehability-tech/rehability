import { put, del } from "@vercel/blob";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const { isAuthorized, response } = await requireAdmin();
    if (!isAuthorized) return response as NextResponse;

    const { searchParams } = new URL(request.url);
    const filename = searchParams.get("filename");
    if (!filename) {
      return NextResponse.json({ error: "Brak nazwy pliku" }, { status: 400 });
    }

    const extension = filename.includes(".")
      ? `.${filename.split(".").pop()}`
      : "";
    const base = filename.replace(/\.[^/.]+$/, "");
    const seoFilename = `usluga-${slugify(base) || "image"}${extension}`;

    const blob = await put(seoFilename, request.body as any, {
      access: "public",
      addRandomSuffix: true,
    });

    return NextResponse.json({ success: true, url: blob.url });
  } catch (error) {
    console.error("Błąd uploadu zdjęcia usługi:", error);
    return NextResponse.json(
      { error: "Błąd przesyłania pliku" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request): Promise<NextResponse> {
  try {
    const { isAuthorized, response } = await requireAdmin();
    if (!isAuthorized) return response as NextResponse;

    const { searchParams } = new URL(request.url);
    const url = searchParams.get("url");
    if (url) {
      await del(url);
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Błąd usuwania zdjęcia usługi:", error);
    return NextResponse.json(
      { error: "Błąd usuwania pliku" },
      { status: 500 },
    );
  }
}
