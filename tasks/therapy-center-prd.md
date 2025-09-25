# Product Requirements Document (PRD)

## Specialized Therapy Center Management System

### Document Information

- **Version**: 1.0
- **Date**: January 2025
- **Project**: Vivir Feliz - Specialized Therapy Center Application
- **Type**: Web Application

---

## 1. Executive Summary

### 1.1 Product Overview

The Specialized Therapy Center Management System is a comprehensive web application designed to manage the complete lifecycle of therapy services for children with special needs. The system facilitates consultation scheduling, therapeutic proposal management, session scheduling, progress tracking, and administrative oversight for a specialized therapy center.

### 1.2 Target Users

- **Parents/Guardians**: Schedule consultations, view progress, manage payments
- **Therapists**: Conduct consultations, create therapeutic proposals, manage sessions
- **Coordinators**: Review and approve therapeutic proposals, manage therapists
- **Administrators**: Manage the entire system, confirm payments, schedule sessions
- **Super Administrators**: Financial oversight, user management, system administration

### 1.3 Key Value Propositions

- Streamlined consultation and interview scheduling process
- Comprehensive therapeutic proposal management
- Automated session scheduling with therapist availability
- Complete patient progress tracking and reporting
- Integrated payment management system
- Multi-role access with appropriate permissions

---

## 2. Product Goals and Objectives

### 2.1 Primary Goals

1. **Streamline Consultation Process**: Enable parents to easily schedule consultations and interviews for their children
2. **Optimize Therapist Management**: Efficiently manage therapist schedules, specialties, and availability
3. **Automate Session Scheduling**: Intelligent scheduling system that considers therapist availability and service requirements
4. **Track Patient Progress**: Comprehensive tracking of patient development through structured reports
5. **Manage Financial Operations**: Integrated payment tracking and management system

### 2.2 Success Metrics

- Reduction in consultation scheduling time by 70%
- Increase in therapist utilization efficiency by 50%
- 95% accuracy in session scheduling
- Complete digitalization of patient records
- 100% payment tracking and management

---

## 3. User Roles and Permissions

### 3.1 Parents/Guardians

**Primary Functions:**

- Schedule consultations and interviews
- Complete initial information questionnaires
- Complete medical forms
- Make payments and upload payment receipts
- View patient progress and reports
- View session schedules and comments
- Request session rescheduling

**Permissions:**

- Read-only access to patient information
- Create consultation requests
- Upload payment documents
- View approved reports and plans
- Request session modifications

### 3.2 Therapists

**Primary Functions:**

- Conduct consultations and interviews
- Complete consultation forms and diagnostic hypotheses
- Create therapeutic proposals
- Manage patient sessions
- Generate therapeutic plans
- Create progress reports
- Complete final reports

**Permissions:**

- Full access to assigned patient information
- Create and edit therapeutic proposals
- Manage session schedules
- Generate and submit reports
- View therapist schedule and availability

### 3.3 Coordinators

**Primary Functions:**

- Review and approve therapeutic proposals
- Manage therapist schedules and availability
- Review and approve therapist reports
- Create comprehensive final reports
- Manage therapist assignments

**Permissions:**

- Edit therapeutic proposals
- Approve/reject reports
- Manage therapist settings
- Access all patient information
- Create final comprehensive reports

### 3.4 Administrators

**Primary Functions:**

- Confirm consultations and payments
- Manage therapist registration and schedules
- Schedule patient sessions
- Manage parent/patient records
- Handle session rescheduling
- Generate system reports

**Permissions:**

- Full system access except super admin functions
- Manage all user accounts
- Access financial information
- Schedule and reschedule sessions
- Manage patient documents

### 3.5 Super Administrators

**Primary Functions:**

- Financial oversight and reporting
- User management (admin and therapist registration)
- System configuration
- Advanced financial analytics

**Permissions:**

- Complete system access
- Financial reporting and analytics
- User account management
- System configuration

---

## 4. Core Features and Functionality

### 4.1 Consultation and Interview Scheduling

#### 4.1.1 Initial Access and Selection

- **Landing Page**: Parents access the application to schedule consultations or interviews
- **Service Selection**:
  - Consultation (paid service with configurable pricing)
  - Interview (free service)
- **Pricing Management**: Administrators can modify consultation costs

#### 4.1.2 Information Questionnaire

- **Multi-step Form**: Comprehensive questionnaire for consultation/interview
- **Different Forms**: Separate questionnaires for consultations vs interviews
- **Data Collection**: Essential information for the consultation process
- **Form Validation**: Complete validation before proceeding

#### 4.1.3 Consultation Reason Selection (Consultations Only)

- **Reason Selection**: Parents select consultation reasons
- **Specialty Matching**: System matches reasons to appropriate therapist specialties
- **Specialty-based Assignment**: Ensures proper therapist assignment

