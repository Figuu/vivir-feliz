import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const whereClause: any = {}
    
    if (startDate) {
      whereClause.createdAt = { gte: new Date(startDate) }
    }
    
    if (endDate) {
      whereClause.createdAt = { ...whereClause.createdAt, lte: new Date(endDate) }
    }

    const [totalRequests, approved, rejected, pending, byReason] = await Promise.all([
      db.reschedulingRequest.count({ where: whereClause }),
      db.reschedulingRequest.count({ where: { ...whereClause, status: 'approved' } }),
      db.reschedulingRequest.count({ where: { ...whereClause, status: 'rejected' } }),
      db.reschedulingRequest.count({ where: { ...whereClause, status: 'pending' } }),
      db.reschedulingRequest.groupBy({
        by: ['reason'],
        where: whereClause,
        _count: true
      })
    ])

    return NextResponse.json({
      success: true,
      data: {
        totalRequests,
        approved,
        rejected,
        pending,
        approvalRate: totalRequests > 0 ? (approved / totalRequests) * 100 : 0,
        topReasons: byReason.slice(0, 5).map(r => ({ reason: r.reason, count: r._count }))
      }
    })

  } catch (error) {
    console.error('Error fetching rescheduling analytics:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
