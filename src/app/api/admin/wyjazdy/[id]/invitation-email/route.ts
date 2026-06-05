import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { tripInvitationEmailSchema } from "@/lib/zod/tripsValidators";
import { z } from "zod";

const paramsSchema = z.object({ id: z.string().min(1, "Brak ID Wyjazdu") });

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { isAuthorized, response } = await requireAdmin();
    if (!isAuthorized) return response as NextResponse;

    const validatedParams = paramsSchema.safeParse(await params);
    if (!validatedParams.success) {
      return NextResponse.json(
        { error: validatedParams.error.issues[0].message },
        { status: 400 },
      );
    }
    const { id } = validatedParams.data;

    const body = await req.json();
    const validatedBody = tripInvitationEmailSchema.safeParse(body);
    if (!validatedBody.success) {
      return NextResponse.json(
        { error: validatedBody.error.issues[0].message },
        { status: 400 },
      );
    }

    const {
      invitationEmailTitle,
      invitationEmailSubject,
      invitationEmailBody,
      invitationEmailButtonText,
      invitationEmailHeroImage,
      invitationEmailHighlights,
      invitationEmailGallery,
    } = validatedBody.data;

    const updatedTrip = await prisma.trip.update({
      where: { id },
      data: {
        invitationEmailTitle,
        invitationEmailSubject,
        invitationEmailBody,
        invitationEmailButtonText,
        invitationEmailHeroImage,
        invitationEmailHighlights: invitationEmailHighlights ?? undefined,
        invitationEmailGallery: invitationEmailGallery ?? [],
        lastStage: "zaproszenia",
      },
    });

    return NextResponse.json(updatedTrip);
  } catch (error) {
    console.error("Błąd PATCH invitation-email:", error);
    return NextResponse.json(
      { error: "Wystąpił błąd podczas zapisu szablonu e-maila" },
      { status: 500 },
    );
  }
}
