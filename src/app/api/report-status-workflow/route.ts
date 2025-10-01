import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'

// Simplified validation schemas
const statusQuerySchema = z.object({
  reportId: z.string().uuid('Invalid report ID').optional(),
  reportType: z.enum(['progress_report', 'final_report']).optional(),
  patientId: z.string().uuid('Invalid patient ID').optional(),
  therapistId: z.string().uuid('Invalid therapist ID').optional(),
  currentStatus: z.enum(['DRAFT', 'SUBMITTED', 'APPROVED']).optional()
})

const workflowQuerySchema = z.object({
  reportType: z.enum(['progress_report', 'final_report']),
  startStatus: z.enum(['DRAFT', 'SUBMITTED', 'APPROVED']),
  targetStatus: z.enum(['DRAFT', 'SUBMITTED', 'APPROVED']).optional()
})

// Workflow definitions
const workflowDefinitions = {
  progress_report: {
    states: ['DRAFT', 'SUBMITTED', 'APPROVED'],
    transitions: {
      'DRAFT': ['SUBMITTED'],
      'SUBMITTED': ['APPROVED', 'DRAFT'],
      'APPROVED': []
    }
  },
  final_report: {
    states: ['DRAFT', 'SUBMITTED', 'APPROVED'],
    transitions: {
      'DRAFT': ['SUBMITTED'],
      'SUBMITTED': ['APPROVED', 'DRAFT'],
      'APPROVED': []
    }
  }
}

// Helper functions
function getWorkflowDefinition(reportType: string) {
  return workflowDefinitions[reportType as keyof typeof workflowDefinitions] || null
}

function getNextSteps(reportType: string, currentStatus: string): string[] {
  const workflow = getWorkflowDefinition(reportType)
  return workflow?.transitions[currentStatus as keyof typeof workflow.transitions] || []
}

function getStatusPath(reportType: string, startStatus: string, targetStatus: string): string[] {
  const workflow = getWorkflowDefinition(reportType)
  if (!workflow) return []
  
  // Simple path finding - in this case, we have a linear workflow
  const states = workflow.states
  const startIndex = states.indexOf(startStatus)
  const targetIndex = states.indexOf(targetStatus)
  
  if (startIndex === -1 || targetIndex === -1 || startIndex >= targetIndex) {
    return []
  }
  
  return states.slice(startIndex + 1, targetIndex + 1)
}

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

      const whereClause: any = {}
      if (patientId) whereClause.patientId = patientId
      if (therapistId) whereClause.therapistId = therapistId

      const [progressStats, finalStats] = await Promise.all([
        // Progress report statistics by status
        db.progressReport.groupBy({
          by: ['status'],
          where: whereClause,
          _count: true
        }),
        // Final report statistics by status
        db.finalReport.groupBy({
          by: ['status'],
          where: whereClause,
          _count: true
        })
      ])

      // Get recent reports
      const [recentProgress, recentFinal] = await Promise.all([
        db.progressReport.findMany({
          where: whereClause,
          orderBy: { updatedAt: 'desc' },
          take: 10,
          include: {
            patient: {
              select: {
                id: true,
                profile: {
                  select: {
                    firstName: true,
                    lastName: true
                  }
                }
              }
            },
            therapist: {
              select: {
                id: true,
                profile: {
                  select: {
                    firstName: true,
                    lastName: true
                  }
                }
              }
            }
          }
        }),
        db.finalReport.findMany({
          where: whereClause,
          orderBy: { updatedAt: 'desc' },
          take: 10,
          include: {
            patient: {
              select: {
                id: true,
                profile: {
                  select: {
                    firstName: true,
                    lastName: true
                  }
                }
              }
            },
            therapist: {
              select: {
                id: true,
                profile: {
                  select: {
                    firstName: true,
                    lastName: true
                  }
                }
              }
            }
          }
        })
      ])

      return NextResponse.json({
        success: true,
        data: {
          statistics: {
            progressReports: progressStats,
            finalReports: finalStats
          },
          recentActivity: {
            progressReports: recentProgress.map(report => ({
              id: report.id,
              type: 'progress_report',
              reportNumber: report.reportNumber,
              status: report.status,
              patient: report.patient,
              therapist: report.therapist,
              updatedAt: report.updatedAt
            })),
            finalReports: recentFinal.map(report => ({
              id: report.id,
              type: 'final_report',
              status: report.status,
              patient: report.patient,
              therapist: report.therapist,
              updatedAt: report.updatedAt
            }))
          }
        }
      })
    }
    
    // Default action: get status information
    const validation = statusQuerySchema.safeParse({
      reportId: searchParams.get('reportId'),
      reportType: searchParams.get('reportType'),
      patientId: searchParams.get('patientId'),
      therapistId: searchParams.get('therapistId'),
      currentStatus: searchParams.get('currentStatus')
    })

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: validation.error.issues },
        { status: 400 }
      )
    }

    const { reportId, reportType, patientId, therapistId, currentStatus } = validation.data

    let reports: any[] = []

    // Fetch reports based on filters
    if (reportType === 'progress_report' || !reportType) {
      const whereClause: any = {}
      if (reportId) whereClause.id = reportId
      if (patientId) whereClause.patientId = patientId
      if (therapistId) whereClause.therapistId = therapistId
      if (currentStatus) whereClause.status = currentStatus

      const progressReports = await db.progressReport.findMany({
        where: whereClause,
        include: {
          patient: {
            select: {
              id: true,
              profile: {
                select: {
                  firstName: true,
                  lastName: true
                }
              }
            }
          },
          therapist: {
            select: {
              id: true,
              profile: {
                select: {
                  firstName: true,
                  lastName: true
                }
              }
            }
          }
        },
        orderBy: { updatedAt: 'desc' }
      })

      reports = progressReports.map(report => ({
        id: report.id,
        type: 'progress_report',
        reportNumber: report.reportNumber,
        status: report.status,
        coordinatorNotes: report.coordinatorNotes,
        patient: report.patient,
        therapist: report.therapist,
        createdAt: report.createdAt,
        updatedAt: report.updatedAt
      }))
    }

    if (reportType === 'final_report' || !reportType) {
      const whereClause: any = {}
      if (reportId) whereClause.id = reportId
      if (patientId) whereClause.patientId = patientId
      if (therapistId) whereClause.therapistId = therapistId
      if (currentStatus) whereClause.status = currentStatus

      const finalReports = await db.finalReport.findMany({
        where: whereClause,
        include: {
          patient: {
            select: {
              id: true,
              profile: {
                select: {
                  firstName: true,
                  lastName: true
                }
              }
            }
          },
          therapist: {
            select: {
              id: true,
              profile: {
                select: {
                  firstName: true,
                  lastName: true
                }
              }
            }
          }
        },
        orderBy: { updatedAt: 'desc' }
      })

      const finalReportData = finalReports.map(report => ({
        id: report.id,
        type: 'final_report',
        status: report.status,
        patient: report.patient,
        therapist: report.therapist,
        createdAt: report.createdAt,
        updatedAt: report.updatedAt
      }))

      reports = reportType === 'final_report' ? finalReportData : [...reports, ...finalReportData]
    }

    return NextResponse.json({
      success: true,
      data: {
        reports,
        filters: {
          reportId,
          reportType,
          patientId,
          therapistId,
          currentStatus
        }
      }
    })

  } catch (error) {
    console.error('Error fetching report status workflow:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}