import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'

// Comprehensive validation schemas
const progressEntryCreateSchema = z.object({
  // Basic Information
  patientId: z.string().uuid('Invalid patient ID'),
  therapistId: z.string().uuid('Invalid therapist ID'),
  
  // Progress Entry Details
  entryDate: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Entry date must be in YYYY-MM-DD format')
    .transform(val => new Date(val)),
  
  entryType: z.enum(['session', 'assessment', 'evaluation', 'milestone', 'observation', 'measurement']),
  
  // Progress Data
  title: z.string()
    .min(3, 'Title must be at least 3 characters')
    .max(200, 'Title cannot exceed 200 characters')
    .transform(val => val.trim()),
  
  description: z.string()
    .min(10, 'Description must be at least 10 characters')
    .max(2000, 'Description cannot exceed 2000 characters')
    .transform(val => val.trim()),
  
  // Progress Metrics
  progressScore: z.number().min(0).max(100).optional(),
  
  overallProgress: z.number().min(0).max(100).default(0),
  
  // Detailed Progress Data
  progressData: z.object({
    // Behavioral Progress
    behavioralChanges: z.object({
      positiveChanges: z.array(z.string().max(500, 'Change description cannot exceed 500 characters')).optional().default([]),
      negativeChanges: z.array(z.string().max(500, 'Change description cannot exceed 500 characters')).optional().default([]),
      observations: z.string().max(1000, 'Observations cannot exceed 1000 characters').optional()
    }).optional(),
    
    // Emotional Progress
    emotionalState: z.object({
      moodRating: z.number().min(1).max(10).optional(),
      emotionalStability: z.number().min(1).max(10).optional(),
      stressLevel: z.number().min(1).max(10).optional(),
      anxietyLevel: z.number().min(1).max(10).optional(),
      depressionLevel: z.number().min(1).max(10).optional(),
      notes: z.string().max(1000, 'Emotional notes cannot exceed 1000 characters').optional()
    }).optional(),
    
    // Cognitive Progress
    cognitiveFunction: z.object({
      attentionSpan: z.number().min(1).max(10).optional(),
      memoryFunction: z.number().min(1).max(10).optional(),
      problemSolving: z.number().min(1).max(10).optional(),
      decisionMaking: z.number().min(1).max(10).optional(),
      cognitiveFlexibility: z.number().min(1).max(10).optional(),
      notes: z.string().max(1000, 'Cognitive notes cannot exceed 1000 characters').optional()
    }).optional(),
    
    // Social Progress
    socialFunction: z.object({
      communicationSkills: z.number().min(1).max(10).optional(),
      socialInteraction: z.number().min(1).max(10).optional(),
      relationshipQuality: z.number().min(1).max(10).optional(),
      socialAnxiety: z.number().min(1).max(10).optional(),
      peerRelationships: z.number().min(1).max(10).optional(),
      notes: z.string().max(1000, 'Social notes cannot exceed 1000 characters').optional()
    }).optional(),
    
    // Physical Progress
    physicalHealth: z.object({
      sleepQuality: z.number().min(1).max(10).optional(),
      appetite: z.number().min(1).max(10).optional(),
      energyLevel: z.number().min(1).max(10).optional(),
      physicalSymptoms: z.array(z.string().max(200, 'Symptom description cannot exceed 200 characters')).optional().default([]),
      medicationCompliance: z.number().min(1).max(10).optional(),
      notes: z.string().max(1000, 'Physical notes cannot exceed 1000 characters').optional()
    }).optional(),
    
    // Treatment Progress
    treatmentResponse: z.object({
      therapyEngagement: z.number().min(1).max(10).optional(),
      homeworkCompletion: z.number().min(1).max(10).optional(),
      skillApplication: z.number().min(1).max(10).optional(),
      motivationLevel: z.number().min(1).max(10).optional(),
      resistanceLevel: z.number().min(1).max(10).optional(),
      notes: z.string().max(1000, 'Treatment notes cannot exceed 1000 characters').optional()
    }).optional()
  }),
  
  // Goals and Objectives
  goalsProgress: z.array(z.object({
    goalId: z.string().uuid('Invalid goal ID').optional(),
    goalTitle: z.string().max(200, 'Goal title cannot exceed 200 characters'),
    progressPercentage: z.number().min(0).max(100),
    status: z.enum(['not_started', 'in_progress', 'completed', 'on_hold', 'cancelled']),
    notes: z.string().max(500, 'Goal notes cannot exceed 500 characters').optional()
  })).optional().default([]),
  
  // Risk Assessment
  riskAssessment: z.object({
    riskLevel: z.enum(['low', 'moderate', 'high', 'critical']).default('low'),
    riskFactors: z.array(z.string().max(200, 'Risk factor cannot exceed 200 characters')).optional().default([]),
    protectiveFactors: z.array(z.string().max(200, 'Protective factor cannot exceed 200 characters')).optional().default([]),
    safetyPlan: z.string().max(1000, 'Safety plan cannot exceed 1000 characters').optional(),
    crisisIntervention: z.boolean().default(false),
    notes: z.string().max(1000, 'Risk assessment notes cannot exceed 1000 characters').optional()
  }).optional(),
  
  // Recommendations
  recommendations: z.array(z.object({
    type: z.enum(['treatment', 'medication', 'lifestyle', 'referral', 'monitoring', 'intervention']),
    priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
    description: z.string().max(500, 'Recommendation description cannot exceed 500 characters'),
    targetDate: z.string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Target date must be in YYYY-MM-DD format')
      .transform(val => new Date(val))
      .optional(),
    isCompleted: z.boolean().default(false)
  })).optional().default([]),
  
  // Session Information
  sessionInfo: z.object({
    sessionId: z.string().uuid('Invalid session ID').optional(),
    sessionType: z.string().max(100, 'Session type cannot exceed 100 characters').optional(),
    sessionDuration: z.number().min(1).max(480).optional(), // minutes
    sessionNotes: z.string().max(2000, 'Session notes cannot exceed 2000 characters').optional()
  }).optional(),
  
  // Validation and Quality
  validationStatus: z.enum(['pending', 'validated', 'flagged', 'requires_review']).default('pending'),
  
  validatedBy: z.string().uuid('Invalid validator ID').optional(),
  
  validationDate: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Validation date must be in YYYY-MM-DD format')
    .transform(val => new Date(val))
    .optional(),
  
  validationNotes: z.string().max(1000, 'Validation notes cannot exceed 1000 characters').optional(),
  
  // Additional Information
  notes: z.string().max(2000, 'Notes cannot exceed 2000 characters').optional().transform(val => val?.trim()),
  
  tags: z.array(z.string().max(50, 'Tag cannot exceed 50 characters')).optional().default([]),
  
  // Created by
  createdBy: z.string().uuid('Invalid creator ID')
})

