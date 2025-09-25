import { db } from './db'

export interface AssignmentCriteria {
  specialtyId: string
  date: string
  time: string
  duration: number
  patientAge?: number
  patientGender?: string
  urgency?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  preferredTherapistId?: string
  excludeTherapistIds?: string[]
  maxWorkload?: number // Maximum number of appointments per day
}

export interface TherapistScore {
  therapistId: string
  therapistName: string
  score: number
  reasons: string[]
  specialties: string[]
  currentWorkload: number
  maxWorkload: number
  availability: boolean
  experience: number // years of experience
  rating?: number
  lastAssigned?: Date
  distance?: number // if location-based assignment is needed
}

export interface AssignmentResult {
  assignedTherapist?: {
    therapistId: string
    therapistName: string
    specialties: string[]
    score: number
    reasons: string[]
  }
  alternativeTherapists: TherapistScore[]
  assignmentStrategy: string
  totalCandidates: number
  assignmentTime: Date
}

export class TherapistAssignment {
  /**
   * Automatically assign the best therapist based on criteria
   */
  static async assignTherapist(criteria: AssignmentCriteria): Promise<AssignmentResult> {
    try {
      const startTime = new Date()

      // Get all eligible therapists for the specialty
      const eligibleTherapists = await this.getEligibleTherapists(criteria)
      
      if (eligibleTherapists.length === 0) {
        return {
          alternativeTherapists: [],
          assignmentStrategy: 'No eligible therapists found',
          totalCandidates: 0,
          assignmentTime: startTime
        }
      }

      // Score each therapist based on multiple factors
      const scoredTherapists = await this.scoreTherapists(eligibleTherapists, criteria)

      // Sort by score (highest first)
      const sortedTherapists = scoredTherapists.sort((a, b) => b.score - a.score)

      // Select the best therapist
      const assignedTherapist = sortedTherapists[0]
      const alternativeTherapists = sortedTherapists.slice(1, 6) // Top 5 alternatives

      // Determine assignment strategy
      const strategy = this.determineAssignmentStrategy(assignedTherapist, criteria)

      return {
        assignedTherapist: assignedTherapist.availability ? {
          therapistId: assignedTherapist.therapistId,
          therapistName: assignedTherapist.therapistName,
          specialties: assignedTherapist.specialties,
          score: assignedTherapist.score,
          reasons: assignedTherapist.reasons
        } : undefined,
        alternativeTherapists,
        assignmentStrategy: strategy,
        totalCandidates: eligibleTherapists.length,
        assignmentTime: startTime
      }

    } catch (error) {
      console.error('Error in therapist assignment:', error)
      return {
        alternativeTherapists: [],
        assignmentStrategy: 'Assignment failed due to error',
        totalCandidates: 0,
        assignmentTime: new Date()
      }
    }
  }

