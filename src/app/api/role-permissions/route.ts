import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { UserRole } from '@prisma/client'

const rolePermissionSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  role: z.enum(['ADMIN', 'COORDINATOR', 'THERAPIST', 'PARENT', 'PATIENT']),
  permissions: z.array(z.string()),
  updatedBy: z.string().uuid('Invalid updater ID')
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const role = searchParams.get('role')

    if (userId) {
      const user = await db.profile.findUnique({
        where: { id: userId },
        select: { id: true, role: true, email: true, firstName: true, lastName: true }
      })

      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }

      return NextResponse.json({
        success: true,
        data: { user, permissions: getRolePermissions(user.role) }
      })
    }

    if (role) {
      return NextResponse.json({
        success: true,
        data: { role, permissions: getRolePermissions(role) }
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        roles: ['ADMIN', 'COORDINATOR', 'THERAPIST', 'PARENT', 'PATIENT'],
        permissions: {
          ADMIN: getRolePermissions('ADMIN'),
          COORDINATOR: getRolePermissions('COORDINATOR'),
          THERAPIST: getRolePermissions('THERAPIST'),
          PARENT: getRolePermissions('PARENT'),
          PATIENT: getRolePermissions('PATIENT')
        }
      }
    })

  } catch (error) {
    console.error('Error fetching roles:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    
    const validation = rolePermissionSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.issues },
        { status: 400 }
      )
    }

    const { userId, role, updatedBy } = validation.data

    const user = await db.profile.update({
      where: { id: userId },
      data: { role: role as UserRole, updatedAt: new Date() },
      select: { id: true, email: true, firstName: true, lastName: true, role: true }
    })

    return NextResponse.json({
      success: true,
      message: 'User role updated successfully',
      data: user
    })

  } catch (error) {
    console.error('Error updating role:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function getRolePermissions(role: string): string[] {
  const permissions: Record<string, string[]> = {
    ADMIN: ['all'],
    COORDINATOR: ['view_reports', 'approve_reports', 'view_patients', 'view_sessions', 'manage_proposals'],
    THERAPIST: ['view_patients', 'create_reports', 'manage_sessions', 'view_schedule'],
    PARENT: ['view_child_progress', 'view_reports', 'view_schedule', 'make_payments'],
    PATIENT: ['view_own_progress', 'view_own_reports', 'view_own_schedule']
  }
  return permissions[role] || []
}
