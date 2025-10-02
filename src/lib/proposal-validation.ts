import { z } from 'zod'

// Base schemas for common types
export const ServiceSchema = z.object({
  id: z.string().min(1, 'Service ID is required'),
  code: z.string().min(1, 'Service code is required'),
  name: z.string().min(1, 'Service name is required'),
  description: z.string().min(1, 'Service description is required'),
  categoryId: z.string().min(1, 'Category ID is required'),
  category: z.object({
    id: z.string().min(1, 'Category ID is required'),
    name: z.string().min(1, 'Category name is required'),
    color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format'),
    icon: z.string().min(1, 'Icon is required')
  }),
  type: z.enum(['EVALUATION', 'TREATMENT', 'CONSULTATION', 'FOLLOW_UP', 'ASSESSMENT']),
  duration: z.number().int().min(1, 'Duration must be at least 1 minute'),
  price: z.number().min(0, 'Price must be non-negative'),
  currency: z.string().length(3, 'Currency must be 3 characters'),
  isActive: z.boolean(),
  requiresApproval: z.boolean(),
  maxSessions: z.number().int().min(1).optional(),
  minSessions: z.number().int().min(1).optional(),
  ageRange: z.object({
    min: z.number().int().min(0),
    max: z.number().int().min(0)
  }).optional(),
  prerequisites: z.array(z.string()).optional(),
  outcomes: z.array(z.string()).optional(),
  tags: z.array(z.string())
})

export const SelectedServiceSchema = z.object({
  service: ServiceSchema,
  sessionCount: z.number().int().min(1, 'Session count must be at least 1'),
  notes: z.string().optional(),
  priority: z.enum(['HIGH', 'MEDIUM', 'LOW'])
})

export const InsuranceCoverageSchema = z.object({
  covered: z.boolean(),
  percentage: z.number().min(0).max(100, 'Coverage percentage must be between 0 and 100'),
  notes: z.string().optional()
})

export const PaymentTermsSchema = z.object({
  method: z.enum(['INSURANCE', 'SELF_PAY', 'MIXED']),
  installments: z.number().int().min(1, 'Installments must be at least 1'),
  notes: z.string().optional()
})

// Main proposal schema
export const ProposalSchema = z.object({
  id: z.string().min(1, 'Proposal ID is required'),
  patientId: z.string().min(1, 'Patient ID is required'),
  therapistId: z.string().min(1, 'Therapist ID is required').optional(),
  selectedServices: z.array(SelectedServiceSchema).min(1, 'At least one service must be selected'),
  totalSessions: z.number().int().min(1, 'Total sessions must be at least 1'),
  estimatedDuration: z.number().int().min(1, 'Estimated duration must be at least 1 minute'),
  estimatedCost: z.number().min(0, 'Estimated cost must be non-negative'),
  currency: z.string().length(3, 'Currency must be 3 characters'),
  status: z.enum(['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'CANCELLED', 'COMPLETED']),
  priority: z.enum(['HIGH', 'MEDIUM', 'LOW']),
  notes: z.string().optional(),
  goals: z.array(z.string()).min(1, 'At least one goal must be specified'),
  expectedOutcomes: z.array(z.string()).min(1, 'At least one expected outcome must be specified'),
  followUpRequired: z.boolean(),
  followUpNotes: z.string().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  submittedAt: z.string().datetime().optional(),
  reviewedAt: z.string().datetime().optional(),
  reviewedBy: z.string().optional(),
  coordinatorNotes: z.string().optional(),
  pricingNotes: z.string().optional(),
  approvalNotes: z.string().optional(),
  adminNotes: z.string().optional(),
  finalApprovalNotes: z.string().optional(),
  budgetApproval: z.boolean().optional(),
  insuranceCoverage: InsuranceCoverageSchema.optional(),
  paymentTerms: PaymentTermsSchema.optional()
})

// Schema for creating new proposals
export const CreateProposalSchema = ProposalSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  submittedAt: true,
  reviewedAt: true,
  reviewedBy: true
})

// Schema for updating proposals
export const UpdateProposalSchema = ProposalSchema.partial().omit({
  id: true,
  createdAt: true,
  patientId: true
})

