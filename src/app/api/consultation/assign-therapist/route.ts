import { NextRequest, NextResponse } from 'next/server'
import { TherapistAssignment, AssignmentCriteria } from '@/lib/therapist-assignment'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      specialtyId, 
      date, 
      time, 
      duration, 
      patientAge, 
      patientGender, 
      urgency, 
      preferredTherapistId, 
      excludeTherapistIds, 
      maxWorkload 
    } = body

    // Validate required fields
    if (!specialtyId || !date || !time || !duration) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'SpecialtyId, date, time, and duration are required' 
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

    // Validate urgency
    if (urgency && !['LOW', 'MEDIUM', 'HIGH', 'URGENT'].includes(urgency)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid urgency level. Must be LOW, MEDIUM, HIGH, or URGENT' 
        },
        { status: 400 }
      )
    }

    // Validate patient age
    if (patientAge && (patientAge < 0 || patientAge > 120)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid patient age. Must be between 0 and 120' 
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
          error: 'Cannot assign therapists for past dates' 
        },
        { status: 400 }
      )
    }

    // Create assignment criteria
    const criteria: AssignmentCriteria = {
      specialtyId,
      date,
      time,
      duration,
      patientAge,
      patientGender,
      urgency,
      preferredTherapistId,
      excludeTherapistIds,
      maxWorkload
    }

    // Perform therapist assignment
    const assignmentResult = await TherapistAssignment.assignTherapist(criteria)

    return NextResponse.json({
      success: true,
      data: assignmentResult
    })

  } catch (error) {
    console.error('Error in therapist assignment:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to assign therapist' 
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    if (!startDate || !endDate) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Start date and end date are required' 
        },
        { status: 400 }
      )
    }

    // Validate date formats
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

    // Validate date range
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

    // Get assignment statistics
    const statistics = await TherapistAssignment.getAssignmentStatistics({
      start: startDate,
      end: endDate
    })

    return NextResponse.json({
      success: true,
      data: statistics
    })

  } catch (error) {
    console.error('Error getting assignment statistics:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to get assignment statistics' 
      },
      { status: 500 }
    )
  }
}
