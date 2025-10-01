import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'

// Password validation regex
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/

// Comprehensive validation schemas
const userCreateSchema = z.object({
  // Basic Information
  email: z.string()
    .email('Invalid email address')
    .toLowerCase()
    .transform(val => val.trim()),
  
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password cannot exceed 100 characters')
    .regex(passwordRegex, 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  
  firstName: z.string()
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name cannot exceed 50 characters')
    .transform(val => val.trim().split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ')),
  
  lastName: z.string()
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name cannot exceed 50 characters')
    .transform(val => val.trim().split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ')),
  
  // Contact Information
  phone: z.string()
    .regex(/^\+?[\d\s-()]+$/, 'Invalid phone number format')
    .max(20, 'Phone number cannot exceed 20 characters')
    .optional(),
  
  // Role Assignment
  role: z.enum(['admin', 'coordinator', 'therapist', 'parent', 'patient']),
  
  // Additional Information
  dateOfBirth: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date of birth must be in YYYY-MM-DD format')
    .transform(val => new Date(val))
    .optional(),
  
  address: z.string().max(200, 'Address cannot exceed 200 characters').optional(),
  
  emergencyContact: z.object({
    name: z.string().max(100, 'Emergency contact name cannot exceed 100 characters'),
    phone: z.string().max(20, 'Emergency contact phone cannot exceed 20 characters'),
    relationship: z.string().max(50, 'Relationship cannot exceed 50 characters')
  }).optional(),
  
  // Status
  status: z.enum(['active', 'inactive', 'suspended']).default('active'),
  
  emailVerified: z.boolean().default(false),
  
  // Metadata
  notes: z.string().max(1000, 'Notes cannot exceed 1000 characters').optional(),
  
  createdBy: z.string().uuid('Invalid creator ID')
})

const userUpdateSchema = userCreateSchema.partial().extend({
  id: z.string().uuid('Invalid user ID')
}).omit({ password: true })

const userQuerySchema = z.object({
  page: z.string().transform(val => parseInt(val) || 1).refine(val => val > 0, 'Page must be greater than 0'),
  limit: z.string().transform(val => parseInt(val) || 10).refine(val => val > 0 && val <= 100, 'Limit must be between 1 and 100'),
  role: z.enum(['admin', 'coordinator', 'therapist', 'parent', 'patient']).optional(),
  status: z.enum(['active', 'inactive', 'suspended']).optional(),
  search: z.string().max(100, 'Search term cannot exceed 100 characters').optional(),
  emailVerified: z.string().transform(val => val === 'true').optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'firstName', 'lastName', 'email']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc')
})

const passwordUpdateSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  currentPassword: z.string().min(8, 'Current password is required'),
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password cannot exceed 100 characters')
    .regex(passwordRegex, 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  confirmPassword: z.string()
}).refine(data => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword']
})

