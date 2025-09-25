import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const specialtyId = searchParams.get('specialtyId')
    const search = searchParams.get('search')

    // Build the query
    let whereClause: any = {}

    if (specialtyId) {
      whereClause.specialtyId = specialtyId
    }

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { specialty: { name: { contains: search, mode: 'insensitive' } } }
      ]
    }

    // Fetch consultation reasons with specialty information
    const consultationReasons = await db.consultationReason.findMany({
      where: whereClause,
      include: {
        specialty: {
          select: {
            id: true,
            name: true,
            description: true
          }
        }
      },
      orderBy: [
        { specialty: { name: 'asc' } },
        { name: 'asc' }
      ]
    })

    return NextResponse.json({
      success: true,
      data: consultationReasons
    })

  } catch (error) {
    console.error('Error fetching consultation reasons:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch consultation reasons' 
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, specialtyId } = body

    // Validate required fields
    if (!name || !specialtyId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Name and specialtyId are required' 
        },
        { status: 400 }
      )
    }

    // Check if specialty exists
    const specialty = await db.specialty.findUnique({
      where: { id: specialtyId }
    })

    if (!specialty) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Specialty not found' 
        },
        { status: 404 }
      )
    }

    // Create consultation reason
    const consultationReason = await db.consultationReason.create({
      data: {
        name,
        description,
        specialtyId
      },
      include: {
        specialty: {
          select: {
            id: true,
            name: true,
            description: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: consultationReason
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating consultation reason:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create consultation reason' 
      },
      { status: 500 }
    )
  }
}
