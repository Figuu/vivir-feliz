import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'

// Simplified validation schemas
const reportSubmissionCreateSchema = z.object({
  reportType: z.enum(['progress_report', 'final_report']),
  reportId: z.string().uuid('Invalid report ID'),
  therapistId: z.string().uuid('Invalid therapist ID'),
  patientId: z.string().uuid('Invalid patient ID'),
  title: z.string().min(3, 'Title must be at least 3 characters').max(200, 'Title cannot exceed 200 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters').max(2000, 'Description cannot exceed 2000 characters'),
  status: z.enum(['DRAFT', 'SUBMITTED', 'APPROVED']).default('DRAFT'),
  notes: z.string().max(2000, 'Notes cannot exceed 2000 characters').optional()
})

const reportSubmissionQuerySchema = z.object({
  page: z.string().transform(val => parseInt(val) || 1).refine(val => val > 0, 'Page must be greater than 0'),
  limit: z.string().transform(val => parseInt(val) || 10).refine(val => val > 0 && val <= 100, 'Limit must be between 1 and 100'),
  therapistId: z.string().uuid('Invalid therapist ID').optional(),
  patientId: z.string().uuid('Invalid patient ID').optional(),
  reportType: z.enum(['progress_report', 'final_report']).optional(),
  status: z.enum(['DRAFT', 'SUBMITTED', 'APPROVED']).optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format').optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be in YYYY-MM-DD format').optional(),
  sortBy: z.enum(['createdAt', 'updatedAt']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc')
})

// GET /api/report-submission - Get report submissions
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const validation = reportSubmissionQuerySchema.safeParse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      therapistId: searchParams.get('therapistId'),
      patientId: searchParams.get('patientId'),
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

    const { page, limit, therapistId, patientId, reportType, status, startDate, endDate, sortBy, sortOrder } = validation.data

    // Build where clause
    const whereClause: any = {}
    
    if (therapistId) whereClause.therapistId = therapistId
    if (patientId) whereClause.patientId = patientId
    if (status) whereClause.status = status
    
    if (startDate || endDate) {
      whereClause.createdAt = {}
      if (startDate) whereClause.createdAt.gte = new Date(startDate)
      if (endDate) whereClause.createdAt.lte = new Date(endDate)
    }

    // Calculate pagination
    const skip = (page - 1) * limit

    let reports: any[] = []
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
        submissions: reports,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages,
          hasNextPage,
          hasPrevPage
        },
        filters: {
          therapistId,
          patientId,
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
    console.error('Error fetching report submissions:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/report-submission - Create or update report submission
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate request body
    const validation = reportSubmissionCreateSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.issues },
        { status: 400 }
      )
    }

    const { reportType, reportId, therapistId, patientId, title, description, status, notes } = validation.data

    let createdReport: any = null

    // Create or update report based on type
    if (reportType === 'progress_report') {
      // Check if report already exists
      const existingReport = await db.progressReport.findUnique({
        where: { id: reportId }
      })

      if (existingReport) {
        // Update existing report
        createdReport = await db.progressReport.update({
          where: { id: reportId },
          data: {
            status,
            coordinatorNotes: notes
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
      } else {
        // Create new progress report
        createdReport = await db.progressReport.create({
          data: {
            id: reportId,
            patientId,
            therapistId,
            reportNumber: Math.floor(Date.now() / 1000),
            status,
            coordinatorNotes: notes
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
      }
    } else if (reportType === 'final_report') {
      // Check if report already exists
      const existingReport = await db.finalReport.findUnique({
        where: { id: reportId }
      })

      if (existingReport) {
        // Update existing report
        createdReport = await db.finalReport.update({
          where: { id: reportId },
          data: {
            status
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
      } else {
        // Create new final report
        createdReport = await db.finalReport.create({
          data: {
            id: reportId,
            patientId,
            therapistId,
            status
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
      }
    }

    if (!createdReport) {
      return NextResponse.json(
        { error: 'Failed to create or update report' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Report submission created successfully',
      data: {
        submission: {
          id: createdReport.id,
          type: reportType,
          status: createdReport.status,
          patient: createdReport.patient,
          therapist: createdReport.therapist,
          createdAt: createdReport.createdAt,
          updatedAt: createdReport.updatedAt
        }
      }
    })

  } catch (error) {
    console.error('Error creating report submission:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}