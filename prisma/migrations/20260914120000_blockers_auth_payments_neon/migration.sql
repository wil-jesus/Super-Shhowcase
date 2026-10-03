-- AlterEnum
ALTER TYPE "PaymentStatus" ADD VALUE 'FAILED';

-- AlterTable
ALTER TABLE "Musician" ADD COLUMN IF NOT EXISTS "stripeAccountId" TEXT;
