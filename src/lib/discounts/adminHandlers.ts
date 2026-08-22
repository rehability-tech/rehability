import { NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma";

import { prisma } from "@/lib/prisma";
import {
  discountCodeSchema,
  emailDiscountSchema,
  emailMembersSchema,
  saleSchema,
} from "@/lib/zod/discountValidators";

import {
  blockDeleteIfUsed,
  parseDiscountPatch,
  resetExhaustionMarker,
  validationError,
  withSandboxFlag,
} from "./adminWrite";
import { ownerData, ownerFilter, type DiscountOwner } from "./owner";

/**
 * ─────────────────────────────────────────────────────────────────────────
 *  GENERYCZNE HANDLERY CRUD PROMOCJI
 * ─────────────────────────────────────────────────────────────────────────
 *
 * Wydarzenia i kursy mają identyczny cykl życia promocji, więc trasy API dla
 * obu produktów są cienkimi opakowaniami na te funkcje. Gdyby każdy produkt
 * miał własną kopię, pierwsza poprawka reguły (np. limitu użyć) wylądowałaby
 * tylko w jednym miejscu.
 */

export type PromoModel = "discountCode" | "sale" | "emailDiscount";

const SCHEMAS = {
  discountCode: discountCodeSchema,
  sale: saleSchema,
  emailDiscount: emailDiscountSchema,
} as const;

/**
 * Trzy schematy mają różne kształty wyjścia (kod ma `code`
 * i `stackableWithSale`, przecena `targetPriceGrosze`…), więc TypeScript nie
 * potrafi zunifikować ich w jednym generyku. Tutaj i tak przekazujemy wynik
 * prosto do Prismy jako `data`, a poprawność pól pilnuje sam Zod — dlatego
 * na czas dyspozytorni sprowadzamy je do wspólnego, luźnego kształtu.
 */
type LoosePromoSchema = {
  safeParse: (
    input: unknown,
  ) =>
    | { success: true; data: Record<string, unknown> }
    | { success: false; error: { issues: { message: string }[] } };
};

const schemaFor = (model: PromoModel) =>
  SCHEMAS[model] as unknown as LoosePromoSchema;

const NOT_FOUND: Record<PromoModel, string> = {
  discountCode: "Kod nie istnieje.",
  sale: "Przecena nie istnieje.",
  emailDiscount: "Rabat nie istnieje.",
};

/** Delegat Prismy — trzy modele mają identyczny zestaw pól cyklu życia. */
type Delegate = {
  create: (args: unknown) => Promise<unknown>;
  update: (args: unknown) => Promise<unknown>;
  delete: (args: unknown) => Promise<unknown>;
  findFirst: (args: unknown) => Promise<{ id: string; usedCount: number } | null>;
};

const delegateFor = (model: PromoModel) =>
  prisma[model] as unknown as Delegate;

async function readJson(req: Request): Promise<unknown | null> {
  try {
    return await req.json();
  } catch {
    return null;
  }
}

/** Kolizja kodu w obrębie produktu (@@unique [tripId|courseId, code]). */
function duplicateCodeResponse(error: unknown): NextResponse | null {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    return NextResponse.json(
      { error: "Taki kod już istnieje w tym produkcie." },
      { status: 409 },
    );
  }
  return null;
}

export async function createPromo(
  req: Request,
  owner: DiscountOwner,
  sandbox: boolean,
  model: PromoModel,
): Promise<NextResponse> {
  const body = await readJson(req);
  if (body === null) {
    return NextResponse.json({ error: "Nieprawidłowe dane." }, { status: 400 });
  }

  const parsed = schemaFor(model).safeParse(body);
  if (!parsed.success) return validationError(parsed.error.issues);

  try {
    const created = await delegateFor(model).create({
      // `ownerData` ustawia drugie pole właściciela jawnie na null, żeby nie
      // został „ogon" po poprzednim produkcie przy kopiowaniu.
      data: withSandboxFlag({ ...parsed.data, ...ownerData(owner) }, sandbox),
    });

    return NextResponse.json({ success: true, promo: created });
  } catch (error) {
    const duplicate = duplicateCodeResponse(error);
    if (duplicate) return duplicate;

    console.error(`[rabaty] create ${model}:`, error);
    return NextResponse.json(
      { error: "Nie udało się zapisać promocji." },
      { status: 500 },
    );
  }
}

