import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'

// Comprehensive validation schemas
const collaborationCreateSchema = z.object({
  // Basic Information
  reportId: z.string().uuid('Invalid report ID'),
  reportType: z.enum(['therapeutic_plan', 'progress_report', 'final_report', 'assessment', 'evaluation']),
  
  // Collaboration Settings
  title: z.string()
    .min(3, 'Title must be at least 3 characters')
    .max(200, 'Title cannot exceed 200 characters')
    .transform(val => val.trim()),
  
  description: z.string()
    .min(10, 'Description must be at least 10 characters')
    .max(1000, 'Description cannot exceed 1000 characters')
    .transform(val => val.trim()),
  
  // Participants
  participants: z.array(z.object({
    therapistId: z.string().uuid('Invalid therapist ID'),
    role: z.enum(['owner', 'editor', 'reviewer', 'viewer']),
    permissions: z.object({
      canEdit: z.boolean(),
      canReview: z.boolean(),
      canComment: z.boolean(),
      canApprove: z.boolean(),
      canInvite: z.boolean()
    })
  })).min(1, 'At least one participant is required'),
  
  // Collaboration Rules
  settings: z.object({
    allowSimultaneousEditing: z.boolean().default(true),
    requireApproval: z.boolean().default(false),
    autoSave: z.boolean().default(true),
    lockOnEdit: z.boolean().default(false),
    notificationSettings: z.object({
      onEdit: z.boolean().default(true),
      onComment: z.boolean().default(true),
      onApproval: z.boolean().default(true),
      onCompletion: z.boolean().default(true)
    }),
    validationRules: z.object({
      enforceConsistency: z.boolean().default(true),
      requireValidation: z.boolean().default(true),
      allowOverrides: z.boolean().default(false),
      validationTimeout: z.number().min(1).max(1440).default(30) // minutes
    })
  }).optional().default({}),
  
  // Status
  status: z.enum(['draft', 'in_progress', 'under_review', 'approved', 'completed', 'archived']).default('draft'),
  
  // Timeline
  dueDate: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Due date must be in YYYY-MM-DD format')
    .transform(val => new Date(val))
    .optional(),
  
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  
  // Created by
  createdBy: z.string().uuid('Invalid creator ID')
})

const collaborationUpdateSchema = collaborationCreateSchema.partial()

const collaborationQuerySchema = z.object({
  page: z.string().transform(val => parseInt(val) || 1).refine(val => val > 0, 'Page must be greater than 0'),
  limit: z.string().transform(val => parseInt(val) || 10).refine(val => val > 0 && val <= 100, 'Limit must be between 1 and 100'),
  reportType: z.enum(['therapeutic_plan', 'progress_report', 'final_report', 'assessment', 'evaluation']).optional(),
  status: z.enum(['draft', 'in_progress', 'under_review', 'approved', 'completed', 'archived']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  therapistId: z.string().uuid('Invalid therapist ID').optional(),
  role: z.enum(['owner', 'editor', 'reviewer', 'viewer']).optional(),
  search: z.string().max(100, 'Search term cannot exceed 100 characters').optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'dueDate', 'priority', 'status']).optional().default('updatedAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc')
})

const commentCreateSchema = z.object({
  collaborationId: z.string().uuid('Invalid collaboration ID'),
  content: z.string()
    .min(1, 'Comment content is required')
    .max(2000, 'Comment cannot exceed 2000 characters')
    .transform(val => val.trim()),
  
  type: z.enum(['comment', 'suggestion', 'question', 'approval', 'rejection']).default('comment'),
  
  // Reference to specific content
  reference: z.object({
    section: z.string().max(100, 'Section cannot exceed 100 characters').optional(),
    field: z.string().max(100, 'Field cannot exceed 100 characters').optional(),
    lineNumber: z.number().min(1).optional(),
    text: z.string().max(500, 'Reference text cannot exceed 500 characters').optional()
  }).optional(),
  
  // Visibility
  isPrivate: z.boolean().default(false),
  
  // Mentions
  mentions: z.array(z.string().uuid('Invalid mention ID')).optional().default([]),
  
  // Created by
  createdBy: z.string().uuid('Invalid creator ID')
})

const approvalCreateSchema = z.object({
  collaborationId: z.string().uuid('Invalid collaboration ID'),
  action: z.enum(['approve', 'reject', 'request_changes']),
  
  comments: z.string()
    .min(1, 'Approval comments are required')
    .max(1000, 'Comments cannot exceed 1000 characters')
    .transform(val => val.trim()),
  
  // Validation results
  validationResults: z.object({
    isValid: z.boolean(),
    errors: z.array(z.object({
      field: z.string(),
      message: z.string(),
      severity: z.enum(['error', 'warning', 'info'])
    })).optional().default([]),
    warnings: z.array(z.object({
      field: z.string(),
      message: z.string()
    })).optional().default([])
  }),
  
  // Created by
  createdBy: z.string().uuid('Invalid approver ID')
})

