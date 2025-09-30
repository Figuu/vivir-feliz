import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'

// NOTE: This route requires ReportSubmission and ReviewComment models to be added to the Prisma schema
// These models are currently missing and need to be defined before this API can work properly

// Comprehensive validation schemas
const reviewActionSchema = z.object({
  submissionId: z.string().uuid('Invalid submission ID'),
  coordinatorId: z.string().uuid('Invalid coordinator ID'),
  action: z.enum(['approve', 'request_revision', 'start_review']),
  comments: z.string()
    .min(10, 'Comments must be at least 10 characters')
    .max(2000, 'Comments cannot exceed 2000 characters')
    .transform(val => val.trim())
    .optional(),
  revisionNotes: z.string()
    .max(5000, 'Revision notes cannot exceed 5000 characters')
    .transform(val => val?.trim())
    .optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional().default('medium'),
  requiresAdminApproval: z.boolean().optional().default(false)
})

const reviewQuerySchema = z.object({
  page: z.string().transform(val => parseInt(val) || 1).refine(val => val > 0, 'Page must be greater than 0'),
  limit: z.string().transform(val => parseInt(val) || 10).refine(val => val > 0 && val <= 100, 'Limit must be between 1 and 100'),
  coordinatorId: z.string().uuid('Invalid coordinator ID').optional(),
  status: z.enum(['submitted', 'under_review', 'approved', 'revision_requested']).optional(),
  reportType: z.enum(['therapeutic_plan', 'progress_report', 'final_report', 'session_notes', 'assessment', 'evaluation']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  therapistId: z.string().uuid('Invalid therapist ID').optional(),
  patientId: z.string().uuid('Invalid patient ID').optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format').optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be in YYYY-MM-DD format').optional(),
  search: z.string().max(100, 'Search term cannot exceed 100 characters').optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'submittedAt', 'priority']).optional().default('submittedAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc')
})

const bulkActionSchema = z.object({
  submissionIds: z.array(z.string().uuid('Invalid submission ID')).min(1, 'At least one submission ID is required'),
  coordinatorId: z.string().uuid('Invalid coordinator ID'),
  action: z.enum(['start_review', 'mark_urgent']),
  comments: z.string().max(1000, 'Comments cannot exceed 1000 characters').optional()
})