#### 4.1.4 Schedule Selection

- **Availability Search**: System searches available time slots across all therapists in selected specialty
- **Calendar Interface**: Interactive calendar showing available dates and times
- **Time Configuration**: Configurable session duration for consultations and interviews
- **Automatic Assignment**: System assigns consultation to available therapist

### 4.2 Payment Management

#### 4.2.1 Payment Processing

- **Payment Interface**: Secure payment processing system
- **Receipt Upload**: Parents can upload payment receipts (PDF or images)
- **Administrator Review**: Administrators review and confirm payments
- **Payment Confirmation**: System confirms payment before finalizing consultation

#### 4.2.2 Payment Tracking

- **Payment Status**: Track payment status (pending, confirmed, rejected)
- **Timeout Management**: Automatic cancellation of unpaid consultations
- **Receipt Management**: Store and manage payment receipts
- **Payment History**: Complete payment history for each patient

### 4.3 Medical Form Management

#### 4.3.1 Parent Medical Forms

- **Multi-step Medical Form**: Detailed medical information form
- **Save Functionality**: Save progress at any step
- **Therapist Access**: Therapists can complete missing information during consultation
- **Data Persistence**: All form data saved for future reference

#### 4.3.2 Consultation Forms

- **Therapist Forms**: Forms filled during consultation
- **Automatic Data Population**: Some fields auto-populated from previous forms
- **Diagnostic Hypotheses**: Therapist input for diagnostic assessments
- **Medical History**: Complete medical history tracking

### 4.4 Therapeutic Proposal System

#### 4.4.1 Proposal Creation

- **Treatment Duration Selection**: Choose treatment period (2, 3, 6 months, etc.)
- **Service Selection**: Select treatments and evaluations
- **Service Configuration**:
  - Service code and name
  - Predetermined session count
  - Cost per session
  - Session duration
  - Required therapist specialty
- **Dual Proposal System**: Create Proposal A and Proposal B with different session counts
- **Therapist Assignment**: Assign specific therapists to each service
- **Parent Availability**: Record parent and patient availability

#### 4.4.2 Service Management

- **Service Database**: Comprehensive service catalog
- **Administrator Control**: Add, edit, or remove services
- **Specialty Filtering**: Services filtered by therapist specialty
- **Dynamic Pricing**: Configurable pricing per service

#### 4.4.3 Proposal Review Process

- **Coordinator Review**: Coordinators review and edit proposals
- **Administrator Approval**: Final approval by administrators
- **PDF Generation**: Generate PDF reports of approved proposals
- **Status Tracking**: Track proposal status through approval process

### 4.5 Session Scheduling System

#### 4.5.1 Advanced Scheduling

- **Therapist Availability**: Consider individual therapist schedules
- **Service Duration**: Match session duration to service requirements
- **Parent Availability**: Consider parent and patient availability
- **Conflict Resolution**: Handle scheduling conflicts automatically

#### 4.5.2 Schedule Management

- **Monthly Calendar**: Month-by-month scheduling interface
- **Therapist Schedules**: Individual therapist schedule management
- **Session Confirmation**: Confirm and register scheduled sessions
- **Automatic Assignment**: Assign sessions to therapist calendars

### 4.6 Therapist Management

#### 4.6.1 Therapist Configuration

- **Consultation Settings**: Enable/disable consultation availability
- **Schedule Management**: Set working hours and break times
- **Specialty Assignment**: Assign therapist specialties
- **Availability Control**: Manage therapist availability

#### 4.6.2 Therapist Dashboard

- **Weekly Agenda**: View all sessions, consultations, and interviews
- **Patient Management**: Access assigned patients
- **Session Management**: Start and complete sessions
- **Report Generation**: Create therapeutic plans and progress reports

### 4.7 Patient Progress Tracking

#### 4.7.1 Therapeutic Plan

- **Plan Creation**: Generate after first completed session
- **Objective Setting**: Define treatment objectives
- **Metric Definition**: Establish progress measurement metrics
- **Recommendation System**: Provide treatment recommendations

#### 4.7.2 Progress Reports

- **Progress Tracking**: Generate after second session
- **Metric Updates**: Update progress metrics
- **Advancement Assessment**: Evaluate patient advancement
- **Continuous Monitoring**: Ongoing progress evaluation

#### 4.7.3 Final Reports

- **Comprehensive Assessment**: Complete treatment evaluation
- **Final Metrics**: Final progress measurement update
- **Treatment Summary**: Complete treatment overview
- **Multi-therapist Integration**: Combine reports from multiple therapists

### 4.8 Report Management System

#### 4.8.1 Report Workflow

