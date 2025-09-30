import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'

// Comprehensive validation schemas
const statusQuerySchema = z.object({
  reportId: z.string().uuid('Invalid report ID').optional(),
  reportType: z.enum(['therapeutic_plan', 'progress_report', 'final_report', 'submission', 'compilation']).optional(),
  patientId: z.string().uuid('Invalid patient ID').optional(),
  therapistId: z.string().uuid('Invalid therapist ID').optional(),
  currentStatus: z.string().optional(),
  includeTimeline: z.string().transform(val => val === 'true').optional().default(true),
  includeWorkflow: z.string().transform(val => val === 'true').optional().default(true),
  includeMetrics: z.string().transform(val => val === 'true').optional().default(true)
})

const workflowQuerySchema = z.object({
  reportType: z.enum(['therapeutic_plan', 'progress_report', 'final_report', 'submission', 'compilation']),
  startStatus: z.string(),
  targetStatus: z.string().optional()
})

// GET /api/report-status-workflow - Get status tracking and workflow information
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    
    if (action === 'workflow_definition') {
      // Get workflow definition for a report type
      const validation = workflowQuerySchema.safeParse({
        reportType: searchParams.get('reportType'),
        startStatus: searchParams.get('startStatus'),
        targetStatus: searchParams.get('targetStatus')
      })

      if (!validation.success) {
        return NextResponse.json(
          { error: 'Invalid workflow parameters', details: validation.error.issues },
          { status: 400 }
        )
      }

      const { reportType, startStatus, targetStatus } = validation.data

      // Get workflow definition
      const workflow = getWorkflowDefinition(reportType)
      
      // Get possible next steps from current status
      const nextSteps = getNextSteps(reportType, startStatus)
      
      // Get path to target status if specified
      const path = targetStatus ? getStatusPath(reportType, startStatus, targetStatus) : null

      return NextResponse.json({
        success: true,
        data: {
          workflow,
          currentStatus: startStatus,
          nextSteps,
          path
        }
      })
    }
    
    if (action === 'dashboard') {
      // Get comprehensive dashboard data
      const patientId = searchParams.get('patientId')
      const therapistId = searchParams.get('therapistId')

      const whereSubmission: any = {}
      const whereCompilation: any = {}

      if (patientId) {
        whereSubmission.patientId = patientId
        whereCompilation.patientId = patientId
      }

      if (therapistId) {
        whereSubmission.therapistId = therapistId
      }

      const [
        submissionStats,
        compilationStats,
        recentActivity
      ] = await Promise.all([
        // Submission statistics by status
        db.reportSubmission.groupBy({
          by: ['status'],
          where: whereSubmission,
          _count: true
        }),
        // Compilation statistics by status
        db.finalReportCompilation.groupBy({
          by: ['status'],
          where: whereCompilation,
          _count: true
        }),
        // Recent status changes
        db.reportApproval.findMany({
          where: {
            createdAt: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
            }
          },
          include: {
            approver: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 20
        })
      ])

      return NextResponse.json({
        success: true,
        data: {
          submissions: {
            byStatus: submissionStats.reduce((acc: any, stat) => {
              acc[stat.status] = stat._count
              return acc
            }, {}),
            total: submissionStats.reduce((sum, stat) => sum + stat._count, 0)
          },
          compilations: {
            byStatus: compilationStats.reduce((acc: any, stat) => {
              acc[stat.status] = stat._count
              return acc
            }, {}),
            total: compilationStats.reduce((sum, stat) => sum + stat._count, 0)
          },
          recentActivity
        }
      })
    }
    
    // Regular status tracking query
    const validation = statusQuerySchema.safeParse({
      reportId: searchParams.get('reportId'),
      reportType: searchParams.get('reportType'),
      patientId: searchParams.get('patientId'),
      therapistId: searchParams.get('therapistId'),
      currentStatus: searchParams.get('currentStatus'),
      includeTimeline: searchParams.get('includeTimeline'),
      includeWorkflow: searchParams.get('includeWorkflow'),
      includeMetrics: searchParams.get('includeMetrics')
    })

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: validation.error.issues },
        { status: 400 }
      )
    }

    const { reportId, reportType, patientId, therapistId, currentStatus, includeTimeline, includeWorkflow, includeMetrics } = validation.data

    // Build where clause
    const whereClause: any = {}
    
    if (reportId) {
      whereClause.reportId = reportId
    }
    
    if (reportType) {
      whereClause.reportType = reportType
    }

    // Get status history
    const statusHistory = await db.reportApproval.findMany({
      where: whereClause,
      include: {
        approver: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    })

    // Get current report status
    let currentReportStatus = null
    if (reportId && reportType) {
      currentReportStatus = await getCurrentReportStatus(reportId, reportType)
    }

    // Build timeline if requested
    let timeline = null
    if (includeTimeline) {
      timeline = buildStatusTimeline(statusHistory)
    }

    // Get workflow if requested
    let workflow = null
    if (includeWorkflow && reportType && currentReportStatus) {
      workflow = {
        definition: getWorkflowDefinition(reportType),
        currentStatus: currentReportStatus.status,
        nextSteps: getNextSteps(reportType, currentReportStatus.status),
        completionPercentage: calculateWorkflowProgress(reportType, currentReportStatus.status)
      }
    }

    // Calculate metrics if requested
    let metrics = null
    if (includeMetrics) {
      metrics = calculateStatusMetrics(statusHistory)
    }

    return NextResponse.json({
      success: true,
      data: {
        currentStatus: currentReportStatus,
        statusHistory,
        timeline,
        workflow,
        metrics
      }
    })

  } catch (error) {
    console.error('Error fetching status tracking data:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function to get current report status
async function getCurrentReportStatus(reportId: string, reportType: string) {
  let report = null

  switch (reportType) {
    case 'submission':
      report = await db.reportSubmission.findUnique({
        where: { id: reportId },
        select: {
          id: true,
          status: true,
          title: true,
          updatedAt: true
        }
      })
      break
    case 'compilation':
      report = await db.finalReportCompilation.findUnique({
        where: { id: reportId },
        select: {
          id: true,
          status: true,
          title: true,
          updatedAt: true
        }
      })
      break
    case 'therapeutic_plan':
      report = await db.therapeuticPlan.findUnique({
        where: { id: reportId },
        select: {
          id: true,
          title: true,
          updatedAt: true
        }
      })
      if (report) {
        report = { ...report, status: 'active' }
      }
      break
    case 'progress_report':
      report = await db.progressReport.findUnique({
        where: { id: reportId },
        select: {
          id: true,
          reportTitle: true,
          updatedAt: true
        }
      })
      if (report) {
        report = { ...report, title: report.reportTitle, status: 'active' }
      }
      break
    case 'final_report':
      report = await db.finalReport.findUnique({
        where: { id: reportId },
        select: {
          id: true,
          reportTitle: true,
          updatedAt: true
        }
      })
      if (report) {
        report = { ...report, title: report.reportTitle, status: 'active' }
      }
      break
  }

  return report
}

// Helper function to build status timeline
function buildStatusTimeline(statusHistory: any[]) {
  return statusHistory.map((entry, index) => ({
    step: index + 1,
    action: entry.action,
    status: getStatusAfterAction(entry.action),
    actor: `${entry.approver.firstName} ${entry.approver.lastName}`,
    role: entry.approverRole,
    timestamp: entry.createdAt,
    comments: entry.comments,
    duration: index > 0 ? 
      new Date(entry.createdAt).getTime() - new Date(statusHistory[index - 1].createdAt).getTime() : 
      null
  }))
}

// Helper function to get workflow definition
function getWorkflowDefinition(reportType: string) {
  const baseWorkflow = {
    submission: [
      { status: 'draft', label: 'Draft', description: 'Report being created by therapist' },
      { status: 'submitted', label: 'Submitted', description: 'Submitted for coordinator review' },
      { status: 'under_review', label: 'Under Review', description: 'Being reviewed by coordinator' },
      { status: 'approved', label: 'Approved', description: 'Approved by coordinator' },
      { status: 'published', label: 'Published', description: 'Published and available' }
    ],
    compilation: [
      { status: 'draft', label: 'Draft', description: 'Compilation being created' },
      { status: 'under_review', label: 'Under Review', description: 'Being reviewed' },
      { status: 'completed', label: 'Completed', description: 'Compilation completed' },
      { status: 'published', label: 'Published', description: 'Published and distributed' }
    ]
  }

  return baseWorkflow[reportType as keyof typeof baseWorkflow] || baseWorkflow.submission
}

// Helper function to get next possible steps
function getNextSteps(reportType: string, currentStatus: string) {
  const transitions: any = {
    submission: {
      draft: ['submitted'],
      submitted: ['under_review', 'rejected'],
      under_review: ['approved', 'revision_requested', 'rejected'],
      approved: ['published'],
      revision_requested: ['submitted'],
      rejected: []
    },
    compilation: {
      draft: ['under_review'],
      under_review: ['completed', 'draft'],
      completed: ['published'],
      published: []
    }
  }

  const typeTransitions = transitions[reportType] || transitions.submission
  return typeTransitions[currentStatus] || []
}

// Helper function to get status path
function getStatusPath(reportType: string, startStatus: string, targetStatus: string) {
  // Simple BFS to find path between statuses
  const workflow = getWorkflowDefinition(reportType)
  const statuses = workflow.map(s => s.status)
  
  if (!statuses.includes(startStatus) || !statuses.includes(targetStatus)) {
    return null
  }

  // For simplicity, return linear path through workflow
  const startIndex = statuses.indexOf(startStatus)
  const targetIndex = statuses.indexOf(targetStatus)
  
  if (targetIndex > startIndex) {
    return statuses.slice(startIndex, targetIndex + 1)
  }
  
  return null
}

// Helper function to calculate workflow progress
function calculateWorkflowProgress(reportType: string, currentStatus: string): number {
  const workflow = getWorkflowDefinition(reportType)
  const currentIndex = workflow.findIndex(s => s.status === currentStatus)
  
  if (currentIndex === -1) return 0
  
  return Math.round(((currentIndex + 1) / workflow.length) * 100)
}

// Helper function to calculate status metrics
function calculateStatusMetrics(statusHistory: any[]) {
  if (statusHistory.length === 0) {
    return {
      totalActions: 0,
      averageReviewTime: 0,
      actionBreakdown: {},
      roleBreakdown: {}
    }
  }

  const actionBreakdown: any = {}
  const roleBreakdown: any = {}
  let totalReviewTime = 0
  let reviewCount = 0

  statusHistory.forEach((entry, index) => {
    // Action breakdown
    actionBreakdown[entry.action] = (actionBreakdown[entry.action] || 0) + 1
    
    // Role breakdown
    roleBreakdown[entry.approverRole] = (roleBreakdown[entry.approverRole] || 0) + 1
    
    // Calculate review time
    if (entry.metadata?.reviewDuration) {
      totalReviewTime += entry.metadata.reviewDuration
      reviewCount++
    }
  })

  return {
    totalActions: statusHistory.length,
    averageReviewTime: reviewCount > 0 ? totalReviewTime / reviewCount : 0,
    actionBreakdown,
    roleBreakdown,
    firstAction: statusHistory[0].createdAt,
    lastAction: statusHistory[statusHistory.length - 1].createdAt,
    totalDuration: new Date(statusHistory[statusHistory.length - 1].createdAt).getTime() - 
                   new Date(statusHistory[0].createdAt).getTime()
  }
}

// Helper function to get status after action
function getStatusAfterAction(action: string): string {
  const statusMap: any = {
    approve: 'approved',
    reject: 'rejected',
    request_revision: 'revision_requested',
    delegate: 'delegated',
    escalate: 'escalated'
  }
  return statusMap[action] || 'unknown'
}
