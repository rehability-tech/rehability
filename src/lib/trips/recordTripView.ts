import "server-only";
import crypto from "node:crypto";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function recordTripView(tripId: string) {
  try {
    const h = await headers();
    const ip =
      h.get("x-forwarded-for")?.split(",")[0].trim() ??
      h.get("x-real-ip") ??
      "unknown";
    const ua = h.get("user-agent") ?? "unknown";
    const secret = process.env.PAGEVIEW_SECRET ?? "rotate-me";
    const visitorHash = crypto
      .createHash("sha256")
      .update(`${ip}|${ua}|${secret}`)
      .digest("hex");

    const day = new Date();
    day.setUTCHours(0, 0, 0, 0);

    await prisma.$transaction([
      prisma.tripView.create({
        data: { tripId, visitorHash, day },
      }),
      prisma.trip.update({
        where: { id: tripId },
        data: { views: { increment: 1 } },
      }),
    ]);
  } catch (err: any) {
    // P2002 = unique (tripId, visitorHash, day) — ten visitor już dziś nabił, pomijamy.
    if (err?.code !== "P2002") {
      console.error("recordTripView failed:", err);
    }
  }
}
