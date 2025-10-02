import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'

const approvalSchema = z.object({
  requestId: z.string().uuid('Invalid request ID'),
  action: z.enum(['approve', 'reject', 'suggest_alternative']),
  approvedBy: z.string().uuid('Invalid user ID'),
  comments: z.string().max(1000).optional(),
  suggestedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).transform(val => new Date(val)).optional(),
  suggestedTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional()
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const validation = approvalSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.issues },
        { status: 400 }
      )
    }

    const data = validation.data

    // Since there's no reschedulingRequest table, we'll work with sessions directly
    // For now, we'll simulate the approval process
    const session = await db.patientSession.findUnique({
      where: { id: data.requestId },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true
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
            }
          }
        }
      }
    })

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    let updatedSession = null

    if (data.action === 'approve') {
      // Update session with new date/time if provided
      const updateData: any = {
        status: 'RESCHEDULED'
      }

      if (data.suggestedDate) {
        updateData.scheduledDate = data.suggestedDate
      }

      if (data.suggestedTime) {
        updateData.scheduledTime = data.suggestedTime
      }

      updatedSession = await db.patientSession.update({
        where: { id: data.requestId },
        data: updateData,
        include: {
          patient: {
            select: {
              id: true,
              firstName: true,
              lastName: true
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
              }
            }
          }
        }
      })
    } else if (data.action === 'reject') {
      // Mark session as cancelled
      updatedSession = await db.patientSession.update({
        where: { id: data.requestId },
        data: {
          status: 'CANCELLED'
        },
        include: {
          patient: {
            select: {
              id: true,
              firstName: true,
              lastName: true
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
              }
            }
          }
        }
      })
    }

    return NextResponse.json({
      success: true,
      message: `Rescheduling request ${data.action}d successfully`,
      data: {
        session: updatedSession,
        action: data.action,
        approvedBy: data.approvedBy,
        comments: data.comments,
        processedAt: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Error processing approval:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}