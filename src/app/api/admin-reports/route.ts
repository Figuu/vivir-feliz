import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'

// Comprehensive validation schemas
const reportQuerySchema = z.object({
  page: z.string().transform(val => parseInt(val) || 1).refine(val => val > 0, 'Page must be greater than 0'),
  limit: z.string().transform(val => parseInt(val) || 10).refine(val => val > 0 && val <= 100, 'Limit must be between 1 and 100'),
  reportType: z.enum(['submission', 'compilation', 'all']).optional().default('all'),
  status: z.string().optional(),
  patientId: z.string().uuid('Invalid patient ID').optional(),
  therapistId: z.string().uuid('Invalid therapist ID').optional(),
  coordinatorId: z.string().uuid('Invalid coordinator ID').optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format').optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be in YYYY-MM-DD format').optional(),
  search: z.string().max(100, 'Search term cannot exceed 100 characters').optional(),
  requiresApproval: z.string().transform(val => val === 'true').optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'submittedAt', 'title']).optional().default('updatedAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc')
})

const distributionSchema = z.object({
  reportId: z.string().uuid('Invalid report ID'),
  reportType: z.enum(['submission', 'compilation']),
  recipients: z.array(z.object({
    recipientId: z.string().uuid('Invalid recipient ID'),
    recipientType: z.enum(['patient', 'parent', 'therapist', 'coordinator', 'external']),
    email: z.string().email('Invalid email address'),
    accessLevel: z.enum(['view', 'download', 'full']).default('view'),
    expiresAt: z.string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Expiry date must be in YYYY-MM-DD format')
      .transform(val => new Date(val))
      .optional()
  })).min(1, 'At least one recipient is required'),
  message: z.string().max(1000, 'Message cannot exceed 1000 characters').optional(),
  notifyRecipients: z.boolean().default(true),
  distributedBy: z.string().uuid('Invalid administrator ID')
})

const approvalSchema = z.object({
  reportId: z.string().uuid('Invalid report ID'),
  reportType: z.enum(['submission', 'compilation']),
  action: z.enum(['approve', 'reject']),
  comments: z.string().max(2000, 'Comments cannot exceed 2000 characters').optional(),
  approvedBy: z.string().uuid('Invalid administrator ID')
})

