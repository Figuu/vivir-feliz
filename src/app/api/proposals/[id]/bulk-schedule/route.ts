import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { ConflictResolutionService } from '@/lib/conflict-resolution'

// Validation schemas
const bulkScheduleSchema = z.object({
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  frequency: z.enum(['DAILY', 'WEEKLY', 'BIWEEKLY']),
  daysOfWeek: z.array(z.enum(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'])).optional(),
  timeSlots: z.array(z.object({
    time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    duration: z.number().min(15).max(480)
  })).min(1),
  notes: z.string().optional(),
  autoResolveConflicts: z.boolean().default(false),
  maxTimeShift: z.number().min(0).max(480).default(60)
})

// POST /api/proposals/[id]/bulk-schedule - Bulk schedule sessions for approved proposal
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()

    // Validate request body
    const validation = bulkScheduleSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.errors },
        { status: 400 }
      )
    }

    const { startDate, endDate, frequency, daysOfWeek, timeSlots, notes, autoResolveConflicts, maxTimeShift } = validation.data

    // Get proposal with all related data
    const proposal = await db.therapeuticProposal.findUnique({
      where: { id: params.id },
      include: {
        patient: true,
        therapist: true,
        services: {
          include: {
            service: true,
            assignedTherapist: true,
            serviceAssignments: {
              include: {
                service: true
              }
            }
          }
        }
      }
    })

    if (!proposal) {
      return NextResponse.json(
        { error: 'Proposal not found' },
        { status: 404 }
      )
    }

    // Check if proposal is approved
    if (proposal.status !== 'APPROVED') {
      return NextResponse.json(
        { error: 'Proposal must be approved before scheduling sessions' },
        { status: 400 }
      )
    }

    // Check if proposal has a selected proposal type
    if (!proposal.selectedProposal) {
      return NextResponse.json(
        { error: 'Proposal must have a selected proposal type (A or B) before scheduling' },
        { status: 400 }
      )
    }

    // Generate session dates based on frequency
    const sessionDates: Date[] = []
    const start = new Date(startDate)
    const end = new Date(endDate)

    let currentDate = new Date(start)
    while (currentDate <= end) {
      const dayOfWeek = currentDate.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase()
      
      if (!daysOfWeek || daysOfWeek.includes(dayOfWeek as any)) {
        sessionDates.push(new Date(currentDate))
      }

      // Move to next date based on frequency
      switch (frequency) {
        case 'DAILY':
          currentDate.setDate(currentDate.getDate() + 1)
          break
        case 'WEEKLY':
          currentDate.setDate(currentDate.getDate() + 7)
          break
        case 'BIWEEKLY':
          currentDate.setDate(currentDate.getDate() + 14)
          break
      }
    }

    // Process each service assignment
    const results = {
      createdSessions: [] as any[],
      errors: [] as any[],
      serviceAssignments: [] as any[]
    }

    for (const proposalService of proposal.services) {
      // Determine which proposal (A or B) to use
      const isProposalA = proposal.selectedProposal === 'A'
      const totalSessions = isProposalA ? proposalService.proposalASession : proposalService.proposalBSessions
      const costPerSession = isProposalA ? proposalService.proposalACostPerSession : proposalService.proposalBCostPerSession

      if (totalSessions <= 0) {
        results.errors.push({
          serviceId: proposalService.serviceId,
          serviceName: proposalService.service.name,
          error: 'No sessions configured for this service'
        })
        continue
      }

      // Get or create service assignment
      let serviceAssignment = proposalService.serviceAssignments.find(
        sa => sa.serviceId === proposalService.serviceId
      )

      if (!serviceAssignment) {
        // Create new service assignment
        serviceAssignment = await db.serviceAssignment.create({
          data: {
            proposalServiceId: proposalService.id,
            serviceId: proposalService.serviceId,
            therapistId: proposalService.assignedTherapistId || proposal.therapistId,
            totalSessions,
            completedSessions: 0,
            costPerSession: costPerSession || proposalService.service.costPerSession,
            status: 'SCHEDULED',
            startDate: start,
            endDate: end
          },
          include: {
            service: {
              select: {
                id: true,
                name: true,
                type: true
              }
            }
          }
        })
      }

      results.serviceAssignments.push(serviceAssignment)

      // Create sessions for this service assignment
      let sessionsCreated = 0
      const maxSessions = Math.min(totalSessions, sessionDates.length * timeSlots.length)

      for (const date of sessionDates) {
        if (sessionsCreated >= maxSessions) break

        for (const timeSlot of timeSlots) {
          if (sessionsCreated >= maxSessions) break

          try {
            // Check availability
            const availability = await ConflictResolutionService.checkAvailability({
              therapistId: serviceAssignment.therapistId,
              date,
              startTime: timeSlot.time,
              endTime: new Date(date.getTime() + timeSlot.duration * 60000).toTimeString().slice(0, 5),
              duration: timeSlot.duration
            })

            if (!availability.available) {
              if (autoResolveConflicts) {
                // Try to resolve conflicts automatically
                const resolution = await ConflictResolutionService.resolveConflicts(
                  serviceAssignment.therapistId,
                  date,
                  timeSlot.duration,
                  {
                    preferredTime: timeSlot.time,
                    maxTimeShift,
                    allowDifferentDay: false
                  }
                )

                if (resolution.resolved && resolution.suggestedTime) {
                  // Use resolved time
                  const session = await db.patientSession.create({
                    data: {
                      serviceAssignmentId: serviceAssignment.id,
                      patientId: proposal.patientId,
                      therapistId: serviceAssignment.therapistId,
                      scheduledDate: date,
                      scheduledTime: resolution.suggestedTime,
                      duration: timeSlot.duration,
                      sessionNotes: notes,
                      status: 'SCHEDULED'
                    }
                  })

                  results.createdSessions.push({
                    ...session,
                    serviceName: proposalService.service.name,
                    resolvedTime: resolution.suggestedTime,
                    originalTime: timeSlot.time,
                    resolutionReason: resolution.reason
                  })
                  sessionsCreated++
                } else {
                  results.errors.push({
                    date: date.toISOString(),
                    time: timeSlot.time,
                    serviceName: proposalService.service.name,
                    error: `Could not resolve conflicts: ${resolution.reason}`,
                    conflicts: availability.conflicts,
                    suggestions: availability.suggestions
                  })
                }
              } else {
                results.errors.push({
                  date: date.toISOString(),
                  time: timeSlot.time,
                  serviceName: proposalService.service.name,
                  error: availability.reason,
                  conflicts: availability.conflicts,
                  suggestions: availability.suggestions
                })
              }
            } else {
              // Create session with original time
              const session = await db.patientSession.create({
                data: {
                  serviceAssignmentId: serviceAssignment.id,
                  patientId: proposal.patientId,
                  therapistId: serviceAssignment.therapistId,
                  scheduledDate: date,
                  scheduledTime: timeSlot.time,
                  duration: timeSlot.duration,
                  sessionNotes: notes,
                  status: 'SCHEDULED'
                }
              })

              results.createdSessions.push({
                ...session,
                serviceName: proposalService.service.name
              })
              sessionsCreated++
            }
          } catch (error) {
            results.errors.push({
              date: date.toISOString(),
              time: timeSlot.time,
              serviceName: proposalService.service.name,
              error: error instanceof Error ? error.message : 'Unknown error'
            })
          }
        }
      }
    }

    // Update proposal status if sessions were created
    if (results.createdSessions.length > 0) {
      await db.therapeuticProposal.update({
        where: { id: params.id },
        data: {
          status: 'APPROVED' // Ensure it stays approved
        }
      })
    }

    return NextResponse.json({
      success: true,
      message: `Bulk scheduling completed. Created ${results.createdSessions.length} sessions.`,
      results: {
        createdSessions: results.createdSessions,
        errors: results.errors,
        serviceAssignments: results.serviceAssignments,
        summary: {
          totalSessionsCreated: results.createdSessions.length,
          totalErrors: results.errors.length,
          servicesProcessed: results.serviceAssignments.length,
          autoResolvedConflicts: results.createdSessions.filter(s => s.resolvedTime).length
        }
      }
    })

  } catch (error) {
    console.error('Error bulk scheduling sessions:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET /api/proposals/[id]/bulk-schedule - Get bulk scheduling options and preview
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const proposal = await db.therapeuticProposal.findUnique({
      where: { id: params.id },
      include: {
        patient: true,
        therapist: {
          include: {
            therapistSchedules: {
              where: { isActive: true }
            }
          }
        },
        services: {
          include: {
            service: true,
            assignedTherapist: {
              include: {
                therapistSchedules: {
                  where: { isActive: true }
                }
              }
            },
            serviceAssignments: {
              include: {
                service: true,
                patientSessions: {
                  where: {
                    status: {
                      in: ['SCHEDULED', 'IN_PROGRESS']
                    }
                  }
                }
              }
            }
          }
        }
      }
    })

    if (!proposal) {
      return NextResponse.json(
        { error: 'Proposal not found' },
        { status: 404 }
      )
    }

    // Generate scheduling options
    const schedulingOptions = {
      proposal: {
        id: proposal.id,
        status: proposal.status,
        selectedProposal: proposal.selectedProposal,
        treatmentPeriod: proposal.treatmentPeriod
      },
      services: proposal.services.map(ps => ({
        id: ps.id,
        serviceId: ps.serviceId,
        serviceName: ps.service.name,
        serviceType: ps.service.type,
        sessionDuration: ps.service.sessionDuration,
        assignedTherapist: ps.assignedTherapist,
        proposalA: {
          sessions: ps.proposalASession,
          costPerSession: ps.proposalACostPerSession
        },
        proposalB: {
          sessions: ps.proposalBSessions,
          costPerSession: ps.proposalBCostPerSession
        },
        existingSessions: ps.serviceAssignments.flatMap(sa => sa.patientSessions)
      })),
      therapistSchedules: proposal.therapist.therapistSchedules,
      availability: {
        // This could be enhanced to show actual availability
        workingDays: proposal.therapist.therapistSchedules.map(ts => ts.dayOfWeek),
        workingHours: proposal.therapist.therapistSchedules.reduce((acc, ts) => {
          acc[ts.dayOfWeek] = {
            start: ts.startTime,
            end: ts.endTime,
            breakStart: ts.breakStart,
            breakEnd: ts.breakEnd
          }
          return acc
        }, {} as any)
      }
    }

    return NextResponse.json({
      success: true,
      data: schedulingOptions
    })

  } catch (error) {
    console.error('Error getting bulk scheduling options:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
