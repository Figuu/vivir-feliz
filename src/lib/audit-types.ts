/**
 * Audit Log Types
 * These types are used for audit logging since they don't exist in the Prisma schema
 */

export const AuditAction = {
  // Authentication
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  PASSWORD_CHANGE: 'PASSWORD_CHANGE',
  PASSWORD_RESET: 'PASSWORD_RESET',
  
  // User Management
  USER_CREATE: 'USER_CREATE',
  USER_UPDATE: 'USER_UPDATE',
  USER_DELETE: 'USER_DELETE',
  USER_ROLE_CHANGE: 'USER_ROLE_CHANGE',
  USER_IMPERSONATE: 'USER_IMPERSONATE',
  
  // Data Operations
  CREATE: 'CREATE',
  READ: 'READ',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  
  // Security
  SECURITY_VIOLATION: 'SECURITY_VIOLATION',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  UNAUTHORIZED_ACCESS: 'UNAUTHORIZED_ACCESS',
  
  // System
  SYSTEM_ERROR: 'SYSTEM_ERROR',
  CONFIGURATION_CHANGE: 'CONFIGURATION_CHANGE',
} as const

export type AuditAction = typeof AuditAction[keyof typeof AuditAction]

export const AuditSeverity = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL',
} as const

export type AuditSeverity = typeof AuditSeverity[keyof typeof AuditSeverity]

