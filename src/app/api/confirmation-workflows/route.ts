import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'

// Comprehensive validation schemas
const consultationConfirmationSchema = z.object({
  consultationId: z.string().uuid('Invalid consultation ID'),
  action: z.enum(['confirm', 'reschedule', 'cancel']),
  confirmedBy: z.string().uuid('Invalid user ID'),
  
  // Reschedule data
  newDate: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
    .transform(val => new Date(val))
    .optional(),
  
  newTime: z.string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Time must be in HH:MM format')
    .optional(),
  
  // Cancellation data
  cancellationReason: z.string()
    .max(500, 'Cancellation reason cannot exceed 500 characters')
    .optional(),
  
  notes: z.string().max(1000, 'Notes cannot exceed 1000 characters').optional()
})

const paymentConfirmationSchema = z.object({
  paymentId: z.string().uuid('Invalid payment ID'),
  action: z.enum(['confirm', 'reject', 'request_correction']),
  confirmedBy: z.string().uuid('Invalid user ID'),
  
  // Confirmation data
  confirmedAmount: z.number()
    .min(0, 'Amount must be positive')
    .multipleOf(0.01, 'Amount must have at most 2 decimal places')
    .optional(),
  
  transactionReference: z.string()
    .max(100, 'Transaction reference cannot exceed 100 characters')
    .optional(),
  
  // Rejection data
  rejectionReason: z.string()
    .max(500, 'Rejection reason cannot exceed 500 characters')
    .optional(),
  
  // Correction request data
  correctionNotes: z.string()
    .max(1000, 'Correction notes cannot exceed 1000 characters')
    .optional(),
  
  notes: z.string().max(1000, 'Notes cannot exceed 1000 characters').optional()
})

const confirmationQuerySchema = z.object({
  page: z.string().transform(val => parseInt(val) || 1).refine(val => val > 0, 'Page must be greater than 0'),
  limit: z.string().transform(val => parseInt(val) || 10).refine(val => val > 0 && val <= 100, 'Limit must be between 1 and 100'),
  type: z.enum(['consultation', 'payment']),
  status: z.enum(['pending', 'confirmed', 'rejected', 'cancelled']).optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format').optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be in YYYY-MM-DD format').optional(),
  sortBy: z.enum(['createdAt', 'updatedAt']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc')
})

