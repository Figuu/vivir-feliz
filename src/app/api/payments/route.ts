import { NextRequest, NextResponse } from 'next/server'
import { PaymentApiManager, PaymentRequest } from '@/lib/payment-api-manager'
import { db } from '@/lib/db'
import { z } from 'zod'

const createPaymentSchema = z.object({
  patientId: z.string().uuid('Invalid patient ID format'),
  therapistId: z.string().uuid('Invalid therapist ID format'),
  consultationRequestId: z.string().uuid('Invalid consultation request ID format').optional(),
  paymentPlanId: z.string().uuid('Invalid payment plan ID format').optional(),
  amount: z.number().positive('Amount must be greater than 0').max(100000, 'Amount cannot exceed $100,000'),
  paymentMethod: z.enum(['CREDIT_CARD', 'BANK_TRANSFER', 'CASH', 'CHECK', 'DEBIT_CARD', 'PAYPAL', 'STRIPE']),
  paymentType: z.enum(['CONSULTATION', 'SESSION', 'EVALUATION', 'TREATMENT', 'PLAN_INSTALLMENT', 'REFUND']),
  description: z.string().max(500, 'Description cannot exceed 500 characters').optional(),
  reference: z.string().max(100, 'Reference cannot exceed 100 characters').optional(),
  metadata: z.record(z.any()).optional(),
  dueDate: z.string().datetime('Invalid due date format').optional(),
  autoProcess: z.boolean().optional()
})

const getPaymentsQuerySchema = z.object({
  // Pagination
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().optional().transform(val => val ? Math.min(parseInt(val), 100) : 20),
  
  // Filtering
  patientId: z.string().uuid().optional(),
  therapistId: z.string().uuid().optional(),
  consultationRequestId: z.string().uuid().optional(),
  paymentPlanId: z.string().uuid().optional(),
  paymentMethod: z.enum(['CREDIT_CARD', 'BANK_TRANSFER', 'CASH', 'CHECK', 'DEBIT_CARD', 'PAYPAL', 'STRIPE']).optional(),
  paymentType: z.enum(['CONSULTATION', 'SESSION', 'EVALUATION', 'TREATMENT', 'PLAN_INSTALLMENT', 'REFUND']).optional(),
  status: z.enum(['PENDING', 'COMPLETED', 'FAILED', 'CANCELLED', 'REFUNDED', 'PARTIALLY_REFUNDED']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  minAmount: z.string().optional().transform(val => val ? parseFloat(val) : undefined),
  maxAmount: z.string().optional().transform(val => val ? parseFloat(val) : undefined),
  searchTerm: z.string().optional(),
  
  // Sorting
  sortField: z.enum(['date', 'amount', 'status', 'method', 'type']).optional(),
  sortDirection: z.enum(['asc', 'desc']).optional()
})

// POST - Create a new payment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate request body
    const validationResult = createPaymentSchema.safeParse(body)
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
    
    const { 
      patientId, 
      therapistId, 
      consultationRequestId, 
      paymentPlanId, 
      amount, 
      paymentMethod, 
      paymentType, 
      description, 
      reference, 
      metadata, 
      dueDate, 
      autoProcess 
    } = validationResult.data
    
    // Create payment request
    const paymentRequest: PaymentRequest = {
      patientId,
      therapistId,
      consultationRequestId,
      paymentPlanId,
      amount,
      paymentMethod,
      paymentType,
      description,
      reference,
      metadata,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      autoProcess: autoProcess || false
    }
    
    // Create payment
    const payment = await PaymentApiManager.createPayment(paymentRequest)
    
    return NextResponse.json({
      success: true,
      data: payment,
      message: 'Payment created successfully'
    }, { status: 201 })
    
  } catch (error) {
    console.error('Error creating payment:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to create payment' 
      },
      { status: 500 }
    )
  }
}

// GET - Get payments with filtering, sorting, and pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Parse and validate query parameters
    const queryParams = Object.fromEntries(searchParams.entries())
    const validationResult = getPaymentsQuerySchema.safeParse(queryParams)
    
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid query parameters',
          details: validationResult.error.flatten().fieldErrors
        },
        { status: 400 }
      )
    }
    
    const {
      page,
      limit,
      patientId,
      therapistId,
      consultationRequestId,
      paymentPlanId,
      paymentMethod,
      paymentType,
      status,
      startDate,
      endDate,
      minAmount,
      maxAmount,
      searchTerm,
      sortField,
      sortDirection
    } = validationResult.data
    
    // Build where clause
    const whereClause: any = {}
    
    if (patientId) whereClause.patientId = patientId
    if (therapistId) whereClause.therapistId = therapistId
    if (consultationRequestId) whereClause.consultationRequestId = consultationRequestId
    if (paymentPlanId) whereClause.paymentPlanId = paymentPlanId
    if (paymentMethod) whereClause.paymentMethod = paymentMethod
    if (paymentType) whereClause.paymentType = paymentType
    if (status) whereClause.status = status
    
    if (startDate || endDate) {
      if (!startDate || !endDate) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Both start date and end date are required for date filtering' 
          },
          { status: 400 }
        )
      }
      
      whereClause.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    }
    
    if (minAmount !== undefined || maxAmount !== undefined) {
      whereClause.amount = {
        gte: minAmount || 0,
        lte: maxAmount || Number.MAX_SAFE_INTEGER
      }
    }
    
    if (searchTerm) {
      whereClause.OR = [
        { description: { contains: searchTerm, mode: 'insensitive' } },
        { reference: { contains: searchTerm, mode: 'insensitive' } },
        { transactionId: { contains: searchTerm, mode: 'insensitive' } }
      ]
    }
    
    // Build order by clause
    const orderBy: any = {}
    if (sortField) {
      switch (sortField) {
        case 'date':
          orderBy.createdAt = sortDirection || 'desc'
          break
        case 'amount':
          orderBy.amount = sortDirection || 'desc'
          break
        case 'status':
          orderBy.status = sortDirection || 'asc'
          break
        case 'method':
          orderBy.paymentMethod = sortDirection || 'asc'
          break
        case 'type':
          orderBy.paymentType = sortDirection || 'asc'
          break
      }
    } else {
      orderBy.createdAt = 'desc' // Default sort by date descending
    }
    
    // Calculate pagination
    const offset = (page - 1) * limit
    
    // Fetch payments
    const [payments, totalCount] = await Promise.all([
      db.payment.findMany({
        where: whereClause,
        include: {
          patient: {
            select: {
              firstName: true,
              lastName: true,
              dateOfBirth: true
            }
          },
          therapist: {
            select: {
              firstName: true,
              lastName: true,
              user: {
                select: {
                  name: true
                }
              }
            }
          },
          consultationRequest: {
            select: {
              id: true,
              reason: true,
              urgency: true
            }
          },
          paymentPlan: {
            select: {
              id: true,
              planName: true,
              totalAmount: true
            }
          }
        },
        orderBy,
        skip: offset,
        take: limit
      }),
      db.payment.count({ where: whereClause })
    ])
    
    const totalPages = Math.ceil(totalCount / limit)
    
    return NextResponse.json({
      success: true,
      data: {
        payments,
        totalCount,
        pagination: {
          page,
          limit,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      }
    })
    
  } catch (error) {
    console.error('Error getting payments:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to get payments' 
      },
      { status: 500 }
    )
  }
}