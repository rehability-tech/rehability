import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { prisma } from "@/lib/prisma";
import { copyDiscountSchema } from "@/lib/zod/discountValidators";
import { loadTripForDiscounts, validationError } from "@/lib/discounts/adminWrite";

export const dynamic = "force-dynamic";

/**
 * POST — kopiowanie promocji do innych wydarzeń.
 *
 * Promocje są per-wydarzenie, więc „ten sam kod na kolejny turnus" oznacza
 * NOWY rekord w każdym z nich. Kopie startują z wyzerowanym licznikiem użyć
 * (`usedCount = 0`) i bez znacznika powiadomienia — każde wydarzenie ma
 * własną pulę.
 *
 * Lista adresów rabatu mailowego jest kopiowana razem z nim.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin();
  if (!auth.isAuthorized) return auth.response;

  const { id: tripId } = await params;

  const source = await loadTripForDiscounts(tripId);
  if (!source.ok) return source.response;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Nieprawidłowe dane." }, { status: 400 });
  }

  const parsed = copyDiscountSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error.issues);

  const { kind, id, targetTripIds } = parsed.data;

  // Kopiujemy tylko do istniejących wydarzeń i nigdy do samego siebie.
  const targets = await prisma.trip.findMany({
    where: { id: { in: targetTripIds.filter((t) => t !== tripId) } },
    select: { id: true, discountSandbox: true },
  });

  if (targets.length === 0) {
    return NextResponse.json(
      { error: "Nie wskazano żadnego innego wydarzenia." },
      { status: 400 },
    );
  }

  try {
    let copied = 0;
    let skipped = 0;

    if (kind === "CODE") {
      const src = await prisma.discountCode.findFirst({ where: { id, tripId } });
      if (!src) {
        return NextResponse.json({ error: "Kod nie istnieje." }, { status: 404 });
      }

      for (const target of targets) {
        // Kod jest unikalny w obrębie wydarzenia — kolizję pomijamy,
        // zamiast wywracać całą operację.
        const clash = await prisma.discountCode.findFirst({
          where: { tripId: target.id, code: src.code },
          select: { id: true },
        });
        if (clash) {
          skipped += 1;
          continue;
        }

        await prisma.discountCode.create({
          data: {
            tripId: target.id,
            code: src.code,
            note: src.note,
            valueType: src.valueType,
            percent: src.percent,
            amountGrosze: src.amountGrosze,
            stackableWithSale: src.stackableWithSale,
            isActive: src.isActive,
            validFrom: src.validFrom,
            validUntil: src.validUntil,
            usageLimit: src.usageLimit,
            isSandbox: target.discountSandbox,
          },
        });
        copied += 1;
      }
    } else if (kind === "SALE") {
      const src = await prisma.sale.findFirst({ where: { id, tripId } });
      if (!src) {
        return NextResponse.json({ error: "Przecena nie istnieje." }, { status: 404 });
      }

      await prisma.sale.createMany({
        data: targets.map((target) => ({
          tripId: target.id,
          name: src.name,
          note: src.note,
          valueType: src.valueType,
          percent: src.percent,
          targetPriceGrosze: src.targetPriceGrosze,
          isActive: src.isActive,
          validFrom: src.validFrom,
          validUntil: src.validUntil,
          usageLimit: src.usageLimit,
          isSandbox: target.discountSandbox,
        })),
      });
      copied = targets.length;
    } else {
      const src = await prisma.emailDiscount.findFirst({
        where: { id, tripId },
        include: { members: { select: { email: true } } },
      });
      if (!src) {
        return NextResponse.json({ error: "Rabat nie istnieje." }, { status: 404 });
      }

      for (const target of targets) {
        await prisma.emailDiscount.create({
          data: {
            tripId: target.id,
            name: src.name,
            note: src.note,
            valueType: src.valueType,
            percent: src.percent,
            amountGrosze: src.amountGrosze,
            isActive: src.isActive,
            validFrom: src.validFrom,
            validUntil: src.validUntil,
            usageLimit: src.usageLimit,
            isSandbox: target.discountSandbox,
            members: {
              create: src.members.map((member) => ({ email: member.email })),
            },
          },
        });
        copied += 1;
      }
    }

    return NextResponse.json({ success: true, copied, skipped });
  } catch (error) {
    console.error("[admin/rabaty/kopiuj] POST error:", error);
    return NextResponse.json(
      { error: "Nie udało się skopiować promocji." },
      { status: 500 },
    );
  }
}
