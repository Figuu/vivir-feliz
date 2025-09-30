import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const specialtyId = searchParams.get('specialtyId')
    const therapistId = searchParams.get('therapistId')
    
    // Validate date range
    if (!startDate || !endDate) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Start date and end date are required' 
        },
        { status: 400 }
      )
    }
    
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid date format. Use YYYY-MM-DD' 
        },
        { status: 400 }
      )
    }
    
    const start = new Date(startDate)
    const end = new Date(endDate)
    
    if (start > end) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Start date must be before end date' 
        },
        { status: 400 }
      )
    }
    
    // Check if date range is not too large (max 1 year)
    const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    if (daysDiff > 365) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Date range cannot exceed 365 days' 
        },
        { status: 400 }
      )
    }
    
    // Build where clause
    const whereClause: any = {
      createdAt: {
        gte: start,
        lte: end
      }
    }
    
    if (specialtyId) {
      whereClause.reason = {
        specialtyId: specialtyId
      }
    }
    
    if (therapistId) {
      whereClause.therapistId = therapistId
    }
    
    // Get basic statistics
    const [
      totalRequests,
      statusCounts,
      consultationTypeCounts,
      urgencyCounts,
      specialtyCounts,
      therapistCounts,
      dailyCounts,
      monthlyCounts,
      averageDuration,
      completionRate,
      cancellationRate,
      noShowRate
    ] = await Promise.all([
      // Total requests
      db.consultationRequest.count({ where: whereClause }),
      
      // Status counts
      db.consultationRequest.groupBy({
        by: ['status'],
        where: whereClause,
        _count: { status: true }
      }),
      
      // Consultation type counts
      db.consultationRequest.groupBy({
        by: ['type'],
        where: whereClause,
        _count: { type: true }
      }),
      
      // Urgency counts (not available in schema)
      Promise.resolve([]),
      
      // Specialty counts (accessed through reason)
      db.consultationRequest.groupBy({
        by: ['reasonId'],
        where: whereClause,
        _count: { reasonId: true },
        _avg: { duration: true }
      }),
      
      // Therapist counts
      db.consultationRequest.groupBy({
        by: ['therapistId'],
        where: {
          ...whereClause,
          therapistId: { not: null }
        },
        _count: { therapistId: true },
        _avg: { duration: true }
      }),
      
      // Daily counts
      Promise.resolve([]),
      
      // Monthly counts
      Promise.resolve([]),
      
      // Average duration
      db.consultationRequest.aggregate({
        where: whereClause,
        _avg: { duration: true }
      }),
      
      // Completion rate
      db.consultationRequest.count({
        where: { ...whereClause, status: 'COMPLETED' }
      }),
      
      // Cancellation rate
      db.consultationRequest.count({
        where: { ...whereClause, status: 'CANCELLED' }
      }),
      
      // No-show rate
      db.consultationRequest.count({
        where: { ...whereClause, status: 'NO_SHOW' }
      })
    ])
    
    // Get reason names for specialty counts
    const reasonIds = specialtyCounts.map((item: any) => item.reasonId).filter(Boolean)
    const reasons = await db.consultationReason.findMany({
      where: { id: { in: reasonIds } },
      include: {
        specialty: {
          select: { id: true, name: true }
        }
      }
    })
    
    const reasonMap = reasons.reduce((acc, reason) => {
      acc[reason.id] = {
        reasonName: reason.name,
        specialtyName: reason.specialty.name,
        specialtyId: reason.specialtyId
      }
      return acc
    }, {} as { [key: string]: { reasonName: string; specialtyName: string; specialtyId: string } })
    
    // Get therapist names for therapist counts
    const therapistIds = therapistCounts.map((item: any) => item.therapistId).filter(Boolean) as string[]
    const therapists = await db.therapist.findMany({
      where: { id: { in: therapistIds } },
      select: { 
        id: true,
        profile: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    })
    
    const therapistMap = therapists.reduce((acc, therapist) => {
      acc[therapist.id] = `${therapist.profile.firstName} ${therapist.profile.lastName}`
      return acc
    }, {} as { [key: string]: string })
    
    // Calculate rates
    const completionRatePercent = totalRequests > 0 ? (completionRate / totalRequests) * 100 : 0
    const cancellationRatePercent = totalRequests > 0 ? (cancellationRate / totalRequests) * 100 : 0
    const noShowRatePercent = totalRequests > 0 ? (noShowRate / totalRequests) * 100 : 0
    
    // Format specialty counts
    const formattedSpecialtyCounts = specialtyCounts.map((item: any) => {
      const reasonInfo = reasonMap[item.reasonId] || { reasonName: 'Unknown', specialtyName: 'Unknown', specialtyId: '' }
      return {
        reasonId: item.reasonId,
        reasonName: reasonInfo.reasonName,
        specialtyId: reasonInfo.specialtyId,
        specialtyName: reasonInfo.specialtyName,
        count: item._count?.reasonId || 0,
        averageDuration: item._avg?.duration || 0
      }
    })
    
    // Format therapist counts
    const formattedTherapistCounts = therapistCounts.map((item: any) => ({
      therapistId: item.therapistId,
      therapistName: therapistMap[item.therapistId || ''] || 'Unknown',
      count: item._count?.therapistId || 0,
      averageDuration: item._avg?.duration || 0
    }))
    
    // Format status counts
    const formattedStatusCounts = statusCounts.map((item: any) => ({
      status: item.status,
      count: item._count?.status || 0
    }))
    
    // Format consultation type counts
    const formattedConsultationTypeCounts = consultationTypeCounts.map((item: any) => ({
      consultationType: item.type,
      count: item._count?.type || 0
    }))
    
    // Format urgency counts (not available in schema)
    const formattedUrgencyCounts: any[] = []
    
    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalRequests,
          dateRange: { startDate, endDate },
          averageDuration: averageDuration._avg.duration || 0,
          completionRate: Math.round(completionRatePercent * 100) / 100,
          cancellationRate: Math.round(cancellationRatePercent * 100) / 100,
          noShowRate: Math.round(noShowRatePercent * 100) / 100
        },
        statusBreakdown: formattedStatusCounts,
        consultationTypeBreakdown: formattedConsultationTypeCounts,
        urgencyBreakdown: formattedUrgencyCounts,
        specialtyBreakdown: formattedSpecialtyCounts,
        therapistBreakdown: formattedTherapistCounts,
        dailyTrends: dailyCounts,
        monthlyTrends: monthlyCounts
      }
    })
    
  } catch (error) {
    console.error('Error fetching consultation request statistics:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch consultation request statistics' 
      },
      { status: 500 }
    )
  }
}
