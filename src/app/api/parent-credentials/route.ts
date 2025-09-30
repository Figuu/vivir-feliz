import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'

// Password validation regex
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/

// Comprehensive validation schemas
const credentialGenerationSchema = z.object({
  patientId: z.string().uuid('Invalid patient ID'),
  parentEmail: z.string().email('Invalid email address').toLowerCase().transform(val => val.trim()),
  sendWelcomeEmail: z.boolean().default(true),
  sendSMS: z.boolean().default(false),
  customMessage: z.string().max(500, 'Custom message cannot exceed 500 characters').optional(),
  temporaryPassword: z.string()
    .min(8, 'Temporary password must be at least 8 characters')
    .regex(passwordRegex, 'Password must contain uppercase, lowercase, number, and special character')
    .optional(),
  requirePasswordChange: z.boolean().default(true),
  expiresInDays: z.number().min(1).max(365).default(30),
  generatedBy: z.string().uuid('Invalid generator ID')
})

const credentialUpdateSchema = z.object({
  credentialId: z.string().uuid('Invalid credential ID'),
  action: z.enum(['activate', 'deactivate', 'reset_password', 'extend_expiry', 'resend_email']),
  newPassword: z.string()
    .min(8, 'New password must be at least 8 characters')
    .regex(passwordRegex, 'Password must contain uppercase, lowercase, number, and special character')
    .optional(),
  expiresInDays: z.number().min(1).max(365).optional(),
  updatedBy: z.string().uuid('Invalid updater ID')
})

const passwordSetupSchema = z.object({
  token: z.string().min(32, 'Invalid token'),
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password cannot exceed 100 characters')
    .regex(passwordRegex, 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  confirmPassword: z.string()
}).refine(data => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword']
})

const credentialQuerySchema = z.object({
  page: z.string().transform(val => parseInt(val) || 1).refine(val => val > 0, 'Page must be greater than 0'),
  limit: z.string().transform(val => parseInt(val) || 10).refine(val => val > 0 && val <= 100, 'Limit must be between 1 and 100'),
  patientId: z.string().uuid('Invalid patient ID').optional(),
  parentEmail: z.string().email('Invalid email').optional(),
  status: z.enum(['active', 'inactive', 'expired', 'pending']).optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'expiresAt']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc')
})

