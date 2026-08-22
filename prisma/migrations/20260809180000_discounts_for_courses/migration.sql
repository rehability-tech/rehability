-- Rozszerzenie systemu rabatowego na KURSY.
--
-- Promocja należy do DOKŁADNIE JEDNEGO produktu: wydarzenia albo kursu.
-- Prisma nie potrafi wyrazić „dokładnie jedno z dwóch", więc `tripId` staje
-- się opcjonalne, dochodzi opcjonalne `courseId`, a niezmiennik pilnujemy
-- w warstwie zapisu (`resolveDiscountOwner`).
--
-- Zmiana jest w pełni addytywna: żadna kolumna nie znika, jedyna modyfikacja
-- istniejącej to rozluźnienie NOT NULL na `tripId`.

-- AlterTable — właściciel promocji
ALTER TABLE "DiscountCode" ADD COLUMN     "courseId" TEXT,
ALTER COLUMN "tripId" DROP NOT NULL;

ALTER TABLE "Sale" ADD COLUMN     "courseId" TEXT,
ALTER COLUMN "tripId" DROP NOT NULL;

ALTER TABLE "EmailDiscount" ADD COLUMN     "courseId" TEXT,
ALTER COLUMN "tripId" DROP NOT NULL;

-- AlterTable
-- Snapshot rabatów na zakupie kursu — lustro pól z Booking. Bez kluczy
-- obcych, żeby skasowanie promocji nie naruszyło historii zakupów.
ALTER TABLE "CoursePurchase" ADD COLUMN     "originalAmount" INTEGER,
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

-- CreateIndex
CREATE INDEX "CoursePurchase_discountCodeId_idx" ON "CoursePurchase"("discountCodeId");
CREATE INDEX "CoursePurchase_saleId_idx" ON "CoursePurchase"("saleId");
CREATE INDEX "CoursePurchase_emailDiscountId_idx" ON "CoursePurchase"("emailDiscountId");

-- CreateIndex
CREATE INDEX "DiscountCode_courseId_isActive_idx" ON "DiscountCode"("courseId", "isActive");
CREATE INDEX "Sale_courseId_isActive_idx" ON "Sale"("courseId", "isActive");
CREATE INDEX "EmailDiscount_courseId_isActive_idx" ON "EmailDiscount"("courseId", "isActive");

-- CreateIndex
-- W Postgresie NULL-e w indeksie unikalnym są traktowane jako różne, więc
-- @@unique([tripId, code]) nie blokuje kodów kursowych (tripId = NULL).
CREATE UNIQUE INDEX "DiscountCode_courseId_code_key" ON "DiscountCode"("courseId", "code");

-- AddForeignKey
ALTER TABLE "DiscountCode" ADD CONSTRAINT "DiscountCode_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EmailDiscount" ADD CONSTRAINT "EmailDiscount_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;
