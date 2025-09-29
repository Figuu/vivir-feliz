import { NextRequest, NextResponse } from 'next/server'
import { validateProposalStats } from '@/lib/proposal-validation'

// Mock data for demonstration
const mockProposals = [
  {
    id: 'PROP-2024-001',
    patientId: 'PAT-2024-001',
    therapistId: 'THER-2024-001',
    status: 'UNDER_REVIEW',
    priority: 'HIGH',
    estimatedCost: 150.00,
    currency: 'USD',
    createdAt: '2024-01-20T10:00:00Z',
    updatedAt: '2024-01-20T14:30:00Z',
    submittedAt: '2024-01-20T11:00:00Z',
    reviewedAt: '2024-01-20T13:00:00Z'
  },
  {
    id: 'PROP-2024-002',
    patientId: 'PAT-2024-002',
    therapistId: 'THER-2024-001',
    status: 'APPROVED',
    priority: 'MEDIUM',
    estimatedCost: 800.00,
    currency: 'USD',
    createdAt: '2024-01-19T09:00:00Z',
    updatedAt: '2024-01-19T16:00:00Z',
    submittedAt: '2024-01-19T10:00:00Z',
    reviewedAt: '2024-01-19T14:00:00Z'
  },
  {
    id: 'PROP-2024-003',
    patientId: 'PAT-2024-003',
    therapistId: 'THER-2024-002',
    status: 'COMPLETED',
    priority: 'LOW',
    estimatedCost: 1200.00,
    currency: 'USD',
    createdAt: '2024-01-18T08:00:00Z',
    updatedAt: '2024-01-18T17:00:00Z',
    submittedAt: '2024-01-18T09:00:00Z',
    reviewedAt: '2024-01-18T15:00:00Z'
  }
]

// Helper function to get user role from request headers
function getUserRole(request: NextRequest): string {
  return request.headers.get('x-user-role') || 'THERAPIST'
}

// Helper function to get user ID from request headers
function getUserId(request: NextRequest): string {
  return request.headers.get('x-user-id') || 'user-1'
}

// Helper function to filter proposals based on user access
function filterProposalsByAccess(proposals: any[], userRole: string, userId: string): any[] {
  if (userRole === 'THERAPIST') {
    return proposals.filter(proposal => proposal.therapistId === userId)
  }
  return proposals
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
    const userRole = getUserRole(request)
    const userId = getUserId(request)
    
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
    
    const { dateFrom, dateTo, groupBy, therapistId, status } = validation.data
    
    // Filter proposals based on user access
    let filteredProposals = filterProposalsByAccess(mockProposals, userRole, userId)
    
    // Apply date filters
    if (dateFrom) {
      const fromDate = new Date(dateFrom)
      filteredProposals = filteredProposals.filter(proposal =>
        new Date(proposal.createdAt) >= fromDate
      )
    }
    
    if (dateTo) {
      const toDate = new Date(dateTo)
      filteredProposals = filteredProposals.filter(proposal =>
        new Date(proposal.createdAt) <= toDate
      )
    }
    
    // Apply therapist filter
    if (therapistId) {
      filteredProposals = filteredProposals.filter(proposal =>
        proposal.therapistId === therapistId
      )
    }
    
    // Apply status filter
    if (status && status.length > 0) {
      filteredProposals = filteredProposals.filter(proposal =>
        status.includes(proposal.status)
      )
    }
    
    // Calculate basic statistics
    const totalProposals = filteredProposals.length
    const totalCost = filteredProposals.reduce((sum, proposal) => sum + proposal.estimatedCost, 0)
    const averageCost = totalProposals > 0 ? totalCost / totalProposals : 0
    
    // Group by status
    const statusGroups = filteredProposals.reduce((groups, proposal) => {
      groups[proposal.status] = (groups[proposal.status] || 0) + 1
      return groups
    }, {} as Record<string, number>)
    
    // Group by priority
    const priorityGroups = filteredProposals.reduce((groups, proposal) => {
      groups[proposal.priority] = (groups[proposal.priority] || 0) + 1
      return groups
    }, {} as Record<string, number>)
    
    // Group by therapist
    const therapistGroups = filteredProposals.reduce((groups, proposal) => {
      if (!groups[proposal.therapistId]) {
        groups[proposal.therapistId] = {
          count: 0,
          totalCost: 0,
          averageCost: 0
        }
      }
      groups[proposal.therapistId].count++
      groups[proposal.therapistId].totalCost += proposal.estimatedCost
      groups[proposal.therapistId].averageCost = groups[proposal.therapistId].totalCost / groups[proposal.therapistId].count
      return groups
    }, {} as Record<string, any>)
    
    // Group by time period
    const timeGroups = groupByTimePeriod(filteredProposals, groupBy)
    const timeSeriesData = Object.entries(timeGroups).map(([period, proposals]) => ({
      period,
      count: proposals.length,
      totalCost: proposals.reduce((sum, proposal) => sum + proposal.estimatedCost, 0),
      averageCost: proposals.length > 0 ? proposals.reduce((sum, proposal) => sum + proposal.estimatedCost, 0) / proposals.length : 0
    })).sort((a, b) => a.period.localeCompare(b.period))
    
    // Calculate completion rate
    const completedProposals = filteredProposals.filter(p => p.status === 'COMPLETED').length
    const completionRate = totalProposals > 0 ? (completedProposals / totalProposals) * 100 : 0
    
    // Calculate approval rate
    const approvedProposals = filteredProposals.filter(p => p.status === 'APPROVED').length
    const approvalRate = totalProposals > 0 ? (approvedProposals / totalProposals) * 100 : 0
    
    // Calculate rejection rate
    const rejectedProposals = filteredProposals.filter(p => p.status === 'REJECTED').length
    const rejectionRate = totalProposals > 0 ? (rejectedProposals / totalProposals) * 100 : 0
    
    // Calculate average processing time
    const processedProposals = filteredProposals.filter(p => p.reviewedAt)
    const averageProcessingTime = processedProposals.length > 0 
      ? processedProposals.reduce((sum, proposal) => {
          const submitted = new Date(proposal.submittedAt)
          const reviewed = new Date(proposal.reviewedAt)
          return sum + (reviewed.getTime() - submitted.getTime()) / (1000 * 60 * 60 * 24) // days
        }, 0) / processedProposals.length
      : 0
    
    return NextResponse.json({
      summary: {
        totalProposals,
        totalCost,
        averageCost,
        completionRate,
        approvalRate,
        rejectionRate,
        averageProcessingTime
      },
      statusDistribution: statusGroups,
      priorityDistribution: priorityGroups,
      therapistPerformance: therapistGroups,
      timeSeriesData,
      filters: {
        dateFrom,
        dateTo,
        groupBy,
        therapistId,
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
