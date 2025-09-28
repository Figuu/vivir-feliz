import { db } from './db'

export interface AvailabilityCheckParams {
  therapistId?: string
  specialtyId?: string
  date: string
  time: string
  duration: number // in minutes
  excludeAppointmentId?: string // for rescheduling
}

export interface AvailabilityResult {
  isAvailable: boolean
  reason?: string
  therapistId?: string
  therapistName?: string
  conflictingAppointment?: {
    id: string
    scheduledTime: string
    duration: number
    patientName: string
  }
  alternativeSlots?: {
    time: string
    therapistId: string
    therapistName: string
  }[]
}

export interface TherapistAvailability {
  therapistId: string
  therapistName: string
  specialties: string[]
  isAvailable: boolean
  reason?: string
  nextAvailableSlot?: string
}

export class AvailabilityChecker {
  /**
   * Check if a specific time slot is available for booking
   */
  static async checkSlotAvailability(params: AvailabilityCheckParams): Promise<AvailabilityResult> {
    try {
      const { therapistId, specialtyId, date, time, duration, excludeAppointmentId } = params

      // Parse the date and time
      const appointmentDateTime = new Date(`${date}T${time}:00`)
      const appointmentEndTime = new Date(appointmentDateTime.getTime() + duration * 60000)

      // If specific therapist is requested, check only that therapist
      if (therapistId) {
        return await this.checkTherapistAvailability({
          therapistId,
          date,
          time,
          duration,
          excludeAppointmentId
        })
      }

      // If specialty is specified, find available therapists for that specialty
      if (specialtyId) {
        return await this.checkSpecialtyAvailability({
          specialtyId,
          date,
          time,
          duration,
          excludeAppointmentId
        })
      }

      // Check all available therapists
      return await this.checkGeneralAvailability({
        date,
        time,
        duration,
        excludeAppointmentId
      })

    } catch (error) {
      console.error('Error checking slot availability:', error)
      return {
        isAvailable: false,
        reason: 'Error checking availability'
      }
    }
  }

  /**
   * Check availability for a specific therapist
   */
  private static async checkTherapistAvailability(params: {
    therapistId: string
    date: string
    time: string
    duration: number
    excludeAppointmentId?: string
  }): Promise<AvailabilityResult> {
    const { therapistId, date, time, duration, excludeAppointmentId } = params

    // Get therapist information
    const therapist = await db.therapist.findUnique({
      where: { id: therapistId },
      include: {
        user: {
          select: {
            name: true
          }
        }
      }
    })

    if (!therapist || !therapist.isActive || !therapist.canTakeConsultations) {
      return {
        isAvailable: false,
        reason: 'Therapist is not available for consultations'
      }
    }

    // Check if therapist has schedule for this day
    const dayOfWeek = this.getDayOfWeek(date)
    const schedule = await db.therapistSchedule.findUnique({
      where: {
        therapistId_dayOfWeek: {
          therapistId,
          dayOfWeek
        }
      }
    })

    if (!schedule || !schedule.isActive) {
      return {
        isAvailable: false,
        reason: 'Therapist does not work on this day'
      }
    }

    // Check if time is within working hours
    const workingHoursCheck = this.checkWorkingHours(schedule, time, duration)
    if (!workingHoursCheck.isAvailable) {
      return workingHoursCheck
    }

    // Check for conflicting appointments
    const conflictCheck = await this.checkConflictingAppointments({
      therapistId,
      date,
      time,
      duration,
      excludeAppointmentId
    })

    if (!conflictCheck.isAvailable) {
      return {
        ...conflictCheck,
        therapistId,
        therapistName: therapist.user.name || `${therapist.firstName} ${therapist.lastName}`
      }
    }

    return {
      isAvailable: true,
      therapistId,
      therapistName: therapist.user.name || `${therapist.firstName} ${therapist.lastName}`
    }
  }

