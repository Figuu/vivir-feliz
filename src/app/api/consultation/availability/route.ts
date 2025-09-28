import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const month = searchParams.get('month') // Format: YYYY-MM
    const specialtyId = searchParams.get('specialtyId')
    const therapistId = searchParams.get('therapistId')

    if (!month) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Month parameter is required (format: YYYY-MM)' 
        },
        { status: 400 }
      )
    }

    // Parse month parameter
    const [year, monthNum] = month.split('-').map(Number)
    const startDate = new Date(year, monthNum - 1, 1)
    const endDate = new Date(year, monthNum, 0) // Last day of the month

    // Build query for therapist schedules
    let whereClause: any = {
      isActive: true,
      therapist: {
        isActive: true,
        canTakeConsultations: true
      }
    }

    // Filter by specialty if provided
    if (specialtyId) {
      whereClause.therapist = {
        ...whereClause.therapist,
        specialties: {
          some: {
            specialtyId: specialtyId,
            isPrimary: true
          }
        }
      }
    }

    // Filter by specific therapist if provided
    if (therapistId) {
      whereClause.therapistId = therapistId
    }

    // Fetch therapist schedules
    const schedules = await db.therapistSchedule.findMany({
      where: whereClause,
      include: {
        therapist: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            specialties: {
              include: {
                specialty: {
                  select: {
                    name: true
                  }
                }
              }
            }
          }
        }
      }
    })

    // Fetch existing appointments for the month
    const existingAppointments = await db.consultationRequest.findMany({
      where: {
        scheduledDate: {
          gte: startDate,
          lte: endDate
        },
        status: {
          in: ['CONFIRMED', 'IN_PROGRESS', 'COMPLETED']
        }
      },
      select: {
        scheduledDate: true,
        scheduledTime: true,
        therapistId: true,
        duration: true
      }
    })

    // Generate availability data
    const availability: { [date: string]: any[] } = {}

    // Initialize all days in the month
    for (let day = 1; day <= endDate.getDate(); day++) {
      const date = new Date(year, monthNum - 1, day)
      const dateString = date.toISOString().split('T')[0]
      const dayOfWeek = date.getDay() // 0 = Sunday, 1 = Monday, etc.
      
      availability[dateString] = []

      // Find schedules for this day of week
      const daySchedules = schedules.filter(schedule => {
        const scheduleDayMap: { [key: number]: string } = {
          0: 'SUNDAY',
          1: 'MONDAY', 
          2: 'TUESDAY',
          3: 'WEDNESDAY',
          4: 'THURSDAY',
          5: 'FRIDAY',
          6: 'SATURDAY'
        }
        return schedule.dayOfWeek === scheduleDayMap[dayOfWeek]
      })

      // Generate time slots for each therapist
      for (const schedule of daySchedules) {
        const startTime = schedule.startTime.split(':').map(Number)
        const endTime = schedule.endTime.split(':').map(Number)
        const breakStart = schedule.breakStart ? schedule.breakStart.split(':').map(Number) : null
        const breakEnd = schedule.breakEnd ? schedule.breakEnd.split(':').map(Number) : null

        let currentHour = startTime[0]
        let currentMinute = startTime[1]

        while (currentHour < endTime[0] || (currentHour === endTime[0] && currentMinute < endTime[1])) {
          // Check if current time is during break
          const isDuringBreak = breakStart && breakEnd && (
            (currentHour > breakStart[0] || (currentHour === breakStart[0] && currentMinute >= breakStart[1])) &&
            (currentHour < breakEnd[0] || (currentHour === breakEnd[0] && currentMinute < breakEnd[1]))
          )

          if (!isDuringBreak) {
            const timeString = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`
            
            // Check if this time slot is already booked
            const isBooked = existingAppointments.some(appointment => {
              const appointmentDate = appointment.scheduledDate.toISOString().split('T')[0]
              return appointmentDate === dateString && 
                     appointment.scheduledTime === timeString &&
                     appointment.therapistId === schedule.therapistId
            })

            availability[dateString].push({
              time: timeString,
              therapistId: schedule.therapistId,
              therapistName: `${schedule.therapist.firstName} ${schedule.therapist.lastName}`,
              available: !isBooked,
              specialties: schedule.therapist.specialties.map(ts => ts.specialty.name)
            })
          }

          // Move to next time slot (default 60 minutes)
          currentMinute += 60
          if (currentMinute >= 60) {
            currentHour += Math.floor(currentMinute / 60)
            currentMinute = currentMinute % 60
          }
        }
      }

      // Sort time slots by time
      availability[dateString].sort((a, b) => a.time.localeCompare(b.time))
    }

    return NextResponse.json({
      success: true,
      data: {
        month: month,
        availability: availability,
        totalSchedules: schedules.length,
        totalAppointments: existingAppointments.length
      }
    })

  } catch (error) {
    console.error('Error fetching availability:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch availability' 
      },
      { status: 500 }
    )
  }
}


