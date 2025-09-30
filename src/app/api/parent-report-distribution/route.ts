import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'

// Comprehensive validation schemas
const parentDistributionSchema = z.object({
  reportId: z.string().uuid('Invalid report ID'),
  reportType: z.enum(['therapeutic_plan', 'progress_report', 'final_report', 'compilation']),
  patientId: z.string().uuid('Invalid patient ID'),
  parentEmail: z.string().email('Invalid parent email address'),
  
  // Distribution options
  accessLevel: z.enum(['view_only', 'download', 'full_access']).default('download'),
  
  expiresAt: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Expiry date must be in YYYY-MM-DD format')
    .transform(val => new Date(val))
    .optional(),
  
  // Notification options
  sendEmail: z.boolean().default(true),
  sendSMS: z.boolean().default(false),
  
  customMessage: z.string()
    .max(1000, 'Custom message cannot exceed 1000 characters')
    .transform(val => val?.trim())
    .optional(),
  
  // Parent information
  parentInfo: z.object({
    firstName: z.string().max(100, 'First name cannot exceed 100 characters'),
    lastName: z.string().max(100, 'Last name cannot exceed 100 characters'),
    phone: z.string().max(20, 'Phone number cannot exceed 20 characters').optional(),
    relationshipToPatient: z.enum(['parent', 'guardian', 'caregiver', 'other']).default('parent'),
    preferredLanguage: z.enum(['en', 'es', 'fr', 'other']).default('en')
  }),
  
  // Security options
  requiresPassword: z.boolean().default(false),
  password: z.string().min(8, 'Password must be at least 8 characters').optional(),
  
  allowPrinting: z.boolean().default(true),
  allowSharing: z.boolean().default(false),
  
  // Distribution metadata
  distributedBy: z.string().uuid('Invalid distributor ID'),
  
  notes: z.string().max(500, 'Notes cannot exceed 500 characters').optional()
})

const parentAccessQuerySchema = z.object({
  patientId: z.string().uuid('Invalid patient ID').optional(),
  parentEmail: z.string().email('Invalid parent email').optional(),
  accessToken: z.string().optional(),
  includeExpired: z.string().transform(val => val === 'true').optional().default(false)
})

