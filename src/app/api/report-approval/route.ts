import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'

// Comprehensive validation schemas
const approvalActionSchema = z.object({
  reportId: z.string().uuid('Invalid report ID'),
  reportType: z.enum(['therapeutic_plan', 'progress_report', 'final_report', 'submission', 'compilation']),
  action: z.enum(['approve', 'reject', 'request_revision', 'delegate', 'escalate']),
  approverId: z.string().uuid('Invalid approver ID'),
  approverRole: z.enum(['therapist', 'coordinator', 'administrator']),
  
  // Action-specific data
  comments: z.string()
    .max(2000, 'Comments cannot exceed 2000 characters')
    .transform(val => val?.trim())
    .optional(),
  
  revisionNotes: z.string()
    .max(5000, 'Revision notes cannot exceed 5000 characters')
    .transform(val => val?.trim())
    .optional(),
  
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional().default('medium'),
  
  delegateTo: z.string().uuid('Invalid delegate user ID').optional(),
  
  escalateTo: z.string().uuid('Invalid escalation user ID').optional(),
  
  requiresAdminApproval: z.boolean().optional().default(false),
  
  // Conditions and requirements
  conditions: z.array(z.object({
    condition: z.string().max(200, 'Condition cannot exceed 200 characters'),
    isMet: z.boolean(),
    notes: z.string().max(500, 'Condition notes cannot exceed 500 characters').optional()
  })).optional().default([]),
  
  // Approval metadata
  metadata: z.object({
    reviewDuration: z.number().optional(), // in minutes
    qualityScore: z.number().min(0).max(100).optional(),
    completenessScore: z.number().min(0).max(100).optional(),
    complianceChecks: z.array(z.object({
      checkName: z.string(),
      passed: z.boolean(),
      notes: z.string().optional()
    })).optional()
  }).optional()
})

const approvalQuerySchema = z.object({
  page: z.string().transform(val => parseInt(val) || 1).refine(val => val > 0, 'Page must be greater than 0'),
  limit: z.string().transform(val => parseInt(val) || 10).refine(val => val > 0 && val <= 100, 'Limit must be between 1 and 100'),
  reportId: z.string().uuid('Invalid report ID').optional(),
  reportType: z.enum(['therapeutic_plan', 'progress_report', 'final_report', 'submission', 'compilation']).optional(),
  action: z.enum(['approve', 'reject', 'request_revision', 'delegate', 'escalate']).optional(),
  approverId: z.string().uuid('Invalid approver ID').optional(),
  approverRole: z.enum(['therapist', 'coordinator', 'administrator']).optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format').optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be in YYYY-MM-DD format').optional(),
  sortBy: z.enum(['createdAt', 'action', 'approverRole']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc')
})

const bulkApprovalSchema = z.object({
  approvals: z.array(z.object({
    reportId: z.string().uuid('Invalid report ID'),
    reportType: z.enum(['therapeutic_plan', 'progress_report', 'final_report', 'submission', 'compilation']),
    action: z.enum(['approve', 'reject'])
  })).min(1, 'At least one approval is required').max(50, 'Cannot process more than 50 approvals at once'),
  approverId: z.string().uuid('Invalid approver ID'),
  approverRole: z.enum(['coordinator', 'administrator']),
  comments: z.string().max(1000, 'Bulk comments cannot exceed 1000 characters').optional()
})

const approvalStatsSchema = z.object({
  approverId: z.string().uuid('Invalid approver ID').optional(),
  approverRole: z.enum(['therapist', 'coordinator', 'administrator']).optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format').optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be in YYYY-MM-DD format').optional()
})

