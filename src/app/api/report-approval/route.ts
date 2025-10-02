import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'

// Simplified validation schemas
const approvalActionSchema = z.object({
  reportId: z.string().uuid('Invalid report ID'),
  reportType: z.enum(['progress_report', 'final_report']),
  action: z.enum(['approve', 'reject', 'request_revision']),
  approverId: z.string().uuid('Invalid approver ID'),
  comments: z.string().max(2000, 'Comments cannot exceed 2000 characters').optional()
})

const approvalQuerySchema = z.object({
  page: z.string().transform(val => parseInt(val) || 1).refine(val => val > 0, 'Page must be greater than 0'),
  limit: z.string().transform(val => parseInt(val) || 10).refine(val => val > 0 && val <= 100, 'Limit must be between 1 and 100'),
  reportType: z.enum(['progress_report', 'final_report']).optional(),
  status: z.enum(['DRAFT', 'SUBMITTED', 'APPROVED']).optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format').optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be in YYYY-MM-DD format').optional(),
  sortBy: z.enum(['createdAt', 'updatedAt']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc')
})

// GET /api/report-approval - Get approval history and pending approvals
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Parse and validate query parameters
    const validation = approvalQuerySchema.safeParse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      reportType: searchParams.get('reportType'),
      status: searchParams.get('status'),
      startDate: searchParams.get('startDate'),
      endDate: searchParams.get('endDate'),
      sortBy: searchParams.get('sortBy'),
      sortOrder: searchParams.get('sortOrder')
    })

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: validation.error.issues },
        { status: 400 }
      )
    }

    const { page, limit, reportType, status, startDate, endDate, sortBy, sortOrder } = validation.data

    // Build where clause
    const whereClause: any = {}
    
    if (status) {
      whereClause.status = status
    }
    
    if (startDate) {
      whereClause.createdAt = { gte: new Date(startDate) }
    }
    
    if (endDate) {
      whereClause.createdAt = { 
        ...whereClause.createdAt,
        lte: new Date(endDate) 
      }
    }

    // Calculate pagination
    const skip = (page - 1) * limit

    let reports: Array<{
      id: string;
      type: string;
      reportNumber?: number;
      status: string;
      coordinatorNotes?: string | null;
      patient: any;
      therapist: any;
      createdAt: Date;
      updatedAt: Date;
    }> = []
    let totalCount = 0

    // Fetch reports based on type
    if (reportType === 'progress_report' || !reportType) {
      const [progressReports, progressCount] = await Promise.all([
        db.progressReport.findMany({
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
          orderBy: { [sortBy]: sortOrder },
          skip,
          take: limit,
        }),
        db.progressReport.count({ where: whereClause })
      ])

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

      totalCount = progressCount
    }

    if (reportType === 'final_report' || !reportType) {
      const [finalReports, finalCount] = await Promise.all([
        db.finalReport.findMany({
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
          orderBy: { [sortBy]: sortOrder },
          skip,
          take: limit,
        }),
        db.finalReport.count({ where: whereClause })
      ])

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
      totalCount = reportType === 'final_report' ? finalCount : totalCount + finalCount
    }

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit)
    const hasNextPage = page < totalPages
    const hasPrevPage = page > 1

    return NextResponse.json({
      success: true,
      data: {
        reports,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages,
          hasNextPage,
          hasPrevPage
        },
        filters: {
          reportType,
          status,
          startDate,
          endDate,
          sortBy,
          sortOrder
        }
      }
    })

  } catch (error) {
    console.error('Error fetching report approvals:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/report-approval - Approve or reject a report
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate request body
    const validation = approvalActionSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.issues },
        { status: 400 }
      )
    }

    const { reportId, reportType, action, approverId, comments } = validation.data

    let updatedReport: any = null

    // Update report based on type
    if (reportType === 'progress_report') {
      const updateData: any = {
        status: action === 'approve' ? 'APPROVED' : action === 'reject' ? 'REJECTED' : 'DRAFT'
      }

      if (comments) {
        updateData.coordinatorNotes = comments
      }

      updatedReport = await db.progressReport.update({
        where: { id: reportId },
        data: updateData,
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
    } else if (reportType === 'final_report') {
      const updateData: any = {
        status: action === 'approve' ? 'APPROVED' : action === 'reject' ? 'REJECTED' : 'DRAFT'
      }

      updatedReport = await db.finalReport.update({
        where: { id: reportId },
        data: updateData,
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
    }

    if (!updatedReport) {
      return NextResponse.json(
        { error: 'Report not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Report ${action}d successfully`,
      data: {
        reportId: updatedReport.id,
        type: reportType,
        status: updatedReport.status,
        action,
        approverId,
        comments,
        patient: updatedReport.patient,
        therapist: updatedReport.therapist,
        updatedAt: updatedReport.updatedAt
      }
    })

  } catch (error) {
    console.error('Error processing report approval:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}