// GET /api/parent-report-distribution - Get parent distributions or access reports
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    
    if (action === 'access') {
      // Parent accessing their reports
      const accessToken = searchParams.get('accessToken')
      
      if (!accessToken) {
        return NextResponse.json(
          { error: 'Access token is required' },
          { status: 400 }
        )
      }

      // Find distribution by access token
      const distribution = await db.parentReportDistribution.findFirst({
        where: {
          accessToken,
          OR: [
            { expiresAt: null },
            { expiresAt: { gte: new Date() } }
          ]
        },
        include: {
          patient: {
            select: {
              id: true,
              firstName: true,
              lastName: true
            }
          }
        }
      })

      if (!distribution) {
        return NextResponse.json(
          { error: 'Access denied or link expired' },
          { status: 403 }
        )
      }

      // Get the report based on type
      let report = null
      switch (distribution.reportType) {
        case 'therapeutic_plan':
          report = await db.therapeuticPlan.findUnique({
            where: { id: distribution.reportId }
          })
          break
        case 'progress_report':
          report = await db.progressReport.findUnique({
            where: { id: distribution.reportId }
          })
          break
        case 'final_report':
          report = await db.finalReport.findUnique({
            where: { id: distribution.reportId }
          })
          break
        case 'compilation':
          report = await db.finalReportCompilation.findUnique({
            where: { id: distribution.reportId },
            include: {
              includedReports: {
                include: {
                  submission: {
                    select: {
                      title: true,
                      reportType: true
                    }
                  }
                }
              }
            }
          })
          break
      }

      if (!report) {
        return NextResponse.json(
          { error: 'Report not found' },
          { status: 404 }
        )
      }

      // Track access
      await db.parentReportDistribution.update({
        where: { id: distribution.id },
        data: {
          lastAccessedAt: new Date(),
          accessCount: { increment: 1 }
        }
      })

      return NextResponse.json({
        success: true,
        data: {
          distribution: {
            id: distribution.id,
            reportType: distribution.reportType,
            parentInfo: distribution.parentInfo,
            accessLevel: distribution.accessLevel,
            allowPrinting: distribution.allowPrinting,
            allowSharing: distribution.allowSharing,
            customMessage: distribution.customMessage,
            distributedAt: distribution.distributedAt,
            expiresAt: distribution.expiresAt
          },
          report,
          patient: distribution.patient
        }
      })
    }
    
    // Regular query for distributions
    const validation = parentAccessQuerySchema.safeParse({
      patientId: searchParams.get('patientId'),
      parentEmail: searchParams.get('parentEmail'),
      accessToken: searchParams.get('accessToken'),
      includeExpired: searchParams.get('includeExpired')
    })

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: validation.error.errors },
        { status: 400 }
      )
    }

    const { patientId, parentEmail, includeExpired } = validation.data

    // Build where clause
    const whereClause: any = {}
    
    if (patientId) {
      whereClause.patientId = patientId
    }
    
    if (parentEmail) {
      whereClause.parentEmail = parentEmail
    }
    
    if (!includeExpired) {
      whereClause.OR = [
        { expiresAt: null },
        { expiresAt: { gte: new Date() } }
      ]
    }

    // Get distributions
    const distributions = await db.parentReportDistribution.findMany({
      where: whereClause,
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        distributedByUser: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: { distributedAt: 'desc' }
    })

    return NextResponse.json({
      success: true,
      data: {
        distributions,
        totalCount: distributions.length
      }
    })

  } catch (error) {
    console.error('Error fetching parent distributions:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/parent-report-distribution - Create parent distribution
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate request body
    const validation = parentDistributionSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.errors },
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

    // Check if distributor exists
    const distributor = await db.user.findUnique({
      where: { id: validatedData.distributedBy }
    })

    if (!distributor) {
      return NextResponse.json(
        { error: 'Distributor not found' },
        { status: 404 }
      )
    }

    // Verify report exists
    let reportExists = false
    switch (validatedData.reportType) {
      case 'therapeutic_plan':
        reportExists = !!(await db.therapeuticPlan.findUnique({
          where: { id: validatedData.reportId }
        }))
        break
      case 'progress_report':
        reportExists = !!(await db.progressReport.findUnique({
          where: { id: validatedData.reportId }
        }))
        break
      case 'final_report':
        reportExists = !!(await db.finalReport.findUnique({
          where: { id: validatedData.reportId }
        }))
        break
      case 'compilation':
        reportExists = !!(await db.finalReportCompilation.findUnique({
          where: { id: validatedData.reportId }
        }))
        break
    }

    if (!reportExists) {
      return NextResponse.json(
        { error: `${validatedData.reportType} not found` },
        { status: 404 }
      )
    }

    // Generate unique access token
    const accessToken = generateAccessToken()

    // Create distribution
    const distribution = await db.parentReportDistribution.create({
      data: {
        reportId: validatedData.reportId,
        reportType: validatedData.reportType,
        patientId: validatedData.patientId,
        parentEmail: validatedData.parentEmail,
        accessLevel: validatedData.accessLevel,
        expiresAt: validatedData.expiresAt,
        sendEmail: validatedData.sendEmail,
        sendSMS: validatedData.sendSMS,
        customMessage: validatedData.customMessage,
        parentInfo: validatedData.parentInfo,
        requiresPassword: validatedData.requiresPassword,
        password: validatedData.requiresPassword && validatedData.password ? 
          hashPassword(validatedData.password) : null,
        allowPrinting: validatedData.allowPrinting,
        allowSharing: validatedData.allowSharing,
        distributedBy: validatedData.distributedBy,
        distributedAt: new Date(),
        accessToken,
        notes: validatedData.notes
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        distributedByUser: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    })

    // Send notifications
    if (validatedData.sendEmail) {
      // TODO: Send email notification with access link
      console.log(`Sending email to ${validatedData.parentEmail} with access token: ${accessToken}`)
    }

    if (validatedData.sendSMS && validatedData.parentInfo.phone) {
      // TODO: Send SMS notification
      console.log(`Sending SMS to ${validatedData.parentInfo.phone}`)
    }

    return NextResponse.json({
      success: true,
      message: 'Report distributed to parent successfully',
      data: {
        distribution,
        accessLink: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/parent-reports?token=${accessToken}`
      }
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating parent distribution:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function to generate access token
function generateAccessToken(): string {
  return Array.from({ length: 32 }, () => 
    Math.random().toString(36).charAt(2)
  ).join('')
}

// Helper function to hash password (simple example - use proper hashing in production)
function hashPassword(password: string): string {
  // In production, use bcrypt or similar
  return Buffer.from(password).toString('base64')
}
