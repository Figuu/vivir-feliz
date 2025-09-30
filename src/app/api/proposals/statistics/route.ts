import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { validateProposalStats } from '@/lib/proposal-validation'
import { ProposalStatus } from '@prisma/client'

// Helper function to get current user from Supabase
async function getCurrentUser(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    return null
  }
  
  const dbUser = await db.user.findUnique({
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
    const validation = validateProposalStats(statsData)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid statistics parameters', details: validation.error.errors },
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
        in: status as ProposalStatus[]
      }
    }
    
    // Fetch proposals from database
    const proposals = await db.therapeuticProposal.findMany({
      where,
      select: {
        id: true,
        status: true,
        therapistId: true,
        proposalACost: true,
        proposalBCost: true,
        selectedProposal: true,
        createdAt: true,
        reviewedAt: true
      }
    })
    
    // Calculate statistics
    const totalProposals = proposals.length
    const totalCost = proposals.reduce((sum, proposal) => {
      const cost = proposal.selectedProposal === 'PROPOSAL_A' 
        ? proposal.proposalACost 
        : proposal.selectedProposal === 'PROPOSAL_B'
        ? proposal.proposalBCost
        : proposal.proposalACost
      return sum + (cost ? Number(cost) : 0)
    }, 0)
    const averageCost = totalProposals > 0 ? totalCost / totalProposals : 0
    
    // Group by status
    const statusGroups = proposals.reduce((groups, proposal) => {
      groups[proposal.status] = (groups[proposal.status] || 0) + 1
      return groups
    }, {} as Record<string, number>)
    
    // Group by therapist
    const therapistGroups = proposals.reduce((groups, proposal) => {
      if (!groups[proposal.therapistId]) {
        groups[proposal.therapistId] = {
          count: 0,
          totalCost: 0,
          averageCost: 0
        }
      }
      const cost = proposal.selectedProposal === 'PROPOSAL_A' 
        ? proposal.proposalACost 
        : proposal.selectedProposal === 'PROPOSAL_B'
        ? proposal.proposalBCost
        : proposal.proposalACost
      const numCost = cost ? Number(cost) : 0
      
      groups[proposal.therapistId].count++
      groups[proposal.therapistId].totalCost += numCost
      groups[proposal.therapistId].averageCost = groups[proposal.therapistId].totalCost / groups[proposal.therapistId].count
      return groups
    }, {} as Record<string, any>)
    
    // Group by time period
    const timeGroups = groupByTimePeriod(proposals, groupBy)
    const timeSeriesData = Object.entries(timeGroups).map(([period, groupProposals]) => ({
      period,
      count: groupProposals.length,
      totalCost: groupProposals.reduce((sum, proposal) => {
        const cost = proposal.selectedProposal === 'PROPOSAL_A' 
          ? proposal.proposalACost 
          : proposal.selectedProposal === 'PROPOSAL_B'
          ? proposal.proposalBCost
          : proposal.proposalACost
        return sum + (cost ? Number(cost) : 0)
      }, 0),
      averageCost: groupProposals.length > 0 
        ? groupProposals.reduce((sum, proposal) => {
            const cost = proposal.selectedProposal === 'PROPOSAL_A' 
              ? proposal.proposalACost 
              : proposal.selectedProposal === 'PROPOSAL_B'
              ? proposal.proposalBCost
              : proposal.proposalACost
            return sum + (cost ? Number(cost) : 0)
          }, 0) / groupProposals.length
        : 0
    })).sort((a, b) => a.period.localeCompare(b.period))
    
    // Calculate approval rate
    const approvedProposals = proposals.filter(p => 
      ['COORDINATOR_APPROVED', 'ADMIN_APPROVED', 'CONFIRMED'].includes(p.status)
    ).length
    const approvalRate = totalProposals > 0 ? (approvedProposals / totalProposals) * 100 : 0
    
    // Calculate rejection rate
    const rejectedProposals = proposals.filter(p => p.status === 'REJECTED').length
    const rejectionRate = totalProposals > 0 ? (rejectedProposals / totalProposals) * 100 : 0
    
    // Calculate confirmation rate (equivalent to completion rate)
    const confirmedProposals = proposals.filter(p => p.status === 'CONFIRMED').length
    const confirmationRate = totalProposals > 0 ? (confirmedProposals / totalProposals) * 100 : 0
    
    // Calculate average processing time
    const processedProposals = proposals.filter(p => p.reviewedAt && p.createdAt)
    const averageProcessingTime = processedProposals.length > 0 
      ? processedProposals.reduce((sum, proposal) => {
          const created = new Date(proposal.createdAt)
          const reviewed = new Date(proposal.reviewedAt!)
          return sum + (reviewed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24) // days
        }, 0) / processedProposals.length
      : 0
    
    return NextResponse.json({
      summary: {
        totalProposals,
        totalCost,
        averageCost,
        confirmationRate,
        approvalRate,
        rejectionRate,
        averageProcessingTime
      },
      statusDistribution: statusGroups,
      therapistPerformance: therapistGroups,
      timeSeriesData,
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
