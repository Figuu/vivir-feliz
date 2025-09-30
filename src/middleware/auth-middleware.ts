/**
 * Authentication and Authorization Middleware
 * Provides centralized auth checks for API routes
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { hasPermission, Permission, PERMISSIONS } from '@/lib/permissions'

export interface AuthUser {
  id: string
  email: string
  role: string
}

export interface AuthMiddlewareOptions {
  requiredPermissions?: Permission[]
  allowedRoles?: string[]
  requireAuth?: boolean
}

/**
 * Verify user authentication
 * Returns authenticated user or null
 */
export async function verifyAuth(request: NextRequest): Promise<{ user: AuthUser | null; response?: NextResponse }> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return { user: null }
    }

    // Get user from database to include role
    const dbUser = await db.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        role: true,
        status: true
      }
    })

    if (!dbUser) {
      return { user: null }
    }

    // Check if user is active
    if (dbUser.status !== 'active') {
      return {
        user: null,
        response: NextResponse.json(
          { error: 'Account is not active' },
          { status: 403 }
        )
      }
    }

    return {
      user: {
        id: dbUser.id,
        email: dbUser.email,
        role: dbUser.role
      }
    }
  } catch (error) {
    console.error('Auth verification error:', error)
    return { user: null }
  }
}

/**
 * Check if user has required permissions
 */
export function checkPermissions(
  userRole: string,
  requiredPermissions: Permission[]
): { authorized: boolean; missingPermissions: Permission[] } {
  const missingPermissions = requiredPermissions.filter(
    permission => !hasPermission(userRole, permission)
  )

  return {
    authorized: missingPermissions.length === 0,
    missingPermissions
  }
}

/**
 * Check if user has allowed role
 */
export function checkRole(userRole: string, allowedRoles: string[]): boolean {
  return allowedRoles.includes(userRole)
}

/**
 * Apply authentication and authorization middleware
 */
export async function applyAuthMiddleware(
  request: NextRequest,
  options: AuthMiddlewareOptions = {}
): Promise<{ user: AuthUser | null; response?: NextResponse }> {
  const {
    requiredPermissions = [],
    allowedRoles = [],
    requireAuth = true
  } = options

  // Verify authentication
  const { user, response: authResponse } = await verifyAuth(request)

  // If auth is required and user is not authenticated
  if (requireAuth && !user) {
    return {
      user: null,
      response: authResponse || NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
  }

  // If no user but auth is not required, allow
  if (!user && !requireAuth) {
    return { user: null }
  }

  // Check role-based access
  if (user && allowedRoles.length > 0) {
    if (!checkRole(user.role, allowedRoles)) {
      return {
        user: null,
        response: NextResponse.json(
          { error: 'Insufficient permissions - role not allowed' },
          { status: 403 }
        )
      }
    }
  }

  // Check permission-based access
  if (user && requiredPermissions.length > 0) {
    const { authorized, missingPermissions } = checkPermissions(
      user.role,
      requiredPermissions
    )

    if (!authorized) {
      return {
        user: null,
        response: NextResponse.json(
          { 
            error: 'Insufficient permissions',
            missing: missingPermissions
          },
          { status: 403 }
        )
      }
    }
  }

  return { user }
}

/**
 * Wrapper for API routes to easily add auth middleware
 */
export function withAuth(
  handler: (request: NextRequest, user: AuthUser) => Promise<NextResponse>,
  options: AuthMiddlewareOptions = {}
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const { user, response } = await applyAuthMiddleware(request, options)

    if (response) {
      return response
    }

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    return handler(request, user)
  }
}

/**
 * Route protection configuration
 */
export const ROUTE_PROTECTION = {
  // Public routes (no auth required)
  public: [
    '/',
    '/login',
    '/signup',
    '/forgot-password',
    '/reset-password'
  ],

  // Role-based route protection
  routes: {
    '/dashboard': ['USER', 'ADMIN', 'THERAPIST', 'COORDINATOR', 'PARENT', 'SUPER_ADMIN'],
    '/admin': ['ADMIN', 'SUPER_ADMIN'],
    '/super-admin': ['SUPER_ADMIN'],
    '/therapist': ['THERAPIST', 'SUPER_ADMIN'],
    '/coordinator': ['COORDINATOR', 'SUPER_ADMIN'],
    '/parent-portal': ['PARENT', 'SUPER_ADMIN']
  },

  // API route protection
  api: {
    '/api/admin': {
      allowedRoles: ['ADMIN', 'SUPER_ADMIN'],
      requiredPermissions: [PERMISSIONS.ADMIN_ACCESS]
    },
    '/api/super-admin': {
      allowedRoles: ['SUPER_ADMIN'],
      requiredPermissions: [PERMISSIONS.SYSTEM_ADMIN]
    },
    '/api/user': {
      requireAuth: true
    },
    '/api/upload': {
      requireAuth: true,
      requiredPermissions: [PERMISSIONS.FILES_UPLOAD]
    }
  }
}

/**
 * Check if a route is public
 */
export function isPublicRoute(pathname: string): boolean {
  return ROUTE_PROTECTION.public.some(route => 
    pathname === route || pathname.startsWith(`${route}/`)
  )
}

/**
 * Get allowed roles for a route
 */
export function getAllowedRoles(pathname: string): string[] | null {
  for (const [route, roles] of Object.entries(ROUTE_PROTECTION.routes)) {
    if (pathname === route || pathname.startsWith(`${route}/`)) {
      return roles
    }
  }
  return null
}
