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
  - [x] 1.1 Update Prisma schema with all therapy center models and relationships
  - [x] 1.2 Run `prisma migrate dev` to generate and apply migration files
  - [x] 1.3 Add proper indexes for performance optimization
  - [x] 1.4 Set up seed data for specialties, services, and initial configuration
  - [x] 1.5 Test database schema integrity and relationships
  - [x] 1.6 Configure database connection and environment variables

- [ ] 2.0 Consultation and Interview Scheduling System
  - [x] 2.1 Create header button/modal for consultation/interview selection
  - [x] 2.2 Build consultation vs interview selection modal with cost information
  - [x] 2.3 Build multi-step consultation questionnaire form with comprehensive validation (name capitalization, email format, phone numbers, required fields)
  - [x] 2.4 Build multi-step interview questionnaire form with comprehensive validation (name capitalization, email format, phone numbers, required fields)
  - [x] 2.5 Implement consultation reason selection with specialty mapping
  - [x] 2.6 Create dynamic calendar interface for schedule selection
  - [x] 2.7 Build therapist availability checking system
  - [x] 2.8 Implement automatic therapist assignment based on specialty
  - [x] 2.9 Create consultation request API endpoints with server-side validation
  - [x] 2.10 Implement consultation status tracking and updates

- [ ] 3.0 Payment Management System
  - [x] 3.1 Create payment processing interface with receipt upload
  - [x] 3.2 Build payment status tracking and management
  - [x] 3.3 Implement payment confirmation workflow for administrators
  - [x] 3.4 Create monthly payment plan management system
  - [x] 3.5 Implement payment history and reporting
  - [x] 3.6 Create payment API endpoints with validation
  - [x] 3.7 Add payment receipt storage and management
  - [x] 3.8 Implement payment timeout and cancellation logic
  - [x] 3.9 Create payment analytics and financial reporting

- [ ] 4.0 Medical Form Management System
  - [ ] 4.1 Create multi-step medical form for parents with save functionality and comprehensive validation (name capitalization, date formats, number fields, text length limits)
  - [ ] 4.2 Build therapist interface for completing medical forms with field validation (medical terminology, numeric values, date consistency)
  - [ ] 4.3 Implement form progress tracking and auto-save with validation state persistence
  - [ ] 4.4 Create medical form validation schema and data structure with Zod
  - [ ] 4.5 Build medical form API endpoints with server-side validation
  - [ ] 4.6 Implement medical history data visualization
  - [ ] 4.7 Create medical form templates and customization
  - [ ] 4.8 Add medical form sharing between therapists
  - [ ] 4.9 Implement medical form version control
  - [ ] 4.10 Create medical form export and PDF generation

- [ ] 5.0 Therapeutic Proposal System
  - [ ] 5.1 Create service catalog management for administrators with validation (service codes, pricing formats, duration values)
  - [ ] 5.2 Build therapeutic proposal creation form for therapists with service loading from database (treatments and evaluations) - hide pricing, show only sessions, duration, and service details
  - [ ] 5.3 Implement dual proposal system (A and B options) with session count validation - therapists select sessions, system calculates costs in background
  - [ ] 5.4 Create therapist assignment and specialty filtering with validation
  - [ ] 5.5 Build parent availability input and management with time format validation
  - [ ] 5.6 Implement proposal review interface for coordinators with form validation for edits and pricing visibility
  - [ ] 5.7 Create proposal approval interface for administrators with full cost visibility
  - [ ] 5.8 Build proposal cost calculation system (hidden from therapists, visible to coordinators/admins) with decimal precision validation
  - [ ] 5.9 Implement proposal PDF generation and download with pricing information
  - [ ] 5.10 Create proposal status tracking and workflow
  - [ ] 5.11 Build proposal API endpoints with comprehensive server-side validation and role-based data filtering

- [ ] 6.0 Advanced Session Scheduling System
  - [ ] 6.1 Create therapist schedule configuration interface
  - [ ] 6.2 Build advanced session scheduling calendar
  - [ ] 6.3 Implement conflict resolution and availability checking
  - [ ] 6.4 Create bulk session scheduling for approved proposals
  - [ ] 6.5 Build session duration and timing management
  - [ ] 6.6 Implement session confirmation system
  - [ ] 6.7 Create session scheduling API endpoints
  - [ ] 6.8 Build session calendar views for different roles
  - [ ] 6.9 Implement session capacity and workload management
  - [ ] 6.10 Create session scheduling analytics and reporting

- [ ] 7.0 Therapist Management and Dashboard
  - [ ] 7.1 Create therapist registration and profile management with validation (name capitalization, email format, phone numbers, license numbers)
  - [ ] 7.2 Build therapist specialty and certification management with validation
  - [ ] 7.3 Create therapist schedule configuration interface with time format validation and conflict checking
  - [ ] 7.4 Build therapist dashboard with agenda and patient overview
  - [ ] 7.5 Implement weekly agenda view with session management
  - [ ] 7.6 Create patient list and detailed patient information views
  - [ ] 7.7 Build session start/complete interface with notes and validation (time tracking, note length limits)
  - [ ] 7.8 Implement therapist availability management with time validation
  - [ ] 7.9 Create therapist workload and capacity tracking
  - [ ] 7.10 Build therapist performance analytics
  - [ ] 7.11 Implement therapist API endpoints with comprehensive validation
  - [ ] 7.12 Create therapist mobile-responsive interfaces

