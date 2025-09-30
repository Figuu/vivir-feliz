import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { PaymentStatus } from '@prisma/client'

// GET - Get overdue payments
export async function GET(request: NextRequest) {
  try {
    const now = new Date()
    
    // Get payments that are pending or failed and past their due date
    const overduePayments = await db.payment.findMany({
      where: {
        status: {
          in: [PaymentStatus.PENDING, PaymentStatus.FAILED]
        },
        dueDate: {
          lt: now
        }
      },
      include: {
        parent: {
          select: {
            id: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        },
        paymentPlan: {
          select: {
            id: true,
            name: true,
            planType: true
          }
        }
      },
      orderBy: {
        dueDate: 'asc'
      }
    })
    
    return NextResponse.json({
      success: true,
      data: overduePayments.map(payment => ({
        id: payment.id,
        amount: payment.amount.toNumber(),
        status: payment.status,
        dueDate: payment.dueDate,
        paymentMethod: payment.paymentMethod,
        parent: payment.parent ? {
          id: payment.parent.id,
          name: `${payment.parent.profile.firstName} ${payment.parent.profile.lastName}`,
          email: payment.parent.profile.email
        } : null,
        paymentPlan: payment.paymentPlan,
        createdAt: payment.createdAt
      }))
    })
    
  } catch (error) {
    console.error('Error getting overdue payments:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to get overdue payments' 
      },
      { status: 500 }
    )
  }
}


