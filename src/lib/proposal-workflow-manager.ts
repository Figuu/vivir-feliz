export interface User {
  id: string
  name: string
  email: string
  role: 'THERAPIST' | 'COORDINATOR' | 'ADMIN'
  isActive: boolean
}

export interface Proposal {
  id: string
  patientId: string
  therapistId?: string
  selectedServices: any[]
  totalSessions: number
  estimatedDuration: number
  estimatedCost: number
  currency: string
  status: 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'COMPLETED'
  priority: 'HIGH' | 'MEDIUM' | 'LOW'
  notes: string
  goals: string[]
  expectedOutcomes: string[]
  followUpRequired: boolean
  followUpNotes?: string
  createdAt: string
  updatedAt: string
  submittedAt?: string
  reviewedAt?: string
  reviewedBy?: string
  coordinatorNotes?: string
  pricingNotes?: string
  approvalNotes?: string
  adminNotes?: string
  finalApprovalNotes?: string
  budgetApproval?: boolean
  insuranceCoverage?: {
    covered: boolean
    percentage: number
    notes: string
  }
  paymentTerms?: {
    method: 'INSURANCE' | 'SELF_PAY' | 'MIXED'
    installments: number
    notes: string
  }
}

export interface WorkflowStep {
  id: string
  name: string
  description: string
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED' | 'REJECTED'
  assignedTo?: string
  assignedToName?: string
  assignedAt?: string
  completedAt?: string
  dueDate?: string
  notes?: string
  required: boolean
  order: number
  canSkip: boolean
  skipReason?: string
  attachments?: string[]
  comments?: WorkflowComment[]
}

export interface WorkflowComment {
  id: string
  userId: string
  userName: string
  userRole: string
  content: string
  createdAt: string
  isInternal: boolean
  attachments?: string[]
}

export interface WorkflowTransition {
  id: string
  fromStatus: string
  toStatus: string
  trigger: 'AUTOMATIC' | 'MANUAL' | 'CONDITIONAL'
  conditions?: WorkflowCondition[]
  actions?: WorkflowAction[]
  requiredRole?: string
  requiredApproval?: boolean
  notificationTemplate?: string
}

export interface WorkflowCondition {
  field: string
  operator: 'EQUALS' | 'NOT_EQUALS' | 'GREATER_THAN' | 'LESS_THAN' | 'CONTAINS' | 'IS_EMPTY' | 'IS_NOT_EMPTY'
  value: any
  description: string
}

export interface WorkflowAction {
  type: 'NOTIFY' | 'ASSIGN' | 'UPDATE_FIELD' | 'SEND_EMAIL' | 'CREATE_TASK' | 'LOG_EVENT'
  parameters: Record<string, any>
  description: string
}

export interface WorkflowEvent {
  id: string
  proposalId: string
  eventType: 'STATUS_CHANGE' | 'ASSIGNMENT' | 'COMMENT' | 'APPROVAL' | 'REJECTION' | 'ESCALATION' | 'DEADLINE'
  fromStatus?: string
  toStatus?: string
  userId: string
  userName: string
  userRole: string
  description: string
  details?: Record<string, any>
  createdAt: string
  isInternal: boolean
}

export interface WorkflowNotification {
  id: string
  userId: string
  proposalId: string
  type: 'EMAIL' | 'IN_APP' | 'SMS' | 'PUSH'
  title: string
  message: string
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  status: 'PENDING' | 'SENT' | 'DELIVERED' | 'READ' | 'FAILED'
  sentAt?: string
  deliveredAt?: string
  readAt?: string
  template?: string
  data?: Record<string, any>
}

export interface WorkflowMetrics {
  totalProposals: number
  proposalsByStatus: Record<string, number>
  averageProcessingTime: number
  averageStepsToCompletion: number
  completionRate: number
  rejectionRate: number
  escalationRate: number
  overdueProposals: number
  pendingApprovals: number
  userPerformance: {
    userId: string
    userName: string
    role: string
    proposalsProcessed: number
    averageProcessingTime: number
    completionRate: number
    overdueCount: number
  }[]
}