// GET /api/user-management - Get users
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    
    if (action === 'statistics') {
      // Get user statistics
      const [
        totalUsers,
        activeUsers,
        byRole,
        recentRegistrations
      ] = await Promise.all([
        (db as any).user.count(),
        (db as any).user.count({ where: { status: 'active' } }),
        (db as any).user.groupBy({
          by: ['role'],
          _count: true
        }),
        (db as any).user.count({
          where: {
            createdAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
            }
          }
        })
      ])

      return NextResponse.json({
        success: true,
        data: {
          totalUsers,
          activeUsers,
          byRole: byRole.reduce((acc: any, item: any) => {
            acc[item.role] = item._count
            return acc
          }, {}),
          recentRegistrations
        }
      })
    }
    
    // Regular query
    const validation = userQuerySchema.safeParse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      role: searchParams.get('role'),
      status: searchParams.get('status'),
      search: searchParams.get('search'),
      emailVerified: searchParams.get('emailVerified'),
      sortBy: searchParams.get('sortBy'),
      sortOrder: searchParams.get('sortOrder')
    })

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: validation.error.issues },
        { status: 400 }
      )
    }

    const { page, limit, role, status, search, emailVerified, sortBy, sortOrder } = validation.data

    // Build where clause
    const whereClause: any = {}
    
    if (role) {
      whereClause.role = role
    }
    
    if (status) {
      whereClause.status = status
    }
    
    if (emailVerified !== undefined) {
      whereClause.emailVerified = emailVerified
    }
    
    if (search) {
      whereClause.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Calculate pagination
    const skip = (page - 1) * limit

    // Get users (excluding password)
    const [users, totalCount] = await Promise.all([
      (db as any).user.findMany({
        where: whereClause,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          role: true,
          dateOfBirth: true,
          address: true,
          emergencyContact: true,
          status: true,
          emailVerified: true,
          notes: true,
          createdAt: true,
          updatedAt: true,
          createdBy: true
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      (db as any).user.count({ where: whereClause })
    ])

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit)
    const hasNextPage = page < totalPages
    const hasPrevPage = page > 1

    return NextResponse.json({
      success: true,
      data: {
        users,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages,
          hasNextPage,
          hasPrevPage
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

// POST /api/user-management - Create new user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate request body
    const validation = userCreateSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.issues },
        { status: 400 }
      )
    }

    const validatedData = validation.data

    // Check for duplicate email
    const existingUser = await (db as any).user.findUnique({
      where: { email: validatedData.email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email address is already registered' },
        { status: 409 }
      )
    }

    // Check if creator exists
    const creator = await (db as any).user.findUnique({
      where: { id: validatedData.createdBy }
    })

    if (!creator) {
      return NextResponse.json(
        { error: 'Creator not found' },
        { status: 404 }
      )
    }

    // Validate date of birth if provided
    if (validatedData.dateOfBirth) {
      const today = new Date()
      const age = today.getFullYear() - validatedData.dateOfBirth.getFullYear()
      
      if (age < 0 || age > 150) {
        return NextResponse.json(
          { error: 'Invalid date of birth' },
          { status: 400 }
        )
      }
    }

    // Hash password (in production, use bcrypt)
    const hashedPassword = Buffer.from(validatedData.password).toString('base64')

    // Create user
    const user = await (db as any).user.create({
      data: {
        email: validatedData.email,
        password: hashedPassword,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        phone: validatedData.phone,
        role: validatedData.role,
        dateOfBirth: validatedData.dateOfBirth,
        address: validatedData.address,
        emergencyContact: validatedData.emergencyContact,
        status: validatedData.status,
        emailVerified: validatedData.emailVerified,
        notes: validatedData.notes,
        createdBy: validatedData.createdBy
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        dateOfBirth: true,
        address: true,
        emergencyContact: true,
        status: true,
        emailVerified: true,
        notes: true,
        createdAt: true,
        updatedAt: true
      }
    })

    return NextResponse.json({
      success: true,
      message: 'User created successfully',
      data: user
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/user-management - Update user
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate request body
    const validation = userUpdateSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.issues },
        { status: 400 }
      )
    }

    const validatedData = validation.data

    // Check if user exists
    const existingUser = await (db as any).user.findUnique({
      where: { id: validatedData.id }
    })

    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check for duplicate email if email is being changed
    if (validatedData.email && validatedData.email !== existingUser.email) {
      const duplicateEmail = await db.user.findUnique({
        where: { email: validatedData.email }
      })

      if (duplicateEmail) {
        return NextResponse.json(
          { error: 'Email address is already in use' },
          { status: 409 }
        )
      }
    }

    // Prepare update data
    const updateData: any = {}
    
    if (validatedData.email) updateData.email = validatedData.email
    if (validatedData.firstName) updateData.firstName = validatedData.firstName
    if (validatedData.lastName) updateData.lastName = validatedData.lastName
    if (validatedData.phone !== undefined) updateData.phone = validatedData.phone
    if (validatedData.role) updateData.role = validatedData.role
    if (validatedData.dateOfBirth) updateData.dateOfBirth = validatedData.dateOfBirth
    if (validatedData.address !== undefined) updateData.address = validatedData.address
    if (validatedData.emergencyContact) updateData.emergencyContact = validatedData.emergencyContact
    if (validatedData.status) updateData.status = validatedData.status
    if (validatedData.emailVerified !== undefined) updateData.emailVerified = validatedData.emailVerified
    if (validatedData.notes !== undefined) updateData.notes = validatedData.notes

    // Update user
    const updatedUser = await db.user.update({
      where: { id: validatedData.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        dateOfBirth: true,
        address: true,
        emergencyContact: true,
        status: true,
        emailVerified: true,
        notes: true,
        createdAt: true,
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

// DELETE /api/user-management - Delete user (soft delete)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Check if user exists
    const user = await (db as any).user.findUnique({
      where: { id }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Soft delete by setting status to inactive
    await db.user.update({
      where: { id },
      data: {
        status: 'inactive',
        updatedAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      message: 'User deactivated successfully'
    })

  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH /api/user-management - Update password
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate request body
    const validation = passwordUpdateSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.issues },
        { status: 400 }
      )
    }

    const validatedData = validation.data

    // Get user with password
    const user = await (db as any).user.findUnique({
      where: { id: validatedData.userId },
      select: {
        id: true,
        password: true
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Verify current password (in production, use bcrypt.compare)
    const currentPasswordHash = Buffer.from(validatedData.currentPassword).toString('base64')
    if (user.password !== currentPasswordHash) {
      return NextResponse.json(
        { error: 'Current password is incorrect' },
        { status: 401 }
      )
    }

    // Hash new password
    const newPasswordHash = Buffer.from(validatedData.newPassword).toString('base64')

    // Update password
    await db.user.update({
      where: { id: validatedData.userId },
      data: {
        password: newPasswordHash,
        updatedAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Password updated successfully'
    })

  } catch (error) {
    console.error('Error updating password:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