// GET /api/admin-reports - Get all reports for admin viewing
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    
    if (action === 'statistics') {
      // Get admin statistics
      const [
        totalSubmissions,
        totalCompilations,
        pendingApproval,
        distributed,
        recentActivity
      ] = await Promise.all([
        db.reportSubmission.count(),
        db.finalReportCompilation.count(),
        db.reportSubmission.count({
          where: { requiresAdminApproval: true, status: 'approved' }
        }) + db.finalReportCompilation.count({
          where: { requiresAdminApproval: true, status: 'completed' }
        }),
        db.reportDistribution.count(),
        db.reportSubmission.count({
          where: {
            updatedAt: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
            }
          }
        })
      ])

      return NextResponse.json({
        success: true,
        data: {
          totalSubmissions,
          totalCompilations,
          pendingApproval,
          distributed,
          recentActivity
        }
      })
    }
    
    // Regular query
    const validation = reportQuerySchema.safeParse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      reportType: searchParams.get('reportType'),
      status: searchParams.get('status'),
      patientId: searchParams.get('patientId'),
      therapistId: searchParams.get('therapistId'),
      coordinatorId: searchParams.get('coordinatorId'),
      startDate: searchParams.get('startDate'),
      endDate: searchParams.get('endDate'),
      search: searchParams.get('search'),
      requiresApproval: searchParams.get('requiresApproval'),
      sortBy: searchParams.get('sortBy'),
      sortOrder: searchParams.get('sortOrder')
    })

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: validation.error.errors },
        { status: 400 }
      )
    }

    const { page, limit, reportType, status, patientId, therapistId, coordinatorId, startDate, endDate, search, requiresApproval, sortBy, sortOrder } = validation.data

    // Calculate pagination
    const skip = (page - 1) * limit

    let submissions: any[] = []
    let compilations: any[] = []
    let totalCount = 0

    // Build where clauses
    const submissionWhere: any = {}
    const compilationWhere: any = {}

    if (status) {
      submissionWhere.status = status
      compilationWhere.status = status
    }

    if (patientId) {
      submissionWhere.patientId = patientId
      compilationWhere.patientId = patientId
    }

    if (therapistId) {
      submissionWhere.therapistId = therapistId
    }

    if (coordinatorId) {
      compilationWhere.coordinatorId = coordinatorId
    }

    if (startDate) {
      submissionWhere.createdAt = { gte: new Date(startDate) }
      compilationWhere.createdAt = { gte: new Date(startDate) }
    }

    if (endDate) {
      submissionWhere.createdAt = { 
        ...submissionWhere.createdAt,
        lte: new Date(endDate) 
      }
      compilationWhere.createdAt = { 
        ...compilationWhere.createdAt,
        lte: new Date(endDate) 
      }
    }

    if (search) {
      submissionWhere.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
      compilationWhere.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (requiresApproval !== undefined) {
      submissionWhere.requiresAdminApproval = requiresApproval
      compilationWhere.requiresAdminApproval = requiresApproval
    }

    // Fetch data based on report type
    if (reportType === 'submission' || reportType === 'all') {
      const [subs, subCount] = await Promise.all([
        db.reportSubmission.findMany({
          where: submissionWhere,
          include: {
            patient: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            },
            therapist: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            },
            reviewer: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            },
            distributions: {
              select: {
                id: true,
                distributedAt: true,
                recipients: true
              }
            }
          },
          orderBy: { [sortBy]: sortOrder },
          skip: reportType === 'submission' ? skip : 0,
          take: reportType === 'submission' ? limit : 50
        }),
        db.reportSubmission.count({ where: submissionWhere })
      ])

      submissions = subs.map(s => ({ ...s, reportType: 'submission' }))
      totalCount += subCount
    }

    if (reportType === 'compilation' || reportType === 'all') {
      const [comps, compCount] = await Promise.all([
        db.finalReportCompilation.findMany({
          where: compilationWhere,
          include: {
            patient: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            },
            coordinator: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            },
            includedReports: {
              select: {
                id: true,
                submission: {
                  select: {
                    title: true,
                    reportType: true
                  }
                }
              }
            },
            distributions: {
              select: {
                id: true,
                distributedAt: true,
                recipients: true
              }
            }
          },
          orderBy: { [sortBy]: sortOrder },
          skip: reportType === 'compilation' ? skip : 0,
          take: reportType === 'compilation' ? limit : 50
        }),
        db.finalReportCompilation.count({ where: compilationWhere })
      ])

      compilations = comps.map(c => ({ ...c, reportType: 'compilation' }))
      totalCount += compCount
    }

    // Combine and sort results if fetching all
    let allReports = [...submissions, ...compilations]
    if (reportType === 'all') {
      allReports.sort((a, b) => {
        const aValue = a[sortBy as keyof typeof a]
        const bValue = b[sortBy as keyof typeof b]
        if (sortOrder === 'asc') {
          return aValue > bValue ? 1 : -1
        }
        return aValue < bValue ? 1 : -1
      })
      allReports = allReports.slice(skip, skip + limit)
    }

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit)
    const hasNextPage = page < totalPages
    const hasPrevPage = page > 1

    return NextResponse.json({
      success: true,
      data: {
        reports: allReports,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages,
          hasNextPage,
          hasPrevPage
        }
      }
    })

  } catch (error) {
    console.error('Error fetching admin reports:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/admin-reports - Handle admin actions (distribution, approval)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const action = body.action

    if (action === 'distribute') {
      // Handle report distribution
      const validation = distributionSchema.safeParse(body)
      if (!validation.success) {
        return NextResponse.json(
          { error: 'Invalid request data', details: validation.error.errors },
          { status: 400 }
        )
      }

      const validatedData = validation.data

      // Verify report exists
      let reportExists = false
      if (validatedData.reportType === 'submission') {
        reportExists = !!(await db.reportSubmission.findUnique({
          where: { id: validatedData.reportId }
        }))
      } else {
        reportExists = !!(await db.finalReportCompilation.findUnique({
          where: { id: validatedData.reportId }
        }))
      }

      if (!reportExists) {
        return NextResponse.json(
          { error: 'Report not found' },
          { status: 404 }
        )
      }

      // Create distribution record
      const distribution = await db.reportDistribution.create({
        data: {
          reportId: validatedData.reportId,
          reportType: validatedData.reportType,
          recipients: validatedData.recipients,
          message: validatedData.message,
          distributedBy: validatedData.distributedBy,
          distributedAt: new Date()
        }
      })

      // TODO: Send notifications to recipients if notifyRecipients is true
      if (validatedData.notifyRecipients) {
        console.log('Notification: Report distributed to recipients')
      }

      return NextResponse.json({
        success: true,
        message: 'Report distributed successfully',
        data: distribution
      })
    } else if (action === 'approve' || action === 'reject') {
      // Handle admin approval/rejection
      const validation = approvalSchema.safeParse(body)
      if (!validation.success) {
        return NextResponse.json(
          { error: 'Invalid request data', details: validation.error.errors },
          { status: 400 }
        )
      }

      const validatedData = validation.data

      // Update report status based on type
      if (validatedData.reportType === 'submission') {
        const submission = await db.reportSubmission.findUnique({
          where: { id: validatedData.reportId }
        })

        if (!submission) {
          return NextResponse.json(
            { error: 'Submission not found' },
            { status: 404 }
          )
        }

        const newStatus = validatedData.action === 'approve' ? 'approved' : 'rejected'
        
        await db.reportSubmission.update({
          where: { id: validatedData.reportId },
          data: {
            status: newStatus,
            adminApprovedBy: validatedData.approvedBy,
            adminApprovedAt: new Date(),
            adminComments: validatedData.comments
          }
        })
      } else {
        const compilation = await db.finalReportCompilation.findUnique({
          where: { id: validatedData.reportId }
        })

        if (!compilation) {
          return NextResponse.json(
            { error: 'Compilation not found' },
            { status: 404 }
          )
        }

        const newStatus = validatedData.action === 'approve' ? 'published' : 'under_review'
        
        await db.finalReportCompilation.update({
          where: { id: validatedData.reportId },
          data: {
            status: newStatus,
            approvedBy: validatedData.approvedBy,
            approvedAt: new Date()
          }
        })
      }

      return NextResponse.json({
        success: true,
        message: `Report ${validatedData.action}d successfully`
      })
    } else {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('Error processing admin action:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
