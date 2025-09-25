import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')

    // Build the query
    let whereClause: any = {}

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Fetch specialties
    const specialties = await db.specialty.findMany({
      where: whereClause,
      include: {
        _count: {
          select: {
            consultationReasons: true,
            therapists: true
          }
        }
      },
      orderBy: { name: 'asc' }
    })

    return NextResponse.json({
      success: true,
      data: specialties
    })

  } catch (error) {
    console.error('Error fetching specialties:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch specialties' 
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description } = body

    // Validate required fields
    if (!name) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Name is required' 
        },
        { status: 400 }
      )
    }

    // Create specialty
    const specialty = await db.specialty.create({
      data: {
        name,
        description
      }
    })

    return NextResponse.json({
      success: true,
      data: specialty
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating specialty:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create specialty' 
      },
      { status: 500 }
    )
  }
}