- **Therapist Submission**: Therapists submit reports
- **Coordinator Review**: Coordinators review and approve/reject
- **Administrator Access**: Administrators view approved reports
- **Parent Distribution**: Share reports with parents

#### 4.8.2 Report Types

- **Therapeutic Plans**: Initial treatment planning documents
- **Progress Reports**: Ongoing progress assessments
- **Final Reports**: Comprehensive treatment summaries
- **Session Comments**: Individual session feedback

### 4.9 Administrative Functions

#### 4.9.1 User Management

- **Parent Registration**: Create parent accounts with generated credentials
- **Therapist Management**: Register, edit, and manage therapists
- **Password Management**: Reset passwords for all user types
- **Account Status**: Enable/disable user accounts

#### 4.9.2 Patient Management

- **Patient Registration**: Complete patient registration process
- **Document Management**: Upload, edit, and manage patient documents
- **Medical History**: Access complete patient medical history
- **Progress Tracking**: Monitor patient progress across all services

#### 4.9.3 Session Management

- **Global Schedule**: View all therapist schedules
- **Session Rescheduling**: Handle session rescheduling requests
- **Automatic Rescheduling**: Intelligent rescheduling based on availability
- **Service Mixing**: Distribute services across available time slots

#### 4.9.4 Financial Management

- **Payment Tracking**: Monitor all payments and outstanding amounts
- **Payment Plans**: Manage monthly payment plans
- **Financial Reports**: Generate comprehensive financial reports
- **Outstanding Balance**: Track unpaid amounts

### 4.10 Rescheduling System

#### 4.10.1 Manual Rescheduling

- **Administrator Control**: Administrators can reschedule sessions
- **Reason Tracking**: Record rescheduling reasons
- **Availability Consideration**: Consider new parent availability

#### 4.10.2 Automatic Rescheduling

- **Availability Input**: New parent availability (Monday-Sunday, morning/afternoon)
- **Frequency Selection**: Weekly frequency (1-6 sessions per week)
- **Service Mixing**: Distribute services across available days
- **Automatic Assignment**: System automatically assigns new time slots

#### 4.10.3 Therapist Changes

- **Therapist Reassignment**: Change therapist for specific services
- **Schedule Integration**: Integrate new therapist schedule
- **Availability Matching**: Match new therapist availability with parent availability

---

## 5. Technical Requirements

### 5.1 Technology Stack

- **Frontend**: Next.js 15.1.7 with App Router, React 19.0.0
- **UI Framework**: TailwindCSS 3.4.17, shadcn/ui components
- **Icons**: Lucide React
- **Forms**: react-hook-form 7.54.2, zod 3.24.2
- **State Management**: Tanstack React Query 5.66.7
- **Animation**: Framer Motion 12.4.7
- **Backend**: Next.js API Routes
- **Database**: Prisma 6.4.0 with PostgreSQL
- **Authentication**: Supabase Auth, NextAuth
- **Email**: Resend for transactional emails
- **PDF Generation**: React PDF for report generation
- **File Storage**: Supabase Storage for document management

### 5.2 Database Requirements

- **Patient Management**: Complete patient and parent information
- **User Management**: Multi-role user system
- **Schedule Management**: Complex scheduling with availability tracking
- **Payment Tracking**: Comprehensive payment and billing system
- **Document Storage**: Secure document storage and management
- **Report System**: Structured report generation and approval workflow

### 5.3 Security Requirements

- **Role-based Access Control**: Strict permission system
- **Data Encryption**: Secure data transmission and storage
- **Document Security**: Secure document upload and access
- **Payment Security**: Secure payment processing
- **Audit Trail**: Complete activity logging

### 5.4 Performance Requirements

- **Response Time**: < 2 seconds for all user interactions
- **Concurrent Users**: Support 100+ concurrent users
- **Data Integrity**: 99.9% data integrity
- **Uptime**: 99.5% system availability

---

## 6. User Experience Requirements

### 6.1 Interface Design

- **Responsive Design**: Mobile-first responsive design
- **Accessibility**: WCAG 2.1 AA compliance
- **Intuitive Navigation**: Clear and logical navigation structure
- **Consistent UI**: Consistent design language throughout

### 6.2 User Workflows

- **Streamlined Processes**: Minimize steps for common tasks
- **Progress Indicators**: Clear progress indication for multi-step processes
- **Error Handling**: Comprehensive error handling and user feedback
- **Help System**: Contextual help and guidance

### 6.3 Mobile Experience

- **Mobile Optimization**: Full functionality on mobile devices
- **Touch Interface**: Optimized for touch interactions
- **Offline Capability**: Basic offline functionality where appropriate

---

## 7. Integration Requirements

### 7.1 Payment Integration

- **Payment Gateway**: Secure payment processing integration
- **Receipt Management**: Automated receipt processing
- **Payment Tracking**: Real-time payment status updates

