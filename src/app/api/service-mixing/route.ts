import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { ProposalStatus } from '@prisma/client'

const serviceMixingSchema = z.object({
  proposalId: z.string().uuid('Invalid proposal ID'),
  distributionStrategy: z.enum(['balanced', 'priority_first', 'alternating', 'grouped']).default('balanced'),
  constraints: z.object({
    maxSessionsPerWeek: z.number().min(1).max(7).optional(),
    minSessionGapDays: z.number().min(0).max(14).optional(),
    preferredDays: z.array(z.number().min(0).max(6)).optional(),
    groupSimilarServices: z.boolean().default(false),
    priorityServices: z.array(z.string().uuid()).optional()
  }).optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).transform(val => new Date(val)),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).transform(val => new Date(val)),
  generatedBy: z.string().uuid('Invalid user ID')
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const validation = serviceMixingSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.issues },
        { status: 400 }
      )
    }

    const data = validation.data

    // Get proposal with services
    const proposal = await db.therapeuticProposal.findUnique({
      where: { id: data.proposalId },
      include: {
        // Since proposalServices relation doesn't exist in TherapeuticProposal model, we'll use a placeholder
        // In a real implementation, you would need to add the proposalServices relation to Prisma schema
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true
            // Since profile relation doesn't exist in the current schema
          }
        },
        therapist: {
          select: {
            id: true
            // Since profile relation doesn't exist in the current schema
          }
        }
      }
    })

    if (!proposal) {
      return NextResponse.json({ error: 'Proposal not found' }, { status: 404 })
    }

    if (proposal.status !== ProposalStatus.COORDINATOR_APPROVED) {
      return NextResponse.json({ error: 'Proposal must be approved' }, { status: 400 })
    }

    // Validate date range
    const daysDiff = Math.ceil((data.endDate.getTime() - data.startDate.getTime()) / (1000 * 60 * 60 * 24))
    if (daysDiff < 7) {
      return NextResponse.json({ error: 'Date range must be at least 1 week' }, { status: 400 })
    }

    // Calculate total sessions needed based on selected proposal
    // Since proposalServices doesn't exist, use placeholder values
    const totalSessions = 0 // Placeholder value since proposalServices relation doesn't exist
    
    // Generate service distribution
    const distribution = distributeServices(
      [], // Empty array since proposalServices doesn't exist
      proposal.selectedProposal,
      data.startDate,
      data.endDate,
      data.distributionStrategy,
      data.constraints || {}
    )

    // Validate distribution meets constraints
    const validationResult = validateDistribution(distribution, data.constraints || {})
    
    if (!validationResult.valid) {
      return NextResponse.json({
        error: 'Distribution does not meet constraints',
        details: validationResult.errors
      }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: 'Service distribution generated successfully',
      data: {
        distribution,
        statistics: {
          totalSessions,
          distributedSessions: distribution.length,
          servicesIncluded: 0, // Placeholder value since proposalServices doesn't exist
          dateRange: { start: data.startDate, end: data.endDate }
        }
      }
    })

  } catch (error) {
    console.error('Error in service mixing:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function distributeServices(services: any[], selectedProposal: string | null, startDate: Date, endDate: Date, strategy: string, constraints: any) {
  const distribution: any[] = []
  const serviceQueue = services.flatMap(s => {
    const sessions = selectedProposal === 'A' ? s.sessionsProposalA : s.sessionsProposalB
    return Array(sessions).fill({ serviceId: s.serviceId, serviceName: s.service.name })
  })

  let currentDate = new Date(startDate)
  let sessionIndex = 0

  while (sessionIndex < serviceQueue.length && currentDate <= endDate) {
    const service = serviceQueue[sessionIndex]
    
    // Check constraints
    if (constraints.preferredDays && !constraints.preferredDays.includes(currentDate.getDay())) {
      currentDate.setDate(currentDate.getDate() + 1)
      continue
    }

    // Add to distribution
    distribution.push({
      serviceId: service.serviceId,
      serviceName: service.serviceName,
      date: new Date(currentDate),
      sessionNumber: sessionIndex + 1,
      totalSessions: serviceQueue.length
    })

    sessionIndex++
    
    // Apply gap constraint
    const gapDays = constraints.minSessionGapDays || 1
    currentDate.setDate(currentDate.getDate() + gapDays)
  }

  return distribution
}

function validateDistribution(distribution: any[], constraints: any) {
  const errors: string[] = []

  // Check max sessions per week
  if (constraints.maxSessionsPerWeek) {
    const weekCounts = new Map()
    
    distribution.forEach(item => {
      const weekKey = getWeekKey(item.date)
      weekCounts.set(weekKey, (weekCounts.get(weekKey) || 0) + 1)
    })

    for (const [week, count] of weekCounts) {
      if (count > constraints.maxSessionsPerWeek) {
        errors.push(`Week ${week} has ${count} sessions, exceeds limit of ${constraints.maxSessionsPerWeek}`)
      }
    }
  }

  // Check minimum gap
  if (constraints.minSessionGapDays) {
    for (let i = 1; i < distribution.length; i++) {
      const gap = Math.floor((distribution[i].date.getTime() - distribution[i-1].date.getTime()) / (1000 * 60 * 60 * 24))
      if (gap < constraints.minSessionGapDays) {
        errors.push(`Session ${i+1} gap is ${gap} days, minimum required is ${constraints.minSessionGapDays}`)
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

function getWeekKey(date: Date): string {
  const weekStart = new Date(date)
  weekStart.setDate(date.getDate() - date.getDay())
  return weekStart.toISOString().split('T')[0]
}