  /**
   * Check availability for therapists in a specific specialty
   */
  private static async checkSpecialtyAvailability(params: {
    specialtyId: string
    date: string
    time: string
    duration: number
    excludeAppointmentId?: string
  }): Promise<AvailabilityResult> {
    const { specialtyId, date, time, duration, excludeAppointmentId } = params

    // Get therapists for this specialty
    const therapists = await db.therapist.findMany({
      where: {
        isActive: true,
        canTakeConsultations: true,
        specialties: {
          some: {
            specialtyId,
            isPrimary: true
          }
        }
      },
      include: {
        user: {
          select: {
            name: true
          }
        }
      }
    })

    if (therapists.length === 0) {
      return {
        isAvailable: false,
        reason: 'No therapists available for this specialty'
      }
    }

    // Check each therapist for availability
    for (const therapist of therapists) {
      const availability = await this.checkTherapistAvailability({
        therapistId: therapist.id,
        date,
        time,
        duration,
        excludeAppointmentId
      })

      if (availability.isAvailable) {
        return availability
      }
    }

    // If no therapist is available, find alternative slots
    const alternatives = await this.findAlternativeSlots({
      specialtyId,
      date,
      duration
    })

    return {
      isAvailable: false,
      reason: 'No therapists available at this time',
      alternativeSlots: alternatives
    }
  }

  /**
   * Check general availability across all therapists
   */
  private static async checkGeneralAvailability(params: {
    date: string
    time: string
    duration: number
    excludeAppointmentId?: string
  }): Promise<AvailabilityResult> {
    const { date, time, duration, excludeAppointmentId } = params

    // Get all active therapists
    const therapists = await db.therapist.findMany({
      where: {
        isActive: true,
        canTakeConsultations: true
      },
      include: {
        user: {
          select: {
            name: true
          }
        }
      }
    })

    if (therapists.length === 0) {
      return {
        isAvailable: false,
        reason: 'No therapists available'
      }
    }

    // Check each therapist for availability
    for (const therapist of therapists) {
      const availability = await this.checkTherapistAvailability({
        therapistId: therapist.id,
        date,
        time,
        duration,
        excludeAppointmentId
      })

      if (availability.isAvailable) {
        return availability
      }
    }

    return {
      isAvailable: false,
      reason: 'No therapists available at this time'
    }
  }

  /**
   * Check if time is within working hours and not during breaks
   */
  private static checkWorkingHours(
    schedule: any,
    time: string,
    duration: number
  ): AvailabilityResult {
    const [startHour, startMinute] = schedule.startTime.split(':').map(Number)
    const [endHour, endMinute] = schedule.endTime.split(':').map(Number)
    const [requestHour, requestMinute] = time.split(':').map(Number)

    const startTime = startHour * 60 + startMinute
    const endTime = endHour * 60 + endMinute
    const requestTime = requestHour * 60 + requestMinute
    const requestEndTime = requestTime + duration

    // Check if request time is before working hours
    if (requestTime < startTime) {
      return {
        isAvailable: false,
        reason: `Therapist starts work at ${schedule.startTime}`
      }
    }

    // Check if request time extends beyond working hours
    if (requestEndTime > endTime) {
      return {
        isAvailable: false,
        reason: `Therapist ends work at ${schedule.endTime}`
      }
    }

    // Check if time conflicts with break
    if (schedule.breakStart && schedule.breakEnd) {
      const [breakStartHour, breakStartMinute] = schedule.breakStart.split(':').map(Number)
      const [breakEndHour, breakEndMinute] = schedule.breakEnd.split(':').map(Number)
      
      const breakStartTime = breakStartHour * 60 + breakStartMinute
      const breakEndTime = breakEndHour * 60 + breakEndMinute

      // Check if appointment overlaps with break
      if ((requestTime < breakEndTime && requestEndTime > breakStartTime)) {
        return {
          isAvailable: false,
          reason: `Time conflicts with therapist break (${schedule.breakStart} - ${schedule.breakEnd})`
        }
      }
    }

    return { isAvailable: true }
  }

