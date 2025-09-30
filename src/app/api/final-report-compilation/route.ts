import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'

// NOTE: This route requires FinalReportCompilation, ReportSubmission, and CompilationIncludedReport models to be added to the Prisma schema
// These models are currently missing and need to be defined before this API can work properly

// Comprehensive validation schemas
const compilationCreateSchema = z.object({
  // Basic Information
  patientId: z.string().uuid('Invalid patient ID'),
  coordinatorId: z.string().uuid('Invalid coordinator ID'),
  
  title: z.string()
    .min(3, 'Title must be at least 3 characters')
    .max(200, 'Title cannot exceed 200 characters')
    .transform(val => val.trim()),
  
  description: z.string()
    .min(10, 'Description must be at least 10 characters')
    .max(2000, 'Description cannot exceed 2000 characters')
    .transform(val => val.trim()),
  
  // Report Selection
  includedReports: z.array(z.object({
    submissionId: z.string().uuid('Invalid submission ID'),
    reportType: z.enum(['therapeutic_plan', 'progress_report', 'final_report', 'session_notes', 'assessment', 'evaluation']),
    includeInCompilation: z.boolean().default(true),
    order: z.number().min(0, 'Order must be positive'),
    notes: z.string().max(1000, 'Notes cannot exceed 1000 characters').optional()
  })).min(1, 'At least one report must be included'),
  
  // Compilation Content
  executiveSummary: z.string()
    .min(50, 'Executive summary must be at least 50 characters')
    .max(5000, 'Executive summary cannot exceed 5000 characters')
    .transform(val => val.trim()),
  
  overallAssessment: z.string()
    .min(50, 'Overall assessment must be at least 50 characters')
    .max(5000, 'Overall assessment cannot exceed 5000 characters')
    .transform(val => val.trim()),
  
  keyFindings: z.array(z.string().max(500, 'Key finding cannot exceed 500 characters')).min(1, 'At least one key finding is required'),
  
  recommendations: z.array(z.object({
    category: z.enum(['treatment', 'medication', 'lifestyle', 'referral', 'monitoring', 'follow_up']),
    priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
    description: z.string().max(1000, 'Recommendation description cannot exceed 1000 characters'),
    responsibleParty: z.string().max(200, 'Responsible party cannot exceed 200 characters').optional(),
    timeline: z.string().max(200, 'Timeline cannot exceed 200 characters').optional()
  })).min(1, 'At least one recommendation is required'),
  
  treatmentOutcomes: z.object({
    initialStatus: z.string().max(1000, 'Initial status cannot exceed 1000 characters'),
    currentStatus: z.string().max(1000, 'Current status cannot exceed 1000 characters'),
    progressSummary: z.string().max(2000, 'Progress summary cannot exceed 2000 characters'),
    achievedGoals: z.array(z.string().max(500, 'Achieved goal cannot exceed 500 characters')),
    ongoingChallenges: z.array(z.string().max(500, 'Ongoing challenge cannot exceed 500 characters')),
    overallImprovement: z.number().min(0).max(100, 'Overall improvement must be between 0 and 100')
  }),
  
  // Additional Sections
  clinicalNotes: z.string().max(5000, 'Clinical notes cannot exceed 5000 characters').optional(),
  
  attachments: z.array(z.object({
    name: z.string().max(255, 'Attachment name cannot exceed 255 characters'),
    url: z.string().url('Invalid attachment URL'),
    type: z.string().max(50, 'Attachment type cannot exceed 50 characters'),
    size: z.number().min(0, 'Attachment size must be positive')
  })).optional().default([]),
  
  // Metadata
  tags: z.array(z.string().max(50, 'Tag cannot exceed 50 characters')).optional().default([]),
  
  status: z.enum(['draft', 'under_review', 'completed', 'published']).default('draft'),
  
  requiresAdminApproval: z.boolean().default(false)
})

const compilationUpdateSchema = compilationCreateSchema.partial().extend({
  id: z.string().uuid('Invalid compilation ID')
})

