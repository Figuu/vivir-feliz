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
      whereClause.specialtyId = specialtyId
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
        by: ['consultationType'],
        where: whereClause,
        _count: { consultationType: true }
      }),
      
      // Urgency counts
      db.consultationRequest.groupBy({
        by: ['urgency'],
        where: whereClause,
        _count: { urgency: true }
      }),
      
      // Specialty counts
      db.consultationRequest.groupBy({
        by: ['specialtyId'],
        where: whereClause,
        _count: { specialtyId: true },
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
      db.$queryRaw`
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as count
        FROM consultation_requests 
        WHERE created_at >= ${start} AND created_at <= ${end}
        ${specialtyId ? db.$queryRaw`AND specialty_id = ${specialtyId}` : db.$queryRaw``}
        ${therapistId ? db.$queryRaw`AND therapist_id = ${therapistId}` : db.$queryRaw``}
        GROUP BY DATE(created_at)
        ORDER BY date ASC
      `,
      
      // Monthly counts
      db.$queryRaw`
        SELECT 
          DATE_TRUNC('month', created_at) as month,
          COUNT(*) as count
        FROM consultation_requests 
        WHERE created_at >= ${start} AND created_at <= ${end}
        ${specialtyId ? db.$queryRaw`AND specialty_id = ${specialtyId}` : db.$queryRaw``}
        ${therapistId ? db.$queryRaw`AND therapist_id = ${therapistId}` : db.$queryRaw``}
        GROUP BY DATE_TRUNC('month', created_at)
        ORDER BY month ASC
      `,
      
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
    
    // Get specialty names for specialty counts
    const specialtyIds = specialtyCounts.map(item => item.specialtyId)
    const specialties = await db.specialty.findMany({
      where: { id: { in: specialtyIds } },
      select: { id: true, name: true }
    })
    
    const specialtyMap = specialties.reduce((acc, specialty) => {
      acc[specialty.id] = specialty.name
      return acc
    }, {} as { [key: string]: string })
    
    // Get therapist names for therapist counts
    const therapistIds = therapistCounts.map(item => item.therapistId).filter(Boolean)
    const therapists = await db.therapist.findMany({
      where: { id: { in: therapistIds } },
      select: { 
        id: true, 
        firstName: true, 
        lastName: true,
        user: {
          select: {
            name: true
          }
        }
      }
    })
    
    const therapistMap = therapists.reduce((acc, therapist) => {
      acc[therapist.id] = therapist.user.name || `${therapist.firstName} ${therapist.lastName}`
      return acc
    }, {} as { [key: string]: string })
    
    // Calculate rates
    const completionRatePercent = totalRequests > 0 ? (completionRate / totalRequests) * 100 : 0
    const cancellationRatePercent = totalRequests > 0 ? (cancellationRate / totalRequests) * 100 : 0
    const noShowRatePercent = totalRequests > 0 ? (noShowRate / totalRequests) * 100 : 0
    
    // Format specialty counts
    const formattedSpecialtyCounts = specialtyCounts.map(item => ({
      specialtyId: item.specialtyId,
      specialtyName: specialtyMap[item.specialtyId] || 'Unknown',
      count: item._count.specialtyId,
      averageDuration: item._avg.duration || 0
    }))
    
    // Format therapist counts
    const formattedTherapistCounts = therapistCounts.map(item => ({
      therapistId: item.therapistId,
      therapistName: therapistMap[item.therapistId || ''] || 'Unknown',
      count: item._count.therapistId,
      averageDuration: item._avg.duration || 0
    }))
    
    // Format status counts
    const formattedStatusCounts = statusCounts.map(item => ({
      status: item.status,
      count: item._count.status
    }))
    
    // Format consultation type counts
    const formattedConsultationTypeCounts = consultationTypeCounts.map(item => ({
      consultationType: item.consultationType,
      count: item._count.consultationType
    }))
    
    // Format urgency counts
    const formattedUrgencyCounts = urgencyCounts.map(item => ({
      urgency: item.urgency,
      count: item._count.urgency
    }))
    
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