### 7.2 Email Integration

- **Notification System**: Automated email notifications
- **Credential Delivery**: Secure credential delivery to parents
- **Report Distribution**: Email-based report distribution

### 7.3 Document Management

- **File Upload**: Secure file upload system
- **Document Storage**: Organized document storage
- **Access Control**: Role-based document access

---

## 8. Data Requirements

### 8.1 Patient Data

- **Personal Information**: Complete patient and parent information
- **Medical History**: Comprehensive medical history tracking
- **Treatment Records**: Complete treatment and session records
- **Progress Data**: Detailed progress tracking and metrics

### 8.2 System Data

- **User Management**: Complete user account information
- **Schedule Data**: Complex scheduling and availability data
- **Financial Data**: Payment and billing information
- **Report Data**: Structured report and document data

### 8.3 Configuration Data

- **Service Configuration**: Dynamic service and pricing configuration
- **Schedule Configuration**: Flexible scheduling parameters
- **System Settings**: Configurable system parameters

---

## 9. Compliance and Legal Requirements

### 9.1 Data Privacy

- **GDPR Compliance**: European data protection compliance
- **HIPAA Considerations**: Healthcare data protection
- **Data Retention**: Appropriate data retention policies
- **Consent Management**: Proper consent collection and management

### 9.2 Security Compliance

- **Data Encryption**: End-to-end data encryption
- **Access Logging**: Comprehensive access and activity logging
- **Secure Storage**: Secure data storage practices
- **Regular Audits**: Regular security audits and assessments

---

## 10. Success Criteria and KPIs

### 10.1 Operational Metrics

- **Consultation Scheduling Time**: < 10 minutes average
- **Session Scheduling Accuracy**: 95% accuracy
- **Payment Processing Time**: < 24 hours
- **Report Generation Time**: < 5 minutes

### 10.2 User Satisfaction

- **User Adoption Rate**: 90% of therapists using system
- **Parent Satisfaction**: 85% satisfaction rating
- **System Usability**: 4.5/5 usability rating
- **Support Ticket Reduction**: 50% reduction in support requests

### 10.3 Business Impact

- **Administrative Efficiency**: 60% reduction in administrative time
- **Revenue Tracking**: 100% payment tracking accuracy
- **Patient Progress**: Improved patient outcome tracking
- **Resource Utilization**: 40% improvement in therapist utilization

---

## 11. Risk Assessment and Mitigation

### 11.1 Technical Risks

- **Data Loss**: Regular backups and disaster recovery
- **System Downtime**: High availability architecture
- **Security Breaches**: Comprehensive security measures
- **Performance Issues**: Performance monitoring and optimization

### 11.2 Business Risks

- **User Adoption**: Comprehensive training and support
- **Data Privacy**: Strict compliance measures
- **Integration Issues**: Thorough testing and validation
- **Scalability**: Scalable architecture design

---

## 12. Implementation Timeline

### 12.1 Phase 1: Core Foundation (Months 1-3)

- User authentication and role management
- Basic consultation scheduling
- Payment processing
- Medical form system

### 12.2 Phase 2: Advanced Features (Months 4-6)

- Therapeutic proposal system
- Session scheduling
- Therapist management
- Report generation

### 12.3 Phase 3: Optimization (Months 7-9)

- Advanced scheduling features
- Comprehensive reporting
- Mobile optimization
- Performance optimization

### 12.4 Phase 4: Enhancement (Months 10-12)

- Advanced analytics
- Integration enhancements
- User experience improvements
- System optimization

---

## 13. Maintenance and Support

### 13.1 Ongoing Maintenance

- **Regular Updates**: Monthly system updates
- **Security Patches**: Immediate security patch deployment
- **Performance Monitoring**: Continuous performance monitoring
- **Data Backup**: Daily automated backups

### 13.2 User Support

- **Training Materials**: Comprehensive user training
- **Help Documentation**: Detailed help and documentation
- **Support Channels**: Multiple support channels
- **Response Time**: < 24 hours support response time

---

## 14. Conclusion

The Specialized Therapy Center Management System represents a comprehensive solution for managing all aspects of a therapy center's operations. The system addresses the complex needs of multiple user roles while providing a streamlined, efficient, and user-friendly experience. The detailed feature set ensures complete coverage of the therapy center's workflow, from initial consultation scheduling to final report generation and distribution.

The system's architecture supports scalability, security, and maintainability while providing the flexibility needed to adapt to changing business requirements. The implementation of this system will significantly improve operational efficiency, patient care quality, and administrative oversight for the therapy center.

---

_This PRD serves as the comprehensive guide for the development and implementation of the Specialized Therapy Center Management System. All features, workflows, and requirements detailed in this document must be implemented to ensure the system meets the complete needs of the therapy center._
