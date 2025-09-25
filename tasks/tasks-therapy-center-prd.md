# Task List: Specialized Therapy Center Management System

Based on the comprehensive PRD analysis and current codebase assessment, this document outlines all tasks required to implement the complete therapy center management system.

## Relevant Files

### Database & Schema

- `prisma/schema.prisma` - Database schema with existing models (needs updates for missing features)
- `prisma/migrations/` - Database migration files for new schema changes

### API Routes

- `src/app/api/consultation-requests/route.ts` - Consultation request management API
- `src/app/api/consultation-requests/[id]/route.ts` - Individual consultation request operations
- `src/app/api/interview-requests/route.ts` - Interview request management API
- `src/app/api/interview-requests/[id]/route.ts` - Individual interview request operations
- `src/app/api/payments/route.ts` - Payment processing and tracking API
- `src/app/api/payments/[id]/route.ts` - Individual payment operations
- `src/app/api/treatment-proposals/route.ts` - Therapeutic proposal management API
- `src/app/api/treatment-proposals/[id]/route.ts` - Individual proposal operations
- `src/app/api/proposal-services/route.ts` - Proposal service management API
- `src/app/api/session-scheduling/route.ts` - Session scheduling API
- `src/app/api/session-rescheduling/route.ts` - Session rescheduling API
- `src/app/api/medical-forms/route.ts` - Medical form management API
- `src/app/api/consultation-forms/route.ts` - Consultation form management API
- `src/app/api/therapeutic-plans/route.ts` - Therapeutic plan management API
- `src/app/api/progress-reports/route.ts` - Progress report management API
- `src/app/api/final-reports/route.ts` - Final report management API
- `src/app/api/report-approvals/route.ts` - Report approval workflow API
- `src/app/api/patient-documents/route.ts` - Patient document management API
- `src/app/api/automatic-rescheduling/route.ts` - Automatic rescheduling logic API
- `src/app/api/parent-availability/route.ts` - Parent availability management API
- `src/app/api/consultation-pricing/route.ts` - Consultation pricing management API
- `src/app/api/session-duration/route.ts` - Session duration configuration API
- `src/app/api/payment-plans/route.ts` - Payment plan management API
- `src/app/api/credential-generation/route.ts` - Parent credential generation API
- `src/app/api/pdf-generation/route.ts` - PDF report generation API
- `src/app/api/email-notifications/route.ts` - Email notification system API

### Frontend Components

