/*
  Warnings:

  - You are about to drop the column `paymentPlan` on the `therapeutic_proposals` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "public"."payment_plan_types" AS ENUM ('FULL', 'MONTHLY');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "public"."medical_form_statuses" ADD VALUE 'REVIEWED';
ALTER TYPE "public"."medical_form_statuses" ADD VALUE 'APPROVED';

-- AlterTable
ALTER TABLE "public"."payment_timeout_notifications" ADD COLUMN     "message" TEXT,
ADD COLUMN     "paymentId" TEXT;

-- AlterTable
ALTER TABLE "public"."payment_timeouts" ADD COLUMN     "cancellationReason" TEXT,
ADD COLUMN     "extendedAt" TIMESTAMP(3),
ADD COLUMN     "extensionCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "maxExtensions" INTEGER NOT NULL DEFAULT 3,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "warningAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "public"."payments" ADD COLUMN     "description" TEXT,
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "paymentPlanId" TEXT,
ADD COLUMN     "processedAt" TIMESTAMP(3),
ADD COLUMN     "reference" TEXT;

-- AlterTable
ALTER TABLE "public"."therapeutic_proposals" DROP COLUMN "paymentPlan",
ADD COLUMN     "paymentPlanType" "public"."payment_plan_types";

-- AlterTable
ALTER TABLE "public"."therapist_medical_forms" ADD COLUMN     "assessment" JSONB,
ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "medicalFormId" TEXT;

-- DropEnum
DROP TYPE "public"."payment_plans";

-- CreateTable
CREATE TABLE "public"."payment_plans" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "planType" "public"."payment_plan_types" NOT NULL DEFAULT 'FULL',
    "totalAmount" DECIMAL(10,2) NOT NULL,
    "installments" INTEGER NOT NULL DEFAULT 1,
    "frequency" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."payment_confirmation_requests" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "requestedBy" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_confirmation_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."payment_confirmation_workflows" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "steps" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_confirmation_workflows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."payment_workflow_steps" (
    "id" TEXT NOT NULL,
    "paymentConfirmationWorkflowId" TEXT NOT NULL,
    "stepNumber" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "requiredRole" TEXT,
    "isOptional" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_workflow_steps_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "payment_plans_planType_idx" ON "public"."payment_plans"("planType");

-- CreateIndex
CREATE INDEX "payment_plans_isActive_idx" ON "public"."payment_plans"("isActive");

-- CreateIndex
CREATE INDEX "payment_confirmation_requests_paymentId_idx" ON "public"."payment_confirmation_requests"("paymentId");

-- CreateIndex
CREATE INDEX "payment_confirmation_requests_status_idx" ON "public"."payment_confirmation_requests"("status");

-- CreateIndex
CREATE INDEX "payment_confirmation_requests_requestedBy_idx" ON "public"."payment_confirmation_requests"("requestedBy");

-- CreateIndex
CREATE INDEX "payment_confirmation_workflows_isActive_idx" ON "public"."payment_confirmation_workflows"("isActive");

-- CreateIndex
CREATE INDEX "payment_workflow_steps_paymentConfirmationWorkflowId_idx" ON "public"."payment_workflow_steps"("paymentConfirmationWorkflowId");

-- CreateIndex
CREATE INDEX "payment_workflow_steps_stepNumber_idx" ON "public"."payment_workflow_steps"("stepNumber");

-- CreateIndex
CREATE INDEX "payment_timeout_notifications_paymentId_idx" ON "public"."payment_timeout_notifications"("paymentId");

-- CreateIndex
CREATE INDEX "payment_timeouts_status_idx" ON "public"."payment_timeouts"("status");

-- CreateIndex
CREATE INDEX "payments_paymentPlanId_idx" ON "public"."payments"("paymentPlanId");

-- CreateIndex
CREATE INDEX "therapist_medical_forms_medicalFormId_idx" ON "public"."therapist_medical_forms"("medicalFormId");

-- AddForeignKey
ALTER TABLE "public"."payments" ADD CONSTRAINT "payments_paymentPlanId_fkey" FOREIGN KEY ("paymentPlanId") REFERENCES "public"."payment_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payment_workflow_steps" ADD CONSTRAINT "payment_workflow_steps_paymentConfirmationWorkflowId_fkey" FOREIGN KEY ("paymentConfirmationWorkflowId") REFERENCES "public"."payment_confirmation_workflows"("id") ON DELETE CASCADE ON UPDATE CASCADE;