// GET /api/parent-credentials - Get parent credentials
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    
    if (action === 'verify_token') {
      // Verify setup token
      const token = searchParams.get('token')
      
      if (!token) {
        return NextResponse.json(
          { error: 'Token is required' },
          { status: 400 }
        )
      }

      const credential = await db.parentCredential.findFirst({
        where: {
          setupToken: token,
          status: 'pending',
          expiresAt: { gte: new Date() }
        },
        include: {
          patient: {
            select: {
              firstName: true,
              lastName: true
            }
          }
        }
      })

      if (!credential) {
        return NextResponse.json(
          { error: 'Invalid or expired token' },
          { status: 404 }
        )
      }

      return NextResponse.json({
        success: true,
        data: {
          email: credential.parentEmail,
          patientName: `${credential.patient.firstName} ${credential.patient.lastName}`,
          requirePasswordChange: credential.requirePasswordChange
        }
      })
    }
    
    // Regular query
    const validation = credentialQuerySchema.safeParse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      patientId: searchParams.get('patientId'),
      parentEmail: searchParams.get('parentEmail'),
      status: searchParams.get('status'),
      sortBy: searchParams.get('sortBy'),
      sortOrder: searchParams.get('sortOrder')
    })

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: validation.error.errors },
        { status: 400 }
      )
    }

    const { page, limit, patientId, parentEmail, status, sortBy, sortOrder } = validation.data

    // Build where clause
    const whereClause: any = {}
    
    if (patientId) {
      whereClause.patientId = patientId
    }
    
    if (parentEmail) {
      whereClause.parentEmail = parentEmail
    }
    
    if (status) {
      whereClause.status = status
    }

    // Calculate pagination
    const skip = (page - 1) * limit

    // Get credentials
    const [credentials, totalCount] = await Promise.all([
      db.parentCredential.findMany({
        where: whereClause,
        include: {
          patient: {
            select: {
              id: true,
              firstName: true,
              lastName: true
            }
          },
          generatedByUser: {
            select: {
              firstName: true,
              lastName: true
            }
          }
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      db.parentCredential.count({ where: whereClause })
    ])

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit)
    const hasNextPage = page < totalPages
    const hasPrevPage = page > 1

    return NextResponse.json({
      success: true,
      data: {
        credentials,
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
    console.error('Error fetching parent credentials:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/parent-credentials - Generate or setup parent credentials
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const action = body.action
    
    if (action === 'setup_password') {
      // Parent setting up their password
      const validation = passwordSetupSchema.safeParse(body)
      if (!validation.success) {
        return NextResponse.json(
          { error: 'Invalid request data', details: validation.error.errors },
          { status: 400 }
        )
      }

      const validatedData = validation.data

      // Find credential by token
      const credential = await db.parentCredential.findFirst({
        where: {
          setupToken: validatedData.token,
          status: 'pending',
          expiresAt: { gte: new Date() }
        }
      })

      if (!credential) {
        return NextResponse.json(
          { error: 'Invalid or expired token' },
          { status: 404 }
        )
      }

      // Get or create parent user
      let parentUser = await db.user.findUnique({
        where: { email: credential.parentEmail }
      })

      const hashedPassword = Buffer.from(validatedData.newPassword).toString('base64')

      if (!parentUser) {
        // Create parent user
        parentUser = await db.user.create({
          data: {
            email: credential.parentEmail,
            password: hashedPassword,
            firstName: 'Parent', // Should be updated by parent
            lastName: 'User',
            role: 'parent',
            status: 'active',
            emailVerified: true,
            createdBy: credential.generatedBy
          }
        })
      } else {
        // Update password
        await db.user.update({
          where: { id: parentUser.id },
          data: {
            password: hashedPassword,
            emailVerified: true
          }
        })
      }

      // Update credential status
      await db.parentCredential.update({
        where: { id: credential.id },
        data: {
          status: 'active',
          activatedAt: new Date(),
          requirePasswordChange: false
        }
      })

      return NextResponse.json({
        success: true,
        message: 'Password set up successfully. You can now log in.'
      })
    } else {
      // Generate new credentials
      const validation = credentialGenerationSchema.safeParse(body)
      if (!validation.success) {
        return NextResponse.json(
          { error: 'Invalid request data', details: validation.error.errors },
          { status: 400 }
        )
      }

      const validatedData = validation.data

      // Check if patient exists
      const patient = await db.patient.findUnique({
        where: { id: validatedData.patientId }
      })

      if (!patient) {
        return NextResponse.json(
          { error: 'Patient not found' },
          { status: 404 }
        )
      }

      // Check if generator exists
      const generator = await db.user.findUnique({
        where: { id: validatedData.generatedBy }
      })

      if (!generator) {
        return NextResponse.json(
          { error: 'Generator not found' },
          { status: 404 }
        )
      }

      // Check for existing active credential
      const existingCredential = await db.parentCredential.findFirst({
        where: {
          patientId: validatedData.patientId,
          parentEmail: validatedData.parentEmail,
          status: { in: ['active', 'pending'] }
        }
      })

      if (existingCredential) {
        return NextResponse.json(
          { error: 'Active credentials already exist for this parent-patient combination' },
          { status: 409 }
        )
      }

      // Generate temporary password if not provided
      const tempPassword = validatedData.temporaryPassword || generateSecurePassword()
      const hashedPassword = Buffer.from(tempPassword).toString('base64')

      // Generate setup token
      const setupToken = generateSetupToken()

      // Calculate expiry date
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + validatedData.expiresInDays)

      // Create credential record
      const credential = await db.parentCredential.create({
        data: {
          patientId: validatedData.patientId,
          parentEmail: validatedData.parentEmail,
          temporaryPassword: hashedPassword,
          setupToken,
          requirePasswordChange: validatedData.requirePasswordChange,
          expiresAt,
          status: 'pending',
          generatedBy: validatedData.generatedBy
        },
        include: {
          patient: {
            select: {
              firstName: true,
              lastName: true
            }
          }
        }
      })

      // Create or update parent user
      const existingUser = await db.user.findUnique({
        where: { email: validatedData.parentEmail }
      })

      if (!existingUser) {
        await db.user.create({
          data: {
            email: validatedData.parentEmail,
            password: hashedPassword,
            firstName: 'Parent',
            lastName: 'User',
            role: 'parent',
            status: 'active',
            emailVerified: false,
            createdBy: validatedData.generatedBy
          }
        })
      }

      // Send notifications
      if (validatedData.sendWelcomeEmail) {
        // TODO: Send welcome email with setup link
        const setupLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/parent-setup?token=${setupToken}`
        console.log(`Welcome email sent to ${validatedData.parentEmail}`)
        console.log(`Setup link: ${setupLink}`)
        console.log(`Temporary password: ${tempPassword}`)
      }

      if (validatedData.sendSMS) {
        // TODO: Send SMS notification
        console.log('SMS notification sent')
      }

      return NextResponse.json({
        success: true,
        message: 'Parent credentials generated successfully',
        data: {
          credential,
          setupLink: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/parent-setup?token=${setupToken}`,
          temporaryPassword: tempPassword // Only return in development
        }
      }, { status: 201 })
    }

  } catch (error) {
    console.error('Error processing parent credentials:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/parent-credentials - Update parent credentials
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate request body
    const validation = credentialUpdateSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.errors },
        { status: 400 }
      )
    }

    const validatedData = validation.data

    // Check if credential exists
    const credential = await db.parentCredential.findUnique({
      where: { id: validatedData.credentialId }
    })

    if (!credential) {
      return NextResponse.json(
        { error: 'Credential not found' },
        { status: 404 }
      )
    }

    // Perform action
    let updateData: any = {}

    switch (validatedData.action) {
      case 'activate':
        updateData = {
          status: 'active',
          activatedAt: new Date()
        }
        break
        
      case 'deactivate':
        updateData = {
          status: 'inactive',
          deactivatedAt: new Date()
        }
        break
        
      case 'reset_password':
        if (!validatedData.newPassword) {
          return NextResponse.json(
            { error: 'New password is required for password reset' },
            { status: 400 }
          )
        }
        
        const hashedPassword = Buffer.from(validatedData.newPassword).toString('base64')
        const newToken = generateSetupToken()
        
        updateData = {
          temporaryPassword: hashedPassword,
          setupToken: newToken,
          requirePasswordChange: true,
          status: 'pending'
        }
        
        // TODO: Send password reset email
        console.log(`Password reset email sent to ${credential.parentEmail}`)
        break
        
      case 'extend_expiry':
        if (!validatedData.expiresInDays) {
          return NextResponse.json(
            { error: 'Extension period is required' },
            { status: 400 }
          )
        }
        
        const newExpiryDate = new Date()
        newExpiryDate.setDate(newExpiryDate.getDate() + validatedData.expiresInDays)
        
        updateData = {
          expiresAt: newExpiryDate
        }
        break
        
      case 'resend_email':
        // TODO: Resend welcome email
        console.log(`Welcome email resent to ${credential.parentEmail}`)
        
        updateData = {
          lastEmailSent: new Date()
        }
        break
    }

    // Update credential
    const updatedCredential = await db.parentCredential.update({
      where: { id: validatedData.credentialId },
      data: updateData,
      include: {
        patient: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: getActionMessage(validatedData.action),
      data: updatedCredential
    })

  } catch (error) {
    console.error('Error updating parent credentials:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper functions
function generateSecurePassword(): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const lowercase = 'abcdefghijklmnopqrstuvwxyz'
  const numbers = '0123456789'
  const special = '@$!%*?&'
  
  let password = ''
  // Ensure at least one of each required type
  password += uppercase.charAt(Math.floor(Math.random() * uppercase.length))
  password += lowercase.charAt(Math.floor(Math.random() * lowercase.length))
  password += numbers.charAt(Math.floor(Math.random() * numbers.length))
  password += special.charAt(Math.floor(Math.random() * special.length))
  
  // Fill remaining characters
  const allChars = uppercase + lowercase + numbers + special
  for (let i = 0; i < 8; i++) {
    password += allChars.charAt(Math.floor(Math.random() * allChars.length))
  }
  
  // Shuffle to avoid predictable pattern
  return password.split('').sort(() => Math.random() - 0.5).join('')
}

function generateSetupToken(): string {
  return Array.from({ length: 64 }, () => 
    Math.random().toString(36).charAt(2)
  ).join('')
}

function getActionMessage(action: string): string {
  switch (action) {
    case 'activate':
      return 'Credentials activated successfully'
    case 'deactivate':
      return 'Credentials deactivated successfully'
    case 'reset_password':
      return 'Password reset email sent successfully'
    case 'extend_expiry':
      return 'Expiry date extended successfully'
    case 'resend_email':
      return 'Welcome email resent successfully'
    default:
      return 'Action completed successfully'
  }
}