export interface WorkflowConfiguration {
  id: string
  name: string
  description: string
  isActive: boolean
  steps: WorkflowStep[]
  transitions: WorkflowTransition[]
  notifications: {
    enabled: boolean
    templates: Record<string, string>
    channels: string[]
    escalationRules: {
      delay: number
      escalateTo: string
      message: string
    }[]
  }
  deadlines: {
    enabled: boolean
    defaultDeadline: number
    stepDeadlines: Record<string, number>
    escalationDelay: number
  }
  permissions: {
    canView: string[]
    canEdit: string[]
    canApprove: string[]
    canReject: string[]
    canEscalate: string[]
  }
  createdAt: string
  updatedAt: string
}

export class ProposalWorkflowManager {
  private workflows: Map<string, WorkflowConfiguration> = new Map()
  private events: WorkflowEvent[] = []
  private notifications: WorkflowNotification[] = []

  constructor() {
    this.initializeDefaultWorkflows()
  }

  /**
   * Initialize default workflow configurations
   */
  private initializeDefaultWorkflows(): void {
    const defaultWorkflow: WorkflowConfiguration = {
      id: 'default-proposal-workflow',
      name: 'Proposal Approval Workflow',
      description: 'Default workflow for therapeutic proposal approval',
      isActive: true,
      steps: [
        {
          id: 'draft',
          name: 'Draft Creation',
          description: 'Therapist creates initial proposal draft',
          status: 'PENDING',
          required: true,
          order: 1,
          canSkip: false
        },
        {
          id: 'submission',
          name: 'Proposal Submission',
          description: 'Therapist submits proposal for review',
          status: 'PENDING',
          required: true,
          order: 2,
          canSkip: false
        },
        {
          id: 'coordinator-review',
          name: 'Coordinator Review',
          description: 'Coordinator reviews proposal and pricing',
          status: 'PENDING',
          required: true,
          order: 3,
          canSkip: false
        },
        {
          id: 'budget-approval',
          name: 'Budget Approval',
          description: 'Administrator approves budget and costs',
          status: 'PENDING',
          required: true,
          order: 4,
          canSkip: false
        },
        {
          id: 'final-approval',
          name: 'Final Approval',
          description: 'Final administrative approval',
          status: 'PENDING',
          required: true,
          order: 5,
          canSkip: false
        },
        {
          id: 'implementation',
          name: 'Implementation',
          description: 'Proposal implementation and therapy start',
          status: 'PENDING',
          required: true,
          order: 6,
          canSkip: false
        }
      ],
      transitions: [
        {
          id: 'draft-to-submitted',
          fromStatus: 'DRAFT',
          toStatus: 'SUBMITTED',
          trigger: 'MANUAL',
          requiredRole: 'THERAPIST',
          notificationTemplate: 'proposal_submitted'
        },
        {
          id: 'submitted-to-review',
          fromStatus: 'SUBMITTED',
          toStatus: 'UNDER_REVIEW',
          trigger: 'AUTOMATIC',
          requiredRole: 'COORDINATOR',
          notificationTemplate: 'proposal_under_review'
        },
        {
          id: 'review-to-approved',
          fromStatus: 'UNDER_REVIEW',
          toStatus: 'APPROVED',
          trigger: 'MANUAL',
          requiredRole: 'ADMIN',
          requiredApproval: true,
          notificationTemplate: 'proposal_approved'
        },
        {
          id: 'review-to-rejected',
          fromStatus: 'UNDER_REVIEW',
          toStatus: 'REJECTED',
          trigger: 'MANUAL',
          requiredRole: 'COORDINATOR',
          notificationTemplate: 'proposal_rejected'
        },
        {
          id: 'approved-to-implementation',
          fromStatus: 'APPROVED',
          toStatus: 'COMPLETED',
          trigger: 'MANUAL',
          requiredRole: 'THERAPIST',
          notificationTemplate: 'proposal_implementation'
        }
      ],
      notifications: {
        enabled: true,
        templates: {
          proposal_submitted: 'New proposal submitted for review',
          proposal_under_review: 'Proposal is under review',
          proposal_approved: 'Proposal has been approved',
          proposal_rejected: 'Proposal has been rejected',
          proposal_implementation: 'Proposal ready for implementation'
        },
        channels: ['EMAIL', 'IN_APP'],
        escalationRules: [
          {
            delay: 24,
            escalateTo: 'ADMIN',
            message: 'Proposal review overdue'
          }
        ]
      },
      deadlines: {
        enabled: true,
        defaultDeadline: 48,
        stepDeadlines: {
          'coordinator-review': 24,
          'budget-approval': 48,
          'final-approval': 24
        },
        escalationDelay: 12
      },
      permissions: {
        canView: ['THERAPIST', 'COORDINATOR', 'ADMIN'],
        canEdit: ['THERAPIST', 'COORDINATOR'],
        canApprove: ['COORDINATOR', 'ADMIN'],
        canReject: ['COORDINATOR', 'ADMIN'],
        canEscalate: ['COORDINATOR', 'ADMIN']
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    this.workflows.set(defaultWorkflow.id, defaultWorkflow)
  }

  /**
   * Get workflow configuration by ID
   */
  getWorkflow(workflowId: string): WorkflowConfiguration | null {
    return this.workflows.get(workflowId) || null
  }

  /**
   * Get all workflow configurations
   */
  getAllWorkflows(): WorkflowConfiguration[] {
    return Array.from(this.workflows.values())
  }

  /**
   * Get active workflow configurations
   */
  getActiveWorkflows(): WorkflowConfiguration[] {
    return Array.from(this.workflows.values()).filter(w => w.isActive)
  }

  /**
   * Create or update workflow configuration
   */
  saveWorkflow(workflow: WorkflowConfiguration): void {
    workflow.updatedAt = new Date().toISOString()
    this.workflows.set(workflow.id, workflow)
  }

  /**
   * Delete workflow configuration
   */
  deleteWorkflow(workflowId: string): boolean {
    return this.workflows.delete(workflowId)
  }

  /**
   * Get current workflow step for a proposal
   */
  getCurrentStep(proposal: Proposal, workflowId: string = 'default-proposal-workflow'): WorkflowStep | null {
    const workflow = this.getWorkflow(workflowId)
    if (!workflow) return null

    const currentStep = workflow.steps.find(step => {
      switch (proposal.status) {
        case 'DRAFT':
          return step.id === 'draft'
        case 'SUBMITTED':
          return step.id === 'submission'
        case 'UNDER_REVIEW':
          return step.id === 'coordinator-review'
        case 'APPROVED':
          return step.id === 'final-approval'
        case 'REJECTED':
          return step.id === 'coordinator-review'
        case 'COMPLETED':
          return step.id === 'implementation'
        default:
          return false
      }
    })

    return currentStep || null
  }

  /**
   * Get next workflow step for a proposal
   */
  getNextStep(proposal: Proposal, workflowId: string = 'default-proposal-workflow'): WorkflowStep | null {
    const workflow = this.getWorkflow(workflowId)
    if (!workflow) return null

    const currentStep = this.getCurrentStep(proposal, workflowId)
    if (!currentStep) return null

    const nextStep = workflow.steps.find(step => step.order === currentStep.order + 1)
    return nextStep || null
  }

  /**
   * Get previous workflow step for a proposal
   */
  getPreviousStep(proposal: Proposal, workflowId: string = 'default-proposal-workflow'): WorkflowStep | null {
    const workflow = this.getWorkflow(workflowId)
    if (!workflow) return null

    const currentStep = this.getCurrentStep(proposal, workflowId)
    if (!currentStep) return null

    const previousStep = workflow.steps.find(step => step.order === currentStep.order - 1)
    return previousStep || null
  }

  /**
   * Get all workflow steps for a proposal
   */
  getWorkflowSteps(proposal: Proposal, workflowId: string = 'default-proposal-workflow'): WorkflowStep[] {
    const workflow = this.getWorkflow(workflowId)
    if (!workflow) return []

    return workflow.steps.map(step => ({
      ...step,
      status: this.getStepStatus(proposal, step.id, workflowId)
    }))
  }

  /**
   * Get step status for a proposal
   */
  private getStepStatus(proposal: Proposal, stepId: string, workflowId: string): 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED' | 'REJECTED' {
    const currentStep = this.getCurrentStep(proposal, workflowId)
    if (!currentStep) return 'PENDING'

    const workflow = this.getWorkflow(workflowId)
    if (!workflow) return 'PENDING'

    const step = workflow.steps.find(s => s.id === stepId)
    if (!step) return 'PENDING'

    if (step.order < currentStep.order) {
      return 'COMPLETED'
    } else if (step.order === currentStep.order) {
      return 'IN_PROGRESS'
    } else {
      return 'PENDING'
    }
  }

  /**
   * Check if user can perform action on proposal
   */
  canUserPerformAction(
    user: User,
    proposal: Proposal,
    action: 'VIEW' | 'EDIT' | 'APPROVE' | 'REJECT' | 'ESCALATE',
    workflowId: string = 'default-proposal-workflow'
  ): boolean {
    const workflow = this.getWorkflow(workflowId)
    if (!workflow) return false

    const permissions = workflow.permissions
    const userRole = user.role

    switch (action) {
      case 'VIEW':
        return permissions.canView.includes(userRole)
      case 'EDIT':
        return permissions.canEdit.includes(userRole)
      case 'APPROVE':
        return permissions.canApprove.includes(userRole)
      case 'REJECT':
        return permissions.canReject.includes(userRole)
      case 'ESCALATE':
        return permissions.canEscalate.includes(userRole)
      default:
        return false
    }
  }

  /**
   * Get available transitions for a proposal
   */
  getAvailableTransitions(
    proposal: Proposal,
    user: User,
    workflowId: string = 'default-proposal-workflow'
  ): WorkflowTransition[] {
    const workflow = this.getWorkflow(workflowId)
    if (!workflow) return []

    return workflow.transitions.filter(transition => {
      // Check if transition is from current status
      if (transition.fromStatus !== proposal.status) return false

      // Check if user has required role
      if (transition.requiredRole && transition.requiredRole !== user.role) return false

      // Check if user can perform the action
      const action = transition.toStatus === 'APPROVED' ? 'APPROVE' : 
                    transition.toStatus === 'REJECTED' ? 'REJECT' : 'EDIT'
      
      return this.canUserPerformAction(user, proposal, action, workflowId)
    })
  }

  /**
   * Execute workflow transition
   */
  async executeTransition(
    proposal: Proposal,
    user: User,
    transitionId: string,
    notes?: string,
    workflowId: string = 'default-proposal-workflow'
  ): Promise<{ success: boolean; error?: string; updatedProposal?: Proposal }> {
    try {
      const workflow = this.getWorkflow(workflowId)
      if (!workflow) {
        return { success: false, error: 'Workflow not found' }
      }

      const transition = workflow.transitions.find(t => t.id === transitionId)
      if (!transition) {
        return { success: false, error: 'Transition not found' }
      }

      // Check if user can perform this transition
      if (!this.canUserPerformAction(user, proposal, 'EDIT', workflowId)) {
        return { success: false, error: 'User not authorized to perform this action' }
      }

      // Check conditions
      if (transition.conditions) {
        for (const condition of transition.conditions) {
          if (!this.evaluateCondition(proposal, condition)) {
            return { success: false, error: `Condition not met: ${condition.description}` }
          }
        }
      }

      // Update proposal status
      const updatedProposal: Proposal = {
        ...proposal,
        status: transition.toStatus as any,
        updatedAt: new Date().toISOString()
      }

      // Set specific timestamps based on status
      switch (transition.toStatus) {
        case 'SUBMITTED':
          updatedProposal.submittedAt = new Date().toISOString()
          break
        case 'UNDER_REVIEW':
          updatedProposal.reviewedAt = new Date().toISOString()
          updatedProposal.reviewedBy = user.id
          break
        case 'APPROVED':
          updatedProposal.finalApprovalNotes = notes
          break
        case 'REJECTED':
          updatedProposal.approvalNotes = notes
          break
      }

      // Execute actions
      if (transition.actions) {
        for (const action of transition.actions) {
          await this.executeAction(action, updatedProposal, user)
        }
      }

      // Log event
      this.logEvent({
        id: `event-${Date.now()}`,
        proposalId: proposal.id,
        eventType: 'STATUS_CHANGE',
        fromStatus: proposal.status,
        toStatus: transition.toStatus,
        userId: user.id,
        userName: user.name,
        userRole: user.role,
        description: `Status changed from ${proposal.status} to ${transition.toStatus}`,
        details: { transitionId, notes },
        createdAt: new Date().toISOString(),
        isInternal: false
      })

      // Send notifications
      if (transition.notificationTemplate) {
        await this.sendNotification(updatedProposal, transition.notificationTemplate, user)
      }

      return { success: true, updatedProposal }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      }
    }
  }