- `src/components/consultation/ConsultationSchedulingForm.tsx` - Main consultation scheduling form
- `src/components/consultation/ConsultationQuestionnaire.tsx` - Multi-step consultation questionnaire
- `src/components/consultation/InterviewQuestionnaire.tsx` - Multi-step interview questionnaire
- `src/components/consultation/ReasonSelection.tsx` - Consultation reason selection component
- `src/components/consultation/ScheduleSelection.tsx` - Calendar interface for schedule selection
- `src/components/payment/PaymentInterface.tsx` - Payment processing interface
- `src/components/payment/ReceiptUpload.tsx` - Payment receipt upload component
- `src/components/payment/PaymentTracking.tsx` - Payment status tracking component
- `src/components/medical/MedicalFormParent.tsx` - Parent medical form component
- `src/components/medical/MedicalFormTherapist.tsx` - Therapist medical form component
- `src/components/medical/MedicalFormSave.tsx` - Medical form save functionality
- `src/components/proposals/ProposalCreation.tsx` - Therapeutic proposal creation form
- `src/components/proposals/ServiceSelection.tsx` - Service selection component
- `src/components/proposals/DualProposalSystem.tsx` - Proposal A and B creation
- `src/components/proposals/TherapistAssignment.tsx` - Therapist assignment component
- `src/components/proposals/ParentAvailability.tsx` - Parent availability input
- `src/components/proposals/ProposalReview.tsx` - Coordinator proposal review
- `src/components/proposals/ProposalApproval.tsx` - Administrator proposal approval
- `src/components/scheduling/SessionScheduling.tsx` - Advanced session scheduling
- `src/components/scheduling/MonthlyCalendar.tsx` - Monthly calendar interface
- `src/components/scheduling/TherapistAvailability.tsx` - Therapist availability display
- `src/components/scheduling/ConflictResolution.tsx` - Scheduling conflict resolution
- `src/components/therapist/TherapistDashboard.tsx` - Therapist main dashboard
- `src/components/therapist/WeeklyAgenda.tsx` - Weekly agenda view
- `src/components/therapist/PatientManagement.tsx` - Patient management interface
- `src/components/therapist/SessionManagement.tsx` - Session start/complete interface
- `src/components/therapist/ConsultationSettings.tsx` - Consultation availability settings
- `src/components/therapist/ScheduleManagement.tsx` - Therapist schedule management
- `src/components/progress/TherapeuticPlan.tsx` - Therapeutic plan creation
- `src/components/progress/ProgressReport.tsx` - Progress report creation
- `src/components/progress/FinalReport.tsx` - Final report creation
- `src/components/progress/MetricTracking.tsx` - Progress metric tracking
- `src/components/reports/ReportWorkflow.tsx` - Report approval workflow
- `src/components/reports/ReportDistribution.tsx` - Report distribution to parents
- `src/components/reports/PDFGeneration.tsx` - PDF report generation
- `src/components/admin/UserManagement.tsx` - User account management
- `src/components/admin/PatientRegistration.tsx` - Complete patient registration
- `src/components/admin/DocumentManagement.tsx` - Patient document management
- `src/components/admin/GlobalSchedule.tsx` - Global schedule view
- `src/components/admin/SessionRescheduling.tsx` - Session rescheduling interface
- `src/components/admin/AutomaticRescheduling.tsx` - Automatic rescheduling system
- `src/components/admin/FinancialManagement.tsx` - Financial tracking and reports
- `src/components/admin/PaymentPlanManagement.tsx` - Payment plan management
- `src/components/admin/CredentialManagement.tsx` - Parent credential management
- `src/components/rescheduling/ManualRescheduling.tsx` - Manual rescheduling interface
- `src/components/rescheduling/AutomaticRescheduling.tsx` - Automatic rescheduling logic
- `src/components/rescheduling/TherapistChanges.tsx` - Therapist reassignment
- `src/components/rescheduling/ServiceMixing.tsx` - Service distribution logic
- `src/components/parent/ParentDashboard.tsx` - Parent main dashboard
- `src/components/parent/PatientProgress.tsx` - Patient progress viewing
- `src/components/parent/SessionSchedule.tsx` - Session schedule viewing
- `src/components/parent/ReschedulingRequest.tsx` - Rescheduling request form
- `src/components/parent/PaymentInformation.tsx` - Payment information and history
- `src/components/parent/ReportViewing.tsx` - Approved report viewing
- `src/components/parent/SessionComments.tsx` - Session comment viewing
- `src/components/super-admin/FinancialOversight.tsx` - Financial oversight dashboard
- `src/components/super-admin/UserManagement.tsx` - Advanced user management
- `src/components/super-admin/SystemConfiguration.tsx` - System configuration
- `src/components/super-admin/FinancialAnalytics.tsx` - Advanced financial analytics

### Hooks & Utilities

- `src/hooks/useConsultationRequests.ts` - Consultation request management hooks
- `src/hooks/useInterviewRequests.ts` - Interview request management hooks
- `src/hooks/usePayments.ts` - Payment management hooks
- `src/hooks/useTreatmentProposals.ts` - Treatment proposal hooks
- `src/hooks/useSessionScheduling.ts` - Session scheduling hooks
- `src/hooks/useMedicalForms.ts` - Medical form management hooks
- `src/hooks/useTherapeuticPlans.ts` - Therapeutic plan hooks
- `src/hooks/useProgressReports.ts` - Progress report hooks
- `src/hooks/useFinalReports.ts` - Final report hooks
- `src/hooks/useReportApprovals.ts` - Report approval workflow hooks
- `src/hooks/usePatientDocuments.ts` - Patient document hooks
- `src/hooks/useAutomaticRescheduling.ts` - Automatic rescheduling hooks
- `src/hooks/useParentAvailability.ts` - Parent availability hooks
- `src/hooks/useConsultationPricing.ts` - Consultation pricing hooks
- `src/hooks/useSessionDuration.ts` - Session duration configuration hooks
- `src/hooks/usePaymentPlans.ts` - Payment plan hooks
- `src/hooks/useCredentialGeneration.ts` - Credential generation hooks
- `src/hooks/usePDFGeneration.ts` - PDF generation hooks
- `src/hooks/useEmailNotifications.ts` - Email notification hooks
- `src/lib/consultation-utils.ts` - Consultation utility functions
- `src/lib/payment-utils.ts` - Payment processing utilities
- `src/lib/scheduling-utils.ts` - Scheduling algorithm utilities
- `src/lib/proposal-utils.ts` - Proposal calculation utilities
- `src/lib/report-utils.ts` - Report generation utilities
- `src/lib/rescheduling-utils.ts` - Rescheduling algorithm utilities
- `src/lib/availability-utils.ts` - Availability calculation utilities
- `src/lib/pdf-utils.ts` - PDF generation utilities
- `src/lib/email-utils.ts` - Email template utilities