export async function patchPromo(
  req: Request,
  owner: DiscountOwner,
  sandbox: boolean,
  model: PromoModel,
  promoId: string,
): Promise<NextResponse> {
  const existing = await delegateFor(model).findFirst({
    where: { id: promoId, ...ownerFilter(owner) },
    select: { id: true, usedCount: true },
  });
  if (!existing) {
    return NextResponse.json({ error: NOT_FOUND[model] }, { status: 404 });
  }

  const body = await readJson(req);
  if (body === null) {
    return NextResponse.json({ error: "Nieprawidłowe dane." }, { status: 400 });
  }

  const { data, response } = parseDiscountPatch(body, schemaFor(model));
  if (!data) return response;

  try {
    const updated = await delegateFor(model).update({
      where: { id: promoId },
      // Zapis w piaskownicy oznacza rekord jako testowy — także wtedy, gdy
      // zmieniamy wyłącznie `isActive`.
      data: withSandboxFlag(
        {
          ...data,
          ...("usageLimit" in data
            ? resetExhaustionMarker(
                data.usageLimit as number | null | undefined,
                existing.usedCount,
              )
            : {}),
        },
        sandbox,
      ),
    });

    return NextResponse.json({ success: true, promo: updated });
  } catch (error) {
    const duplicate = duplicateCodeResponse(error);
    if (duplicate) return duplicate;

    console.error(`[rabaty] patch ${model}:`, error);
    return NextResponse.json(
      { error: "Nie udało się zapisać zmian." },
      { status: 500 },
    );
  }
}

/** Prosta walidacja adresu — wystarczająca dla listy wklejanej przez admina. */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * POST — masowe dodanie adresów do rabatu mailowego.
 *
 * Admin wkleja listę w dowolnym formacie (z Excela, z maila, z CRM-a), więc
 * rozbijamy po nowych liniach, przecinkach, średnikach i spacjach. Adresy
 * normalizujemy do lowercase — tak samo, jak porównujemy je potem
 * z `session.user.email`.
 */
export async function addMembers(
  req: Request,
  owner: DiscountOwner,
  edId: string,
): Promise<NextResponse> {
  const discount = await prisma.emailDiscount.findFirst({
    where: { id: edId, ...ownerFilter(owner) },
    select: { id: true },
  });
  if (!discount) {
    return NextResponse.json({ error: NOT_FOUND.emailDiscount }, { status: 404 });
  }

  const body = await readJson(req);
  if (body === null) {
    return NextResponse.json({ error: "Nieprawidłowe dane." }, { status: 400 });
  }

  const parsed = emailMembersSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error.issues);

  const tokens = parsed.data.raw
    .split(/[\s,;]+/)
    .map((token) => token.trim().toLowerCase())
    .filter(Boolean);

  const invalid: string[] = [];
  const valid = new Set<string>();

  for (const token of tokens) {
    if (EMAIL_PATTERN.test(token)) valid.add(token);
    else invalid.push(token);
  }

  if (valid.size === 0) {
    return NextResponse.json(
      { error: "Nie znaleziono żadnego poprawnego adresu e-mail." },
      { status: 400 },
    );
  }

  // `skipDuplicates` opiera się na @@unique([emailDiscountId, email]) —
  // ponowne wklejenie tej samej listy jest bezpieczne.
  const result = await prisma.emailDiscountMember.createMany({
    data: [...valid].map((email) => ({ emailDiscountId: edId, email })),
    skipDuplicates: true,
  });

  return NextResponse.json({
    success: true,
    added: result.count,
    duplicates: valid.size - result.count,
    invalid,
  });
}

/** DELETE ?email=... — usunięcie jednego adresu z listy. */
export async function removeMember(
  req: Request,
  owner: DiscountOwner,
  edId: string,
): Promise<NextResponse> {
  const email = new URL(req.url).searchParams.get("email")?.trim().toLowerCase();
  if (!email) {
    return NextResponse.json({ error: "Brak adresu e-mail." }, { status: 400 });
  }

  const discount = await prisma.emailDiscount.findFirst({
    where: { id: edId, ...ownerFilter(owner) },
    select: { id: true },
  });
  if (!discount) {
    return NextResponse.json({ error: NOT_FOUND.emailDiscount }, { status: 404 });
  }

  await prisma.emailDiscountMember.deleteMany({
    where: { emailDiscountId: edId, email },
  });

  return NextResponse.json({ success: true });
}

export async function deletePromo(
  owner: DiscountOwner,
  model: PromoModel,
  promoId: string,
): Promise<NextResponse> {
  const existing = await delegateFor(model).findFirst({
    where: { id: promoId, ...ownerFilter(owner) },
    select: { id: true, usedCount: true },
  });
  if (!existing) {
    return NextResponse.json({ error: NOT_FOUND[model] }, { status: 404 });
  }

  const blocked = blockDeleteIfUsed(existing.usedCount);
  if (blocked) return blocked;

  await delegateFor(model).delete({ where: { id: promoId } });

  return NextResponse.json({ success: true });
}
