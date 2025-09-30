import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

const updateConsultationRequestSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW']).optional(),
  scheduledDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format').optional(),
  scheduledTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format').optional(),
  therapistId: z.string().uuid('Invalid therapist ID').optional(),
  duration: z.number().min(15).max(480).optional(),
  notes: z.string().max(1000, 'Notes too long').optional(),
  cancellationReason: z.string().max(500, 'Cancellation reason too long').optional(),
  additionalNotes: z.string().max(1000, 'Additional notes too long').optional(),
  previousTherapyDetails: z.string().max(500, 'Previous therapy details too long').optional(),
  insuranceProvider: z.string().max(100, 'Insurance provider name too long').optional(),
  insurancePolicyNumber: z.string().max(50, 'Policy number too long').optional()
})

// GET - Fetch specific consultation request
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid consultation request ID format' },
        { status: 400 }
      )
    }
    
    const consultationRequest = await db.consultationRequest.findUnique({
      where: { id },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            dateOfBirth: true,
            gender: true,
            parent: {
              select: {
                id: true,
                relationship: true,
                address: true,
                city: true,
                emergencyContact: true,
                emergencyPhone: true,
                profile: {
                  select: {
                    firstName: true,
                    lastName: true,
                    email: true,
                    phone: true
                  }
                }
              }
            }
          }
        },
        therapist: {
          select: {
            id: true,
            profile: {
              select: {
                firstName: true,
                lastName: true
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
        },
        reason: {
          include: {
            specialty: {
              select: {
                id: true,
                name: true,
                description: true
              }
            }
          }
        },
        medicalForms: {
          select: {
            id: true,
            createdAt: true
          }
        },
        payments: {
          select: {
            id: true,
            amount: true,
            status: true,
            paymentMethod: true,
            paymentDate: true,
            receiptUrl: true,
            createdAt: true
          }
        }
      }
    })
    
    if (!consultationRequest) {
      return NextResponse.json(
        { success: false, error: 'Consultation request not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      data: consultationRequest
    })
    
  } catch (error) {
    console.error('Error fetching consultation request:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch consultation request' },
      { status: 500 }
    )
  }
}