### Pages & Routes

- `src/app/consultation/page.tsx` - Consultation scheduling landing page
- `src/app/consultation/questionnaire/page.tsx` - Consultation questionnaire page
- `src/app/consultation/schedule/page.tsx` - Schedule selection page
- `src/app/consultation/payment/page.tsx` - Payment processing page
- `src/app/interview/page.tsx` - Interview scheduling page
- `src/app/interview/questionnaire/page.tsx` - Interview questionnaire page
- `src/app/medical-forms/page.tsx` - Medical form completion page
- `src/app/proposals/page.tsx` - Therapeutic proposal creation page
- `src/app/proposals/review/page.tsx` - Proposal review page
- `src/app/proposals/approval/page.tsx` - Proposal approval page
- `src/app/scheduling/page.tsx` - Session scheduling page
- `src/app/therapist/dashboard/page.tsx` - Therapist dashboard page
- `src/app/therapist/patients/page.tsx` - Therapist patient management page
- `src/app/therapist/sessions/page.tsx` - Therapist session management page
- `src/app/therapist/reports/page.tsx` - Therapist report creation page
- `src/app/coordinator/proposals/page.tsx` - Coordinator proposal review page
- `src/app/coordinator/reports/page.tsx` - Coordinator report approval page
- `src/app/admin/dashboard/page.tsx` - Administrator dashboard page
- `src/app/admin/patients/page.tsx` - Patient management page
- `src/app/admin/scheduling/page.tsx` - Global scheduling page
- `src/app/admin/rescheduling/page.tsx` - Rescheduling management page
- `src/app/admin/financial/page.tsx` - Financial management page
- `src/app/parent/dashboard/page.tsx` - Parent dashboard page
- `src/app/parent/progress/page.tsx` - Patient progress viewing page
- `src/app/parent/schedule/page.tsx` - Session schedule viewing page
- `src/app/parent/payments/page.tsx` - Payment information page
- `src/app/super-admin/dashboard/page.tsx` - Super admin dashboard page
- `src/app/super-admin/financial/page.tsx` - Financial oversight page
- `src/app/super-admin/users/page.tsx` - User management page

### Test Files

- `src/app/api/consultation-requests/route.test.ts` - Consultation API tests
- `src/app/api/payments/route.test.ts` - Payment API tests
- `src/app/api/treatment-proposals/route.test.ts` - Proposal API tests
- `src/components/consultation/ConsultationSchedulingForm.test.tsx` - Consultation form tests
- `src/components/payment/PaymentInterface.test.tsx` - Payment component tests
- `src/components/proposals/ProposalCreation.test.tsx` - Proposal component tests
- `src/hooks/useConsultationRequests.test.ts` - Consultation hook tests
- `src/hooks/usePayments.test.ts` - Payment hook tests
- `src/lib/scheduling-utils.test.ts` - Scheduling utility tests
- `src/lib/proposal-utils.test.ts` - Proposal utility tests

### Notes

- Unit tests should be placed alongside the code files they are testing
- Use `npx jest [optional/path/to/test/file]` to run tests
- All API routes should include proper authentication and authorization
- All forms should use react-hook-form with zod validation
- All components should follow the existing shadcn/ui pattern
- All database operations must use Prisma client
- All file uploads should use Supabase Storage
- All PDF generation should use React PDF
- All email notifications should use Resend

## Tasks

- [ ] 1.0 Database Schema Enhancement and Migration
- [ ] 2.0 Consultation and Interview Scheduling System
- [ ] 3.0 Payment Management System
- [ ] 4.0 Medical Form Management System
- [ ] 5.0 Therapeutic Proposal System
- [ ] 6.0 Advanced Session Scheduling System
- [ ] 7.0 Therapist Management and Dashboard
- [ ] 8.0 Patient Progress Tracking and Reporting
- [ ] 9.0 Report Management and Approval Workflow
- [ ] 10.0 Administrative Functions and User Management
- [ ] 11.0 Rescheduling System (Manual and Automatic)
- [ ] 12.0 Parent Portal and Patient Information Access
- [ ] 13.0 Super Administrator Functions
- [ ] 14.0 System Integration and Configuration
- [ ] 15.0 Testing, Documentation, and Deployment