  /**
   * Evaluate workflow condition
   */
  private evaluateCondition(proposal: Proposal, condition: WorkflowCondition): boolean {
    const fieldValue = this.getFieldValue(proposal, condition.field)
    
    switch (condition.operator) {
      case 'EQUALS':
        return fieldValue === condition.value
      case 'NOT_EQUALS':
        return fieldValue !== condition.value
      case 'GREATER_THAN':
        return Number(fieldValue) > Number(condition.value)
      case 'LESS_THAN':
        return Number(fieldValue) < Number(condition.value)
      case 'CONTAINS':
        return String(fieldValue).includes(String(condition.value))
      case 'IS_EMPTY':
        return !fieldValue || fieldValue === ''
      case 'IS_NOT_EMPTY':
        return fieldValue && fieldValue !== ''
      default:
        return false
    }
  }

  /**
   * Get field value from proposal
   */
  private getFieldValue(proposal: Proposal, field: string): any {
    const fields = field.split('.')
    let value: any = proposal
    
    for (const f of fields) {
      value = value?.[f]
    }
    
    return value
  }

  /**
   * Execute workflow action
   */
  private async executeAction(action: WorkflowAction, proposal: Proposal, user: User): Promise<void> {
    switch (action.type) {
      case 'NOTIFY':
        await this.sendNotification(proposal, action.parameters.template, user)
        break
      case 'ASSIGN':
        // Update proposal assignment
        break
      case 'UPDATE_FIELD':
        // Update specific field
        break
      case 'SEND_EMAIL':
        // Send email notification
        break
      case 'CREATE_TASK':
        // Create follow-up task
        break
      case 'LOG_EVENT':
        // Log custom event
        break
    }
  }

