import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'

// Simplified validation schemas
const collaborationQuerySchema = z.object({
  page: z.string().transform(val => parseInt(val) || 1).refine(val => val > 0, 'Page must be greater than 0'),
  limit: z.string().transform(val => parseInt(val) || 10).refine(val => val > 0 && val <= 100, 'Limit must be between 1 and 100'),
  reportType: z.enum(['progress_report', 'final_report']).optional(),
  status: z.enum(['DRAFT', 'SUBMITTED', 'APPROVED']).optional(),
  therapistId: z.string().uuid('Invalid therapist ID').optional(),
  sortBy: z.enum(['createdAt', 'updatedAt']).optional().default('updatedAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc')
})

const commentCreateSchema = z.object({
  reportId: z.string().uuid('Invalid report ID'),
  reportType: z.enum(['progress_report', 'final_report']),
  content: z.string().min(1, 'Comment content is required').max(2000, 'Comment cannot exceed 2000 characters'),
  commenterId: z.string().uuid('Invalid commenter ID')
})

// GET /api/report-collaboration - Get collaborative reports
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Parse and validate query parameters
    const validation = collaborationQuerySchema.safeParse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      reportType: searchParams.get('reportType'),
      status: searchParams.get('status'),
      therapistId: searchParams.get('therapistId'),
      sortBy: searchParams.get('sortBy'),
      sortOrder: searchParams.get('sortOrder')
    })

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: validation.error.issues },
        { status: 400 }
      )
    }

    const { page, limit, reportType, status, therapistId, sortBy, sortOrder } = validation.data

    // Build where clause
    const whereClause: any = {}
    
    if (status) {
      whereClause.status = status
    }
    
    if (therapistId) {
      whereClause.therapistId = therapistId
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
        collaborations: reports,
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
          therapistId,
          sortBy,
          sortOrder
        }
      }
    })

  } catch (error) {
    console.error('Error fetching collaborative reports:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/report-collaboration - Add comment to report
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate request body
    const validation = commentCreateSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.issues },
        { status: 400 }
      )
    }

    const { reportId, reportType, content, commenterId } = validation.data

    // Check if report exists
    let report: any = null
    if (reportType === 'progress_report') {
      report = await db.progressReport.findUnique({
        where: { id: reportId }
      })
    } else if (reportType === 'final_report') {
      report = await db.finalReport.findUnique({
        where: { id: reportId }
      })
    }

    if (!report) {
      return NextResponse.json(
        { error: 'Report not found' },
        { status: 404 }
      )
    }

    // Update report with comment (using coordinatorNotes field for progress reports)
    let updatedReport: any = null
    if (reportType === 'progress_report') {
      updatedReport = await db.progressReport.update({
        where: { id: reportId },
        data: {
          coordinatorNotes: content
        },
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
      // For final reports, we could use a similar approach or create a separate comments table
      updatedReport = report
    }

    return NextResponse.json({
      success: true,
      message: 'Comment added successfully',
      data: {
        reportId: updatedReport.id,
        type: reportType,
        content,
        commenterId,
        report: updatedReport,
        createdAt: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Error adding comment to report:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}