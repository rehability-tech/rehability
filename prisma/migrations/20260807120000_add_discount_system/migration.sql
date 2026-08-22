-- System rabatowy (per wydarzenie): kody, przeceny, rabaty mailowe,
-- piaskownica oraz snapshot rabatu na rezerwacji.
-- Wszystkie kolumny są nullable albo mają DEFAULT — brak downtime.

-- AlterTable
-- Piaskownica wydarzenia. Kolumna "sandbox" istnieje już w bazie (dryf po
-- wcześniejszym podejściu do tematu) — adoptujemy ją zamiast dokładać drugą
-- flagę o tym samym znaczeniu. Dokładamy tylko znacznik czasu i cennik testowy.
ALTER TABLE "Trip" ADD COLUMN IF NOT EXISTS "sandbox" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "sandboxEnabledAt" TIMESTAMP(3),
ADD COLUMN     "sandboxPrice" DECIMAL(65,30),
ADD COLUMN     "sandboxDeposit" DECIMAL(65,30);

-- AlterTable
-- Dostęp do piaskownicy per konto. Administrator ma go zawsze z racji roli;
-- ta flaga służy nadaniu dostępu komuś, kto adminem nie jest.
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "sandboxAccess" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "sandboxGrantedAt" TIMESTAMP(3);

-- AlterTable
-- Kolumna istnieje w bazie i czeka na analogiczny tryb testowy po stronie VOD.
ALTER TABLE "Course" ADD COLUMN IF NOT EXISTS "sandbox" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
-- Zadatek po rabacie (grosze) + snapshot udzielonych rabatów.
-- Snapshot trzyma WARTOŚCI, nie referencje — bez kluczy obcych, żeby
-- skasowanie promocji nie psuło historii zamówień.
ALTER TABLE "Booking" ADD COLUMN     "amountDeposit" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "originalAmount" INTEGER,
ADD COLUMN     "totalDiscountAmount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "discountCodeId" TEXT,
ADD COLUMN     "discountCode" TEXT,
ADD COLUMN     "discountCodeAmount" INTEGER,
ADD COLUMN     "saleId" TEXT,
ADD COLUMN     "saleName" TEXT,
ADD COLUMN     "saleAmount" INTEGER,
ADD COLUMN     "emailDiscountId" TEXT,
ADD COLUMN     "emailDiscountName" TEXT,
ADD COLUMN     "emailDiscountAmount" INTEGER,
ADD COLUMN     "isSandbox" BOOLEAN NOT NULL DEFAULT false;

-- Backfill: istniejące rezerwacje dostają zadatek z cennika wydarzenia,
-- żeby resume-payment nie wpadało w fallback dla starych rekordów.
UPDATE "Booking" b
SET "amountDeposit" = ROUND(t."deposit" * 100)
FROM "Trip" t
WHERE b."tripId" = t."id" AND b."amountDeposit" = 0;

-- CreateTable
CREATE TABLE "DiscountCode" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "tripId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "note" TEXT,
    "valueType" TEXT NOT NULL DEFAULT 'percent',
    "percent" INTEGER,
    "amountGrosze" INTEGER,
    "stackableWithSale" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "validFrom" TIMESTAMP(3),
    "validUntil" TIMESTAMP(3),
    "usageLimit" INTEGER,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "exhaustedNotifiedAt" TIMESTAMP(3),
    "isSandbox" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "DiscountCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sale" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "tripId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "note" TEXT,
    "valueType" TEXT NOT NULL DEFAULT 'percent',
    "percent" INTEGER,
    "targetPriceGrosze" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "validFrom" TIMESTAMP(3),
    "validUntil" TIMESTAMP(3),
    "usageLimit" INTEGER,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "exhaustedNotifiedAt" TIMESTAMP(3),
    "isSandbox" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Sale_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailDiscount" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "tripId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "note" TEXT,
    "valueType" TEXT NOT NULL DEFAULT 'percent',
    "percent" INTEGER,
    "amountGrosze" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "validFrom" TIMESTAMP(3),
    "validUntil" TIMESTAMP(3),
    "usageLimit" INTEGER,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "exhaustedNotifiedAt" TIMESTAMP(3),
    "isSandbox" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "EmailDiscount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailDiscountMember" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "emailDiscountId" TEXT NOT NULL,
    "email" TEXT NOT NULL,

    CONSTRAINT "EmailDiscountMember_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Booking_discountCodeId_idx" ON "Booking"("discountCodeId");

-- CreateIndex
CREATE INDEX "Booking_saleId_idx" ON "Booking"("saleId");

-- CreateIndex
CREATE INDEX "Booking_emailDiscountId_idx" ON "Booking"("emailDiscountId");

-- CreateIndex
CREATE INDEX "DiscountCode_tripId_isActive_idx" ON "DiscountCode"("tripId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "DiscountCode_tripId_code_key" ON "DiscountCode"("tripId", "code");

-- CreateIndex
CREATE INDEX "Sale_tripId_isActive_idx" ON "Sale"("tripId", "isActive");

-- CreateIndex
CREATE INDEX "EmailDiscount_tripId_isActive_idx" ON "EmailDiscount"("tripId", "isActive");

-- CreateIndex
CREATE INDEX "EmailDiscountMember_email_idx" ON "EmailDiscountMember"("email");

-- CreateIndex
CREATE UNIQUE INDEX "EmailDiscountMember_emailDiscountId_email_key" ON "EmailDiscountMember"("emailDiscountId", "email");

-- AddForeignKey
ALTER TABLE "DiscountCode" ADD CONSTRAINT "DiscountCode_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailDiscount" ADD CONSTRAINT "EmailDiscount_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailDiscountMember" ADD CONSTRAINT "EmailDiscountMember_emailDiscountId_fkey" FOREIGN KEY ("emailDiscountId") REFERENCES "EmailDiscount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
