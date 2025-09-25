// Permission constants
export const PERMISSIONS = {
  // User management
  USERS_READ: 'users:read',
  USERS_WRITE: 'users:write',
  USERS_DELETE: 'users:delete',
  USERS_IMPERSONATE: 'users:impersonate',
  
  // Profile management
  PROFILE_READ_OWN: 'profile:read:own',
  PROFILE_WRITE_OWN: 'profile:write:own',
  PROFILE_READ_ALL: 'profile:read:all',
  PROFILE_WRITE_ALL: 'profile:write:all',
  
  // System administration
  SYSTEM_ADMIN: 'system:admin',
  SYSTEM_CONFIG: 'system:config',
  
  // Analytics and reporting
  ANALYTICS_READ: 'analytics:read',
  ANALYTICS_EXPORT: 'analytics:export',
  REPORTS_VIEW: 'reports:view',
  ADMIN_ACCESS: 'admin:access',
  
  // File management
  FILES_UPLOAD: 'files:upload',
  FILES_DELETE: 'files:delete',
  FILES_READ: 'files:read',
  
  // Audit logging
  AUDIT_LOGS_VIEW: 'audit:logs:view',
  AUDIT_LOGS_EXPORT: 'audit:logs:export',
  AUDIT_LOGS_MANAGE: 'audit:logs:manage',
} as const

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS]

// Role definitions with their permissions
export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  USER: [
    PERMISSIONS.PROFILE_READ_OWN,
    PERMISSIONS.PROFILE_WRITE_OWN,
    PERMISSIONS.FILES_UPLOAD,
    PERMISSIONS.FILES_READ,
  ],
  ADMIN: [
    // All user permissions
    PERMISSIONS.PROFILE_READ_OWN,
    PERMISSIONS.PROFILE_WRITE_OWN,
    PERMISSIONS.FILES_UPLOAD,
    PERMISSIONS.FILES_READ,
    // Plus admin permissions
    PERMISSIONS.USERS_READ,
    PERMISSIONS.USERS_WRITE,
    PERMISSIONS.PROFILE_READ_ALL,
    PERMISSIONS.ANALYTICS_READ,
    PERMISSIONS.ANALYTICS_EXPORT,
    PERMISSIONS.FILES_DELETE,
  ],
  SUPER_ADMIN: [
    // All permissions
    ...Object.values(PERMISSIONS),
  ],
}

// Initialize USER permissions properly
ROLE_PERMISSIONS.USER = [
  PERMISSIONS.PROFILE_READ_OWN,
  PERMISSIONS.PROFILE_WRITE_OWN,
  PERMISSIONS.FILES_UPLOAD,
  PERMISSIONS.FILES_READ,
]

ROLE_PERMISSIONS.ADMIN = [
  ...ROLE_PERMISSIONS.USER,
  PERMISSIONS.USERS_READ,
  PERMISSIONS.USERS_WRITE,
  PERMISSIONS.PROFILE_READ_ALL,
  PERMISSIONS.ANALYTICS_READ,
  PERMISSIONS.ANALYTICS_EXPORT,
  PERMISSIONS.REPORTS_VIEW,
  PERMISSIONS.ADMIN_ACCESS,
  PERMISSIONS.FILES_DELETE,
  PERMISSIONS.AUDIT_LOGS_VIEW,
  PERMISSIONS.AUDIT_LOGS_EXPORT,
]

/**
 * Check if a user role has a specific permission
 */
export function hasPermission(userRole: string, permission: Permission): boolean {
  const rolePermissions = ROLE_PERMISSIONS[userRole] || []
  return rolePermissions.includes(permission)
}

/**
 * Check if a user role has any of the specified permissions
 */
export function hasAnyPermission(userRole: string, permissions: Permission[]): boolean {
  return permissions.some(permission => hasPermission(userRole, permission))
}

/**
 * Check if a user role has all of the specified permissions
 */
export function hasAllPermissions(userRole: string, permissions: Permission[]): boolean {
  return permissions.every(permission => hasPermission(userRole, permission))
}

/**
 * Get all permissions for a user role
 */
export function getRolePermissions(userRole: string): Permission[] {
  return ROLE_PERMISSIONS[userRole] || []
}

/**
 * Check if a user can perform an action on a resource
 */
export function canPerformAction(
  userRole: string,
  permission: Permission,
  resourceOwnerId?: string,
  userId?: string
): boolean {
  // Super admins can do everything
  if (userRole === 'SUPER_ADMIN') {
    return true
  }

  // Check if user has the general permission
  if (hasPermission(userRole, permission)) {
    return true
  }

  // For own resources, check if user has "own" permission
  if (resourceOwnerId && userId && resourceOwnerId === userId) {
    const ownPermission = permission.replace(':all', ':own') as Permission
    return hasPermission(userRole, ownPermission)
  }

  return false
}

/**
 * Middleware helper to check permissions
 */
export function createPermissionChecker(requiredPermissions: Permission[]) {
  return (userRole: string, userId?: string, resourceOwnerId?: string) => {
    // Super admins bypass all checks
    if (userRole === 'SUPER_ADMIN') {
      return true
    }

    return requiredPermissions.some(permission => 
      canPerformAction(userRole, permission, resourceOwnerId, userId)
    )
  }
}

/**
 * Role hierarchy - higher roles inherit lower role permissions
 */
export const ROLE_HIERARCHY = {
  USER: 0,
  ADMIN: 1,
  SUPER_ADMIN: 2,
} as const

export function isHigherRole(userRole: string, targetRole: string): boolean {
  const userLevel = ROLE_HIERARCHY[userRole as keyof typeof ROLE_HIERARCHY] ?? -1
  const targetLevel = ROLE_HIERARCHY[targetRole as keyof typeof ROLE_HIERARCHY] ?? -1
  return userLevel > targetLevel
}

export function canManageUser(managerRole: string, targetRole: string): boolean {
  // Super admins can manage anyone
  if (managerRole === 'SUPER_ADMIN') {
    return true
  }
  
  // Admins can manage users but not other admins or super admins
  if (managerRole === 'ADMIN' && targetRole === 'USER') {
    return true
  }
  
  return false
}