// GET /api/report-collaboration - Get collaboration sessions with filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    
    if (action === 'comments') {
      // Handle comments request
      const collaborationId = searchParams.get('collaborationId')
      if (!collaborationId) {
        return NextResponse.json(
          { error: 'Collaboration ID is required' },
          { status: 400 }
        )
      }

      const comments = await db.reportCollaborationComment.findMany({
        where: { collaborationId },
        include: {
          createdByUser: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          mentions: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        },
        orderBy: { createdAt: 'asc' }
      })

      return NextResponse.json({
        success: true,
        data: comments
      })
    } else if (action === 'approvals') {
      // Handle approvals request
      const collaborationId = searchParams.get('collaborationId')
      if (!collaborationId) {
        return NextResponse.json(
          { error: 'Collaboration ID is required' },
          { status: 400 }
        )
      }

      const approvals = await db.reportCollaborationApproval.findMany({
        where: { collaborationId },
        include: {
          createdByUser: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      })

      return NextResponse.json({
        success: true,
        data: approvals
      })
    } else {
      // Handle regular collaboration request
      const validation = collaborationQuerySchema.safeParse({
        page: searchParams.get('page'),
        limit: searchParams.get('limit'),
        reportType: searchParams.get('reportType'),
        status: searchParams.get('status'),
        priority: searchParams.get('priority'),
        therapistId: searchParams.get('therapistId'),
        role: searchParams.get('role'),
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

      const { page, limit, reportType, status, priority, therapistId, role, search, sortBy, sortOrder } = validation.data

      // Build where clause
      const whereClause: any = {}
      
      if (reportType) {
        whereClause.reportType = reportType
      }
      
      if (status) {
        whereClause.status = status
      }
      
      if (priority) {
        whereClause.priority = priority
      }
      
      if (search) {
        whereClause.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } }
        ]
      }
      
      if (therapistId) {
        whereClause.participants = {
          some: {
            therapistId: therapistId,
            ...(role && { role })
          }
        }
      }

      // Calculate pagination
      const skip = (page - 1) * limit

      // Get collaboration sessions with related data
      const [collaborations, totalCount] = await Promise.all([
        db.reportCollaboration.findMany({
          where: whereClause,
          include: {
            createdByUser: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            },
            participants: {
              include: {
                therapist: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true
                  }
                }
              }
            },
            _count: {
              select: {
                comments: true,
                approvals: true,
                versions: true
              }
            }
          },
          orderBy: { [sortBy]: sortOrder },
          skip,
          take: limit,
        }),
        db.reportCollaboration.count({ where: whereClause })
      ])

      // Calculate pagination metadata
      const totalPages = Math.ceil(totalCount / limit)
      const hasNextPage = page < totalPages
      const hasPrevPage = page > 1

      return NextResponse.json({
        success: true,
        data: {
          collaborations: collaborations.map(collab => ({
            id: collab.id,
            reportId: collab.reportId,
            reportType: collab.reportType,
            title: collab.title,
            description: collab.description,
            status: collab.status,
            priority: collab.priority,
            dueDate: collab.dueDate,
            settings: collab.settings,
            createdBy: collab.createdBy,
            createdByUser: collab.createdByUser,
            participants: collab.participants,
            stats: {
              totalComments: collab._count.comments,
              totalApprovals: collab._count.approvals,
              totalVersions: collab._count.versions
            },
            createdAt: collab.createdAt,
            updatedAt: collab.updatedAt
          })),
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
            priority,
            therapistId,
            role,
            search,
            sortBy,
            sortOrder
          }
        }
      })
    }

  } catch (error) {
    console.error('Error fetching collaboration data:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/report-collaboration - Create collaboration session or add comment/approval
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const action = body.action

    if (action === 'comment') {
      // Handle comment creation
      const validation = commentCreateSchema.safeParse(body)
      if (!validation.success) {
        return NextResponse.json(
          { error: 'Invalid comment data', details: validation.error.issues },
          { status: 400 }
        )
      }

      const validatedData = validation.data

      // Check if collaboration exists
      const collaboration = await db.reportCollaboration.findUnique({
        where: { id: validatedData.collaborationId }
      })

      if (!collaboration) {
        return NextResponse.json(
          { error: 'Collaboration session not found' },
          { status: 404 }
        )
      }

      // Check if user is participant
      const participant = await db.reportCollaborationParticipant.findFirst({
        where: {
          collaborationId: validatedData.collaborationId,
          therapistId: validatedData.createdBy
        }
      })

      if (!participant) {
        return NextResponse.json(
          { error: 'You are not a participant in this collaboration' },
          { status: 403 }
        )
      }

      // Create comment
      const result = await db.reportCollaborationComment.create({
        data: {
          collaborationId: validatedData.collaborationId,
          content: validatedData.content,
          type: validatedData.type,
          reference: validatedData.reference,
          isPrivate: validatedData.isPrivate,
          mentions: validatedData.mentions,
          createdBy: validatedData.createdBy
        },
        include: {
          createdByUser: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          mentions: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      })

      return NextResponse.json({
        success: true,
        message: 'Comment added successfully',
        data: result
      }, { status: 201 })

    } else if (action === 'approval') {
      // Handle approval creation
      const validation = approvalCreateSchema.safeParse(body)
      if (!validation.success) {
        return NextResponse.json(
          { error: 'Invalid approval data', details: validation.error.issues },
          { status: 400 }
        )
      }

      const validatedData = validation.data

      // Check if collaboration exists
      const collaboration = await db.reportCollaboration.findUnique({
        where: { id: validatedData.collaborationId }
      })

      if (!collaboration) {
        return NextResponse.json(
          { error: 'Collaboration session not found' },
          { status: 404 }
        )
      }

      // Check if user has approval permissions
      const participant = await db.reportCollaborationParticipant.findFirst({
        where: {
          collaborationId: validatedData.collaborationId,
          therapistId: validatedData.createdBy,
          permissions: {
            path: ['canApprove'],
            equals: true
          }
        }
      })

      if (!participant) {
        return NextResponse.json(
          { error: 'You do not have approval permissions for this collaboration' },
          { status: 403 }
        )
      }

      // Create approval
      const result = await db.reportCollaborationApproval.create({
        data: {
          collaborationId: validatedData.collaborationId,
          action: validatedData.action,
          comments: validatedData.comments,
          validationResults: validatedData.validationResults,
          createdBy: validatedData.createdBy
        },
        include: {
          createdByUser: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      })

      // Update collaboration status based on approval
      let newStatus = collaboration.status
      if (validatedData.action === 'approve') {
        newStatus = 'approved'
      } else if (validatedData.action === 'reject') {
        newStatus = 'draft'
      } else if (validatedData.action === 'request_changes') {
        newStatus = 'in_progress'
      }

      await db.reportCollaboration.update({
        where: { id: validatedData.collaborationId },
        data: { status: newStatus }
      })

      return NextResponse.json({
        success: true,
        message: 'Approval submitted successfully',
        data: result
      }, { status: 201 })

    } else {
      // Handle collaboration creation
      const validation = collaborationCreateSchema.safeParse(body)
      if (!validation.success) {
        return NextResponse.json(
          { error: 'Invalid collaboration data', details: validation.error.issues },
          { status: 400 }
        )
      }

      const validatedData = validation.data

      // Check if creator exists
      const creator = await db.user.findUnique({
        where: { id: validatedData.createdBy }
      })

      if (!creator) {
        return NextResponse.json(
          { error: 'Creator not found' },
          { status: 404 }
        )
      }

      // Validate all participants exist
      for (const participant of validatedData.participants) {
        const therapist = await db.therapist.findUnique({
          where: { id: participant.therapistId }
        })

        if (!therapist) {
          return NextResponse.json(
            { error: `Therapist not found: ${participant.therapistId}` },
            { status: 404 }
          )
        }
      }

      // Create collaboration with transaction
      const result = await db.$transaction(async (tx) => {
        // Create collaboration
        const collaboration = await tx.reportCollaboration.create({
          data: {
            reportId: validatedData.reportId,
            reportType: validatedData.reportType,
            title: validatedData.title,
            description: validatedData.description,
            status: validatedData.status,
            priority: validatedData.priority,
            dueDate: validatedData.dueDate,
            settings: validatedData.settings,
            createdBy: validatedData.createdBy
          }
        })

        // Create participants
        for (const participantData of validatedData.participants) {
          await tx.reportCollaborationParticipant.create({
            data: {
              collaborationId: collaboration.id,
              therapistId: participantData.therapistId,
              role: participantData.role,
              permissions: participantData.permissions
            }
          })
        }

        return collaboration
      })

      // Return created collaboration with related data
      const createdCollaboration = await db.reportCollaboration.findUnique({
        where: { id: result.id },
        include: {
          createdByUser: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          participants: {
            include: {
              therapist: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true
                }
              }
            }
          },
          _count: {
            select: {
              comments: true,
              approvals: true,
              versions: true
            }
          }
        }
      })

      return NextResponse.json({
        success: true,
        message: 'Collaboration session created successfully',
        data: createdCollaboration
      }, { status: 201 })
    }

  } catch (error) {
    console.error('Error creating collaboration data:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