// PUT - Update consultation request
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()
    
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid consultation request ID format' },
        { status: 400 }
      )
    }
    
    // Validate request body
    const validationResult = updateConsultationRequestSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Validation failed',
          details: validationResult.error.flatten().fieldErrors
        },
        { status: 400 }
      )
    }
    
    const validatedData = validationResult.data
    
    // Check if consultation request exists
    const existingRequest = await db.consultationRequest.findUnique({
      where: { id },
      select: { 
        id: true, 
        status: true,
        scheduledDate: true,
        scheduledTime: true,
        therapistId: true
      }
    })
    
    if (!existingRequest) {
      return NextResponse.json(
        { success: false, error: 'Consultation request not found' },
        { status: 404 }
      )
    }
    
    // Validate status transitions
    if (validatedData.status) {
      const validTransitions: { [key: string]: string[] } = {
        'PENDING': ['CONFIRMED', 'CANCELLED'],
        'CONFIRMED': ['IN_PROGRESS', 'CANCELLED', 'NO_SHOW'],
        'IN_PROGRESS': ['COMPLETED', 'CANCELLED'],
        'COMPLETED': [], // Terminal state
        'CANCELLED': [], // Terminal state
        'NO_SHOW': ['CONFIRMED', 'CANCELLED'] // Can reschedule or cancel
      }
      
      const currentStatus = existingRequest.status
      const newStatus = validatedData.status
      
      if (!validTransitions[currentStatus]?.includes(newStatus)) {
        return NextResponse.json(
          { 
            success: false, 
            error: `Invalid status transition from ${currentStatus} to ${newStatus}` 
          },
          { status: 400 }
        )
      }
    }
    
    // Validate therapist assignment
    if (validatedData.therapistId) {
      const therapist = await db.therapist.findUnique({
        where: { id: validatedData.therapistId },
        select: { id: true, isActive: true, canTakeConsultations: true }
      })
      
      if (!therapist) {
        return NextResponse.json(
          { success: false, error: 'Therapist not found' },
          { status: 400 }
        )
      }
      
      if (!therapist.isActive || !therapist.canTakeConsultations) {
        return NextResponse.json(
          { success: false, error: 'Therapist is not available for consultations' },
          { status: 400 }
        )
      }
    }
    
    // Validate date and time if provided
    if (validatedData.scheduledDate || validatedData.scheduledTime) {
      const scheduledDate = validatedData.scheduledDate || existingRequest.scheduledDate
      const scheduledTime = validatedData.scheduledTime || existingRequest.scheduledTime
      
      if (scheduledDate && scheduledTime) {
        const appointmentDate = new Date(scheduledDate)
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        
        if (appointmentDate < today) {
          return NextResponse.json(
            { 
              success: false, 
              error: 'Cannot schedule appointments in the past' 
            },
            { status: 400 }
          )
        }
        
        // Check for conflicts if therapist is assigned
        if (validatedData.therapistId || existingRequest.therapistId) {
          const therapistId = validatedData.therapistId || existingRequest.therapistId
          
          const conflictingAppointments = await db.consultationRequest.findMany({
            where: {
              therapistId,
              scheduledDate: {
                gte: new Date(scheduledDate + 'T00:00:00'),
                lt: new Date(scheduledDate + 'T23:59:59')
              },
              status: {
                in: ['CONFIRMED', 'IN_PROGRESS']
              },
              id: { not: id } // Exclude current request
            }
          })
          
          for (const appointment of conflictingAppointments) {
            if (appointment.scheduledTime === scheduledTime) {
              return NextResponse.json(
                { 
                  success: false, 
                  error: 'Time slot is already booked by another appointment' 
                },
                { status: 400 }
              )
            }
          }
        }
      }
    }
    
    // Prepare update data
    const updateData: any = { ...validatedData }
    
    // Convert date strings to Date objects
    if (validatedData.scheduledDate) {
      updateData.scheduledDate = new Date(validatedData.scheduledDate)
    }
    
    // Update consultation request
    const updatedRequest = await db.consultationRequest.update({
      where: { id },
      data: updateData,
      include: {
        patient: {
          select: {
            firstName: true,
            lastName: true,
            dateOfBirth: true,
            gender: true
          }
        },
        parent: {
          select: {
            profile: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                phone: true
              }
            }
          }
        },
        therapist: {
          select: {
            profile: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        },
        reason: {
          select: {
            name: true,
            specialty: {
              select: {
                name: true
              }
            }
          }
        }
      }
    })
    
    return NextResponse.json({
      success: true,
      data: updatedRequest,
      message: 'Consultation request updated successfully'
    })
    
  } catch (error) {
    console.error('Error updating consultation request:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update consultation request' },
      { status: 500 }
    )
  }
}

// DELETE - Cancel consultation request
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()
    const { cancellationReason } = body || {}
    
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid consultation request ID format' },
        { status: 400 }
      )
    }
    
    // Check if consultation request exists
    const existingRequest = await db.consultationRequest.findUnique({
      where: { id },
      select: { id: true, status: true }
    })
    
    if (!existingRequest) {
      return NextResponse.json(
        { success: false, error: 'Consultation request not found' },
        { status: 404 }
      )
    }
    
    // Check if request can be cancelled
    if (existingRequest.status === 'COMPLETED') {
      return NextResponse.json(
        { success: false, error: 'Cannot cancel completed consultation request' },
        { status: 400 }
      )
    }
    
    if (existingRequest.status === 'CANCELLED') {
      return NextResponse.json(
        { success: false, error: 'Consultation request is already cancelled' },
        { status: 400 }
      )
    }
    
    // Update consultation request status to cancelled
    const cancelledRequest = await db.consultationRequest.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        notes: cancellationReason || 'Cancelled by user'
      },
      include: {
        patient: {
          select: {
            firstName: true,
            lastName: true
          }
        },
        parent: {
          select: {
            profile: {
              select: {
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        }
      }
    })
    
    return NextResponse.json({
      success: true,
      data: cancelledRequest,
      message: 'Consultation request cancelled successfully'
    })
    
  } catch (error) {
    console.error('Error cancelling consultation request:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to cancel consultation request' },
      { status: 500 }
    )
  }
}
