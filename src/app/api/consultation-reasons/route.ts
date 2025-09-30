import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Fetch consultation reasons
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const specialtyId = searchParams.get('specialtyId')

    const where: any = {
      isActive: true
    }

    if (specialtyId) {
      where.specialtyId = specialtyId
    }

    const consultationReasons = await db.consultationReason.findMany({
      where,
      include: {
        specialty: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })

    return NextResponse.json({
      consultationReasons
    })
  } catch (error) {
    console.error('Error fetching consultation reasons:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