// GET /api/coordinator-review - Get submissions for review
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    
    if (action === 'statistics') {
      // Get review statistics
      const coordinatorId = searchParams.get('coordinatorId')
      
      const whereClause: any = {
        status: { in: ['submitted', 'under_review'] }
      }
      
      if (coordinatorId) {
        whereClause.reviewerId = coordinatorId
      }

      const [totalPending, underReview, highPriority, overdue] = await Promise.all([
        (db as any).reportSubmission.count({
          where: { status: 'submitted' }
        }),
        (db as any).reportSubmission.count({
          where: { status: 'under_review', reviewerId: coordinatorId || undefined }
        }),
        (db as any).reportSubmission.count({
          where: {
            ...whereClause,
            priority: { in: ['high', 'urgent'] }
          }
        }),
        (db as any).reportSubmission.count({
          where: {
            ...whereClause,
            submittedAt: {
              lte: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3 days ago
            }
          }
        })
      ])

      return NextResponse.json({
        success: true,
        data: {
          totalPending,
          underReview,
          highPriority,
          overdue
        }
      })
    }
    
    // Regular query
    const validation = reviewQuerySchema.safeParse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      coordinatorId: searchParams.get('coordinatorId'),
      status: searchParams.get('status'),
      reportType: searchParams.get('reportType'),
      priority: searchParams.get('priority'),
      therapistId: searchParams.get('therapistId'),
      patientId: searchParams.get('patientId'),
      startDate: searchParams.get('startDate'),
      endDate: searchParams.get('endDate'),
      search: searchParams.get('search'),
      sortBy: searchParams.get('sortBy'),
      sortOrder: searchParams.get('sortOrder')
    })

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: validation.error.issues },
        { status: 400 }
      )
    }

    const { page, limit, coordinatorId, status, reportType, priority, therapistId, patientId, startDate, endDate, search, sortBy, sortOrder } = validation.data

    // Build where clause
    const whereClause: any = {}
    
    // Only show submissions that require review
    if (!status) {
      whereClause.status = { in: ['submitted', 'under_review'] }
    } else {
      whereClause.status = status
    }
    
    if (coordinatorId) {
      whereClause.OR = [
        { reviewerId: coordinatorId },
        { reviewerId: null, status: 'submitted' } // Unassigned submissions
      ]
    }
    
    if (reportType) {
      whereClause.reportType = reportType
    }
    
    if (priority) {
      whereClause.priority = priority
    }
    
    if (therapistId) {
      whereClause.therapistId = therapistId
    }
    
    if (patientId) {
      whereClause.patientId = patientId
    }
    
    if (startDate) {
      whereClause.submittedAt = { gte: new Date(startDate) }
    }
    
    if (endDate) {
      whereClause.submittedAt = { 
        ...whereClause.submittedAt,
        lte: new Date(endDate) 
      }
    }
    
    if (search) {
      whereClause.OR = [
        ...(whereClause.OR || []),
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Calculate pagination
    const skip = (page - 1) * limit

    // Get submissions with related data
    const [submissions, totalCount] = await Promise.all([
      (db as any).reportSubmission.findMany({
        where: whereClause,
        include: {
          therapist: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          patient: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          submittedByUser: {
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
          reviewComments: {
            orderBy: { createdAt: 'desc' },
            take: 5,
            include: {
              reviewer: {
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
      (db as any).reportSubmission.count({ where: whereClause })
    ])

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit)
    const hasNextPage = page < totalPages
    const hasPrevPage = page > 1

    return NextResponse.json({
      success: true,
      data: {
        submissions,
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
    console.error('Error fetching submissions for review:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/coordinator-review - Perform review action
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const action = body.bulkAction ? 'bulk' : 'single'
    
    if (action === 'bulk') {
      // Handle bulk actions
      const validation = bulkActionSchema.safeParse(body)
      if (!validation.success) {
        return NextResponse.json(
          { error: 'Invalid request data', details: validation.error.issues },
          { status: 400 }
        )
      }

      const validatedData = validation.data

      // Check if coordinator exists
      const coordinator = await db.profile.findUnique({
        where: { id: validatedData.coordinatorId }
      })

      if (!coordinator) {
        return NextResponse.json(
          { error: 'Coordinator not found' },
          { status: 404 }
        )
      }

      // Perform bulk action
      const updates: any = {}
      
      if (validatedData.action === 'start_review') {
        updates.status = 'under_review'
        updates.reviewerId = validatedData.coordinatorId
        updates.reviewStartedAt = new Date()
      } else if (validatedData.action === 'mark_urgent') {
        updates.priority = 'urgent'
      }

      await (db as any).reportSubmission.updateMany({
        where: {
          id: { in: validatedData.submissionIds },
          status: { in: ['submitted', 'under_review'] }
        },
        data: updates
      })

      return NextResponse.json({
        success: true,
        message: `Bulk action completed for ${validatedData.submissionIds.length} submissions`
      })
    } else {
      // Handle single review action
      const validation = reviewActionSchema.safeParse(body)
      if (!validation.success) {
        return NextResponse.json(
          { error: 'Invalid request data', details: validation.error.issues },
          { status: 400 }
        )
      }

      const validatedData = validation.data

      // Check if submission exists
      const submission = await (db as any).reportSubmission.findUnique({
        where: { id: validatedData.submissionId },
        include: {
          therapist: true,
          patient: true
        }
      })

      if (!submission) {
        return NextResponse.json(
          { error: 'Submission not found' },
          { status: 404 }
        )
      }

      // Check if coordinator exists
      const coordinator = await db.profile.findUnique({
        where: { id: validatedData.coordinatorId }
      })

      if (!coordinator) {
        return NextResponse.json(
          { error: 'Coordinator not found' },
          { status: 404 }
        )
      }

      // Validate submission status
      if (submission.status === 'approved') {
        return NextResponse.json(
          { error: 'Submission is already approved' },
          { status: 400 }
        )
      }

      // Perform action
      let updatedSubmission
      let reviewComment = null

      switch (validatedData.action) {
        case 'approve':
          updatedSubmission = await (db as any).reportSubmission.update({
            where: { id: validatedData.submissionId },
            data: {
              status: 'approved',
              reviewerId: validatedData.coordinatorId,
              reviewCompletedAt: new Date(),
              requiresAdminApproval: validatedData.requiresAdminApproval
            },
            include: {
              therapist: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true
                }
              },
              patient: {
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
              }
            }
          })

          // Create approval comment
          if (validatedData.comments) {
            reviewComment = await (db as any).reviewComment.create({
              data: {
                submissionId: validatedData.submissionId,
                reviewerId: validatedData.coordinatorId,
                commentType: 'approval',
                content: validatedData.comments,
                isVisible: true
              }
            })
          }

          // TODO: Send notification to therapist
          console.log('Notification: Report approved by coordinator')
          break

        case 'request_revision':
          if (!validatedData.revisionNotes) {
            return NextResponse.json(
              { error: 'Revision notes are required when requesting revisions' },
              { status: 400 }
            )
          }

          updatedSubmission = await (db as any).reportSubmission.update({
            where: { id: validatedData.submissionId },
            data: {
              status: 'revision_requested',
              reviewerId: validatedData.coordinatorId,
              reviewCompletedAt: new Date(),
              revisionNotes: validatedData.revisionNotes,
              priority: validatedData.priority
            },
            include: {
              therapist: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true
                }
              },
              patient: {
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
              }
            }
          })

          // Create revision comment
          reviewComment = await (db as any).reviewComment.create({
            data: {
              submissionId: validatedData.submissionId,
              reviewerId: validatedData.coordinatorId,
              commentType: 'revision_request',
              content: validatedData.revisionNotes,
              isVisible: true
            }
          })

          // TODO: Send notification to therapist
          console.log('Notification: Revision requested by coordinator')
          break

        case 'start_review':
          updatedSubmission = await (db as any).reportSubmission.update({
            where: { id: validatedData.submissionId },
            data: {
              status: 'under_review',
              reviewerId: validatedData.coordinatorId,
              reviewStartedAt: new Date()
            },
            include: {
              therapist: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true
                }
              },
              patient: {
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
              }
            }
          })

          // Create review started comment
          if (validatedData.comments) {
            reviewComment = await (db as any).reviewComment.create({
              data: {
                submissionId: validatedData.submissionId,
                reviewerId: validatedData.coordinatorId,
                commentType: 'general',
                content: validatedData.comments,
                isVisible: false
              }
            })
          }
          break
      }

      return NextResponse.json({
        success: true,
        message: getActionMessage(validatedData.action),
        data: {
          submission: updatedSubmission,
          reviewComment
        }
      })
    }

  } catch (error) {
    console.error('Error performing review action:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function to get action message
function getActionMessage(action: string): string {
  switch (action) {
    case 'approve':
      return 'Report approved successfully'
    case 'request_revision':
      return 'Revision requested successfully'
    case 'start_review':
      return 'Review started successfully'
    default:
      return 'Action completed successfully'
  }
}
