-- CreateEnum
CREATE TYPE "public"."medical_form_statuses" AS ENUM ('DRAFT', 'IN_PROGRESS', 'PENDING_REVIEW', 'COMPLETED', 'ARCHIVED');

-- AlterEnum
ALTER TYPE "public"."consultation_statuses" ADD VALUE 'CONFIRMED';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "public"."payment_statuses" ADD VALUE 'PROCESSING';
ALTER TYPE "public"."payment_statuses" ADD VALUE 'COMPLETED';
ALTER TYPE "public"."payment_statuses" ADD VALUE 'FAILED';
ALTER TYPE "public"."payment_statuses" ADD VALUE 'CANCELLED';

-- AlterTable
ALTER TABLE "public"."consultation_requests" ADD COLUMN     "duration" INTEGER;

-- AlterTable
ALTER TABLE "public"."medical_forms" ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "completedSteps" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "consultationRequestId" TEXT,
ADD COLUMN     "currentStep" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "status" "public"."medical_form_statuses" NOT NULL DEFAULT 'DRAFT';

-- AlterTable
ALTER TABLE "public"."payments" ADD COLUMN     "consultationRequestId" TEXT,
ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'USD',
ADD COLUMN     "errorMessage" TEXT,
ADD COLUMN     "paymentMethod" TEXT,
ADD COLUMN     "receiptUrl" TEXT,
ADD COLUMN     "refundAmount" DECIMAL(10,2),
ADD COLUMN     "transactionId" TEXT;

