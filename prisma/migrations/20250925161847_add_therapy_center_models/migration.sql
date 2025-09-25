/*
  Warnings:

  - The values [USER] on the enum `user_roles` will be removed. If these variants are still used in the database, this will fail.
  - Added the required column `updatedAt` to the `sessions` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."genders" AS ENUM ('MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY');

-- CreateEnum
CREATE TYPE "public"."days_of_week" AS ENUM ('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY');

-- CreateEnum
CREATE TYPE "public"."consultation_types" AS ENUM ('CONSULTATION', 'INTERVIEW');

-- CreateEnum
CREATE TYPE "public"."consultation_statuses" AS ENUM ('PENDING_PAYMENT', 'PAYMENT_SUBMITTED', 'PAYMENT_CONFIRMED', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'RESCHEDULED');

-- CreateEnum
CREATE TYPE "public"."service_types" AS ENUM ('TREATMENT', 'EVALUATION');

-- CreateEnum
CREATE TYPE "public"."treatment_periods" AS ENUM ('TWO_MONTHS', 'THREE_MONTHS', 'FOUR_MONTHS', 'SIX_MONTHS', 'TWELVE_MONTHS', 'CUSTOM');

-- CreateEnum
CREATE TYPE "public"."proposal_statuses" AS ENUM ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'COORDINATOR_APPROVED', 'ADMIN_APPROVED', 'REJECTED', 'CONFIRMED');

-- CreateEnum
CREATE TYPE "public"."proposal_types" AS ENUM ('PROPOSAL_A', 'PROPOSAL_B');

-- CreateEnum
CREATE TYPE "public"."payment_plans" AS ENUM ('FULL_PAYMENT', 'MONTHLY');

-- CreateEnum
CREATE TYPE "public"."assignment_statuses" AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."session_statuses" AS ENUM ('SCHEDULED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'RESCHEDULED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "public"."report_statuses" AS ENUM ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'REVISION_REQUIRED');

-- CreateEnum
CREATE TYPE "public"."payment_types" AS ENUM ('CONSULTATION', 'THERAPEUTIC_PROPOSAL', 'MONTHLY_PAYMENT');

-- CreateEnum
CREATE TYPE "public"."payment_statuses" AS ENUM ('PENDING', 'SUBMITTED', 'CONFIRMED', 'REJECTED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "public"."document_categories" AS ENUM ('GENERAL', 'MEDICAL', 'THERAPEUTIC_PLAN', 'PROGRESS_REPORT', 'FINAL_REPORT', 'PAYMENT_RECEIPT', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."schedule_request_types" AS ENUM ('RESCHEDULE_SESSION', 'CANCEL_SESSION', 'RESCHEDULE_ALL_REMAINING', 'CHANGE_THERAPIST');

-- CreateEnum
CREATE TYPE "public"."request_statuses" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'PROCESSED');

-- CreateEnum
CREATE TYPE "public"."urgency_levels" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "public"."audit_actions" AS ENUM ('LOGIN', 'LOGOUT', 'LOGIN_FAILED', 'PASSWORD_RESET', 'PASSWORD_CHANGED', 'EMAIL_VERIFIED', 'USER_CREATED', 'USER_UPDATED', 'USER_DELETED', 'USER_ROLE_CHANGED', 'USER_IMPERSONATED', 'USER_IMPERSONATION_ENDED', 'PROFILE_UPDATED', 'AVATAR_UPLOADED', 'AVATAR_DELETED', 'FILE_UPLOADED', 'FILE_DOWNLOADED', 'FILE_DELETED', 'FILE_SHARED', 'SESSION_CREATED', 'SESSION_TERMINATED', 'SESSION_EXPIRED', 'RATE_LIMIT_EXCEEDED', 'SUSPICIOUS_ACTIVITY', 'SECURITY_VIOLATION', 'BULK_USER_OPERATION', 'SYSTEM_CONFIGURATION_CHANGED', 'AUDIT_LOG_VIEWED', 'AUDIT_LOG_EXPORTED', 'CONSULTATION_SCHEDULED', 'CONSULTATION_COMPLETED', 'PAYMENT_PROCESSED', 'THERAPEUTIC_PROPOSAL_CREATED', 'THERAPEUTIC_PROPOSAL_APPROVED', 'SESSION_SCHEDULED', 'SESSION_COMPLETED', 'REPORT_SUBMITTED', 'REPORT_APPROVED');

-- CreateEnum
CREATE TYPE "public"."audit_severities" AS ENUM ('LOW', 'INFO', 'WARNING', 'HIGH', 'CRITICAL');

-- AlterEnum
BEGIN;
CREATE TYPE "public"."user_roles_new" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'THERAPIST', 'PARENT');
ALTER TABLE "public"."users" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "public"."users" ALTER COLUMN "role" TYPE "public"."user_roles_new" USING ("role"::text::"public"."user_roles_new");
ALTER TYPE "public"."user_roles" RENAME TO "user_roles_old";
ALTER TYPE "public"."user_roles_new" RENAME TO "user_roles";
DROP TYPE "public"."user_roles_old";
ALTER TABLE "public"."users" ALTER COLUMN "role" SET DEFAULT 'PARENT';
COMMIT;

-- AlterTable
ALTER TABLE "public"."sessions" ADD COLUMN     "browser" TEXT,
ADD COLUMN     "browserVersion" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "country" TEXT,
ADD COLUMN     "deviceName" TEXT,
ADD COLUMN     "deviceType" TEXT,
ADD COLUMN     "ipAddress" TEXT,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "lastActivity" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "loginMethod" TEXT,
ADD COLUMN     "os" TEXT,
ADD COLUMN     "osVersion" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "public"."users" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ALTER COLUMN "role" SET DEFAULT 'PARENT';

-- CreateTable
CREATE TABLE "public"."parents" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" TEXT,
    "address" TEXT,
    "city" TEXT,
    "emergencyContact" TEXT,
    "emergencyPhone" TEXT,
    "relationship" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "parents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."patients" (
    "id" TEXT NOT NULL,
    "parentId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3) NOT NULL,
    "gender" "public"."genders" NOT NULL,
    "schoolName" TEXT,
    "schoolGrade" TEXT,
    "medicalHistory" JSONB,
    "specialNeeds" TEXT,
    "emergencyContact" TEXT,
    "emergencyPhone" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "patients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."therapists" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" TEXT,
    "licenseNumber" TEXT,
    "isCoordinator" BOOLEAN NOT NULL DEFAULT false,
    "canTakeConsultations" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "therapists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."specialties" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "specialties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."therapist_specialties" (
    "id" TEXT NOT NULL,
    "therapistId" TEXT NOT NULL,
    "specialtyId" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "therapist_specialties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."therapist_schedules" (
    "id" TEXT NOT NULL,
    "therapistId" TEXT NOT NULL,
    "dayOfWeek" "public"."days_of_week" NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "breakStart" TEXT,
    "breakEnd" TEXT,
    "breakBetweenSessions" INTEGER NOT NULL DEFAULT 15,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "therapist_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."consultation_requests" (
    "id" TEXT NOT NULL,
    "parentId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "type" "public"."consultation_types" NOT NULL,
    "status" "public"."consultation_statuses" NOT NULL DEFAULT 'PENDING_PAYMENT',
    "therapistId" TEXT,
    "scheduledDate" TIMESTAMP(3),
    "scheduledTime" TEXT,
    "duration" INTEGER,
    "cost" DECIMAL(10,2),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "consultation_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."consultation_reasons" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "specialtyId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "consultation_reasons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."consultation_request_reasons" (
    "id" TEXT NOT NULL,
    "consultationRequestId" TEXT NOT NULL,
    "reasonId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "consultation_request_reasons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."general_forms" (
    "id" TEXT NOT NULL,
    "consultationRequestId" TEXT NOT NULL,
    "patientFirstName" TEXT,
    "patientLastName" TEXT,
    "patientDateOfBirth" TIMESTAMP(3),
    "patientGender" "public"."genders",
    "guardianFirstName" TEXT,
    "guardianLastName" TEXT,
    "guardianPhone" TEXT,
    "guardianEmail" TEXT,
    "guardianAddress" TEXT,
    "guardianCity" TEXT,
    "schoolName" TEXT,
    "schoolGrade" TEXT,
    "schoolTeacher" TEXT,
    "availability" JSONB,
    "referralSource" TEXT,
    "previousTreatments" TEXT,
    "currentMedications" TEXT,
    "mainConcerns" TEXT,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "general_forms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."medical_forms" (
    "id" TEXT NOT NULL,
    "consultationRequestId" TEXT,
    "patientId" TEXT,
    "birthComplications" TEXT,
    "developmentalMilestones" JSONB,
    "medicalConditions" TEXT,
    "allergies" TEXT,
    "currentMedications" TEXT,
    "previousSurgeries" TEXT,
    "familyMedicalHistory" TEXT,
    "familyStructure" TEXT,
    "familyDynamics" TEXT,
    "parentalConcerns" TEXT,
    "behavioralConcerns" TEXT,
    "socialSkills" TEXT,
    "communicationSkills" TEXT,
    "learningDifficulties" TEXT,
    "academicPerformance" TEXT,
    "schoolBehavior" TEXT,
    "teacherReports" TEXT,
    "sleepPatterns" TEXT,
    "eatingHabits" TEXT,
    "dailyRoutines" TEXT,
    "stressFactors" TEXT,
    "filledByParent" BOOLEAN NOT NULL DEFAULT true,
    "filledByTherapist" BOOLEAN NOT NULL DEFAULT false,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "medical_forms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."consultation_forms" (
    "id" TEXT NOT NULL,
    "consultationRequestId" TEXT NOT NULL,
    "therapistId" TEXT NOT NULL,
    "clinicalObservations" TEXT,
    "behavioralObservations" TEXT,
    "cognitiveAssessment" TEXT,
    "emotionalState" TEXT,
    "socialInteraction" TEXT,
    "communicationAssessment" TEXT,
    "diagnosticHypothesis" TEXT,
    "recommendedTreatments" TEXT,
    "urgencyLevel" "public"."urgency_levels" NOT NULL DEFAULT 'NORMAL',
    "parentInteraction" TEXT,
    "environmentalFactors" TEXT,
    "riskFactors" TEXT,
    "protectiveFactors" TEXT,
    "sessionDate" TIMESTAMP(3) NOT NULL,
    "sessionDuration" INTEGER NOT NULL,
    "sessionNotes" TEXT,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "consultation_forms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."services" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "public"."service_types" NOT NULL,
    "specialtyId" TEXT NOT NULL,
    "defaultSessions" INTEGER NOT NULL DEFAULT 1,
    "costPerSession" DECIMAL(10,2) NOT NULL,
    "sessionDuration" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."therapeutic_proposals" (
    "id" TEXT NOT NULL,
    "consultationRequestId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "therapistId" TEXT NOT NULL,
    "treatmentPeriod" "public"."treatment_periods" NOT NULL,
    "parentAvailability" JSONB NOT NULL,
    "status" "public"."proposal_statuses" NOT NULL DEFAULT 'DRAFT',
    "proposalASessions" INTEGER,
    "proposalACost" DECIMAL(10,2),
    "proposalBSessions" INTEGER,
    "proposalBCost" DECIMAL(10,2),
    "selectedProposal" "public"."proposal_types",
    "paymentPlan" "public"."payment_plans",
    "notes" TEXT,
    "coordinatorNotes" TEXT,
    "adminNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "reviewedAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),

    CONSTRAINT "therapeutic_proposals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."proposal_services" (
    "id" TEXT NOT NULL,
    "therapeuticProposalId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "proposalASession" INTEGER NOT NULL DEFAULT 0,
    "proposalACostPerSession" DECIMAL(10,2),
    "proposalBSessions" INTEGER NOT NULL DEFAULT 0,
    "proposalBCostPerSession" DECIMAL(10,2),
    "assignedTherapistId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "proposal_services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."service_assignments" (
    "id" TEXT NOT NULL,
    "proposalServiceId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "therapistId" TEXT NOT NULL,
    "totalSessions" INTEGER NOT NULL,
    "completedSessions" INTEGER NOT NULL DEFAULT 0,
    "costPerSession" DECIMAL(10,2) NOT NULL,
    "status" "public"."assignment_statuses" NOT NULL DEFAULT 'SCHEDULED',
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."patient_sessions" (
    "id" TEXT NOT NULL,
    "serviceAssignmentId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "therapistId" TEXT NOT NULL,
    "scheduledDate" TIMESTAMP(3) NOT NULL,
    "scheduledTime" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,
    "status" "public"."session_statuses" NOT NULL DEFAULT 'SCHEDULED',
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "actualDuration" INTEGER,
    "sessionNotes" TEXT,
    "therapistComments" TEXT,
    "parentVisible" BOOLEAN NOT NULL DEFAULT true,
    "originalDate" TIMESTAMP(3),
    "rescheduleReason" TEXT,
    "rescheduledBy" TEXT,
    "rescheduledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "patient_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."therapeutic_plans" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "therapistId" TEXT NOT NULL,
    "objectives" TEXT NOT NULL,
    "antecedents" TEXT NOT NULL,
    "initialMetrics" JSONB NOT NULL,
    "recommendations" TEXT NOT NULL,
    "status" "public"."report_statuses" NOT NULL DEFAULT 'DRAFT',
    "coordinatorNotes" TEXT,
    "adminNotes" TEXT,
    "rejectionReason" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "submittedAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),

    CONSTRAINT "therapeutic_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."progress_reports" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "therapistId" TEXT NOT NULL,
    "progressSummary" TEXT NOT NULL,
    "updatedMetrics" JSONB NOT NULL,
    "achievements" TEXT,
    "challenges" TEXT,
    "recommendations" TEXT,
    "therapeuticPlanId" TEXT,
    "status" "public"."report_statuses" NOT NULL DEFAULT 'DRAFT',
    "coordinatorNotes" TEXT,
    "adminNotes" TEXT,
    "rejectionReason" TEXT,
    "reportPeriod" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "submittedAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),

    CONSTRAINT "progress_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."final_reports" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "therapistId" TEXT NOT NULL,
    "treatmentSummary" TEXT NOT NULL,
    "finalMetrics" JSONB NOT NULL,
    "outcomes" TEXT NOT NULL,
    "recommendations" TEXT NOT NULL,
    "followUpSuggestions" TEXT,
    "isComprehensive" BOOLEAN NOT NULL DEFAULT false,
    "comprehensiveNotes" TEXT,
    "status" "public"."report_statuses" NOT NULL DEFAULT 'DRAFT',
    "coordinatorNotes" TEXT,
    "adminNotes" TEXT,
    "rejectionReason" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "submittedAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),

    CONSTRAINT "final_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."payments" (
    "id" TEXT NOT NULL,
    "parentId" TEXT NOT NULL,
    "consultationRequestId" TEXT,
    "therapeuticProposalId" TEXT,
    "type" "public"."payment_types" NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" "public"."payment_statuses" NOT NULL DEFAULT 'PENDING',
    "paymentMethod" TEXT,
    "transactionId" TEXT,
    "receiptUrl" TEXT,
    "isMonthlyPayment" BOOLEAN NOT NULL DEFAULT false,
    "monthlyPaymentNumber" INTEGER,
    "totalMonthlyPayments" INTEGER,
    "dueDate" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."patient_documents" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "fileUrl" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "category" "public"."document_categories" NOT NULL DEFAULT 'GENERAL',
    "uploadedBy" TEXT NOT NULL,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "patient_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."schedule_requests" (
    "id" TEXT NOT NULL,
    "parentId" TEXT NOT NULL,
    "type" "public"."schedule_request_types" NOT NULL,
    "reason" TEXT NOT NULL,
    "description" TEXT,
    "sessionId" TEXT,
    "newDate" TIMESTAMP(3),
    "newTime" TEXT,
    "newAvailability" JSONB,
    "frequency" INTEGER,
    "mixServices" BOOLEAN NOT NULL DEFAULT true,
    "status" "public"."request_statuses" NOT NULL DEFAULT 'PENDING',
    "adminNotes" TEXT,
    "processedBy" TEXT,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "schedule_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."audit_logs" (
    "id" TEXT NOT NULL,
    "action" "public"."audit_actions" NOT NULL,
    "resource" TEXT NOT NULL,
    "resourceId" TEXT,
    "userId" TEXT,
    "endpoint" TEXT,
    "method" TEXT,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "oldData" JSONB,
    "newData" JSONB,
    "metadata" JSONB,
    "severity" "public"."audit_severities" NOT NULL DEFAULT 'INFO',
    "category" TEXT,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "parents_userId_key" ON "public"."parents"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "therapists_userId_key" ON "public"."therapists"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "therapists_licenseNumber_key" ON "public"."therapists"("licenseNumber");

-- CreateIndex
CREATE UNIQUE INDEX "specialties_name_key" ON "public"."specialties"("name");

-- CreateIndex
CREATE UNIQUE INDEX "therapist_specialties_therapistId_specialtyId_key" ON "public"."therapist_specialties"("therapistId", "specialtyId");

-- CreateIndex
CREATE UNIQUE INDEX "therapist_schedules_therapistId_dayOfWeek_key" ON "public"."therapist_schedules"("therapistId", "dayOfWeek");

-- CreateIndex
CREATE UNIQUE INDEX "consultation_reasons_name_key" ON "public"."consultation_reasons"("name");

-- CreateIndex
CREATE UNIQUE INDEX "consultation_request_reasons_consultationRequestId_reasonId_key" ON "public"."consultation_request_reasons"("consultationRequestId", "reasonId");

-- CreateIndex
CREATE UNIQUE INDEX "general_forms_consultationRequestId_key" ON "public"."general_forms"("consultationRequestId");

-- CreateIndex
CREATE UNIQUE INDEX "medical_forms_consultationRequestId_key" ON "public"."medical_forms"("consultationRequestId");

-- CreateIndex
CREATE UNIQUE INDEX "consultation_forms_consultationRequestId_key" ON "public"."consultation_forms"("consultationRequestId");

-- CreateIndex
CREATE UNIQUE INDEX "services_code_key" ON "public"."services"("code");

-- CreateIndex
CREATE UNIQUE INDEX "therapeutic_proposals_consultationRequestId_key" ON "public"."therapeutic_proposals"("consultationRequestId");

-- CreateIndex
CREATE INDEX "patient_sessions_scheduledDate_idx" ON "public"."patient_sessions"("scheduledDate");

-- CreateIndex
CREATE INDEX "patient_sessions_therapistId_scheduledDate_idx" ON "public"."patient_sessions"("therapistId", "scheduledDate");

-- CreateIndex
CREATE INDEX "patient_sessions_patientId_idx" ON "public"."patient_sessions"("patientId");

-- CreateIndex
CREATE UNIQUE INDEX "payments_consultationRequestId_key" ON "public"."payments"("consultationRequestId");

-- CreateIndex
CREATE INDEX "audit_logs_userId_idx" ON "public"."audit_logs"("userId");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "public"."audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_resource_idx" ON "public"."audit_logs"("resource");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "public"."audit_logs"("createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_severity_idx" ON "public"."audit_logs"("severity");

-- CreateIndex
CREATE INDEX "audit_logs_success_idx" ON "public"."audit_logs"("success");

-- CreateIndex
CREATE INDEX "sessions_isActive_idx" ON "public"."sessions"("isActive");

-- CreateIndex
CREATE INDEX "sessions_lastActivity_idx" ON "public"."sessions"("lastActivity");

-- AddForeignKey
ALTER TABLE "public"."parents" ADD CONSTRAINT "parents_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."patients" ADD CONSTRAINT "patients_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "public"."parents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."therapists" ADD CONSTRAINT "therapists_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."therapist_specialties" ADD CONSTRAINT "therapist_specialties_therapistId_fkey" FOREIGN KEY ("therapistId") REFERENCES "public"."therapists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."therapist_specialties" ADD CONSTRAINT "therapist_specialties_specialtyId_fkey" FOREIGN KEY ("specialtyId") REFERENCES "public"."specialties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."therapist_schedules" ADD CONSTRAINT "therapist_schedules_therapistId_fkey" FOREIGN KEY ("therapistId") REFERENCES "public"."therapists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."consultation_requests" ADD CONSTRAINT "consultation_requests_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "public"."parents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."consultation_requests" ADD CONSTRAINT "consultation_requests_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "public"."patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."consultation_requests" ADD CONSTRAINT "consultation_requests_therapistId_fkey" FOREIGN KEY ("therapistId") REFERENCES "public"."therapists"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."consultation_reasons" ADD CONSTRAINT "consultation_reasons_specialtyId_fkey" FOREIGN KEY ("specialtyId") REFERENCES "public"."specialties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."consultation_request_reasons" ADD CONSTRAINT "consultation_request_reasons_consultationRequestId_fkey" FOREIGN KEY ("consultationRequestId") REFERENCES "public"."consultation_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."consultation_request_reasons" ADD CONSTRAINT "consultation_request_reasons_reasonId_fkey" FOREIGN KEY ("reasonId") REFERENCES "public"."consultation_reasons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."general_forms" ADD CONSTRAINT "general_forms_consultationRequestId_fkey" FOREIGN KEY ("consultationRequestId") REFERENCES "public"."consultation_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."medical_forms" ADD CONSTRAINT "medical_forms_consultationRequestId_fkey" FOREIGN KEY ("consultationRequestId") REFERENCES "public"."consultation_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."medical_forms" ADD CONSTRAINT "medical_forms_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "public"."patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."consultation_forms" ADD CONSTRAINT "consultation_forms_consultationRequestId_fkey" FOREIGN KEY ("consultationRequestId") REFERENCES "public"."consultation_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."consultation_forms" ADD CONSTRAINT "consultation_forms_therapistId_fkey" FOREIGN KEY ("therapistId") REFERENCES "public"."therapists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."services" ADD CONSTRAINT "services_specialtyId_fkey" FOREIGN KEY ("specialtyId") REFERENCES "public"."specialties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."therapeutic_proposals" ADD CONSTRAINT "therapeutic_proposals_consultationRequestId_fkey" FOREIGN KEY ("consultationRequestId") REFERENCES "public"."consultation_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."therapeutic_proposals" ADD CONSTRAINT "therapeutic_proposals_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "public"."patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."therapeutic_proposals" ADD CONSTRAINT "therapeutic_proposals_therapistId_fkey" FOREIGN KEY ("therapistId") REFERENCES "public"."therapists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."proposal_services" ADD CONSTRAINT "proposal_services_therapeuticProposalId_fkey" FOREIGN KEY ("therapeuticProposalId") REFERENCES "public"."therapeutic_proposals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."proposal_services" ADD CONSTRAINT "proposal_services_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "public"."services"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."proposal_services" ADD CONSTRAINT "proposal_services_assignedTherapistId_fkey" FOREIGN KEY ("assignedTherapistId") REFERENCES "public"."therapists"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."service_assignments" ADD CONSTRAINT "service_assignments_proposalServiceId_fkey" FOREIGN KEY ("proposalServiceId") REFERENCES "public"."proposal_services"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."service_assignments" ADD CONSTRAINT "service_assignments_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "public"."services"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."service_assignments" ADD CONSTRAINT "service_assignments_therapistId_fkey" FOREIGN KEY ("therapistId") REFERENCES "public"."therapists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."patient_sessions" ADD CONSTRAINT "patient_sessions_serviceAssignmentId_fkey" FOREIGN KEY ("serviceAssignmentId") REFERENCES "public"."service_assignments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."patient_sessions" ADD CONSTRAINT "patient_sessions_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "public"."patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."patient_sessions" ADD CONSTRAINT "patient_sessions_therapistId_fkey" FOREIGN KEY ("therapistId") REFERENCES "public"."therapists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."therapeutic_plans" ADD CONSTRAINT "therapeutic_plans_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "public"."patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."therapeutic_plans" ADD CONSTRAINT "therapeutic_plans_therapistId_fkey" FOREIGN KEY ("therapistId") REFERENCES "public"."therapists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."progress_reports" ADD CONSTRAINT "progress_reports_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "public"."patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."progress_reports" ADD CONSTRAINT "progress_reports_therapistId_fkey" FOREIGN KEY ("therapistId") REFERENCES "public"."therapists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."final_reports" ADD CONSTRAINT "final_reports_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "public"."patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."final_reports" ADD CONSTRAINT "final_reports_therapistId_fkey" FOREIGN KEY ("therapistId") REFERENCES "public"."therapists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payments" ADD CONSTRAINT "payments_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "public"."parents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payments" ADD CONSTRAINT "payments_consultationRequestId_fkey" FOREIGN KEY ("consultationRequestId") REFERENCES "public"."consultation_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payments" ADD CONSTRAINT "payments_therapeuticProposalId_fkey" FOREIGN KEY ("therapeuticProposalId") REFERENCES "public"."therapeutic_proposals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."patient_documents" ADD CONSTRAINT "patient_documents_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "public"."patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."schedule_requests" ADD CONSTRAINT "schedule_requests_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "public"."parents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
