-- CreateEnum
CREATE TYPE "public"."user_roles" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'COORDINATOR', 'THERAPIST', 'PARENT');

-- CreateEnum
CREATE TYPE "public"."genders" AS ENUM ('MALE', 'FEMALE', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."days_of_week" AS ENUM ('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY');

-- CreateEnum
CREATE TYPE "public"."service_types" AS ENUM ('EVALUATION', 'TREATMENT');

-- CreateEnum
CREATE TYPE "public"."consultation_types" AS ENUM ('CONSULTATION', 'INTERVIEW');

-- CreateEnum
CREATE TYPE "public"."consultation_statuses" AS ENUM ('PENDING', 'PAYMENT_PENDING', 'PAYMENT_CONFIRMED', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."payment_statuses" AS ENUM ('PENDING', 'CONFIRMED', 'REJECTED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "public"."payment_types" AS ENUM ('CONSULTATION', 'PROPOSAL_FULL', 'PROPOSAL_MONTHLY');

-- CreateEnum
CREATE TYPE "public"."payment_plans" AS ENUM ('FULL', 'MONTHLY');

-- CreateEnum
CREATE TYPE "public"."form_statuses" AS ENUM ('DRAFT', 'COMPLETED');

-- CreateEnum
CREATE TYPE "public"."proposal_statuses" AS ENUM ('DRAFT', 'SUBMITTED_TO_COORDINATOR', 'COORDINATOR_APPROVED', 'COORDINATOR_REJECTED', 'SUBMITTED_TO_ADMIN', 'ADMIN_APPROVED', 'WAITING_PARENT_APPROVAL', 'PARENT_APPROVED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."proposal_types" AS ENUM ('A', 'B');

-- CreateEnum
CREATE TYPE "public"."treatment_periods" AS ENUM ('BIMONTHLY', 'QUARTERLY', 'FOUR_MONTHS', 'BIANNUAL', 'ANNUAL');

-- CreateEnum
CREATE TYPE "public"."assignment_statuses" AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."session_statuses" AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'RESCHEDULED');

-- CreateEnum
CREATE TYPE "public"."report_statuses" AS ENUM ('DRAFT', 'SUBMITTED', 'COORDINATOR_APPROVED', 'COORDINATOR_REJECTED', 'ADMIN_APPROVED', 'SENT_TO_PARENT');

-- CreateEnum
CREATE TYPE "public"."request_statuses" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "public"."schedule_request_types" AS ENUM ('RESCHEDULE_SESSION', 'RESCHEDULE_ALL', 'CANCEL_SESSION', 'CHANGE_THERAPIST');

-- CreateTable
CREATE TABLE "public"."profiles" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" TEXT,
    "avatar" TEXT,
    "role" "public"."user_roles" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."therapists" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "licenseNumber" TEXT,
    "bio" TEXT,
    "isCoordinator" BOOLEAN NOT NULL DEFAULT false,
    "canTakeConsultations" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "therapists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."parents" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
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
CREATE TABLE "public"."admins" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "department" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admins_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "public"."sessions" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "device" TEXT,
    "browser" TEXT,
    "os" TEXT,
    "country" TEXT,
    "city" TEXT,
    "lastActivityAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."audit_logs" (
    "id" TEXT NOT NULL,
    "profileId" TEXT,
    "action" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "resourceId" TEXT,
    "oldValue" JSONB,
    "newValue" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "errorMessage" TEXT,
    "metadata" JSONB,
    "category" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "public"."therapist_specialties" (
    "therapistId" TEXT NOT NULL,
    "specialtyId" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "therapist_specialties_pkey" PRIMARY KEY ("therapistId","specialtyId")
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
CREATE TABLE "public"."services" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "public"."service_types" NOT NULL,
    "specialtyId" TEXT NOT NULL,
    "defaultSessions" INTEGER NOT NULL,
    "costPerSession" DECIMAL(10,2) NOT NULL,
    "sessionDuration" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."consultation_requests" (
    "id" TEXT NOT NULL,
    "parentId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "type" "public"."consultation_types" NOT NULL,
    "status" "public"."consultation_statuses" NOT NULL DEFAULT 'PENDING',
    "scheduledDate" TIMESTAMP(3),
    "scheduledTime" TEXT,
    "therapistId" TEXT,
    "reasonId" TEXT,
    "cost" DECIMAL(10,2),
    "paymentStatus" "public"."payment_statuses" NOT NULL DEFAULT 'PENDING',
    "paymentProof" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "consultation_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."consultation_forms" (
    "id" TEXT NOT NULL,
    "consultationRequestId" TEXT NOT NULL,
    "therapistId" TEXT NOT NULL,
    "formData" JSONB NOT NULL,
    "diagnosis" TEXT,
    "observations" TEXT,
    "status" "public"."form_statuses" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "consultation_forms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."medical_forms" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "formData" JSONB NOT NULL,
    "filledBy" TEXT NOT NULL,
    "isComplete" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "medical_forms_pkey" PRIMARY KEY ("id")
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
    "coordinatorNotes" TEXT,
    "adminNotes" TEXT,
    "selectedProposal" "public"."proposal_types",
    "paymentPlan" "public"."payment_plans",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "therapeutic_proposals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."proposal_services" (
    "id" TEXT NOT NULL,
    "therapeuticProposalId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "therapistId" TEXT NOT NULL,
    "sessionsProposalA" INTEGER NOT NULL,
    "sessionsProposalB" INTEGER NOT NULL,
    "costPerSession" DECIMAL(10,2) NOT NULL,
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
    "numberOfSessions" INTEGER NOT NULL,
    "status" "public"."assignment_statuses" NOT NULL DEFAULT 'SCHEDULED',
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
    "therapistNotes" TEXT,
    "observations" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "patient_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."therapeutic_plans" (
    "id" TEXT NOT NULL,
    "therapeuticProposalId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "therapistId" TEXT NOT NULL,
    "objectives" JSONB NOT NULL,
    "background" TEXT,
    "metrics" JSONB NOT NULL,
    "recommendations" TEXT,
    "status" "public"."report_statuses" NOT NULL DEFAULT 'DRAFT',
    "coordinatorNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "therapeutic_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."progress_reports" (
    "id" TEXT NOT NULL,
    "therapeuticPlanId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "therapistId" TEXT NOT NULL,
    "reportNumber" INTEGER NOT NULL,
    "metricsUpdate" JSONB NOT NULL,
    "progress" TEXT,
    "observations" TEXT,
    "status" "public"."report_statuses" NOT NULL DEFAULT 'DRAFT',
    "coordinatorNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "progress_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."final_reports" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "therapistId" TEXT NOT NULL,
    "finalMetrics" JSONB NOT NULL,
    "conclusions" TEXT,
    "recommendations" TEXT,
    "status" "public"."report_statuses" NOT NULL DEFAULT 'DRAFT',
    "coordinatorNotes" TEXT,
    "coordinatorReport" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "final_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."payments" (
    "id" TEXT NOT NULL,
    "parentId" TEXT NOT NULL,
    "type" "public"."payment_types" NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "status" "public"."payment_statuses" NOT NULL DEFAULT 'PENDING',
    "paymentProof" TEXT,
    "paymentDate" TIMESTAMP(3),
    "dueDate" TIMESTAMP(3),
    "confirmedBy" TEXT,
    "confirmedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."patient_documents" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "uploadedBy" TEXT NOT NULL,
    "description" TEXT,
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
    "newAvailability" JSONB,
    "status" "public"."request_statuses" NOT NULL DEFAULT 'PENDING',
    "adminResponse" TEXT,
    "respondedBy" TEXT,
    "respondedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "schedule_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "profiles_email_key" ON "public"."profiles"("email");

-- CreateIndex
CREATE INDEX "profiles_role_idx" ON "public"."profiles"("role");

-- CreateIndex
CREATE INDEX "profiles_isActive_idx" ON "public"."profiles"("isActive");

-- CreateIndex
CREATE INDEX "profiles_email_idx" ON "public"."profiles"("email");

-- CreateIndex
CREATE UNIQUE INDEX "therapists_profileId_key" ON "public"."therapists"("profileId");

-- CreateIndex
CREATE UNIQUE INDEX "therapists_licenseNumber_key" ON "public"."therapists"("licenseNumber");

-- CreateIndex
CREATE INDEX "therapists_profileId_idx" ON "public"."therapists"("profileId");

-- CreateIndex
CREATE INDEX "therapists_isCoordinator_idx" ON "public"."therapists"("isCoordinator");

-- CreateIndex
CREATE INDEX "therapists_canTakeConsultations_idx" ON "public"."therapists"("canTakeConsultations");

-- CreateIndex
CREATE INDEX "therapists_licenseNumber_idx" ON "public"."therapists"("licenseNumber");

-- CreateIndex
CREATE UNIQUE INDEX "parents_profileId_key" ON "public"."parents"("profileId");

-- CreateIndex
CREATE INDEX "parents_profileId_idx" ON "public"."parents"("profileId");

-- CreateIndex
CREATE UNIQUE INDEX "admins_profileId_key" ON "public"."admins"("profileId");

-- CreateIndex
CREATE INDEX "admins_profileId_idx" ON "public"."admins"("profileId");

-- CreateIndex
CREATE INDEX "patients_parentId_idx" ON "public"."patients"("parentId");

-- CreateIndex
CREATE INDEX "patients_firstName_lastName_idx" ON "public"."patients"("firstName", "lastName");

-- CreateIndex
CREATE INDEX "patients_dateOfBirth_idx" ON "public"."patients"("dateOfBirth");

-- CreateIndex
CREATE INDEX "patients_isActive_idx" ON "public"."patients"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_token_key" ON "public"."sessions"("token");

-- CreateIndex
CREATE INDEX "sessions_profileId_idx" ON "public"."sessions"("profileId");

-- CreateIndex
CREATE INDEX "sessions_token_idx" ON "public"."sessions"("token");

-- CreateIndex
CREATE INDEX "sessions_expiresAt_idx" ON "public"."sessions"("expiresAt");

-- CreateIndex
CREATE INDEX "audit_logs_profileId_idx" ON "public"."audit_logs"("profileId");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "public"."audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_resource_idx" ON "public"."audit_logs"("resource");

-- CreateIndex
CREATE INDEX "audit_logs_resourceId_idx" ON "public"."audit_logs"("resourceId");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "public"."audit_logs"("createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_category_idx" ON "public"."audit_logs"("category");

-- CreateIndex
CREATE UNIQUE INDEX "specialties_name_key" ON "public"."specialties"("name");

-- CreateIndex
CREATE INDEX "specialties_name_idx" ON "public"."specialties"("name");

-- CreateIndex
CREATE INDEX "specialties_isActive_idx" ON "public"."specialties"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "consultation_reasons_name_key" ON "public"."consultation_reasons"("name");

-- CreateIndex
CREATE INDEX "consultation_reasons_specialtyId_idx" ON "public"."consultation_reasons"("specialtyId");

-- CreateIndex
CREATE INDEX "consultation_reasons_name_idx" ON "public"."consultation_reasons"("name");

-- CreateIndex
CREATE INDEX "consultation_reasons_isActive_idx" ON "public"."consultation_reasons"("isActive");

-- CreateIndex
CREATE INDEX "therapist_specialties_therapistId_idx" ON "public"."therapist_specialties"("therapistId");

-- CreateIndex
CREATE INDEX "therapist_specialties_specialtyId_idx" ON "public"."therapist_specialties"("specialtyId");

-- CreateIndex
CREATE INDEX "therapist_schedules_therapistId_idx" ON "public"."therapist_schedules"("therapistId");

-- CreateIndex
CREATE INDEX "therapist_schedules_dayOfWeek_idx" ON "public"."therapist_schedules"("dayOfWeek");

-- CreateIndex
CREATE INDEX "therapist_schedules_isActive_idx" ON "public"."therapist_schedules"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "therapist_schedules_therapistId_dayOfWeek_key" ON "public"."therapist_schedules"("therapistId", "dayOfWeek");

-- CreateIndex
CREATE UNIQUE INDEX "services_code_key" ON "public"."services"("code");

-- CreateIndex
CREATE INDEX "services_code_idx" ON "public"."services"("code");

-- CreateIndex
CREATE INDEX "services_specialtyId_idx" ON "public"."services"("specialtyId");

-- CreateIndex
CREATE INDEX "services_type_idx" ON "public"."services"("type");

-- CreateIndex
CREATE INDEX "services_isActive_idx" ON "public"."services"("isActive");

-- CreateIndex
CREATE INDEX "consultation_requests_parentId_idx" ON "public"."consultation_requests"("parentId");

-- CreateIndex
CREATE INDEX "consultation_requests_patientId_idx" ON "public"."consultation_requests"("patientId");

-- CreateIndex
CREATE INDEX "consultation_requests_therapistId_idx" ON "public"."consultation_requests"("therapistId");

-- CreateIndex
CREATE INDEX "consultation_requests_status_idx" ON "public"."consultation_requests"("status");

-- CreateIndex
CREATE INDEX "consultation_requests_scheduledDate_idx" ON "public"."consultation_requests"("scheduledDate");

-- CreateIndex
CREATE INDEX "consultation_requests_paymentStatus_idx" ON "public"."consultation_requests"("paymentStatus");

-- CreateIndex
CREATE UNIQUE INDEX "consultation_forms_consultationRequestId_key" ON "public"."consultation_forms"("consultationRequestId");

-- CreateIndex
CREATE INDEX "consultation_forms_consultationRequestId_idx" ON "public"."consultation_forms"("consultationRequestId");

-- CreateIndex
CREATE INDEX "consultation_forms_therapistId_idx" ON "public"."consultation_forms"("therapistId");

-- CreateIndex
CREATE INDEX "consultation_forms_status_idx" ON "public"."consultation_forms"("status");

-- CreateIndex
CREATE INDEX "medical_forms_patientId_idx" ON "public"."medical_forms"("patientId");

-- CreateIndex
CREATE INDEX "medical_forms_isComplete_idx" ON "public"."medical_forms"("isComplete");

-- CreateIndex
CREATE UNIQUE INDEX "therapeutic_proposals_consultationRequestId_key" ON "public"."therapeutic_proposals"("consultationRequestId");

-- CreateIndex
CREATE INDEX "therapeutic_proposals_consultationRequestId_idx" ON "public"."therapeutic_proposals"("consultationRequestId");

-- CreateIndex
CREATE INDEX "therapeutic_proposals_patientId_idx" ON "public"."therapeutic_proposals"("patientId");

-- CreateIndex
CREATE INDEX "therapeutic_proposals_therapistId_idx" ON "public"."therapeutic_proposals"("therapistId");

-- CreateIndex
CREATE INDEX "therapeutic_proposals_status_idx" ON "public"."therapeutic_proposals"("status");

-- CreateIndex
CREATE INDEX "proposal_services_therapeuticProposalId_idx" ON "public"."proposal_services"("therapeuticProposalId");

-- CreateIndex
CREATE INDEX "proposal_services_serviceId_idx" ON "public"."proposal_services"("serviceId");

-- CreateIndex
CREATE INDEX "proposal_services_therapistId_idx" ON "public"."proposal_services"("therapistId");

-- CreateIndex
CREATE INDEX "service_assignments_proposalServiceId_idx" ON "public"."service_assignments"("proposalServiceId");

-- CreateIndex
CREATE INDEX "service_assignments_serviceId_idx" ON "public"."service_assignments"("serviceId");

-- CreateIndex
CREATE INDEX "service_assignments_therapistId_idx" ON "public"."service_assignments"("therapistId");

-- CreateIndex
CREATE INDEX "service_assignments_status_idx" ON "public"."service_assignments"("status");

-- CreateIndex
CREATE INDEX "patient_sessions_serviceAssignmentId_idx" ON "public"."patient_sessions"("serviceAssignmentId");

-- CreateIndex
CREATE INDEX "patient_sessions_patientId_idx" ON "public"."patient_sessions"("patientId");

-- CreateIndex
CREATE INDEX "patient_sessions_therapistId_idx" ON "public"."patient_sessions"("therapistId");

-- CreateIndex
CREATE INDEX "patient_sessions_scheduledDate_idx" ON "public"."patient_sessions"("scheduledDate");

-- CreateIndex
CREATE INDEX "patient_sessions_status_idx" ON "public"."patient_sessions"("status");

-- CreateIndex
CREATE UNIQUE INDEX "therapeutic_plans_therapeuticProposalId_key" ON "public"."therapeutic_plans"("therapeuticProposalId");

-- CreateIndex
CREATE INDEX "therapeutic_plans_therapeuticProposalId_idx" ON "public"."therapeutic_plans"("therapeuticProposalId");

-- CreateIndex
CREATE INDEX "therapeutic_plans_patientId_idx" ON "public"."therapeutic_plans"("patientId");

-- CreateIndex
CREATE INDEX "therapeutic_plans_therapistId_idx" ON "public"."therapeutic_plans"("therapistId");

-- CreateIndex
CREATE INDEX "therapeutic_plans_status_idx" ON "public"."therapeutic_plans"("status");

-- CreateIndex
CREATE INDEX "progress_reports_therapeuticPlanId_idx" ON "public"."progress_reports"("therapeuticPlanId");

-- CreateIndex
CREATE INDEX "progress_reports_patientId_idx" ON "public"."progress_reports"("patientId");

-- CreateIndex
CREATE INDEX "progress_reports_therapistId_idx" ON "public"."progress_reports"("therapistId");

-- CreateIndex
CREATE INDEX "progress_reports_status_idx" ON "public"."progress_reports"("status");

-- CreateIndex
CREATE INDEX "final_reports_patientId_idx" ON "public"."final_reports"("patientId");

-- CreateIndex
CREATE INDEX "final_reports_therapistId_idx" ON "public"."final_reports"("therapistId");

-- CreateIndex
CREATE INDEX "final_reports_status_idx" ON "public"."final_reports"("status");

-- CreateIndex
CREATE INDEX "payments_parentId_idx" ON "public"."payments"("parentId");

-- CreateIndex
CREATE INDEX "payments_type_idx" ON "public"."payments"("type");

-- CreateIndex
CREATE INDEX "payments_status_idx" ON "public"."payments"("status");

-- CreateIndex
CREATE INDEX "payments_dueDate_idx" ON "public"."payments"("dueDate");

-- CreateIndex
CREATE INDEX "patient_documents_patientId_idx" ON "public"."patient_documents"("patientId");

-- CreateIndex
CREATE INDEX "schedule_requests_parentId_idx" ON "public"."schedule_requests"("parentId");

-- CreateIndex
CREATE INDEX "schedule_requests_status_idx" ON "public"."schedule_requests"("status");

-- AddForeignKey
ALTER TABLE "public"."therapists" ADD CONSTRAINT "therapists_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "public"."profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."parents" ADD CONSTRAINT "parents_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "public"."profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."admins" ADD CONSTRAINT "admins_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "public"."profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."patients" ADD CONSTRAINT "patients_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "public"."parents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sessions" ADD CONSTRAINT "sessions_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "public"."profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."audit_logs" ADD CONSTRAINT "audit_logs_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "public"."profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."consultation_reasons" ADD CONSTRAINT "consultation_reasons_specialtyId_fkey" FOREIGN KEY ("specialtyId") REFERENCES "public"."specialties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."therapist_specialties" ADD CONSTRAINT "therapist_specialties_therapistId_fkey" FOREIGN KEY ("therapistId") REFERENCES "public"."therapists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."therapist_specialties" ADD CONSTRAINT "therapist_specialties_specialtyId_fkey" FOREIGN KEY ("specialtyId") REFERENCES "public"."specialties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."therapist_schedules" ADD CONSTRAINT "therapist_schedules_therapistId_fkey" FOREIGN KEY ("therapistId") REFERENCES "public"."therapists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."services" ADD CONSTRAINT "services_specialtyId_fkey" FOREIGN KEY ("specialtyId") REFERENCES "public"."specialties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."consultation_requests" ADD CONSTRAINT "consultation_requests_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "public"."parents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."consultation_requests" ADD CONSTRAINT "consultation_requests_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "public"."patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."consultation_requests" ADD CONSTRAINT "consultation_requests_therapistId_fkey" FOREIGN KEY ("therapistId") REFERENCES "public"."therapists"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."consultation_requests" ADD CONSTRAINT "consultation_requests_reasonId_fkey" FOREIGN KEY ("reasonId") REFERENCES "public"."consultation_reasons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."consultation_forms" ADD CONSTRAINT "consultation_forms_consultationRequestId_fkey" FOREIGN KEY ("consultationRequestId") REFERENCES "public"."consultation_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."consultation_forms" ADD CONSTRAINT "consultation_forms_therapistId_fkey" FOREIGN KEY ("therapistId") REFERENCES "public"."therapists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."medical_forms" ADD CONSTRAINT "medical_forms_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "public"."patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

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
ALTER TABLE "public"."proposal_services" ADD CONSTRAINT "proposal_services_therapistId_fkey" FOREIGN KEY ("therapistId") REFERENCES "public"."therapists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

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
ALTER TABLE "public"."therapeutic_plans" ADD CONSTRAINT "therapeutic_plans_therapeuticProposalId_fkey" FOREIGN KEY ("therapeuticProposalId") REFERENCES "public"."therapeutic_proposals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."therapeutic_plans" ADD CONSTRAINT "therapeutic_plans_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "public"."patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."therapeutic_plans" ADD CONSTRAINT "therapeutic_plans_therapistId_fkey" FOREIGN KEY ("therapistId") REFERENCES "public"."therapists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."progress_reports" ADD CONSTRAINT "progress_reports_therapeuticPlanId_fkey" FOREIGN KEY ("therapeuticPlanId") REFERENCES "public"."therapeutic_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

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
ALTER TABLE "public"."patient_documents" ADD CONSTRAINT "patient_documents_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "public"."patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."schedule_requests" ADD CONSTRAINT "schedule_requests_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "public"."parents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