  /**
   * Send notification
   */
  private async sendNotification(proposal: Proposal, template: string, user: User): Promise<void> {
    const notification: WorkflowNotification = {
      id: `notification-${Date.now()}`,
      userId: user.id,
      proposalId: proposal.id,
      type: 'IN_APP',
      title: 'Proposal Status Update',
      message: `Proposal ${proposal.id} status has been updated`,
      priority: 'MEDIUM',
      status: 'PENDING',
      template,
      data: { proposal, user }
    }

    this.notifications.push(notification)
  }

  /**
   * Log workflow event
   */
  logEvent(event: WorkflowEvent): void {
    this.events.push(event)
  }

  /**
   * Get workflow events for a proposal
   */
  getProposalEvents(proposalId: string): WorkflowEvent[] {
    return this.events.filter(event => event.proposalId === proposalId)
  }

  /**
   * Get workflow notifications for a user
   */
  getUserNotifications(userId: string): WorkflowNotification[] {
    return this.notifications.filter(notification => notification.userId === userId)
  }

  /**
   * Mark notification as read
   */
  markNotificationAsRead(notificationId: string): boolean {
    const notification = this.notifications.find(n => n.id === notificationId)
    if (notification) {
      notification.status = 'READ'
      notification.readAt = new Date().toISOString()
      return true
    }
    return false
  }