const progressEntryUpdateSchema = progressEntryCreateSchema.partial()

const progressQuerySchema = z.object({
  page: z.string().transform(val => parseInt(val) || 1).refine(val => val > 0, 'Page must be greater than 0'),
  limit: z.string().transform(val => parseInt(val) || 10).refine(val => val > 0 && val <= 100, 'Limit must be between 1 and 100'),
  patientId: z.string().uuid('Invalid patient ID').optional(),
  therapistId: z.string().uuid('Invalid therapist ID').optional(),
  entryType: z.enum(['session', 'assessment', 'evaluation', 'milestone', 'observation', 'measurement']).optional(),
  validationStatus: z.enum(['pending', 'validated', 'flagged', 'requires_review']).optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format').optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be in YYYY-MM-DD format').optional(),
  minProgress: z.string().transform(val => parseInt(val) || 0).optional(),
  maxProgress: z.string().transform(val => parseInt(val) || 100).optional(),
  search: z.string().max(100, 'Search term cannot exceed 100 characters').optional(),
  tags: z.string().max(100, 'Tags cannot exceed 100 characters').optional(),
  sortBy: z.enum(['entryDate', 'createdAt', 'updatedAt', 'overallProgress', 'validationStatus']).optional().default('entryDate'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc')
})

const progressAnalyticsSchema = z.object({
  patientId: z.string().uuid('Invalid patient ID').optional(),
  therapistId: z.string().uuid('Invalid therapist ID').optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format').optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be in YYYY-MM-DD format').optional(),
  groupBy: z.enum(['day', 'week', 'month', 'quarter']).optional().default('week'),
  includeTrends: z.string().transform(val => val === 'true').optional().default(true),
  includeComparisons: z.string().transform(val => val === 'true').optional().default(true),
  includeRiskAnalysis: z.string().transform(val => val === 'true').optional().default(true)
})

