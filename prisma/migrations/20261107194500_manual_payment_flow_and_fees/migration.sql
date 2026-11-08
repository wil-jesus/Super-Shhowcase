-- CreateEnum
CREATE TYPE "FeeChargeStatus" AS ENUM ('PENDING', 'PAID');

-- AlterEnum
ALTER TYPE "BookingStatus" ADD VALUE 'PENDING_PAYMENT';
ALTER TYPE "BookingStatus" ADD VALUE 'PAYMENT_CLAIMED';
ALTER TYPE "BookingStatus" ADD VALUE 'PAID';

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "clientConfirmedAt" TIMESTAMP(3),
ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "feeRate" DECIMAL(5,2) NOT NULL DEFAULT 0,
ADD COLUMN     "musicianConfirmedAt" TIMESTAMP(3),
ADD COLUMN     "netAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "paidAt" TIMESTAMP(3),
ADD COLUMN     "paymentClaimedAt" TIMESTAMP(3),
ADD COLUMN     "platformFee" DECIMAL(12,2) NOT NULL DEFAULT 0;

-- Valor monetário exato (Float -> Decimal)
ALTER TABLE "Booking" ALTER COLUMN "value" TYPE DECIMAL(12,2) USING "value"::decimal(12,2);

-- CreateTable
CREATE TABLE "FeeCharge" (
    "id" TEXT NOT NULL,
    "musicianId" TEXT NOT NULL,
    "bookingId" TEXT,
    "amount" DECIMAL(12,2) NOT NULL,
    "status" "FeeChargeStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paidAt" TIMESTAMP(3),

    CONSTRAINT "FeeCharge_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FeeCharge_bookingId_key" ON "FeeCharge"("bookingId");

-- CreateIndex
CREATE INDEX "FeeCharge_musicianId_status_idx" ON "FeeCharge"("musicianId", "status");

-- AddForeignKey
ALTER TABLE "FeeCharge" ADD CONSTRAINT "FeeCharge_musicianId_fkey" FOREIGN KEY ("musicianId") REFERENCES "Musician"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeCharge" ADD CONSTRAINT "FeeCharge_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;