  /**
   * Check for conflicting appointments
   */
  private static async checkConflictingAppointments(params: {
    therapistId: string
    date: string
    time: string
    duration: number
    excludeAppointmentId?: string
  }): Promise<AvailabilityResult> {
    const { therapistId, date, time, duration, excludeAppointmentId } = params

    const appointmentDateTime = new Date(`${date}T${time}:00`)
    const appointmentEndTime = new Date(appointmentDateTime.getTime() + duration * 60000)

    // Find conflicting appointments
    const conflictingAppointments = await db.consultationRequest.findMany({
      where: {
        therapistId,
        scheduledDate: {
          gte: new Date(date + 'T00:00:00'),
          lt: new Date(date + 'T23:59:59')
        },
        status: {
          in: ['CONFIRMED', 'IN_PROGRESS']
        },
        ...(excludeAppointmentId && { id: { not: excludeAppointmentId } })
      },
      include: {
        patient: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    })

    // Check for time conflicts
    for (const appointment of conflictingAppointments) {
      if (appointment.scheduledTime) {
        const existingStartTime = new Date(`${date}T${appointment.scheduledTime}:00`)
        const existingEndTime = new Date(existingStartTime.getTime() + (appointment.duration || 60) * 60000)

        // Check if appointments overlap
        if (appointmentDateTime < existingEndTime && appointmentEndTime > existingStartTime) {
          return {
            isAvailable: false,
            reason: 'Time slot is already booked',
            conflictingAppointment: {
              id: appointment.id,
              scheduledTime: appointment.scheduledTime,
              duration: appointment.duration || 60,
              patientName: `${appointment.patient.firstName} ${appointment.patient.lastName}`
            }
          }
        }
      }
    }

    return { isAvailable: true }
  }

  /**
   * Find alternative time slots for a given date and specialty
   */
  private static async findAlternativeSlots(params: {
    specialtyId: string
    date: string
    duration: number
  }): Promise<{ time: string; therapistId: string; therapistName: string }[]> {
    const { specialtyId, date, duration } = params

    // Get therapists for this specialty
    const therapists = await db.therapist.findMany({
      where: {
        isActive: true,
        canTakeConsultations: true,
        specialties: {
          some: {
            specialtyId,
            isPrimary: true
          }
        }
      },
      include: {
        user: {
          select: {
            name: true
          }
        },
        schedules: {
          where: {
            dayOfWeek: this.getDayOfWeek(date),
            isActive: true
          }
        }
      }
    })

    const alternatives: { time: string; therapistId: string; therapistName: string }[] = []

    for (const therapist of therapists) {
      const schedule = therapist.schedules[0]
      if (!schedule) continue

      // Generate time slots for this therapist
      const timeSlots = this.generateTimeSlots(schedule, duration)
      
      for (const slot of timeSlots) {
        const availability = await this.checkTherapistAvailability({
          therapistId: therapist.id,
          date,
          time: slot,
          duration,
          excludeAppointmentId: undefined
        })

        if (availability.isAvailable) {
          alternatives.push({
            time: slot,
            therapistId: therapist.id,
            therapistName: therapist.user.name || `${therapist.firstName} ${therapist.lastName}`
          })
        }
      }
    }

    // Sort by time and return first 5 alternatives
    return alternatives
      .sort((a, b) => a.time.localeCompare(b.time))
      .slice(0, 5)
  }

  /**
   * Generate time slots for a given schedule
   */
  private static generateTimeSlots(schedule: any, duration: number): string[] {
    const slots: string[] = []
    const [startHour, startMinute] = schedule.startTime.split(':').map(Number)
    const [endHour, endMinute] = schedule.endTime.split(':').map(Number)

    let currentHour = startHour
    let currentMinute = startMinute

    while (currentHour < endHour || (currentHour === endHour && currentMinute < endMinute)) {
      const timeString = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`
      
      // Check if this time is during break
      if (schedule.breakStart && schedule.breakEnd) {
        const [breakStartHour, breakStartMinute] = schedule.breakStart.split(':').map(Number)
        const [breakEndHour, breakEndMinute] = schedule.breakEnd.split(':').map(Number)
        
        const currentTime = currentHour * 60 + currentMinute
        const breakStartTime = breakStartHour * 60 + breakStartMinute
        const breakEndTime = breakEndHour * 60 + breakEndMinute

        if (currentTime >= breakStartTime && currentTime < breakEndTime) {
          // Skip break time
          currentMinute += duration
          if (currentMinute >= 60) {
            currentHour += Math.floor(currentMinute / 60)
            currentMinute = currentMinute % 60
          }
          continue
        }
      }

      slots.push(timeString)

      // Move to next slot
      currentMinute += duration
      if (currentMinute >= 60) {
        currentHour += Math.floor(currentMinute / 60)
        currentMinute = currentMinute % 60
      }
    }

    return slots
  }

  /**
   * Get day of week from date string
   */
  private static getDayOfWeek(date: string): string {
    const dayOfWeekMap: { [key: number]: string } = {
      0: 'SUNDAY',
      1: 'MONDAY',
      2: 'TUESDAY',
      3: 'WEDNESDAY',
      4: 'THURSDAY',
      5: 'FRIDAY',
      6: 'SATURDAY'
    }
    
    const dateObj = new Date(date)
    return dayOfWeekMap[dateObj.getDay()]
  }

  /**
   * Get therapist availability for a specific date
   */
  static async getTherapistAvailability(params: {
    date: string
    specialtyId?: string
  }): Promise<TherapistAvailability[]> {
    const { date, specialtyId } = params

    let therapists

    if (specialtyId) {
      therapists = await db.therapist.findMany({
        where: {
          isActive: true,
          canTakeConsultations: true,
          specialties: {
            some: {
              specialtyId,
              isPrimary: true
            }
          }
        },
        include: {
          user: {
            select: {
              name: true
            }
          },
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
      })
    } else {
      therapists = await db.therapist.findMany({
        where: {
          isActive: true,
          canTakeConsultations: true
        },
        include: {
          user: {
            select: {
              name: true
            }
          },
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
      })
    }

    const availability: TherapistAvailability[] = []

    for (const therapist of therapists) {
      const dayOfWeek = this.getDayOfWeek(date)
      const schedule = await db.therapistSchedule.findUnique({
        where: {
          therapistId_dayOfWeek: {
            therapistId: therapist.id,
            dayOfWeek
          }
        }
      })

      if (!schedule || !schedule.isActive) {
        availability.push({
          therapistId: therapist.id,
          therapistName: therapist.user.name || `${therapist.firstName} ${therapist.lastName}`,
          specialties: therapist.specialties.map(ts => ts.specialty.name),
          isAvailable: false,
          reason: 'Not scheduled for this day'
        })
        continue
      }

      // Check if therapist has any available slots
      const timeSlots = this.generateTimeSlots(schedule, 60)
      let hasAvailableSlots = false
      let nextAvailableSlot: string | undefined

      for (const slot of timeSlots) {
        const slotAvailability = await this.checkTherapistAvailability({
          therapistId: therapist.id,
          date,
          time: slot,
          duration: 60
        })

        if (slotAvailability.isAvailable) {
          hasAvailableSlots = true
          if (!nextAvailableSlot) {
            nextAvailableSlot = slot
          }
          break
        }
      }

      availability.push({
        therapistId: therapist.id,
        therapistName: therapist.user.name || `${therapist.firstName} ${therapist.lastName}`,
        specialties: therapist.specialties.map(ts => ts.specialty.name),
        isAvailable: hasAvailableSlots,
        reason: hasAvailableSlots ? undefined : 'No available slots',
        nextAvailableSlot
      })
    }

    return availability
  }
}


