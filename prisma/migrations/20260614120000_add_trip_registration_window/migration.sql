-- AlterTable
-- Okno zapisów na wydarzenie: opcjonalny termin zamknięcia zapisów oraz ręczna flaga.
ALTER TABLE "Trip" ADD COLUMN     "registrationClosed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "registrationDeadline" TIMESTAMP(3);