-- AlterTable
ALTER TABLE "public"."therapists" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "public"."payment_receipts" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "receiptNumber" TEXT NOT NULL,
    "receiptUrl" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileSize" INTEGER,
    "generatedBy" TEXT,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "emailSent" BOOLEAN NOT NULL DEFAULT false,
    "emailSentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_receipts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."payment_status_history" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "fromStatus" "public"."payment_statuses" NOT NULL,
    "toStatus" "public"."payment_statuses" NOT NULL,
    "changedBy" TEXT,
    "reason" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."payment_timeouts" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "timeoutAt" TIMESTAMP(3) NOT NULL,
    "warningsSent" INTEGER NOT NULL DEFAULT 0,
    "lastWarningAt" TIMESTAMP(3),
    "isCancelled" BOOLEAN NOT NULL DEFAULT false,
    "cancelledAt" TIMESTAMP(3),
    "cancelledBy" TEXT,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_timeouts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."payment_timeout_notifications" (
    "id" TEXT NOT NULL,
    "paymentTimeoutId" TEXT NOT NULL,
    "notificationType" TEXT NOT NULL,
    "sentTo" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_timeout_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."form_progress" (
    "id" TEXT NOT NULL,
    "medicalFormId" TEXT NOT NULL,
    "currentStep" INTEGER NOT NULL DEFAULT 1,
    "completedSteps" JSONB NOT NULL DEFAULT '[]',
    "totalSteps" INTEGER NOT NULL DEFAULT 6,
    "progressPercentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lastSavedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "estimatedTimeRemaining" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "form_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."progress_snapshots" (
    "id" TEXT NOT NULL,
    "formProgressId" TEXT NOT NULL,
    "step" INTEGER NOT NULL,
    "data" JSONB NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "progress_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."therapist_medical_forms" (
    "id" TEXT NOT NULL,
    "therapistId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "formData" JSONB NOT NULL,
    "status" "public"."medical_form_statuses" NOT NULL DEFAULT 'DRAFT',
    "submittedAt" TIMESTAMP(3),
    "reviewedAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "therapist_medical_forms_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "payment_receipts_receiptNumber_key" ON "public"."payment_receipts"("receiptNumber");

-- CreateIndex
CREATE INDEX "payment_receipts_paymentId_idx" ON "public"."payment_receipts"("paymentId");

-- CreateIndex
CREATE INDEX "payment_receipts_receiptNumber_idx" ON "public"."payment_receipts"("receiptNumber");

-- CreateIndex
CREATE INDEX "payment_status_history_paymentId_idx" ON "public"."payment_status_history"("paymentId");

-- CreateIndex
CREATE INDEX "payment_status_history_createdAt_idx" ON "public"."payment_status_history"("createdAt");

-- CreateIndex
CREATE INDEX "payment_timeouts_paymentId_idx" ON "public"."payment_timeouts"("paymentId");

-- CreateIndex
CREATE INDEX "payment_timeouts_timeoutAt_idx" ON "public"."payment_timeouts"("timeoutAt");

-- CreateIndex
CREATE INDEX "payment_timeouts_isCancelled_idx" ON "public"."payment_timeouts"("isCancelled");

-- CreateIndex
CREATE INDEX "payment_timeout_notifications_paymentTimeoutId_idx" ON "public"."payment_timeout_notifications"("paymentTimeoutId");

-- CreateIndex
CREATE INDEX "payment_timeout_notifications_sentAt_idx" ON "public"."payment_timeout_notifications"("sentAt");

-- CreateIndex
CREATE INDEX "form_progress_medicalFormId_idx" ON "public"."form_progress"("medicalFormId");

-- CreateIndex
CREATE INDEX "progress_snapshots_formProgressId_idx" ON "public"."progress_snapshots"("formProgressId");

-- CreateIndex
CREATE INDEX "progress_snapshots_completedAt_idx" ON "public"."progress_snapshots"("completedAt");

-- CreateIndex
CREATE INDEX "therapist_medical_forms_therapistId_idx" ON "public"."therapist_medical_forms"("therapistId");

-- CreateIndex
CREATE INDEX "therapist_medical_forms_patientId_idx" ON "public"."therapist_medical_forms"("patientId");

-- CreateIndex
CREATE INDEX "therapist_medical_forms_status_idx" ON "public"."therapist_medical_forms"("status");

-- CreateIndex
CREATE INDEX "medical_forms_consultationRequestId_idx" ON "public"."medical_forms"("consultationRequestId");

-- CreateIndex
CREATE INDEX "medical_forms_status_idx" ON "public"."medical_forms"("status");

-- CreateIndex
CREATE INDEX "payments_consultationRequestId_idx" ON "public"."payments"("consultationRequestId");

-- CreateIndex
CREATE INDEX "payments_transactionId_idx" ON "public"."payments"("transactionId");

-- CreateIndex
CREATE INDEX "therapists_isActive_idx" ON "public"."therapists"("isActive");

-- AddForeignKey
ALTER TABLE "public"."medical_forms" ADD CONSTRAINT "medical_forms_consultationRequestId_fkey" FOREIGN KEY ("consultationRequestId") REFERENCES "public"."consultation_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payments" ADD CONSTRAINT "payments_consultationRequestId_fkey" FOREIGN KEY ("consultationRequestId") REFERENCES "public"."consultation_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payment_receipts" ADD CONSTRAINT "payment_receipts_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "public"."payments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payment_status_history" ADD CONSTRAINT "payment_status_history_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "public"."payments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payment_timeouts" ADD CONSTRAINT "payment_timeouts_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "public"."payments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payment_timeout_notifications" ADD CONSTRAINT "payment_timeout_notifications_paymentTimeoutId_fkey" FOREIGN KEY ("paymentTimeoutId") REFERENCES "public"."payment_timeouts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."form_progress" ADD CONSTRAINT "form_progress_medicalFormId_fkey" FOREIGN KEY ("medicalFormId") REFERENCES "public"."medical_forms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."progress_snapshots" ADD CONSTRAINT "progress_snapshots_formProgressId_fkey" FOREIGN KEY ("formProgressId") REFERENCES "public"."form_progress"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."therapist_medical_forms" ADD CONSTRAINT "therapist_medical_forms_therapistId_fkey" FOREIGN KEY ("therapistId") REFERENCES "public"."therapists"("id") ON DELETE CASCADE ON UPDATE CASCADE;
