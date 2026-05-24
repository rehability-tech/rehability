-- CreateTable
CREATE TABLE "CampView" (
    "id" TEXT NOT NULL,
    "campId" TEXT NOT NULL,
    "visitorHash" TEXT NOT NULL,
    "day" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CampView_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CampView_campId_day_idx" ON "CampView"("campId", "day");

-- CreateIndex
CREATE UNIQUE INDEX "CampView_campId_visitorHash_day_key" ON "CampView"("campId", "visitorHash", "day");

-- AddForeignKey
ALTER TABLE "CampView" ADD CONSTRAINT "CampView_campId_fkey" FOREIGN KEY ("campId") REFERENCES "Camp"("id") ON DELETE CASCADE ON UPDATE CASCADE;
