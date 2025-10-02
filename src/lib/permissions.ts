export const PERMISSIONS = {
  // Reports
  REPORTS_VIEW: 'reports:view',
  REPORTS_CREATE: 'reports:create',
  REPORTS_EDIT: 'reports:edit',
  REPORTS_DELETE: 'reports:delete',
  
  // Users
  USERS_VIEW: 'users:view',
  USERS_CREATE: 'users:create',
  USERS_EDIT: 'users:edit',
  USERS_DELETE: 'users:delete',
  
  // Patients
  PATIENTS_VIEW: 'patients:view',
  PATIENTS_CREATE: 'patients:create',
  PATIENTS_EDIT: 'patients:edit',
  PATIENTS_DELETE: 'patients:delete',
  
  // Therapists
  THERAPISTS_VIEW: 'therapists:view',
  THERAPISTS_CREATE: 'therapists:create',
  THERAPISTS_EDIT: 'therapists:edit',
  THERAPISTS_DELETE: 'therapists:delete',
  
  // Payments
  PAYMENTS_VIEW: 'payments:view',
  PAYMENTS_CREATE: 'payments:create',
  PAYMENTS_EDIT: 'payments:edit',
  PAYMENTS_DELETE: 'payments:delete',
  
  // Sessions
  SESSIONS_VIEW: 'sessions:view',
  SESSIONS_CREATE: 'sessions:create',
  SESSIONS_EDIT: 'sessions:edit',
  SESSIONS_DELETE: 'sessions:delete',
  
  // Proposals
  PROPOSALS_VIEW: 'proposals:view',
  PROPOSALS_CREATE: 'proposals:create',
  PROPOSALS_EDIT: 'proposals:edit',
  PROPOSALS_DELETE: 'proposals:delete',
  
  // Admin
  ADMIN_VIEW: 'admin:view',
  ADMIN_CREATE: 'admin:create',
  ADMIN_EDIT: 'admin:edit',
  ADMIN_DELETE: 'admin:delete',
  
  // Super Admin
  SUPER_ADMIN_VIEW: 'super_admin:view',
  SUPER_ADMIN_CREATE: 'super_admin:create',
  SUPER_ADMIN_EDIT: 'super_admin:edit',
  SUPER_ADMIN_DELETE: 'super_admin:delete',
  
  // Admin Access
  ADMIN_ACCESS: 'admin:access'
} as const

export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'COORDINATOR' | 'THERAPIST' | 'PARENT'

const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  SUPER_ADMIN: Object.values(PERMISSIONS),
  ADMIN: [
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.REPORTS_CREATE,
    PERMISSIONS.REPORTS_EDIT,
    PERMISSIONS.USERS_VIEW,
    PERMISSIONS.PATIENTS_VIEW,
    PERMISSIONS.PATIENTS_CREATE,
    PERMISSIONS.PATIENTS_EDIT,
    PERMISSIONS.THERAPISTS_VIEW,
    PERMISSIONS.PAYMENTS_VIEW,
    PERMISSIONS.PAYMENTS_CREATE,
    PERMISSIONS.PAYMENTS_EDIT,
    PERMISSIONS.SESSIONS_VIEW,
    PERMISSIONS.SESSIONS_CREATE,
    PERMISSIONS.SESSIONS_EDIT,
    PERMISSIONS.PROPOSALS_VIEW,
    PERMISSIONS.PROPOSALS_CREATE,
    PERMISSIONS.PROPOSALS_EDIT,
    PERMISSIONS.ADMIN_VIEW,
    PERMISSIONS.ADMIN_CREATE,
    PERMISSIONS.ADMIN_EDIT,
    PERMISSIONS.ADMIN_ACCESS
  ],
  COORDINATOR: [
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.REPORTS_CREATE,
    PERMISSIONS.REPORTS_EDIT,
    PERMISSIONS.PATIENTS_VIEW,
    PERMISSIONS.THERAPISTS_VIEW,
    PERMISSIONS.SESSIONS_VIEW,
    PERMISSIONS.SESSIONS_CREATE,
    PERMISSIONS.SESSIONS_EDIT,
    PERMISSIONS.PROPOSALS_VIEW,
    PERMISSIONS.PROPOSALS_CREATE,
    PERMISSIONS.PROPOSALS_EDIT
  ],
  THERAPIST: [
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.REPORTS_CREATE,
    PERMISSIONS.PATIENTS_VIEW,
    PERMISSIONS.SESSIONS_VIEW,
    PERMISSIONS.SESSIONS_CREATE,
    PERMISSIONS.SESSIONS_EDIT,
    PERMISSIONS.PROPOSALS_VIEW,
    PERMISSIONS.PROPOSALS_CREATE
  ],
  PARENT: [
    PERMISSIONS.PATIENTS_VIEW,
    PERMISSIONS.SESSIONS_VIEW,
    PERMISSIONS.PROPOSALS_VIEW
  ]
}

export function hasPermission(userRole: UserRole, permission: string): boolean {
  const rolePermissions = ROLE_PERMISSIONS[userRole] || []
  return rolePermissions.includes(permission)
}

export function getRolePermissions(userRole: UserRole): string[] {
  return ROLE_PERMISSIONS[userRole] || []
}