// GET /api/patient-progress - Get patient progress entries with filtering and analytics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    
    if (action === 'analytics') {
      // Handle analytics request
      const validation = progressAnalyticsSchema.safeParse({
        patientId: searchParams.get('patientId'),
        therapistId: searchParams.get('therapistId'),
        startDate: searchParams.get('startDate'),
        endDate: searchParams.get('endDate'),
        groupBy: searchParams.get('groupBy'),
        includeTrends: searchParams.get('includeTrends'),
        includeComparisons: searchParams.get('includeComparisons'),
        includeRiskAnalysis: searchParams.get('includeRiskAnalysis')
      })

      if (!validation.success) {
        return NextResponse.json(
          { error: 'Invalid analytics parameters', details: validation.error.errors },
          { status: 400 }
        )
      }

      const { patientId, therapistId, startDate, endDate, groupBy, includeTrends, includeComparisons, includeRiskAnalysis } = validation.data

      // Build where clause for analytics
      const whereClause: any = {}
      
      if (patientId) {
        whereClause.patientId = patientId
      }
      
      if (therapistId) {
        whereClause.therapistId = therapistId
      }
      
      if (startDate) {
        whereClause.entryDate = { gte: new Date(startDate) }
      }
      
      if (endDate) {
        whereClause.entryDate = { 
          ...whereClause.entryDate,
          lte: new Date(endDate) 
        }
      }

      // Get progress entries for analytics
      const progressEntries = await db.patientProgress.findMany({
        where: whereClause,
        include: {
          patient: {
            select: {
              id: true,
              firstName: true,
              lastName: true
            }
          },
          therapist: {
            select: {
              id: true,
              firstName: true,
              lastName: true
            }
          }
        },
        orderBy: { entryDate: 'asc' }
      })

      // Process analytics data
      const analytics = processProgressAnalytics(progressEntries, groupBy, includeTrends, includeComparisons, includeRiskAnalysis)

      return NextResponse.json({
        success: true,
        data: analytics
      })
    } else {
      // Handle regular progress entries request
      const validation = progressQuerySchema.safeParse({
        page: searchParams.get('page'),
        limit: searchParams.get('limit'),
        patientId: searchParams.get('patientId'),
        therapistId: searchParams.get('therapistId'),
        entryType: searchParams.get('entryType'),
        validationStatus: searchParams.get('validationStatus'),
        startDate: searchParams.get('startDate'),
        endDate: searchParams.get('endDate'),
        minProgress: searchParams.get('minProgress'),
        maxProgress: searchParams.get('maxProgress'),
        search: searchParams.get('search'),
        tags: searchParams.get('tags'),
        sortBy: searchParams.get('sortBy'),
        sortOrder: searchParams.get('sortOrder')
      })

      if (!validation.success) {
        return NextResponse.json(
          { error: 'Invalid query parameters', details: validation.error.errors },
          { status: 400 }
        )
      }

      const { page, limit, patientId, therapistId, entryType, validationStatus, startDate, endDate, minProgress, maxProgress, search, tags, sortBy, sortOrder } = validation.data

      // Build where clause
      const whereClause: any = {}
      
      if (patientId) {
        whereClause.patientId = patientId
      }
      
      if (therapistId) {
        whereClause.therapistId = therapistId
      }
      
      if (entryType) {
        whereClause.entryType = entryType
      }
      
      if (validationStatus) {
        whereClause.validationStatus = validationStatus
      }
      
      if (startDate) {
        whereClause.entryDate = { gte: new Date(startDate) }
      }
      
      if (endDate) {
        whereClause.entryDate = { 
          ...whereClause.entryDate,
          lte: new Date(endDate) 
        }
      }
      
      if (minProgress !== undefined) {
        whereClause.overallProgress = { gte: minProgress }
      }
      
      if (maxProgress !== undefined) {
        whereClause.overallProgress = { 
          ...whereClause.overallProgress,
          lte: maxProgress 
        }
      }
      
      if (search) {
        whereClause.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } }
        ]
      }
      
      if (tags) {
        const tagArray = tags.split(',').map(tag => tag.trim())
        whereClause.tags = { hasSome: tagArray }
      }

      // Calculate pagination
      const skip = (page - 1) * limit

      // Get progress entries with related data
      const [progressEntries, totalCount] = await Promise.all([
        db.patientProgress.findMany({
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
            therapist: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            },
            createdByUser: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            },
            validatedByUser: {
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
        db.patientProgress.count({ where: whereClause })
      ])

      // Calculate pagination metadata
      const totalPages = Math.ceil(totalCount / limit)
      const hasNextPage = page < totalPages
      const hasPrevPage = page > 1

      return NextResponse.json({
        success: true,
        data: {
          progressEntries: progressEntries.map(entry => ({
            id: entry.id,
            entryDate: entry.entryDate,
            entryType: entry.entryType,
            title: entry.title,
            description: entry.description,
            progressScore: entry.progressScore,
            overallProgress: entry.overallProgress,
            progressData: entry.progressData,
            goalsProgress: entry.goalsProgress,
            riskAssessment: entry.riskAssessment,
            recommendations: entry.recommendations,
            sessionInfo: entry.sessionInfo,
            validationStatus: entry.validationStatus,
            validatedBy: entry.validatedBy,
            validationDate: entry.validationDate,
            validationNotes: entry.validationNotes,
            notes: entry.notes,
            tags: entry.tags,
            patient: entry.patient,
            therapist: entry.therapist,
            createdBy: entry.createdBy,
            createdByUser: entry.createdByUser,
            validatedByUser: entry.validatedByUser,
            createdAt: entry.createdAt,
            updatedAt: entry.updatedAt
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
            patientId,
            therapistId,
            entryType,
            validationStatus,
            startDate,
            endDate,
            minProgress,
            maxProgress,
            search,
            tags,
            sortBy,
            sortOrder
          }
        }
      })
    }

  } catch (error) {
    console.error('Error fetching patient progress data:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/patient-progress - Create a new progress entry
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate request body
    const validation = progressEntryCreateSchema.safeParse(body)
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

    // Check if therapist exists
    const therapist = await db.therapist.findUnique({
      where: { id: validatedData.therapistId }
    })

    if (!therapist) {
      return NextResponse.json(
        { error: 'Therapist not found' },
        { status: 404 }
      )
    }

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

    // Validate date constraints
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    if (validatedData.entryDate > today) {
      return NextResponse.json(
        { error: 'Entry date cannot be in the future' },
        { status: 400 }
      )
    }

    // Validate progress data consistency
    if (validatedData.progressData) {
      // Validate emotional state ratings
      if (validatedData.progressData.emotionalState) {
        const emotionalState = validatedData.progressData.emotionalState
        const ratings = [emotionalState.moodRating, emotionalState.emotionalStability, emotionalState.stressLevel, emotionalState.anxietyLevel, emotionalState.depressionLevel]
        const validRatings = ratings.filter(rating => rating !== undefined)
        
        for (const rating of validRatings) {
          if (rating < 1 || rating > 10) {
            return NextResponse.json(
              { error: 'Emotional state ratings must be between 1 and 10' },
              { status: 400 }
            )
          }
        }
      }

      // Validate cognitive function ratings
      if (validatedData.progressData.cognitiveFunction) {
        const cognitiveFunction = validatedData.progressData.cognitiveFunction
        const ratings = [cognitiveFunction.attentionSpan, cognitiveFunction.memoryFunction, cognitiveFunction.problemSolving, cognitiveFunction.decisionMaking, cognitiveFunction.cognitiveFlexibility]
        const validRatings = ratings.filter(rating => rating !== undefined)
        
        for (const rating of validRatings) {
          if (rating < 1 || rating > 10) {
            return NextResponse.json(
              { error: 'Cognitive function ratings must be between 1 and 10' },
              { status: 400 }
            )
          }
        }
      }

      // Validate social function ratings
      if (validatedData.progressData.socialFunction) {
        const socialFunction = validatedData.progressData.socialFunction
        const ratings = [socialFunction.communicationSkills, socialFunction.socialInteraction, socialFunction.relationshipQuality, socialFunction.socialAnxiety, socialFunction.peerRelationships]
        const validRatings = ratings.filter(rating => rating !== undefined)
        
        for (const rating of validRatings) {
          if (rating < 1 || rating > 10) {
            return NextResponse.json(
              { error: 'Social function ratings must be between 1 and 10' },
              { status: 400 }
            )
          }
        }
      }

      // Validate physical health ratings
      if (validatedData.progressData.physicalHealth) {
        const physicalHealth = validatedData.progressData.physicalHealth
        const ratings = [physicalHealth.sleepQuality, physicalHealth.appetite, physicalHealth.energyLevel, physicalHealth.medicationCompliance]
        const validRatings = ratings.filter(rating => rating !== undefined)
        
        for (const rating of validRatings) {
          if (rating < 1 || rating > 10) {
            return NextResponse.json(
              { error: 'Physical health ratings must be between 1 and 10' },
              { status: 400 }
            )
          }
        }
      }

      // Validate treatment response ratings
      if (validatedData.progressData.treatmentResponse) {
        const treatmentResponse = validatedData.progressData.treatmentResponse
        const ratings = [treatmentResponse.therapyEngagement, treatmentResponse.homeworkCompletion, treatmentResponse.skillApplication, treatmentResponse.motivationLevel, treatmentResponse.resistanceLevel]
        const validRatings = ratings.filter(rating => rating !== undefined)
        
        for (const rating of validRatings) {
          if (rating < 1 || rating > 10) {
            return NextResponse.json(
              { error: 'Treatment response ratings must be between 1 and 10' },
              { status: 400 }
            )
          }
        }
      }
    }

    // Validate goals progress
    if (validatedData.goalsProgress) {
      for (const goal of validatedData.goalsProgress) {
        if (goal.progressPercentage < 0 || goal.progressPercentage > 100) {
          return NextResponse.json(
            { error: `Goal "${goal.goalTitle}" progress percentage must be between 0 and 100` },
            { status: 400 }
          )
        }
      }
    }

    // Validate recommendations
    if (validatedData.recommendations) {
      for (const recommendation of validatedData.recommendations) {
        if (recommendation.targetDate && recommendation.targetDate < validatedData.entryDate) {
          return NextResponse.json(
            { error: `Recommendation "${recommendation.description}" target date cannot be before entry date` },
            { status: 400 }
          )
        }
      }
    }

    // Create progress entry
    const result = await db.patientProgress.create({
      data: {
        patientId: validatedData.patientId,
        therapistId: validatedData.therapistId,
        entryDate: validatedData.entryDate,
        entryType: validatedData.entryType,
        title: validatedData.title,
        description: validatedData.description,
        progressScore: validatedData.progressScore,
        overallProgress: validatedData.overallProgress,
        progressData: validatedData.progressData,
        goalsProgress: validatedData.goalsProgress,
        riskAssessment: validatedData.riskAssessment,
        recommendations: validatedData.recommendations,
        sessionInfo: validatedData.sessionInfo,
        validationStatus: validatedData.validationStatus,
        validatedBy: validatedData.validatedBy,
        validationDate: validatedData.validationDate,
        validationNotes: validatedData.validationNotes,
        notes: validatedData.notes,
        tags: validatedData.tags,
        createdBy: validatedData.createdBy
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
        therapist: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
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

    return NextResponse.json({
      success: true,
      message: 'Progress entry created successfully',
      data: result
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating progress entry:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function to process progress analytics
function processProgressAnalytics(progressEntries: any[], groupBy: string, includeTrends: boolean, includeComparisons: boolean, includeRiskAnalysis: boolean) {
  const analytics: any = {
    summary: {
      totalEntries: progressEntries.length,
      averageProgress: progressEntries.length > 0 ? progressEntries.reduce((sum, entry) => sum + entry.overallProgress, 0) / progressEntries.length : 0,
      validatedEntries: progressEntries.filter(entry => entry.validationStatus === 'validated').length,
      flaggedEntries: progressEntries.filter(entry => entry.validationStatus === 'flagged').length,
      pendingValidation: progressEntries.filter(entry => entry.validationStatus === 'pending').length
    }
  }

  if (includeTrends) {
    // Group data by time period
    analytics.trends = groupProgressByTime(progressEntries, groupBy)
  }

  if (includeComparisons) {
    // Compare progress across different dimensions
    analytics.comparisons = {
      byEntryType: groupProgressByEntryType(progressEntries),
      byValidationStatus: groupProgressByValidationStatus(progressEntries),
      progressDistribution: calculateProgressDistribution(progressEntries)
    }
  }

  if (includeRiskAnalysis) {
    // Analyze risk factors and trends
    analytics.riskAnalysis = analyzeRiskFactors(progressEntries)
  }

  // Calculate detailed progress metrics
  analytics.progressMetrics = calculateProgressMetrics(progressEntries)

  return analytics
}

function groupProgressByTime(progressEntries: any[], groupBy: string) {
  const groups: any = {}
  
  progressEntries.forEach(entry => {
    const date = new Date(entry.entryDate)
    let key: string
    
    switch (groupBy) {
      case 'day':
        key = date.toISOString().split('T')[0]
        break
      case 'week':
        const weekStart = new Date(date)
        weekStart.setDate(date.getDate() - date.getDay())
        key = weekStart.toISOString().split('T')[0]
        break
      case 'month':
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        break
      case 'quarter':
        const quarter = Math.floor(date.getMonth() / 3) + 1
        key = `${date.getFullYear()}-Q${quarter}`
        break
      default:
        key = date.toISOString().split('T')[0]
    }
    
    if (!groups[key]) {
      groups[key] = []
    }
    groups[key].push(entry)
  })
  
  return groups
}

function groupProgressByEntryType(progressEntries: any[]) {
  const groups: any = {}
  
  progressEntries.forEach(entry => {
    const type = entry.entryType
    if (!groups[type]) {
      groups[type] = []
    }
    groups[type].push(entry)
  })
  
  return groups
}

function groupProgressByValidationStatus(progressEntries: any[]) {
  const groups: any = {}
  
  progressEntries.forEach(entry => {
    const status = entry.validationStatus
    if (!groups[status]) {
      groups[status] = []
    }
    groups[status].push(entry)
  })
  
  return groups
}

function calculateProgressDistribution(progressEntries: any[]) {
  const distribution = {
    '0-20': 0,
    '21-40': 0,
    '41-60': 0,
    '61-80': 0,
    '81-100': 0
  }
  
  progressEntries.forEach(entry => {
    const progress = entry.overallProgress
    if (progress <= 20) distribution['0-20']++
    else if (progress <= 40) distribution['21-40']++
    else if (progress <= 60) distribution['41-60']++
    else if (progress <= 80) distribution['61-80']++
    else distribution['81-100']++
  })
  
  return distribution
}

function analyzeRiskFactors(progressEntries: any[]) {
  const riskAnalysis = {
    highRiskEntries: 0,
    moderateRiskEntries: 0,
    lowRiskEntries: 0,
    criticalRiskEntries: 0,
    commonRiskFactors: [] as string[],
    riskTrends: [] as any[]
  }
  
  const riskFactorCounts: any = {}
  
  progressEntries.forEach(entry => {
    if (entry.riskAssessment) {
      const riskLevel = entry.riskAssessment.riskLevel
      switch (riskLevel) {
        case 'low':
          riskAnalysis.lowRiskEntries++
          break
        case 'moderate':
          riskAnalysis.moderateRiskEntries++
          break
        case 'high':
          riskAnalysis.highRiskEntries++
          break
        case 'critical':
          riskAnalysis.criticalRiskEntries++
          break
      }
      
      if (entry.riskAssessment.riskFactors) {
        entry.riskAssessment.riskFactors.forEach((factor: string) => {
          riskFactorCounts[factor] = (riskFactorCounts[factor] || 0) + 1
        })
      }
    }
  })
  
  // Get most common risk factors
  riskAnalysis.commonRiskFactors = Object.entries(riskFactorCounts)
    .sort(([,a], [,b]) => (b as number) - (a as number))
    .slice(0, 5)
    .map(([factor]) => factor)
  
  return riskAnalysis
}

function calculateProgressMetrics(progressEntries: any[]) {
  const metrics = {
    emotionalProgress: {
      averageMoodRating: 0,
      averageStressLevel: 0,
      averageAnxietyLevel: 0,
      totalEntries: 0
    },
    cognitiveProgress: {
      averageAttentionSpan: 0,
      averageMemoryFunction: 0,
      averageProblemSolving: 0,
      totalEntries: 0
    },
    socialProgress: {
      averageCommunicationSkills: 0,
      averageSocialInteraction: 0,
      averageRelationshipQuality: 0,
      totalEntries: 0
    },
    physicalProgress: {
      averageSleepQuality: 0,
      averageEnergyLevel: 0,
      averageAppetite: 0,
      totalEntries: 0
    },
    treatmentProgress: {
      averageTherapyEngagement: 0,
      averageHomeworkCompletion: 0,
      averageMotivationLevel: 0,
      totalEntries: 0
    }
  }
  
  progressEntries.forEach(entry => {
    if (entry.progressData) {
      // Emotional progress
      if (entry.progressData.emotionalState) {
        const emotional = entry.progressData.emotionalState
        if (emotional.moodRating) {
          metrics.emotionalProgress.averageMoodRating += emotional.moodRating
          metrics.emotionalProgress.totalEntries++
        }
        if (emotional.stressLevel) {
          metrics.emotionalProgress.averageStressLevel += emotional.stressLevel
        }
        if (emotional.anxietyLevel) {
          metrics.emotionalProgress.averageAnxietyLevel += emotional.anxietyLevel
        }
      }
      
      // Cognitive progress
      if (entry.progressData.cognitiveFunction) {
        const cognitive = entry.progressData.cognitiveFunction
        if (cognitive.attentionSpan) {
          metrics.cognitiveProgress.averageAttentionSpan += cognitive.attentionSpan
          metrics.cognitiveProgress.totalEntries++
        }
        if (cognitive.memoryFunction) {
          metrics.cognitiveProgress.averageMemoryFunction += cognitive.memoryFunction
        }
        if (cognitive.problemSolving) {
          metrics.cognitiveProgress.averageProblemSolving += cognitive.problemSolving
        }
      }
      
      // Social progress
      if (entry.progressData.socialFunction) {
        const social = entry.progressData.socialFunction
        if (social.communicationSkills) {
          metrics.socialProgress.averageCommunicationSkills += social.communicationSkills
          metrics.socialProgress.totalEntries++
        }
        if (social.socialInteraction) {
          metrics.socialProgress.averageSocialInteraction += social.socialInteraction
        }
        if (social.relationshipQuality) {
          metrics.socialProgress.averageRelationshipQuality += social.relationshipQuality
        }
      }
      
      // Physical progress
      if (entry.progressData.physicalHealth) {
        const physical = entry.progressData.physicalHealth
        if (physical.sleepQuality) {
          metrics.physicalProgress.averageSleepQuality += physical.sleepQuality
          metrics.physicalProgress.totalEntries++
        }
        if (physical.energyLevel) {
          metrics.physicalProgress.averageEnergyLevel += physical.energyLevel
        }
        if (physical.appetite) {
          metrics.physicalProgress.averageAppetite += physical.appetite
        }
      }
      
      // Treatment progress
      if (entry.progressData.treatmentResponse) {
        const treatment = entry.progressData.treatmentResponse
        if (treatment.therapyEngagement) {
          metrics.treatmentProgress.averageTherapyEngagement += treatment.therapyEngagement
          metrics.treatmentProgress.totalEntries++
        }
        if (treatment.homeworkCompletion) {
          metrics.treatmentProgress.averageHomeworkCompletion += treatment.homeworkCompletion
        }
        if (treatment.motivationLevel) {
          metrics.treatmentProgress.averageMotivationLevel += treatment.motivationLevel
        }
      }
    }
  })
  
  // Calculate averages
  Object.keys(metrics).forEach(category => {
    const categoryMetrics = metrics[category as keyof typeof metrics]
    if (categoryMetrics.totalEntries > 0) {
      Object.keys(categoryMetrics).forEach(metric => {
        if (metric !== 'totalEntries' && typeof categoryMetrics[metric as keyof typeof categoryMetrics] === 'number') {
          (categoryMetrics as any)[metric] = (categoryMetrics as any)[metric] / categoryMetrics.totalEntries
        }
      })
    }
  })
  
  return metrics
}