// GET /api/report-approval - Get approval history and pending approvals
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    
    if (action === 'statistics') {
      // Get approval statistics
      const validation = approvalStatsSchema.safeParse({
        approverId: searchParams.get('approverId'),
        approverRole: searchParams.get('approverRole'),
        startDate: searchParams.get('startDate'),
        endDate: searchParams.get('endDate')
      })

      if (!validation.success) {
        return NextResponse.json(
          { error: 'Invalid statistics parameters', details: validation.error.errors },
          { status: 400 }
        )
      }

      const { approverId, approverRole, startDate, endDate } = validation.data

      const whereClause: any = {}
      
      if (approverId) {
        whereClause.approverId = approverId
      }
      
      if (approverRole) {
        whereClause.approverRole = approverRole
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

      const [
        totalApprovals,
        totalApproved,
        totalRejected,
        totalRevisionRequests,
        averageReviewTime,
        pendingApprovals
      ] = await Promise.all([
        db.reportApproval.count({ where: whereClause }),
        db.reportApproval.count({ 
          where: { ...whereClause, action: 'approve' } 
        }),
        db.reportApproval.count({ 
          where: { ...whereClause, action: 'reject' } 
        }),
        db.reportApproval.count({ 
          where: { ...whereClause, action: 'request_revision' } 
        }),
        db.reportApproval.aggregate({
          where: {
            ...whereClause,
            metadata: { path: ['reviewDuration'], not: null }
          },
          _avg: {
            metadata: true
          }
        }),
        // Count reports requiring approval
        Promise.all([
          db.reportSubmission.count({
            where: { requiresAdminApproval: true, status: 'approved' }
          }),
          db.finalReportCompilation.count({
            where: { requiresAdminApproval: true, status: 'completed' }
          })
        ]).then(([submissions, compilations]) => submissions + compilations)
      ])

      return NextResponse.json({
        success: true,
        data: {
          totalApprovals,
          totalApproved,
          totalRejected,
          totalRevisionRequests,
          averageReviewTime: 0, // Would need to calculate from metadata
          pendingApprovals,
          approvalRate: totalApprovals > 0 ? (totalApproved / totalApprovals) * 100 : 0,
          rejectionRate: totalApprovals > 0 ? (totalRejected / totalApprovals) * 100 : 0
        }
      })
    }
    
    if (action === 'pending') {
      // Get pending approvals for a specific approver
      const approverId = searchParams.get('approverId')
      const approverRole = searchParams.get('approverRole')

      if (!approverRole) {
        return NextResponse.json(
          { error: 'Approver role is required' },
          { status: 400 }
        )
      }

      // Get pending submissions and compilations based on role
      let pendingReports: any[] = []

      if (approverRole === 'coordinator') {
        const submissions = await db.reportSubmission.findMany({
          where: {
            status: { in: ['submitted', 'under_review'] },
            requiresCoordinatorReview: true,
            OR: approverId ? [
              { reviewerId: approverId },
              { reviewerId: null }
            ] : undefined
          },
          include: {
            patient: {
              select: {
                firstName: true,
                lastName: true
              }
            },
            therapist: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          },
          take: 20
        })
        
        pendingReports = submissions.map(s => ({ ...s, type: 'submission' }))
      } else if (approverRole === 'administrator') {
        const [submissions, compilations] = await Promise.all([
          db.reportSubmission.findMany({
            where: {
              requiresAdminApproval: true,
              status: 'approved'
            },
            include: {
              patient: {
                select: {
                  firstName: true,
                  lastName: true
                }
              },
              therapist: {
                select: {
                  firstName: true,
                  lastName: true
                }
              }
            },
            take: 10
          }),
          db.finalReportCompilation.findMany({
            where: {
              requiresAdminApproval: true,
              status: 'completed'
            },
            include: {
              patient: {
                select: {
                  firstName: true,
                  lastName: true
                }
              },
              coordinator: {
                select: {
                  firstName: true,
                  lastName: true
                }
              }
            },
            take: 10
          })
        ])
        
        pendingReports = [
          ...submissions.map(s => ({ ...s, type: 'submission' })),
          ...compilations.map(c => ({ ...c, type: 'compilation' }))
        ]
      }

      return NextResponse.json({
        success: true,
        data: {
          pendingReports,
          totalPending: pendingReports.length
        }
      })
    }
    
    // Regular query
    const validation = approvalQuerySchema.safeParse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      reportId: searchParams.get('reportId'),
      reportType: searchParams.get('reportType'),
      action: searchParams.get('action'),
      approverId: searchParams.get('approverId'),
      approverRole: searchParams.get('approverRole'),
      startDate: searchParams.get('startDate'),
      endDate: searchParams.get('endDate'),
      sortBy: searchParams.get('sortBy'),
      sortOrder: searchParams.get('sortOrder')
    })

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: validation.error.errors },
        { status: 400 }
      )
    }

    const { page, limit, reportId, reportType, action: actionFilter, approverId, approverRole, startDate, endDate, sortBy, sortOrder } = validation.data

    // Build where clause
    const whereClause: any = {}
    
    if (reportId) {
      whereClause.reportId = reportId
    }
    
    if (reportType) {
      whereClause.reportType = reportType
    }
    
    if (actionFilter) {
      whereClause.action = actionFilter
    }
    
    if (approverId) {
      whereClause.approverId = approverId
    }
    
    if (approverRole) {
      whereClause.approverRole = approverRole
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

    // Get approvals with related data
    const [approvals, totalCount] = await Promise.all([
      db.reportApproval.findMany({
        where: whereClause,
        include: {
          approver: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          delegatedTo: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      db.reportApproval.count({ where: whereClause })
    ])

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit)
    const hasNextPage = page < totalPages
    const hasPrevPage = page > 1

    return NextResponse.json({
      success: true,
      data: {
        approvals,
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
    console.error('Error fetching approvals:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/report-approval - Create approval action
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const isBulk = body.bulkApproval === true
    
    if (isBulk) {
      // Handle bulk approval
      const validation = bulkApprovalSchema.safeParse(body)
      if (!validation.success) {
        return NextResponse.json(
          { error: 'Invalid request data', details: validation.error.errors },
          { status: 400 }
        )
      }

      const validatedData = validation.data

      // Check if approver exists
      const approver = await db.user.findUnique({
        where: { id: validatedData.approverId }
      })

      if (!approver) {
        return NextResponse.json(
          { error: 'Approver not found' },
          { status: 404 }
        )
      }

      // Process each approval
      const results = await Promise.all(
        validatedData.approvals.map(async (approval) => {
          try {
            // Create approval record
            const approvalRecord = await db.reportApproval.create({
              data: {
                reportId: approval.reportId,
                reportType: approval.reportType,
                action: approval.action,
                approverId: validatedData.approverId,
                approverRole: validatedData.approverRole,
                comments: validatedData.comments,
                priority: 'medium',
                conditions: [],
                metadata: {}
              }
            })

            // Update report status based on type and action
            await updateReportStatus(approval.reportId, approval.reportType, approval.action, validatedData.approverId)

            return { success: true, reportId: approval.reportId }
          } catch (err) {
            console.error(`Error processing approval for ${approval.reportId}:`, err)
            return { success: false, reportId: approval.reportId, error: err }
          }
        })
      )

      const successCount = results.filter(r => r.success).length
      const failureCount = results.filter(r => !r.success).length

      return NextResponse.json({
        success: true,
        message: `Bulk approval completed: ${successCount} succeeded, ${failureCount} failed`,
        data: {
          results,
          successCount,
          failureCount
        }
      })
    } else {
      // Handle single approval
      const validation = approvalActionSchema.safeParse(body)
      if (!validation.success) {
        return NextResponse.json(
          { error: 'Invalid request data', details: validation.error.errors },
          { status: 400 }
        )
      }

      const validatedData = validation.data

      // Check if approver exists
      const approver = await db.user.findUnique({
        where: { id: validatedData.approverId }
      })

      if (!approver) {
        return NextResponse.json(
          { error: 'Approver not found' },
          { status: 404 }
        )
      }

      // Validate action-specific requirements
      if (validatedData.action === 'request_revision' && !validatedData.revisionNotes) {
        return NextResponse.json(
          { error: 'Revision notes are required when requesting revisions' },
          { status: 400 }
        )
      }

      if (validatedData.action === 'delegate' && !validatedData.delegateTo) {
        return NextResponse.json(
          { error: 'Delegate user ID is required for delegation' },
          { status: 400 }
        )
      }

      if (validatedData.action === 'escalate' && !validatedData.escalateTo) {
        return NextResponse.json(
          { error: 'Escalation user ID is required for escalation' },
          { status: 400 }
        )
      }

      // Create approval record
      const approval = await db.reportApproval.create({
        data: {
          reportId: validatedData.reportId,
          reportType: validatedData.reportType,
          action: validatedData.action,
          approverId: validatedData.approverId,
          approverRole: validatedData.approverRole,
          comments: validatedData.comments,
          revisionNotes: validatedData.revisionNotes,
          priority: validatedData.priority,
          delegatedToId: validatedData.delegateTo,
          escalatedToId: validatedData.escalateTo,
          requiresAdminApproval: validatedData.requiresAdminApproval,
          conditions: validatedData.conditions,
          metadata: validatedData.metadata
        },
        include: {
          approver: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          delegatedTo: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      })

      // Update report status based on action
      await updateReportStatus(validatedData.reportId, validatedData.reportType, validatedData.action, validatedData.approverId, validatedData)

      // Create version record for the approval
      const latestVersion = await db.reportVersion.findFirst({
        where: {
          reportId: validatedData.reportId,
          reportType: validatedData.reportType
        },
        orderBy: { versionNumber: 'desc' }
      })

      await db.reportVersion.create({
        data: {
          reportId: validatedData.reportId,
          reportType: validatedData.reportType,
          versionNumber: (latestVersion?.versionNumber || 0) + 1,
          changeType: validatedData.action === 'approve' ? 'approved' : validatedData.action === 'reject' ? 'rejected' : 'revised',
          changeDescription: validatedData.comments || `${validatedData.action} by ${validatedData.approverRole}`,
          changedBy: validatedData.approverId,
          changedFields: ['status', 'approvalStatus'],
          previousData: latestVersion?.currentData || {},
          currentData: { approvalAction: validatedData.action, approvedAt: new Date() },
          metadata: validatedData.metadata
        }
      })

      return NextResponse.json({
        success: true,
        message: getActionMessage(validatedData.action),
        data: approval
      }, { status: 201 })
    }

  } catch (error) {
    console.error('Error processing approval:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function to update report status
async function updateReportStatus(
  reportId: string, 
  reportType: string, 
  action: string, 
  approverId: string,
  validatedData?: any
) {
  const statusMap: any = {
    approve: { submission: 'approved', compilation: 'published' },
    reject: { submission: 'rejected', compilation: 'under_review' },
    request_revision: { submission: 'revision_requested', compilation: 'under_review' }
  }

  const newStatus = statusMap[action]?.[reportType === 'compilation' ? 'compilation' : 'submission']

  if (reportType === 'submission') {
    await db.reportSubmission.update({
      where: { id: reportId },
      data: {
        status: newStatus,
        reviewerId: approverId,
        reviewCompletedAt: new Date(),
        revisionNotes: validatedData?.revisionNotes,
        priority: validatedData?.priority
      }
    })
  } else if (reportType === 'compilation') {
    await db.finalReportCompilation.update({
      where: { id: reportId },
      data: {
        status: newStatus,
        approvedBy: action === 'approve' ? approverId : null,
        approvedAt: action === 'approve' ? new Date() : null
      }
    })
  } else {
    // Handle other report types (therapeutic_plan, progress_report, final_report)
    const updateData: any = {
      updatedAt: new Date()
    }

    switch (reportType) {
      case 'therapeutic_plan':
        await db.therapeuticPlan.update({
          where: { id: reportId },
          data: updateData
        })
        break
      case 'progress_report':
        await db.progressReport.update({
          where: { id: reportId },
          data: updateData
        })
        break
      case 'final_report':
        await db.finalReport.update({
          where: { id: reportId },
          data: updateData
        })
        break
    }
  }
}

// Helper function to get action message
function getActionMessage(action: string): string {
  switch (action) {
    case 'approve':
      return 'Report approved successfully'
    case 'reject':
      return 'Report rejected successfully'
    case 'request_revision':
      return 'Revision requested successfully'
    case 'delegate':
      return 'Report delegated successfully'
    case 'escalate':
      return 'Report escalated successfully'
    default:
      return 'Action completed successfully'
  }
}
