import { NextRequest, NextResponse } from 'next/server'
import { AvailabilityChecker } from '@/lib/availability-checker'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { therapistId, specialtyId, date, time, duration, excludeAppointmentId } = body

    // Validate required fields
    if (!date || !time || !duration) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Date, time, and duration are required' 
        },
        { status: 400 }
      )
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!dateRegex.test(date)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid date format. Use YYYY-MM-DD' 
        },
        { status: 400 }
      )
    }

    // Validate time format
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/
    if (!timeRegex.test(time)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid time format. Use HH:MM' 
        },
        { status: 400 }
      )
    }

    // Validate duration
    if (duration < 15 || duration > 480) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Duration must be between 15 and 480 minutes' 
        },
        { status: 400 }
      )
    }

    // Check if date is in the past
    const appointmentDate = new Date(date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    if (appointmentDate < today) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Cannot book appointments in the past' 
        },
        { status: 400 }
      )
    }

    // Check availability
    const availabilityResult = await AvailabilityChecker.checkSlotAvailability({
      therapistId,
      specialtyId,
      date,
      time,
      duration,
      excludeAppointmentId
    })

    return NextResponse.json({
      success: true,
      data: availabilityResult
    })

  } catch (error) {
    console.error('Error checking availability:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to check availability' 
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')
    const specialtyId = searchParams.get('specialtyId')

    if (!date) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Date parameter is required' 
        },
        { status: 400 }
      )
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!dateRegex.test(date)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid date format. Use YYYY-MM-DD' 
        },
        { status: 400 }
      )
    }

    // Get therapist availability for the date
    const availability = await AvailabilityChecker.getTherapistAvailability({
      date,
      specialtyId: specialtyId || undefined
    })

    return NextResponse.json({
      success: true,
      data: {
        date,
        specialtyId,
        therapists: availability
      }
    })

  } catch (error) {
    console.error('Error getting therapist availability:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to get therapist availability' 
      },
      { status: 500 }
    )
  }
}