- [ ] 8.0 Patient Progress Tracking and Reporting
  - [ ] 8.1 Create therapeutic plan creation form after first session with validation (objective formatting, metric ranges, text length limits)
  - [ ] 8.2 Build progress report creation form after second session with validation (progress scores, achievement descriptions, numeric metrics)
  - [ ] 8.3 Implement final report creation form after treatment completion with validation (outcome measurements, recommendation formatting)
  - [ ] 8.4 Create progress metrics tracking and visualization with numeric validation
  - [ ] 8.5 Build report templates and customization with field validation
  - [ ] 8.6 Implement multi-therapist report collaboration with validation consistency
  - [ ] 8.7 Create progress timeline and milestone tracking with date validation
  - [ ] 8.8 Build patient progress API endpoints with comprehensive validation
  - [ ] 8.9 Implement progress report PDF generation
  - [ ] 8.10 Create progress analytics and insights

- [ ] 9.0 Report Management and Approval Workflow
  - [ ] 9.1 Create report submission workflow for therapists
  - [ ] 9.2 Build coordinator report review and approval interface
  - [ ] 9.3 Implement report rejection and revision system
  - [ ] 9.4 Create comprehensive final report compilation by coordinators
  - [ ] 9.5 Build administrator report viewing and distribution
  - [ ] 9.6 Create report version control and history
  - [ ] 9.7 Build report approval API endpoints
  - [ ] 9.8 Implement report status tracking and workflow
  - [ ] 9.9 Create report distribution to parents

- [ ] 10.0 Administrative Functions and User Management
  - [ ] 10.1 Create user registration and management interface with validation (email uniqueness, password strength, role assignment)
  - [ ] 10.2 Build patient registration with complete information form and comprehensive validation (name capitalization, date formats, contact validation)
  - [ ] 10.3 Implement parent credential generation and management with password validation
  - [ ] 10.4 Create document management system for patients with file validation (type, size, naming)
  - [ ] 10.5 Build global schedule view and management
  - [ ] 10.6 Implement consultation and payment confirmation workflows with validation
  - [ ] 10.7 Create financial tracking and reporting dashboard with numeric validation
  - [ ] 10.8 Build system configuration and settings management with validation
  - [ ] 10.9 Implement user role management and permissions with validation
  - [ ] 10.10 Create administrative API endpoints with comprehensive validation
  - [ ] 10.11 Build administrative mobile interfaces
  - [ ] 10.12 Implement audit logging and activity tracking

- [ ] 11.0 Rescheduling System (Manual and Automatic)
  - [ ] 11.1 Create manual session rescheduling interface with date/time validation
  - [ ] 11.2 Build automatic rescheduling algorithm with availability matching and validation
  - [ ] 11.3 Implement service mixing and distribution logic with constraint validation
  - [ ] 11.4 Create therapist change and reassignment system with validation
  - [ ] 11.5 Build parent rescheduling request interface with form validation (date formats, reason requirements)
  - [ ] 11.6 Implement rescheduling approval workflow with validation
  - [ ] 11.7 Build rescheduling API endpoints with comprehensive validation
  - [ ] 11.8 Implement rescheduling history and tracking
  - [ ] 11.9 Create rescheduling analytics and reporting

- [ ] 12.0 Parent Portal and Patient Information Access
  - [ ] 12.1 Create parent dashboard with patient overview
  - [ ] 12.2 Build patient progress viewing interface
  - [ ] 12.3 Implement session schedule and history viewing
  - [ ] 12.4 Create payment information and history interface
  - [ ] 12.5 Build approved report viewing system
  - [ ] 12.6 Implement session comments and therapist notes viewing
  - [ ] 12.7 Create rescheduling request interface for parents
  - [ ] 12.8 Implement parent API endpoints
  - [ ] 12.9 Create parent mobile-responsive interfaces

- [ ] 13.0 Super Administrator Functions
  - [ ] 13.1 Create financial oversight and analytics dashboard
  - [ ] 13.2 Build advanced user management system
  - [ ] 13.3 Implement system configuration and settings
  - [ ] 13.4 Create comprehensive financial reporting
  - [ ] 13.5 Build payment analytics and tracking
  - [ ] 13.6 Implement system health monitoring
  - [ ] 13.7 Create backup and data management tools
  - [ ] 13.8 Build super admin API endpoints
  - [ ] 13.9 Implement system audit and compliance reporting
  - [ ] 13.10 Create super admin mobile interfaces

- [ ] 14.0 System Integration and Configuration
  - [ ] 14.1 Configure system notification templates
  - [ ] 14.2 Set up file storage and document management
  - [ ] 14.3 Implement PDF generation for all reports
  - [ ] 14.4 Configure authentication and authorization middleware
  - [ ] 14.5 Set up rate limiting and security measures
  - [ ] 14.6 Implement data backup and recovery systems
  - [ ] 14.7 Configure monitoring and logging systems
  - [ ] 14.8 Set up error handling and reporting
  - [ ] 14.9 Implement API documentation and testing
  - [ ] 14.10 Configure deployment and CI/CD pipeline

- [ ] 15.0 Testing, Documentation, and Deployment
  - [ ] 15.1 Create comprehensive unit tests for all components
  - [ ] 15.2 Build integration tests for API endpoints
  - [ ] 15.3 Implement end-to-end testing for critical workflows
  - [ ] 15.4 Create user documentation and help guides
  - [ ] 15.5 Build developer documentation and API references
  - [ ] 15.6 Implement performance testing and optimization
  - [ ] 15.7 Create security testing and vulnerability assessment
  - [ ] 15.8 Build deployment scripts and configuration
  - [ ] 15.9 Implement monitoring and alerting systems
  - [ ] 15.10 Create maintenance and support procedures
