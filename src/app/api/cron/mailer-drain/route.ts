import { prisma } from "@/lib/prisma";
import { runCron } from "@/lib/cron/runCron";
import { getMailer } from "@/lib/mailer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Drainer kolejki mailingowej: dla każdej kampanii w statusie SENDING wysyła
 * jedną paczkę oczekujących odbiorców. Wołany cyklicznie (np. co 1–2 min) domyka
 * duże wysyłki bez bicia w limit czasu pojedynczej funkcji serverless.
 */
async function handler() {
  const mailer = getMailer();
  const sending = await prisma.campaign.findMany({
    where: { status: "SENDING" },
    select: { id: true },
  });

  const results: Array<{
    id: string;
    sent: number;
    failed: number;
    remaining: number;
    done: boolean;
  }> = [];

  for (const c of sending) {
    const r = await mailer.drain(c.id);
    results.push({ id: c.id, ...r });
  }

  return {
    campaigns: sending.length,
    results,
  };
}

export async function POST(req: Request) {
  return runCron(req, "mailer-drain", handler);
}

export async function GET(req: Request) {
  return runCron(req, "mailer-drain", handler);
}