  /**
   * Get workflow metrics
   */
  getWorkflowMetrics(workflowId: string = 'default-proposal-workflow'): WorkflowMetrics {
    const workflow = this.getWorkflow(workflowId)
    if (!workflow) {
      return {
        totalProposals: 0,
        proposalsByStatus: {},
        averageProcessingTime: 0,
        averageStepsToCompletion: 0,
        completionRate: 0,
        rejectionRate: 0,
        escalationRate: 0,
        overdueProposals: 0,
        pendingApprovals: 0,
        userPerformance: []
      }
    }

    // This would typically query the database for real metrics
    // For now, return mock data
    return {
      totalProposals: 150,
      proposalsByStatus: {
        'DRAFT': 25,
        'SUBMITTED': 15,
        'UNDER_REVIEW': 30,
        'APPROVED': 60,
        'REJECTED': 10,
        'COMPLETED': 10
      },
      averageProcessingTime: 72, // hours
      averageStepsToCompletion: 4.2,
      completionRate: 85,
      rejectionRate: 7,
      escalationRate: 3,
      overdueProposals: 5,
      pendingApprovals: 12,
      userPerformance: [
        {
          userId: 'user-1',
          userName: 'Dr. María González',
          role: 'THERAPIST',
          proposalsProcessed: 45,
          averageProcessingTime: 48,
          completionRate: 92,
          overdueCount: 1
        },
        {
          userId: 'user-2',
          userName: 'Ana Coordinadora',
          role: 'COORDINATOR',
          proposalsProcessed: 120,
          averageProcessingTime: 24,
          completionRate: 88,
          overdueCount: 2
        }
      ]
    }
  }

