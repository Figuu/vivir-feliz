import { z } from 'zod'

const costCalculationSchema = z.object({
  selectedServices: z.array(z.object({
    id: z.string(),
    name: z.string(),
    cost: z.number(),
    sessions: z.number()
  })),
  includeTaxes: z.boolean().default(false),
  taxRate: z.number().min(0).max(1).default(0.16),
  includeDiscounts: z.boolean().default(false),
  discountPercentage: z.number().min(0).max(1).default(0),
  includeInsurance: z.boolean().default(false),
  insuranceCoverage: z.number().min(0).max(1).default(0),
  includePaymentFees: z.boolean().default(false),
  paymentFeeRate: z.number().min(0).max(1).default(0.03),
  currency: z.string().default('USD'),
  precision: z.number().min(0).max(4).default(2)
})

const proposalCommentSchema = z.object({
  content: z.string().min(1, 'Comment content is required').max(2000, 'Comment cannot exceed 2000 characters'),
  isInternal: z.boolean().default(false)
})

const proposalStatusTransitionSchema = z.object({
  status: z.enum(['DRAFT', 'SUBMITTED_TO_COORDINATOR', 'COORDINATOR_APPROVED', 'COORDINATOR_REJECTED', 'SUBMITTED_TO_ADMIN', 'ADMIN_APPROVED', 'WAITING_PARENT_APPROVAL', 'PARENT_APPROVED', 'CANCELLED']),
  reason: z.string().optional(),
  notes: z.string().optional()
})

export function validateProposalComment(data: any) {
  return proposalCommentSchema.safeParse(data)
}

export function validateProposalStatusTransition(data: any) {
  return proposalStatusTransitionSchema.safeParse(data)
}