const compilationQuerySchema = z.object({
  page: z.string().transform(val => parseInt(val) || 1).refine(val => val > 0, 'Page must be greater than 0'),
  limit: z.string().transform(val => parseInt(val) || 10).refine(val => val > 0 && val <= 100, 'Limit must be between 1 and 100'),
  patientId: z.string().uuid('Invalid patient ID').optional(),
  coordinatorId: z.string().uuid('Invalid coordinator ID').optional(),
  status: z.enum(['draft', 'under_review', 'completed', 'published']).optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format').optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be in YYYY-MM-DD format').optional(),
  search: z.string().max(100, 'Search term cannot exceed 100 characters').optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'title']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc')
})

// GET /api/final-report-compilation - Get report compilations
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    
    if (action === 'available_reports') {
      // Get approved reports available for compilation
      const patientId = searchParams.get('patientId')
      
      if (!patientId) {
        return NextResponse.json(
          { error: 'Patient ID is required' },
          { status: 400 }
        )
      }

      const approvedReports = await (db as any).reportSubmission.findMany({
        where: {
          patientId,
          status: 'approved'
        },
        include: {
          therapist: {
            select: {
              id: true,
              firstName: true,
              lastName: true
            }
          }
        },
        orderBy: { submittedAt: 'desc' }
      })

      return NextResponse.json({
        success: true,
        data: approvedReports
      })
    }
    
    // Regular query
    const validation = compilationQuerySchema.safeParse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      patientId: searchParams.get('patientId'),
      coordinatorId: searchParams.get('coordinatorId'),
      status: searchParams.get('status'),
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

    const { page, limit, patientId, coordinatorId, status, startDate, endDate, search, sortBy, sortOrder } = validation.data

    // Build where clause
    const whereClause: any = {}
    
    if (patientId) {
      whereClause.patientId = patientId
    }
    
    if (coordinatorId) {
      whereClause.coordinatorId = coordinatorId
    }
    
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
    
    if (search) {
      whereClause.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Calculate pagination
    const skip = (page - 1) * limit

    // Get compilations with related data
    const [compilations, totalCount] = await Promise.all([
      (db as any).finalReportCompilation.findMany({
        where: whereClause,
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
            include: {
              submission: {
                select: {
                  id: true,
                  title: true,
                  reportType: true,
                  therapist: {
                    select: {
                      firstName: true,
                      lastName: true
                    }
                  }
                }
              }
            },
            orderBy: { order: 'asc' }
          }
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      (db as any).finalReportCompilation.count({ where: whereClause })
    ])

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit)
    const hasNextPage = page < totalPages
    const hasPrevPage = page > 1

    return NextResponse.json({
      success: true,
      data: {
        compilations,
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
    console.error('Error fetching report compilations:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/final-report-compilation - Create a new report compilation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate request body
    const validation = compilationCreateSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.issues },
        { status: 400 }
      )
    }

    const validatedData = validation.data

    // Check if patient exists
    const patient = await db.patient.findUnique({
      where: { id: validatedData.patientId }
    })

    if (!patient) {
      return NextResponse.json(
        { error: 'Patient not found' },
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

    // Verify all included reports exist and are approved
    const reportIds = validatedData.includedReports.map(r => r.submissionId)
    const submissions = await (db as any).reportSubmission.findMany({
      where: {
        id: { in: reportIds },
        status: 'approved',
        patientId: validatedData.patientId
      }
    })

    if (submissions.length !== reportIds.length) {
      return NextResponse.json(
        { error: 'One or more reports are not approved or do not belong to this patient' },
        { status: 400 }
      )
    }

    // Create compilation with included reports
    const compilation = await (db as any).finalReportCompilation.create({
      data: {
        patientId: validatedData.patientId,
        coordinatorId: validatedData.coordinatorId,
        title: validatedData.title,
        description: validatedData.description,
        executiveSummary: validatedData.executiveSummary,
        overallAssessment: validatedData.overallAssessment,
        keyFindings: validatedData.keyFindings,
        recommendations: validatedData.recommendations,
        treatmentOutcomes: validatedData.treatmentOutcomes,
        clinicalNotes: validatedData.clinicalNotes,
        attachments: validatedData.attachments,
        tags: validatedData.tags,
        status: validatedData.status,
        requiresAdminApproval: validatedData.requiresAdminApproval,
        includedReports: {
          create: validatedData.includedReports.map(report => ({
            submissionId: report.submissionId,
            reportType: report.reportType,
            includeInCompilation: report.includeInCompilation,
            order: report.order,
            notes: report.notes
          }))
        }
      },
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
          include: {
            submission: {
              select: {
                id: true,
                title: true,
                reportType: true
              }
            }
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Final report compilation created successfully',
      data: compilation
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating report compilation:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/final-report-compilation - Update a report compilation
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate request body
    const validation = compilationUpdateSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.issues },
        { status: 400 }
      )
    }

    const validatedData = validation.data

    // Check if compilation exists
    const existingCompilation = await (db as any).finalReportCompilation.findUnique({
      where: { id: validatedData.id }
    })

    if (!existingCompilation) {
      return NextResponse.json(
        { error: 'Compilation not found' },
        { status: 404 }
      )
    }

    // Check if compilation can be edited
    if (existingCompilation.status === 'published') {
      return NextResponse.json(
        { error: 'Cannot edit published compilation' },
        { status: 400 }
      )
    }

    // Prepare update data
    const updateData: any = {}
    
    if (validatedData.title) updateData.title = validatedData.title
    if (validatedData.description) updateData.description = validatedData.description
    if (validatedData.executiveSummary) updateData.executiveSummary = validatedData.executiveSummary
    if (validatedData.overallAssessment) updateData.overallAssessment = validatedData.overallAssessment
    if (validatedData.keyFindings) updateData.keyFindings = validatedData.keyFindings
    if (validatedData.recommendations) updateData.recommendations = validatedData.recommendations
    if (validatedData.treatmentOutcomes) updateData.treatmentOutcomes = validatedData.treatmentOutcomes
    if (validatedData.clinicalNotes !== undefined) updateData.clinicalNotes = validatedData.clinicalNotes
    if (validatedData.attachments) updateData.attachments = validatedData.attachments
    if (validatedData.tags) updateData.tags = validatedData.tags
    if (validatedData.status) updateData.status = validatedData.status

    // Handle included reports update if provided
    if (validatedData.includedReports) {
      // Delete existing included reports
      await (db as any).compilationIncludedReport.deleteMany({
        where: { compilationId: validatedData.id }
      })
      
      // Create new included reports
      updateData.includedReports = {
        create: validatedData.includedReports.map(report => ({
          submissionId: report.submissionId,
          reportType: report.reportType,
          includeInCompilation: report.includeInCompilation,
          order: report.order,
          notes: report.notes
        }))
      }
    }

    // Update compilation
    const updatedCompilation = await (db as any).finalReportCompilation.update({
      where: { id: validatedData.id },
      data: updateData,
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
          include: {
            submission: {
              select: {
                id: true,
                title: true,
                reportType: true
              }
            }
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Compilation updated successfully',
      data: updatedCompilation
    })

  } catch (error) {
    console.error('Error updating report compilation:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/final-report-compilation - Delete a report compilation (draft only)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Compilation ID is required' },
        { status: 400 }
      )
    }

    // Check if compilation exists
    const compilation = await (db as any).finalReportCompilation.findUnique({
      where: { id }
    })

    if (!compilation) {
      return NextResponse.json(
        { error: 'Compilation not found' },
        { status: 404 }
      )
    }

    // Only allow deletion of drafts
    if (compilation.status !== 'draft') {
      return NextResponse.json(
        { error: 'Only draft compilations can be deleted' },
        { status: 400 }
      )
    }

    // Delete compilation (included reports will be cascade deleted)
    await (db as any).finalReportCompilation.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Draft compilation deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting report compilation:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