  /**
   * Get overdue proposals
   */
  getOverdueProposals(workflowId: string = 'default-proposal-workflow'): Proposal[] {
    // This would typically query the database for overdue proposals
    // For now, return empty array
    return []
  }

  /**
   * Escalate overdue proposal
   */
  async escalateProposal(
    proposal: Proposal,
    user: User,
    reason: string,
    workflowId: string = 'default-proposal-workflow'
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Check if user can escalate
      if (!this.canUserPerformAction(user, proposal, 'ESCALATE', workflowId)) {
        return { success: false, error: 'User not authorized to escalate' }
      }

      // Log escalation event
      this.logEvent({
        id: `escalation-${Date.now()}`,
        proposalId: proposal.id,
        eventType: 'ESCALATION',
        userId: user.id,
        userName: user.name,
        userRole: user.role,
        description: `Proposal escalated: ${reason}`,
        details: { reason, escalatedAt: new Date().toISOString() },
        createdAt: new Date().toISOString(),
        isInternal: true
      })

      // Send escalation notification
      await this.sendNotification(proposal, 'proposal_escalated', user)

      return { success: true }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      }
    }
  }

  /**
   * Add comment to workflow step
   */
  addComment(
    proposalId: string,
    stepId: string,
    user: User,
    content: string,
    isInternal: boolean = false,
    attachments?: string[]
  ): WorkflowComment {
    const comment: WorkflowComment = {
      id: `comment-${Date.now()}`,
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      content,
      createdAt: new Date().toISOString(),
      isInternal,
      attachments
    }

    // This would typically save to database
    // For now, just return the comment
    return comment
  }

  /**
   * Get workflow step comments
   */
  getStepComments(proposalId: string, stepId: string): WorkflowComment[] {
    // This would typically query the database
    // For now, return empty array
    return []
  }
}

// Export default instance
export const defaultWorkflowManager = new ProposalWorkflowManager()
