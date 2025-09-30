import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

const userQuerySchema = z.object({
  role: z.string().optional(),
  status: z.enum(['active', 'inactive', 'suspended']).optional(),
  search: z.string().optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional()
})

const createUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  role: z.enum(['USER', 'ADMIN', 'THERAPIST', 'COORDINATOR', 'PARENT', 'SUPER_ADMIN']),
  phone: z.string().optional(),
  status: z.enum(['active', 'inactive', 'suspended']).default('active')
})

const updateUserSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  email: z.string().email('Invalid email address').optional(),
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  role: z.enum(['USER', 'ADMIN', 'THERAPIST', 'COORDINATOR', 'PARENT', 'SUPER_ADMIN']).optional(),
  phone: z.string().optional(),
  status: z.enum(['active', 'inactive', 'suspended']).optional(),
  password: z.string().min(8).optional()
})

const bulkActionSchema = z.object({
  userIds: z.array(z.string().uuid()).min(1, 'At least one user ID required'),
  action: z.enum(['activate', 'deactivate', 'suspend', 'delete', 'change_role']),
  newRole: z.enum(['USER', 'ADMIN', 'THERAPIST', 'COORDINATOR', 'PARENT', 'SUPER_ADMIN']).optional()
})

// GET - List users with advanced filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const validation = userQuerySchema.safeParse({
      role: searchParams.get('role'),
      status: searchParams.get('status'),
      search: searchParams.get('search'),
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      sortBy: searchParams.get('sortBy'),
      sortOrder: searchParams.get('sortOrder')
    })

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid parameters', details: validation.error.errors },
        { status: 400 }
      )
    }

    const { role, status, search, sortBy, sortOrder } = validation.data
    const page = parseInt(validation.data.page || '1')
    const limit = parseInt(validation.data.limit || '50')
    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}
    
    if (role) {
      where.role = role
    }
    
    if (status) {
      where.status = status
    }
    
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Fetch users
    const [users, totalCount, roleDistribution, statusDistribution] = await Promise.all([
      db.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          status: true,
          phone: true,
          lastLogin: true,
          createdAt: true,
          updatedAt: true
        },
        orderBy: sortBy ? { [sortBy]: sortOrder || 'asc' } : { createdAt: 'desc' },
        skip,
        take: limit
      }),
      db.user.count({ where }),
      db.user.groupBy({
        by: ['role'],
        _count: true
      }),
      db.user.groupBy({
        by: ['status'],
        _count: true
      })
    ])

    return NextResponse.json({
      success: true,
      data: {
        users,
        pagination: {
          total: totalCount,
          page,
          limit,
          pages: Math.ceil(totalCount / limit)
        },
        statistics: {
          byRole: roleDistribution.map(r => ({ role: r.role, count: r._count })),
          byStatus: statusDistribution.map(s => ({ status: s.status, count: s._count })),
          totalUsers: totalCount
        }
      }
    })

  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create new user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const action = body.action

    if (action === 'bulk') {
      // Handle bulk actions
      const validation = bulkActionSchema.safeParse(body)
      if (!validation.success) {
        return NextResponse.json(
          { error: 'Invalid request data', details: validation.error.errors },
          { status: 400 }
        )
      }

      const { userIds, action: bulkAction, newRole } = validation.data

      let updateData: any = {}
      
      switch (bulkAction) {
        case 'activate':
          updateData = { status: 'active' }
          break
        case 'deactivate':
          updateData = { status: 'inactive' }
          break
        case 'suspend':
          updateData = { status: 'suspended' }
          break
        case 'delete':
          await db.user.updateMany({
            where: { id: { in: userIds } },
            data: { status: 'inactive', deletedAt: new Date() }
          })
          return NextResponse.json({
            success: true,
            message: `${userIds.length} users deleted successfully`
          })
        case 'change_role':
          if (!newRole) {
            return NextResponse.json(
              { error: 'New role is required for role change' },
              { status: 400 }
            )
          }
          updateData = { role: newRole }
          break
      }

      await db.user.updateMany({
        where: { id: { in: userIds } },
        data: updateData
      })

      return NextResponse.json({
        success: true,
        message: `Bulk action ${bulkAction} completed for ${userIds.length} users`
      })
    } else {
      // Handle single user creation
      const validation = createUserSchema.safeParse(body)
      if (!validation.success) {
        return NextResponse.json(
          { error: 'Invalid request data', details: validation.error.errors },
          { status: 400 }
        )
      }

      const data = validation.data

      // Check if email already exists
      const existingUser = await db.user.findUnique({
        where: { email: data.email }
      })

      if (existingUser) {
        return NextResponse.json(
          { error: 'Email already in use' },
          { status: 409 }
        )
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(data.password, 10)

      // Create user
      const user = await db.user.create({
        data: {
          email: data.email,
          password: hashedPassword,
          firstName: data.firstName,
          lastName: data.lastName,
          role: data.role,
          phone: data.phone,
          status: data.status
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          status: true,
          createdAt: true
        }
      })

      return NextResponse.json({
        success: true,
        message: 'User created successfully',
        data: user
      }, { status: 201 })
    }

  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT - Update user
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    
    const validation = updateUserSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.errors },
        { status: 400 }
      )
    }

    const { userId, password, ...updateData } = validation.data

    // Check if user exists
    const existingUser = await db.user.findUnique({
      where: { id: userId }
    })

    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // If email is being updated, check for duplicates
    if (updateData.email && updateData.email !== existingUser.email) {
      const emailExists = await db.user.findUnique({
        where: { email: updateData.email }
      })

      if (emailExists) {
        return NextResponse.json(
          { error: 'Email already in use' },
          { status: 409 }
        )
      }
    }

    // If password is being updated, hash it
    const finalUpdateData: any = { ...updateData }
    if (password) {
      finalUpdateData.password = await bcrypt.hash(password, 10)
    }

    // Update user
    const updatedUser = await db.user.update({
      where: { id: userId },
      data: finalUpdateData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        phone: true,
        updatedAt: true
      }
    })

    return NextResponse.json({
      success: true,
      message: 'User updated successfully',
      data: updatedUser
    })

  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Soft delete user
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Check if user exists
    const user = await db.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Soft delete (deactivate)
    await db.user.update({
      where: { id: userId },
      data: {
        status: 'inactive',
        deletedAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