// Schema for proposal status transitions
export const ProposalStatusTransitionSchema = z.object({
  fromStatus: z.enum(['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'CANCELLED', 'COMPLETED']),
  toStatus: z.enum(['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'CANCELLED', 'COMPLETED']),
  notes: z.string().optional(),
  reason: z.string().optional()
})

// Schema for proposal comments
export const ProposalCommentSchema = z.object({
  content: z.string().min(1, 'Comment content is required'),
  isInternal: z.boolean().default(false),
  attachments: z.array(z.string()).optional()
})

// Schema for proposal assignments
export const ProposalAssignmentSchema = z.object({
  therapistId: z.string().min(1, 'Therapist ID is required'),
  assignedBy: z.string().min(1, 'Assigned by is required'),
  notes: z.string().optional()
})

// Schema for proposal reviews
export const ProposalReviewSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED', 'NEEDS_REVISION']),
  notes: z.string().min(1, 'Review notes are required'),
  coordinatorNotes: z.string().optional(),
  pricingNotes: z.string().optional(),
  approvalNotes: z.string().optional(),
  adminNotes: z.string().optional(),
  budgetApproval: z.boolean().optional(),
  insuranceCoverage: InsuranceCoverageSchema.optional(),
  paymentTerms: PaymentTermsSchema.optional()
})

// Schema for proposal search and filtering
export const ProposalSearchSchema = z.object({
  query: z.string().optional(),
  status: z.array(z.enum(['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'CANCELLED', 'COMPLETED'])).optional(),
  priority: z.array(z.enum(['HIGH', 'MEDIUM', 'LOW'])).optional(),
  therapistId: z.string().optional(),
  patientId: z.string().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  minCost: z.number().min(0).optional(),
  maxCost: z.number().min(0).optional(),
  currency: z.string().length(3).optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'submittedAt', 'reviewedAt', 'estimatedCost', 'priority']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20)
})

// Schema for proposal statistics
export const ProposalStatsSchema = z.object({
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  groupBy: z.enum(['day', 'week', 'month', 'year']).default('month'),
  therapistId: z.string().optional(),
  status: z.array(z.enum(['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'CANCELLED', 'COMPLETED'])).optional()
})

// Schema for proposal bulk operations
export const ProposalBulkOperationSchema = z.object({
  proposalIds: z.array(z.string()).min(1, 'At least one proposal ID is required'),
  operation: z.enum(['APPROVE', 'REJECT', 'CANCEL', 'DELETE', 'ASSIGN', 'EXPORT']),
  parameters: z.record(z.string(), z.any()).optional()
})

// Schema for proposal export
export const ProposalExportSchema = z.object({
  proposalIds: z.array(z.string()).min(1, 'At least one proposal ID is required'),
  format: z.enum(['PDF', 'CSV', 'JSON', 'EXCEL']),
  includePricing: z.boolean().default(false),
  includeComments: z.boolean().default(false),
  includeHistory: z.boolean().default(false)
})

// Schema for proposal notifications
export const ProposalNotificationSchema = z.object({
  type: z.enum(['STATUS_CHANGE', 'ASSIGNMENT', 'DEADLINE', 'ESCALATION', 'COMMENT']),
  recipients: z.array(z.string()).min(1, 'At least one recipient is required'),
  message: z.string().min(1, 'Message is required'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  data: z.record(z.string(), z.any()).optional()
})

// Schema for proposal workflow steps
export const ProposalWorkflowStepSchema = z.object({
  stepId: z.string().min(1, 'Step ID is required'),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED', 'REJECTED']),
  assignedTo: z.string().optional(),
  notes: z.string().optional(),
  dueDate: z.string().datetime().optional(),
  completedAt: z.string().datetime().optional()
})

// Schema for proposal workflow transitions
export const ProposalWorkflowTransitionSchema = z.object({
  transitionId: z.string().min(1, 'Transition ID is required'),
  fromStatus: z.string().min(1, 'From status is required'),
  toStatus: z.string().min(1, 'To status is required'),
  notes: z.string().optional(),
  conditions: z.array(z.record(z.string(), z.any())).optional(),
  actions: z.array(z.record(z.string(), z.any())).optional()
})

// Schema for proposal cost calculation
export const ProposalCostCalculationSchema = z.object({
  selectedServices: z.array(SelectedServiceSchema).min(1, 'At least one service must be selected'),
  includeTaxes: z.boolean().default(false),
  taxRate: z.number().min(0).max(100).default(0),
  includeDiscounts: z.boolean().default(false),
  discountPercentage: z.number().min(0).max(100).default(0),
  includeInsurance: z.boolean().default(false),
  insuranceCoverage: z.number().min(0).max(100).default(0),
  includePaymentFees: z.boolean().default(false),
  paymentFeeRate: z.number().min(0).max(100).default(0),
  currency: z.string().length(3).default('USD'),
  precision: z.number().int().min(0).max(10).default(2)
})

// Schema for proposal validation rules
export const ProposalValidationRuleSchema = z.object({
  field: z.string().min(1, 'Field is required'),
  operator: z.enum(['EQUALS', 'NOT_EQUALS', 'GREATER_THAN', 'LESS_THAN', 'CONTAINS', 'IS_EMPTY', 'IS_NOT_EMPTY']),
  value: z.any(),
  message: z.string().min(1, 'Validation message is required')
})

// Schema for proposal permissions
export const ProposalPermissionSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  role: z.enum(['THERAPIST', 'COORDINATOR', 'ADMIN']),
  permissions: z.object({
    canView: z.boolean(),
    canEdit: z.boolean(),
    canApprove: z.boolean(),
    canReject: z.boolean(),
    canDelete: z.boolean(),
    canAssign: z.boolean(),
    canExport: z.boolean()
  })
})

// Schema for proposal audit log
export const ProposalAuditLogSchema = z.object({
  proposalId: z.string().min(1, 'Proposal ID is required'),
  action: z.string().min(1, 'Action is required'),
  userId: z.string().min(1, 'User ID is required'),
  userRole: z.enum(['THERAPIST', 'COORDINATOR', 'ADMIN']),
  details: z.record(z.string(), z.any()).optional(),
  timestamp: z.string().datetime()
})

// Schema for proposal templates
export const ProposalTemplateSchema = z.object({
  id: z.string().min(1, 'Template ID is required'),
  name: z.string().min(1, 'Template name is required'),
  description: z.string().optional(),
  category: z.string().min(1, 'Category is required'),
  services: z.array(SelectedServiceSchema).min(1, 'At least one service must be included'),
  goals: z.array(z.string()).min(1, 'At least one goal must be specified'),
  expectedOutcomes: z.array(z.string()).min(1, 'At least one expected outcome must be specified'),
  isActive: z.boolean().default(true),
  createdBy: z.string().min(1, 'Created by is required'),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
})

// Schema for proposal analytics
export const ProposalAnalyticsSchema = z.object({
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  groupBy: z.enum(['day', 'week', 'month', 'year', 'therapist', 'status', 'priority']).default('month'),
  metrics: z.array(z.enum(['count', 'cost', 'duration', 'completion_rate', 'approval_rate'])).default(['count']),
  filters: z.record(z.string(), z.any()).optional()
})

// Validation functions
export const validateProposal = (data: unknown) => {
  return ProposalSchema.safeParse(data)
}

export const validateCreateProposal = (data: unknown) => {
  return CreateProposalSchema.safeParse(data)
}

export const validateUpdateProposal = (data: unknown) => {
  return UpdateProposalSchema.safeParse(data)
}

export const validateProposalStatusTransitionData = (data: unknown) => {
  return ProposalStatusTransitionSchema.safeParse(data)
}

export const validateProposalComment = (data: unknown) => {
  return ProposalCommentSchema.safeParse(data)
}

export const validateProposalAssignment = (data: unknown) => {
  return ProposalAssignmentSchema.safeParse(data)
}

export const validateProposalReview = (data: unknown) => {
  return ProposalReviewSchema.safeParse(data)
}

export const validateProposalSearch = (data: unknown) => {
  return ProposalSearchSchema.safeParse(data)
}

export const validateProposalStats = (data: unknown) => {
  return ProposalStatsSchema.safeParse(data)
}

export const validateProposalBulkOperation = (data: unknown) => {
  return ProposalBulkOperationSchema.safeParse(data)
}

export const validateProposalExport = (data: unknown) => {
  return ProposalExportSchema.safeParse(data)
}

export const validateProposalNotification = (data: unknown) => {
  return ProposalNotificationSchema.safeParse(data)
}

export const validateProposalWorkflowStep = (data: unknown) => {
  return ProposalWorkflowStepSchema.safeParse(data)
}

export const validateProposalWorkflowTransition = (data: unknown) => {
  return ProposalWorkflowTransitionSchema.safeParse(data)
}

export const validateProposalCostCalculation = (data: unknown) => {
  return ProposalCostCalculationSchema.safeParse(data)
}

export const validateProposalValidationRule = (data: unknown) => {
  return ProposalValidationRuleSchema.safeParse(data)
}

export const validateProposalPermission = (data: unknown) => {
  return ProposalPermissionSchema.safeParse(data)
}

export const validateProposalAuditLog = (data: unknown) => {
  return ProposalAuditLogSchema.safeParse(data)
}

export const validateProposalTemplate = (data: unknown) => {
  return ProposalTemplateSchema.safeParse(data)
}

export const validateProposalAnalytics = (data: unknown) => {
  return ProposalAnalyticsSchema.safeParse(data)
}

// Custom validation functions
export const validateProposalStatusTransition = (fromStatus: string, toStatus: string, userRole: string) => {
  const validTransitions: Record<string, string[]> = {
    'DRAFT': ['SUBMITTED'],
    'SUBMITTED': ['UNDER_REVIEW', 'REJECTED'],
    'UNDER_REVIEW': ['APPROVED', 'REJECTED', 'CANCELLED'],
    'APPROVED': ['COMPLETED', 'CANCELLED'],
    'REJECTED': ['DRAFT', 'CANCELLED'],
    'CANCELLED': [],
    'COMPLETED': []
  }

  const rolePermissions: Record<string, string[]> = {
    'THERAPIST': ['DRAFT', 'SUBMITTED'],
    'COORDINATOR': ['UNDER_REVIEW', 'APPROVED', 'REJECTED'],
    'ADMIN': ['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'CANCELLED', 'COMPLETED']
  }

  if (!validTransitions[fromStatus]?.includes(toStatus)) {
    return { valid: false, error: `Invalid transition from ${fromStatus} to ${toStatus}` }
  }

  if (!rolePermissions[userRole]?.includes(toStatus)) {
    return { valid: false, error: `User role ${userRole} cannot transition to ${toStatus}` }
  }

  return { valid: true }
}

export const validateProposalCost = (selectedServices: any[], maxCost: number = 10000) => {
  const totalCost = selectedServices.reduce((sum, service) => {
    return sum + (service.service.price * service.sessionCount)
  }, 0)

  if (totalCost > maxCost) {
    return { valid: false, error: `Total cost ${totalCost} exceeds maximum allowed cost ${maxCost}` }
  }

  return { valid: true, totalCost }
}

export const validateProposalServices = (selectedServices: any[]) => {
  if (selectedServices.length === 0) {
    return { valid: false, error: 'At least one service must be selected' }
  }

  for (const service of selectedServices) {
    if (service.sessionCount < service.service.minSessions) {
      return { valid: false, error: `Service ${service.service.name} requires at least ${service.service.minSessions} sessions` }
    }

    if (service.service.maxSessions && service.sessionCount > service.service.maxSessions) {
      return { valid: false, error: `Service ${service.service.name} cannot exceed ${service.service.maxSessions} sessions` }
    }
  }

  return { valid: true }
}

export const validateProposalDeadlines = (proposal: any) => {
  const now = new Date()
  const createdAt = new Date(proposal.createdAt)
  const submittedAt = proposal.submittedAt ? new Date(proposal.submittedAt) : null

  // Check if proposal is overdue (more than 30 days without submission)
  if (!submittedAt && (now.getTime() - createdAt.getTime()) > (30 * 24 * 60 * 60 * 1000)) {
    return { valid: false, error: 'Proposal is overdue for submission' }
  }

  // Check if submitted proposal is overdue for review (more than 7 days)
  if (submittedAt && proposal.status === 'SUBMITTED' && (now.getTime() - submittedAt.getTime()) > (7 * 24 * 60 * 60 * 1000)) {
    return { valid: false, error: 'Proposal is overdue for review' }
  }

  return { valid: true }
}

// Export all schemas and validation functions
export const ProposalValidation = {
  schemas: {
    ServiceSchema,
    SelectedServiceSchema,
    InsuranceCoverageSchema,
    PaymentTermsSchema,
    ProposalSchema,
    CreateProposalSchema,
    UpdateProposalSchema,
    ProposalStatusTransitionSchema,
    ProposalCommentSchema,
    ProposalAssignmentSchema,
    ProposalReviewSchema,
    ProposalSearchSchema,
    ProposalStatsSchema,
    ProposalBulkOperationSchema,
    ProposalExportSchema,
    ProposalNotificationSchema,
    ProposalWorkflowStepSchema,
    ProposalWorkflowTransitionSchema,
    ProposalCostCalculationSchema,
    ProposalValidationRuleSchema,
    ProposalPermissionSchema,
    ProposalAuditLogSchema,
    ProposalTemplateSchema,
    ProposalAnalyticsSchema
  },
  validators: {
    validateProposal,
    validateCreateProposal,
    validateUpdateProposal,
    validateProposalStatusTransitionData,
    validateProposalComment,
    validateProposalAssignment,
    validateProposalReview,
    validateProposalSearch,
    validateProposalStats,
    validateProposalBulkOperation,
    validateProposalExport,
    validateProposalNotification,
    validateProposalWorkflowStep,
    validateProposalWorkflowTransition,
    validateProposalCostCalculation,
    validateProposalValidationRule,
    validateProposalPermission,
    validateProposalAuditLog,
    validateProposalTemplate,
    validateProposalAnalytics
  },
  customValidators: {
    validateProposalStatusTransition,
    validateProposalCost,
    validateProposalServices,
    validateProposalDeadlines
  }
}
