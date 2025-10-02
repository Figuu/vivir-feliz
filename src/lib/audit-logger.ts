import { db } from '@/lib/db'

export interface AuditLogData {
  action: string
  resource: string
  resourceId?: string
  userId?: string
  oldValue?: any
  newValue?: any
  ipAddress?: string
  userAgent?: string
  success?: boolean
  errorMessage?: string
  metadata?: any
  category?: string
  endpoint?: string
  method?: string
}

export async function auditLog(data: AuditLogData): Promise<void> {
  try {
    await db.auditLog.create({
      data: {
        profileId: data.userId,
        action: data.action,
        resource: data.resource,
        resourceId: data.resourceId,
        oldValue: data.oldValue,
        newValue: data.newValue,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        success: data.success ?? true,
        errorMessage: data.errorMessage,
        metadata: data.metadata,
        category: data.category
      }
    })
  } catch (error) {
    console.error('Failed to create audit log:', error)
    // Don't throw error to avoid breaking the main operation
  }
}

export async function getAuditLogs(filters: {
  userId?: string
  resource?: string
  action?: string
  startDate?: Date
  endDate?: Date
  page?: number
  limit?: number
}) {
  const where: any = {}
  
  if (filters.userId) where.profileId = filters.userId
  if (filters.resource) where.resource = filters.resource
  if (filters.action) where.action = filters.action
  
  if (filters.startDate || filters.endDate) {
    where.createdAt = {}
    if (filters.startDate) where.createdAt.gte = filters.startDate
    if (filters.endDate) where.createdAt.lte = filters.endDate
  }
  
  const page = filters.page || 1
  const limit = filters.limit || 20
  const skip = (page - 1) * limit
  
  const [logs, totalCount] = await Promise.all([
    db.auditLog.findMany({
      where,
      include: {
        profile: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    }),
    db.auditLog.count({ where })
  ])
  
  return {
    logs,
    totalCount,
    page,
    limit,
    totalPages: Math.ceil(totalCount / limit)
  }
}