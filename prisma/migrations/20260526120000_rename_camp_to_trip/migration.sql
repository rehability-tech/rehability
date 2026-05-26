-- ============================================================
-- Rename Camp domain to Trip (zachowuje dane, ALTER ... RENAME)
-- ============================================================
-- BEZPIECZEŃSTWO:
--   1. Zrób BACKUP bazy przed uruchomieniem (pg_dump).
--   2. Uruchom w transakcji (Prisma migrate domyślnie używa tx).
--   3. Po apply zrestartuj wszystkie procesy łączące się z DB
--      (Next.js dev/prod, pool connections), bo client schema kontekst
--      się zmienił.
--   4. Stripe metadata w PaymentIntents wystawionych przed migracją
--      mogą jeszcze mieć `campId` — kod aplikacji już używa `tripId`,
--      więc dla in-flight transakcji może być potrzebne ręczne
--      mapowanie (lub zostaw je do rozliczenia po staremu).
-- ============================================================

-- Rename enum
ALTER TYPE "CampEventType" RENAME TO "TripEventType";

-- Rename tables
ALTER TABLE "Camp" RENAME TO "Trip";
ALTER TABLE "CampService" RENAME TO "TripService";
ALTER TABLE "CampEvent" RENAME TO "TripEvent";
ALTER TABLE "CampView" RENAME TO "TripView";

-- Rename columns: campId → tripId
ALTER TABLE "Booking" RENAME COLUMN "campId" TO "tripId";
ALTER TABLE "TripService" RENAME COLUMN "campId" TO "tripId";
ALTER TABLE "TripEvent" RENAME COLUMN "campId" TO "tripId";
ALTER TABLE "TripView" RENAME COLUMN "campId" TO "tripId";

-- Rename primary key indexes (Postgres nie robi tego automatycznie przy RENAME TABLE)
ALTER INDEX "Camp_pkey" RENAME TO "Trip_pkey";
ALTER INDEX "CampService_pkey" RENAME TO "TripService_pkey";
ALTER INDEX "CampEvent_pkey" RENAME TO "TripEvent_pkey";
ALTER INDEX "CampView_pkey" RENAME TO "TripView_pkey";

-- Rename foreign key constraints
ALTER TABLE "Booking" RENAME CONSTRAINT "Booking_campId_fkey" TO "Booking_tripId_fkey";
ALTER TABLE "TripService" RENAME CONSTRAINT "CampService_campId_fkey" TO "TripService_tripId_fkey";
ALTER TABLE "TripEvent" RENAME CONSTRAINT "CampEvent_campId_fkey" TO "TripEvent_tripId_fkey";
ALTER TABLE "TripView" RENAME CONSTRAINT "CampView_campId_fkey" TO "TripView_tripId_fkey";

-- Rename unique constraint + index on TripView
ALTER INDEX "CampView_campId_visitorHash_day_key" RENAME TO "TripView_tripId_visitorHash_day_key";
ALTER INDEX "CampView_campId_day_idx" RENAME TO "TripView_tripId_day_idx";