// GET /api/confirmation-workflows - Get pending confirmations
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    
    if (action === 'statistics') {
      // Get confirmation statistics
      const [
        pendingConsultations,
        pendingPayments,
        confirmedToday,
        overdueConfirmations
      ] = await Promise.all([
        db.consultationRequest.count({
          where: { status: 'pending' }
        }),
        db.payment.count({
          where: { status: 'pending' }
        }),
        db.consultationRequest.count({
          where: {
            status: 'confirmed',
            updatedAt: {
              gte: new Date(new Date().setHours(0, 0, 0, 0))
            }
          }
        }) + db.payment.count({
          where: {
            status: 'confirmed',
            updatedAt: {
              gte: new Date(new Date().setHours(0, 0, 0, 0))
            }
          }
        }),
        db.consultationRequest.count({
          where: {
            status: 'pending',
            createdAt: {
              lte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Over 24 hours old
            }
          }
        }) + db.payment.count({
          where: {
            status: 'pending',
            createdAt: {
              lte: new Date(Date.now() - 24 * 60 * 60 * 1000)
            }
          }
        })
      ])

      return NextResponse.json({
        success: true,
        data: {
          pendingConsultations,
          pendingPayments,
          confirmedToday,
          overdueConfirmations,
          totalPending: pendingConsultations + pendingPayments
        }
      })
    }
    
    // Regular query
    const validation = confirmationQuerySchema.safeParse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      type: searchParams.get('type'),
      status: searchParams.get('status'),
      startDate: searchParams.get('startDate'),
      endDate: searchParams.get('endDate'),
      sortBy: searchParams.get('sortBy'),
      sortOrder: searchParams.get('sortOrder')
    })

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: validation.error.errors },
        { status: 400 }
      )
    }

    const { page, limit, type, status, startDate, endDate, sortBy, sortOrder } = validation.data

    const skip = (page - 1) * limit
    let items: any[] = []
    let totalCount = 0

    if (type === 'consultation') {
      const whereClause: any = {}
      
      if (status) {
        whereClause.status = status
      }
      
      if (startDate) {
        whereClause.createdAt = { gte: new Date(startDate) }
      }
      
      if (endDate) {
        whereClause.createdAt = { 
          ...whereClause.createdAt,
          lte: new Date(endDate) 
        }
      }

      const [consultations, count] = await Promise.all([
        db.consultationRequest.findMany({
          where: whereClause,
          include: {
            patient: {
              select: {
                firstName: true,
                lastName: true,
                email: true
              }
            },
            therapist: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          },
          orderBy: { [sortBy]: sortOrder },
          skip,
          take: limit
        }),
        db.consultationRequest.count({ where: whereClause })
      ])

      items = consultations.map(c => ({ ...c, type: 'consultation' }))
      totalCount = count
    } else {
      const whereClause: any = {}
      
      if (status) {
        whereClause.status = status
      }
      
      if (startDate) {
        whereClause.createdAt = { gte: new Date(startDate) }
      }
      
      if (endDate) {
        whereClause.createdAt = { 
          ...whereClause.createdAt,
          lte: new Date(endDate) 
        }
      }

      const [payments, count] = await Promise.all([
        db.payment.findMany({
          where: whereClause,
          include: {
            patient: {
              select: {
                firstName: true,
                lastName: true,
                email: true
              }
            }
          },
          orderBy: { [sortBy]: sortOrder },
          skip,
          take: limit
        }),
        db.payment.count({ where: whereClause })
      ])

      items = payments.map(p => ({ ...p, type: 'payment' }))
      totalCount = count
    }

    const totalPages = Math.ceil(totalCount / limit)

    return NextResponse.json({
      success: true,
      data: {
        items,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      }
    })

  } catch (error) {
    console.error('Error fetching confirmations:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/confirmation-workflows - Process confirmation action
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const type = body.type
    
    if (type === 'consultation') {
      const validation = consultationConfirmationSchema.safeParse(body)
      if (!validation.success) {
        return NextResponse.json(
          { error: 'Invalid request data', details: validation.error.errors },
          { status: 400 }
        )
      }

      const validatedData = validation.data

      const consultation = await db.consultationRequest.findUnique({
        where: { id: validatedData.consultationId }
      })

      if (!consultation) {
        return NextResponse.json(
          { error: 'Consultation not found' },
          { status: 404 }
        )
      }

      let updateData: any = {}

      switch (validatedData.action) {
        case 'confirm':
          updateData = {
            status: 'confirmed',
            confirmedAt: new Date(),
            confirmedBy: validatedData.confirmedBy
          }
          break
          
        case 'reschedule':
          if (!validatedData.newDate || !validatedData.newTime) {
            return NextResponse.json(
              { error: 'New date and time are required for rescheduling' },
              { status: 400 }
            )
          }
          
          updateData = {
            status: 'rescheduled',
            scheduledDate: validatedData.newDate,
            scheduledTime: validatedData.newTime,
            rescheduledAt: new Date(),
            rescheduledBy: validatedData.confirmedBy
          }
          break
          
        case 'cancel':
          if (!validatedData.cancellationReason) {
            return NextResponse.json(
              { error: 'Cancellation reason is required' },
              { status: 400 }
            )
          }
          
          updateData = {
            status: 'cancelled',
            cancellationReason: validatedData.cancellationReason,
            cancelledAt: new Date(),
            cancelledBy: validatedData.confirmedBy
          }
          break
      }

      const updated = await db.consultationRequest.update({
        where: { id: validatedData.consultationId },
        data: updateData,
        include: {
          patient: { select: { firstName: true, lastName: true, email: true } },
          therapist: { select: { firstName: true, lastName: true } }
        }
      })

      return NextResponse.json({
        success: true,
        message: `Consultation ${validatedData.action}ed successfully`,
        data: updated
      })
    } else if (type === 'payment') {
      const validation = paymentConfirmationSchema.safeParse(body)
      if (!validation.success) {
        return NextResponse.json(
          { error: 'Invalid request data', details: validation.error.errors },
          { status: 400 }
        )
      }

      const validatedData = validation.data

      const payment = await db.payment.findUnique({
        where: { id: validatedData.paymentId }
      })

      if (!payment) {
        return NextResponse.json(
          { error: 'Payment not found' },
          { status: 404 }
        )
      }

      let updateData: any = {}

      switch (validatedData.action) {
        case 'confirm':
          updateData = {
            status: 'confirmed',
            confirmedAmount: validatedData.confirmedAmount || payment.amount,
            transactionReference: validatedData.transactionReference,
            confirmedAt: new Date(),
            confirmedBy: validatedData.confirmedBy
          }
          break
          
        case 'reject':
          if (!validatedData.rejectionReason) {
            return NextResponse.json(
              { error: 'Rejection reason is required' },
              { status: 400 }
            )
          }
          
          updateData = {
            status: 'rejected',
            rejectionReason: validatedData.rejectionReason,
            rejectedAt: new Date(),
            rejectedBy: validatedData.confirmedBy
          }
          break
          
        case 'request_correction':
          if (!validatedData.correctionNotes) {
            return NextResponse.json(
              { error: 'Correction notes are required' },
              { status: 400 }
            )
          }
          
          updateData = {
            status: 'correction_requested',
            correctionNotes: validatedData.correctionNotes,
            correctionRequestedAt: new Date(),
            correctionRequestedBy: validatedData.confirmedBy
          }
          break
      }

      const updated = await db.payment.update({
        where: { id: validatedData.paymentId },
        data: updateData,
        include: {
          patient: { select: { firstName: true, lastName: true, email: true } }
        }
      })

      return NextResponse.json({
        success: true,
        message: `Payment ${validatedData.action}ed successfully`,
        data: updated
      })
    }

    return NextResponse.json(
      { error: 'Invalid confirmation type' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Error processing confirmation:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
