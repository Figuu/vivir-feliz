import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { z } from 'zod'

// Helper function to get current user from Supabase
async function getCurrentUser(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    return null
  }
  
  const dbUser = await db.profile.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      role: true,
      therapist: {
        select: { id: true }
      }
    }
  })
  
  return dbUser
}

// Validation schema for statistics parameters
const statsSchema = z.object({
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  groupBy: z.enum(['day', 'week', 'month', 'year']).optional().default('month'),
  therapistId: z.string().uuid().optional(),
  status: z.array(z.string()).optional()
})

// Helper function to group data by time period
function groupByTimePeriod(data: any[], groupBy: string, dateField: string = 'createdAt') {
  const groups: Record<string, any[]> = {}
  
  data.forEach(item => {
    const date = new Date(item[dateField])
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
      case 'year':
        key = String(date.getFullYear())
        break
      default:
        key = date.toISOString().split('T')[0]
    }
    
    if (!groups[key]) {
      groups[key] = []
    }
    groups[key].push(item)
  })
  
  return groups
}

// GET /api/proposals/statistics - Get proposal statistics
export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser(request)
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    const userRole = currentUser.role
    const userId = currentUser.id
    const therapistId = currentUser.therapist?.id
    
    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const statsData = {
      dateFrom: searchParams.get('dateFrom') || undefined,
      dateTo: searchParams.get('dateTo') || undefined,
      groupBy: searchParams.get('groupBy') || 'month',
      therapistId: searchParams.get('therapistId') || undefined,
      status: searchParams.get('status')?.split(',') || undefined
    }
    
    // Validate statistics parameters
    const validation = statsSchema.safeParse(statsData)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid statistics parameters', details: validation.error.issues },
        { status: 400 }
      )
    }
    
    const { dateFrom, dateTo, groupBy, status } = validation.data
    const filterTherapistId = statsData.therapistId
    
    // Build where clause
    const where: any = {}
    
    // Filter by therapist access
    if (userRole === 'THERAPIST') {
      where.therapistId = therapistId
    } else if (filterTherapistId) {
      where.therapistId = filterTherapistId
    }
    
    // Apply date filters
    if (dateFrom || dateTo) {
      where.createdAt = {}
      if (dateFrom) where.createdAt.gte = new Date(dateFrom)
      if (dateTo) where.createdAt.lte = new Date(dateTo)
    }
    
    // Apply status filter
    if (status && status.length > 0) {
      where.status = {
        in: status
      }
    }
    
    // Fetch proposals from database
    const proposals = await db.therapeuticProposal.findMany({
      where,
      select: {
        id: true,
        status: true,
        therapistId: true,
        selectedProposal: true,
        treatmentPeriod: true,
        createdAt: true,
        updatedAt: true
      }
    })
    
    // Calculate statistics
    const totalProposals = proposals.length
    
    // Group by status
    const statusGroups = proposals.reduce((groups, proposal) => {
      groups[proposal.status] = (groups[proposal.status] || 0) + 1
      return groups
    }, {} as Record<string, number>)
    
    // Group by therapist
    const therapistGroups = proposals.reduce((groups, proposal) => {
      if (!groups[proposal.therapistId]) {
        groups[proposal.therapistId] = {
          count: 0
        }
      }
      groups[proposal.therapistId].count++
      return groups
    }, {} as Record<string, { count: number }>)
    
    // Group by time period
    const timeGroups = groupByTimePeriod(proposals, groupBy)
    const timeSeriesData = Object.entries(timeGroups).map(([period, groupProposals]) => ({
      period,
      count: groupProposals.length
    })).sort((a, b) => a.period.localeCompare(b.period))
    
    // Calculate approval rate
    const approvedProposals = proposals.filter(p => p.status === 'APPROVED').length
    const approvalRate = totalProposals > 0 ? (approvedProposals / totalProposals) * 100 : 0
    
    // Calculate rejection rate
    const rejectedProposals = proposals.filter(p => p.status === 'REJECTED').length
    const rejectionRate = totalProposals > 0 ? (rejectedProposals / totalProposals) * 100 : 0
    
    // Calculate draft rate
    const draftProposals = proposals.filter(p => p.status === 'DRAFT').length
    const draftRate = totalProposals > 0 ? (draftProposals / totalProposals) * 100 : 0
    
    // Group by treatment period
    const periodGroups = proposals.reduce((groups, proposal) => {
      groups[proposal.treatmentPeriod] = (groups[proposal.treatmentPeriod] || 0) + 1
      return groups
    }, {} as Record<string, number>)
    
    // Group by selected proposal
    const selectedProposalGroups = proposals.reduce((groups, proposal) => {
      const key = proposal.selectedProposal || 'NONE'
      groups[key] = (groups[key] || 0) + 1
      return groups
    }, {} as Record<string, number>)
    
    return NextResponse.json({
      summary: {
        totalProposals,
        approvalRate,
        rejectionRate,
        draftRate
      },
      statusDistribution: statusGroups,
      therapistPerformance: therapistGroups,
      timeSeriesData,
      periodDistribution: periodGroups,
      selectedProposalDistribution: selectedProposalGroups,
      filters: {
        dateFrom,
        dateTo,
        groupBy,
        therapistId: filterTherapistId,
        status
      },
      generatedAt: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('Error fetching proposal statistics:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}