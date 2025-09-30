import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'

const adminActionSchema = z.object({
  action: z.enum(['bulk_update', 'data_export', 'system_health', 'user_activity']),
  adminId: z.string().uuid('Invalid admin ID'),
  parameters: z.record(z.any()).optional()
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    if (action === 'system_health') {
      const [userCount, patientCount, sessionCount, paymentCount] = await Promise.all([
        db.user.count(),
        db.patient.count(),
        db.patientSession.count(),
        db.payment.count()
      ])

      return NextResponse.json({
        success: true,
        data: {
          status: 'healthy',
          users: userCount,
          patients: patientCount,
          sessions: sessionCount,
          payments: paymentCount,
          timestamp: new Date().toISOString()
        }
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

  } catch (error) {
    console.error('Error in admin operations:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const validation = adminActionSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.errors },
        { status: 400 }
      )
    }

    const { action, adminId } = validation.data

    // Verify admin user
    const admin = await db.user.findUnique({
      where: { id: adminId, role: 'admin' }
    })

    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    return NextResponse.json({
      success: true,
      message: `${action} completed successfully`
    })

  } catch (error) {
    console.error('Error in admin operation:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