  /**
   * Get all therapists eligible for the given specialty and criteria
   */
  private static async getEligibleTherapists(criteria: AssignmentCriteria) {
    const { specialtyId, excludeTherapistIds = [] } = criteria

    const therapists = await db.therapist.findMany({
      where: {
        isActive: true,
        canTakeConsultations: true,
        id: {
          notIn: excludeTherapistIds
        },
        specialties: {
          some: {
            specialtyId: specialtyId,
            isPrimary: true
          }
        }
      },
      include: {
        user: {
          select: {
            name: true,
            createdAt: true
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
        },
        schedules: {
          where: {
            dayOfWeek: this.getDayOfWeek(criteria.date),
            isActive: true
          }
        }
      }
    })

    return therapists
  }

  /**
   * Score therapists based on multiple criteria
   */
  private static async scoreTherapists(
    therapists: any[], 
    criteria: AssignmentCriteria
  ): Promise<TherapistScore[]> {
    const scoredTherapists: TherapistScore[] = []

    for (const therapist of therapists) {
      const score = await this.calculateTherapistScore(therapist, criteria)
      scoredTherapists.push(score)
    }

    return scoredTherapists
  }

  /**
   * Calculate comprehensive score for a therapist
   */
  private static async calculateTherapistScore(
    therapist: any, 
    criteria: AssignmentCriteria
  ): Promise<TherapistScore> {
    let totalScore = 0
    const reasons: string[] = []

    // 1. Availability Check (40% weight)
    const availabilityScore = await this.calculateAvailabilityScore(therapist, criteria)
    totalScore += availabilityScore.score * 0.4
    reasons.push(...availabilityScore.reasons)

    // 2. Workload Balance (25% weight)
    const workloadScore = await this.calculateWorkloadScore(therapist, criteria)
    totalScore += workloadScore.score * 0.25
    reasons.push(...workloadScore.reasons)

    // 3. Experience and Rating (20% weight)
    const experienceScore = this.calculateExperienceScore(therapist)
    totalScore += experienceScore.score * 0.2
    reasons.push(...experienceScore.reasons)

    // 4. Specialty Match (10% weight)
    const specialtyScore = this.calculateSpecialtyScore(therapist, criteria)
    totalScore += specialtyScore.score * 0.1
    reasons.push(...specialtyScore.reasons)

    // 5. Recent Assignment Balance (5% weight)
    const recentAssignmentScore = await this.calculateRecentAssignmentScore(therapist)
    totalScore += recentAssignmentScore.score * 0.05
    reasons.push(...recentAssignmentScore.reasons)

    // Get current workload
    const currentWorkload = await this.getCurrentWorkload(therapist.id, criteria.date)

    return {
      therapistId: therapist.id,
      therapistName: therapist.user.name || `${therapist.firstName} ${therapist.lastName}`,
      score: Math.round(totalScore * 100) / 100, // Round to 2 decimal places
      reasons,
      specialties: therapist.specialties.map((ts: any) => ts.specialty.name),
      currentWorkload,
      maxWorkload: criteria.maxWorkload || 8, // Default max 8 appointments per day
      availability: availabilityScore.score > 0,
      experience: this.calculateExperienceYears(therapist.user.createdAt),
      rating: this.getTherapistRating(therapist.id), // This would come from a rating system
      lastAssigned: await this.getLastAssignedDate(therapist.id)
    }
  }

  /**
   * Calculate availability score (0-100)
   */
  private static async calculateAvailabilityScore(
    therapist: any, 
    criteria: AssignmentCriteria
  ): Promise<{ score: number; reasons: string[] }> {
    const { date, time, duration } = criteria
    const reasons: string[] = []

    // Check if therapist has schedule for this day
    const schedule = therapist.schedules[0]
    if (!schedule) {
      return { score: 0, reasons: ['No schedule for this day'] }
    }

    // Check working hours
    const workingHoursCheck = this.checkWorkingHours(schedule, time, duration)
    if (!workingHoursCheck.isAvailable) {
      return { score: 0, reasons: [workingHoursCheck.reason || 'Outside working hours'] }
    }

    // Check for conflicts
    const conflictCheck = await this.checkConflictingAppointments(therapist.id, date, time, duration)
    if (!conflictCheck.isAvailable) {
      return { score: 0, reasons: ['Time slot already booked'] }
    }

    // Calculate availability score based on time flexibility
    const timeFlexibilityScore = this.calculateTimeFlexibilityScore(schedule, time)
    
    reasons.push('Available at requested time')
    if (timeFlexibilityScore > 80) {
      reasons.push('High time flexibility')
    } else if (timeFlexibilityScore > 60) {
      reasons.push('Good time flexibility')
    }

    return { score: 100, reasons }
  }

  /**
   * Calculate workload balance score (0-100)
   */
  private static async calculateWorkloadScore(
    therapist: any, 
    criteria: AssignmentCriteria
  ): Promise<{ score: number; reasons: string[] }> {
    const { date } = criteria
    const reasons: string[] = []

    const currentWorkload = await this.getCurrentWorkload(therapist.id, date)
    const maxWorkload = criteria.maxWorkload || 8

    // Calculate workload percentage
    const workloadPercentage = (currentWorkload / maxWorkload) * 100

    let score: number
    if (workloadPercentage < 50) {
      score = 100 // Light workload - high priority
      reasons.push('Light workload')
    } else if (workloadPercentage < 75) {
      score = 80 // Moderate workload
      reasons.push('Moderate workload')
    } else if (workloadPercentage < 90) {
      score = 60 // Heavy workload
      reasons.push('Heavy workload')
    } else {
      score = 20 // Very heavy workload
      reasons.push('Very heavy workload')
    }

    reasons.push(`${currentWorkload}/${maxWorkload} appointments today`)

    return { score, reasons }
  }

  /**
   * Calculate experience score (0-100)
   */
  private static calculateExperienceScore(therapist: any): { score: number; reasons: string[] } {
    const reasons: string[] = []
    const experienceYears = this.calculateExperienceYears(therapist.user.createdAt)

    let score: number
    if (experienceYears >= 10) {
      score = 100
      reasons.push('Highly experienced (10+ years)')
    } else if (experienceYears >= 5) {
      score = 80
      reasons.push('Experienced (5-10 years)')
    } else if (experienceYears >= 2) {
      score = 60
      reasons.push('Moderately experienced (2-5 years)')
    } else {
      score = 40
      reasons.push('New therapist (0-2 years)')
    }

    return { score, reasons }
  }

  /**
   * Calculate specialty match score (0-100)
   */
  private static calculateSpecialtyScore(therapist: any, criteria: AssignmentCriteria): { score: number; reasons: string[] } {
    const reasons: string[] = []
    const primarySpecialty = therapist.specialties.find((ts: any) => ts.isPrimary)

    if (primarySpecialty && primarySpecialty.specialtyId === criteria.specialtyId) {
      reasons.push('Primary specialty match')
      return { score: 100, reasons }
    }

    // Check if therapist has the specialty as secondary
    const hasSpecialty = therapist.specialties.some((ts: any) => ts.specialtyId === criteria.specialtyId)
    if (hasSpecialty) {
      reasons.push('Secondary specialty match')
      return { score: 80, reasons }
    }

    reasons.push('No direct specialty match')
    return { score: 0, reasons }
  }

  /**
   * Calculate recent assignment balance score (0-100)
   */
  private static async calculateRecentAssignmentScore(therapist: any): Promise<{ score: number; reasons: string[] }> {
    const reasons: string[] = []
    const lastAssigned = await this.getLastAssignedDate(therapist.id)

    if (!lastAssigned) {
      reasons.push('Never assigned before')
      return { score: 100, reasons }
    }

    const daysSinceLastAssignment = Math.floor(
      (new Date().getTime() - lastAssigned.getTime()) / (1000 * 60 * 60 * 24)
    )

    let score: number
    if (daysSinceLastAssignment >= 7) {
      score = 100
      reasons.push('Not assigned recently (7+ days)')
    } else if (daysSinceLastAssignment >= 3) {
      score = 80
      reasons.push('Not assigned recently (3-7 days)')
    } else if (daysSinceLastAssignment >= 1) {
      score = 60
      reasons.push('Assigned recently (1-3 days)')
    } else {
      score = 40
      reasons.push('Assigned today')
    }

    return { score, reasons }
  }

  /**
   * Calculate time flexibility score
   */
  private static calculateTimeFlexibilityScore(schedule: any, requestedTime: string): number {
    const [startHour, startMinute] = schedule.startTime.split(':').map(Number)
    const [endHour, endMinute] = schedule.endTime.split(':').map(Number)
    const [requestHour, requestMinute] = requestedTime.split(':').map(Number)

    const startTime = startHour * 60 + startMinute
    const endTime = endHour * 60 + endMinute
    const requestTime = requestHour * 60 + requestMinute

    const totalWorkingMinutes = endTime - startTime
    const timeFromStart = requestTime - startTime
    const timeFromEnd = endTime - requestTime

    // Prefer times that are not too early or too late in the day
    const earlyPenalty = Math.max(0, (startTime + 60 - requestTime) / 60) * 10
    const latePenalty = Math.max(0, (requestTime - (endTime - 60)) / 60) * 10

    return Math.max(0, 100 - earlyPenalty - latePenalty)
  }

  /**
   * Get current workload for a therapist on a specific date
   */
  private static async getCurrentWorkload(therapistId: string, date: string): Promise<number> {
    const appointments = await db.consultationRequest.count({
      where: {
        therapistId,
        scheduledDate: {
          gte: new Date(date + 'T00:00:00'),
          lt: new Date(date + 'T23:59:59')
        },
        status: {
          in: ['CONFIRMED', 'IN_PROGRESS']
        }
      }
    })

    return appointments
  }

  /**
   * Get last assigned date for a therapist
   */
  private static async getLastAssignedDate(therapistId: string): Promise<Date | null> {
    const lastAppointment = await db.consultationRequest.findFirst({
      where: {
        therapistId,
        status: {
          in: ['CONFIRMED', 'IN_PROGRESS', 'COMPLETED']
        }
      },
      orderBy: {
        scheduledDate: 'desc'
      },
      select: {
        scheduledDate: true
      }
    })

    return lastAppointment?.scheduledDate || null
  }

  /**
   * Get therapist rating (placeholder - would integrate with rating system)
   */
  private static getTherapistRating(therapistId: string): number {
    // This would integrate with a rating/review system
    // For now, return a random rating between 4.0 and 5.0
    return Math.round((Math.random() * 1 + 4) * 10) / 10
  }

  /**
   * Calculate experience years from creation date
   */
  private static calculateExperienceYears(createdAt: Date): number {
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - createdAt.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return Math.floor(diffDays / 365)
  }

  /**
   * Check working hours (reused from availability checker)
   */
  private static checkWorkingHours(schedule: any, time: string, duration: number): { isAvailable: boolean; reason?: string } {
    const [startHour, startMinute] = schedule.startTime.split(':').map(Number)
    const [endHour, endMinute] = schedule.endTime.split(':').map(Number)
    const [requestHour, requestMinute] = time.split(':').map(Number)

    const startTime = startHour * 60 + startMinute
    const endTime = endHour * 60 + endMinute
    const requestTime = requestHour * 60 + requestMinute
    const requestEndTime = requestTime + duration

    if (requestTime < startTime) {
      return { isAvailable: false, reason: `Therapist starts work at ${schedule.startTime}` }
    }

    if (requestEndTime > endTime) {
      return { isAvailable: false, reason: `Therapist ends work at ${schedule.endTime}` }
    }

    if (schedule.breakStart && schedule.breakEnd) {
      const [breakStartHour, breakStartMinute] = schedule.breakStart.split(':').map(Number)
      const [breakEndHour, breakEndMinute] = schedule.breakEnd.split(':').map(Number)
      
      const breakStartTime = breakStartHour * 60 + breakStartMinute
      const breakEndTime = breakEndHour * 60 + breakEndMinute

      if ((requestTime < breakEndTime && requestEndTime > breakStartTime)) {
        return { isAvailable: false, reason: `Time conflicts with therapist break` }
      }
    }

    return { isAvailable: true }
  }

  /**
   * Check for conflicting appointments (reused from availability checker)
   */
  private static async checkConflictingAppointments(
    therapistId: string, 
    date: string, 
    time: string, 
    duration: number
  ): Promise<{ isAvailable: boolean; reason?: string }> {
    const appointmentDateTime = new Date(`${date}T${time}:00`)
    const appointmentEndTime = new Date(appointmentDateTime.getTime() + duration * 60000)

    const conflictingAppointments = await db.consultationRequest.findMany({
      where: {
        therapistId,
        scheduledDate: {
          gte: new Date(date + 'T00:00:00'),
          lt: new Date(date + 'T23:59:59')
        },
        status: {
          in: ['CONFIRMED', 'IN_PROGRESS']
        }
      }
    })

    for (const appointment of conflictingAppointments) {
      if (appointment.scheduledTime) {
        const existingStartTime = new Date(`${date}T${appointment.scheduledTime}:00`)
        const existingEndTime = new Date(existingStartTime.getTime() + (appointment.duration || 60) * 60000)

        if (appointmentDateTime < existingEndTime && appointmentEndTime > existingStartTime) {
          return { isAvailable: false, reason: 'Time slot already booked' }
        }
      }
    }

    return { isAvailable: true }
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
   * Determine assignment strategy based on result
   */
  private static determineAssignmentStrategy(assignedTherapist: TherapistScore, criteria: AssignmentCriteria): string {
    if (!assignedTherapist.availability) {
      return 'No available therapists found'
    }

    if (assignedTherapist.score >= 90) {
      return 'Optimal assignment - perfect match found'
    } else if (assignedTherapist.score >= 75) {
      return 'Good assignment - strong candidate selected'
    } else if (assignedTherapist.score >= 60) {
      return 'Acceptable assignment - suitable candidate found'
    } else {
      return 'Suboptimal assignment - limited options available'
    }
  }

  /**
   * Get assignment statistics for reporting
   */
  static async getAssignmentStatistics(dateRange: { start: string; end: string }) {
    const assignments = await db.consultationRequest.findMany({
      where: {
        scheduledDate: {
          gte: new Date(dateRange.start),
          lte: new Date(dateRange.end)
        },
        status: {
          in: ['CONFIRMED', 'IN_PROGRESS', 'COMPLETED']
        }
      },
      include: {
        therapist: {
          include: {
            user: {
              select: {
                name: true
              }
            }
          }
        }
      }
    })

    const stats = {
      totalAssignments: assignments.length,
      therapistWorkload: {} as { [therapistId: string]: number },
      averageAssignmentsPerDay: 0,
      mostAssignedTherapist: null as any,
      leastAssignedTherapist: null as any
    }

    // Calculate therapist workloads
    assignments.forEach(assignment => {
      const therapistId = assignment.therapistId
      stats.therapistWorkload[therapistId] = (stats.therapistWorkload[therapistId] || 0) + 1
    })

    // Find most and least assigned therapists
    const workloadEntries = Object.entries(stats.therapistWorkload)
    if (workloadEntries.length > 0) {
      const sortedWorkloads = workloadEntries.sort((a, b) => b[1] - a[1])
      stats.mostAssignedTherapist = {
        therapistId: sortedWorkloads[0][0],
        count: sortedWorkloads[0][1]
      }
      stats.leastAssignedTherapist = {
        therapistId: sortedWorkloads[sortedWorkloads.length - 1][0],
        count: sortedWorkloads[sortedWorkloads.length - 1][1]
      }
    }

    // Calculate average assignments per day
    const daysDiff = Math.ceil(
      (new Date(dateRange.end).getTime() - new Date(dateRange.start).getTime()) / (1000 * 60 * 60 * 24)
    )
    stats.averageAssignmentsPerDay = Math.round((stats.totalAssignments / daysDiff) * 100) / 100

    return stats
  }
}
