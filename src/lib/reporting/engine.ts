import { db } from '@/lib/db'
import { UserRole } from '@prisma/client'

// Report types and configurations
export interface ReportConfig {
  id: string
  name: string
  description: string
  dataSource: string
  query: ReportQuery
  visualizations: VisualizationConfig[]
  filters?: FilterConfig[]
  schedule?: ScheduleConfig
  permissions: ReportPermissions
  createdAt: Date
  updatedAt: Date
  createdBy: string
}

export interface ReportQuery {
  type: 'sql' | 'aggregation'
  source: string // table or collection name
  fields: string[]
  conditions?: QueryCondition[]
  groupBy?: string[]
  orderBy?: OrderBy[]
  limit?: number
}

export interface QueryCondition {
  field: string
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'contains' | 'between'
  value: string | number | boolean | Date | string[] | number[]
}

export interface OrderBy {
  field: string
  direction: 'asc' | 'desc'
}

export interface VisualizationConfig {
  type: 'table' | 'chart' | 'metric' | 'map'
  chartType?: 'line' | 'bar' | 'pie' | 'area' | 'scatter'
  options: Record<string, string | number | boolean>
}

export interface FilterConfig {
  field: string
  type: 'text' | 'select' | 'date' | 'number' | 'boolean'
  label: string
  options?: { label: string; value: string | number | boolean }[]
  defaultValue?: string | number | boolean
}

export interface ScheduleConfig {
  enabled: boolean
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly'
  time: string // HH:MM format
  timezone: string
  recipients: string[]
  format: 'pdf' | 'excel' | 'csv'
}

export interface ReportPermissions {
  viewRoles: UserRole[]
  editRoles: UserRole[]
  executeRoles: UserRole[]
}

export interface ReportResult {
  data: Record<string, unknown>[]
  totalCount: number
  executionTime: number
  metadata: {
    columns: ColumnMetadata[]
    filters: FilterValue[]
    generatedAt: Date
  }
}

export interface ColumnMetadata {
  name: string
  type: 'string' | 'number' | 'date' | 'boolean'
  label: string
  format?: string
}

export interface FilterValue {
  field: string
  value: string | number | boolean | Date | string[] | number[]
  operator: string
}

// Pre-defined report templates
export const REPORT_TEMPLATES = {
  USER_ANALYTICS: {
    name: 'User Analytics',
    description: 'Comprehensive user activity and growth metrics',
    dataSource: 'users',
    query: {
      type: 'aggregation' as const,
      source: 'users',
      fields: ['id', 'email', 'role', 'createdAt', 'updatedAt'],
      conditions: [],
      groupBy: ['role'],
      orderBy: [{ field: 'createdAt', direction: 'desc' as const }]
    },
    visualizations: [
      {
        type: 'metric' as const,
        options: { title: 'Total Users', field: 'count' }
      },
      {
        type: 'chart' as const,
        chartType: 'pie' as const,
        options: { title: 'Users by Role', groupBy: 'role' }
      }
    ]
  },
  AUDIT_SUMMARY: {
    name: 'Security Audit Summary',
    description: 'Security events and audit trail analysis',
    dataSource: 'audit_logs',
    query: {
      type: 'aggregation' as const,
      source: 'audit_logs',
      fields: ['action', 'severity', 'success', 'createdAt'],
      conditions: [],
      groupBy: ['action', 'severity'],
      orderBy: [{ field: 'createdAt', direction: 'desc' as const }]
    },
    visualizations: [
      {
        type: 'chart' as const,
        chartType: 'bar' as const,
        options: { title: 'Actions by Type', groupBy: 'action' }
      },
      {
        type: 'table' as const,
        options: { title: 'Recent Security Events' }
      }
    ]
  },
  SESSION_ANALYTICS: {
    name: 'Session Analytics',
    description: 'User session patterns and device analytics',
    dataSource: 'sessions',
    query: {
      type: 'aggregation' as const,
      source: 'sessions',
      fields: ['deviceType', 'browser', 'os', 'country', 'isActive', 'createdAt'],
      conditions: [{ field: 'isActive', operator: 'eq' as const, value: true }],
      groupBy: ['deviceType', 'browser'],
      orderBy: [{ field: 'createdAt', direction: 'desc' as const }]
    },
    visualizations: [
      {
        type: 'chart' as const,
        chartType: 'pie' as const,
        options: { title: 'Sessions by Device Type', groupBy: 'deviceType' }
      },
      {
        type: 'chart' as const,
        chartType: 'bar' as const,
        options: { title: 'Sessions by Browser', groupBy: 'browser' }
      }
    ]
  }
} as const

/**
 * Core reporting engine class
 */
export class ReportingEngine {
  /**
   * Execute a report configuration and return results
   */
  static async executeReport(
    config: ReportConfig,
    filters: FilterValue[] = [],
    pagination?: { page: number; limit: number }
  ): Promise<ReportResult> {
    const startTime = Date.now()
    
    try {
      let data: Record<string, unknown>[] = []
      let totalCount = 0

      // Execute different types of queries
      switch (config.dataSource) {
        case 'users':
          ({ data, totalCount } = await this.queryUsers(config.query, filters, pagination))
          break
        case 'audit_logs':
          ({ data, totalCount } = await this.queryAuditLogs(config.query, filters, pagination))
          break
        case 'sessions':
          ({ data, totalCount } = await this.querySessions(config.query, filters, pagination))
          break
        default:
          throw new Error(`Unsupported data source: ${config.dataSource}`)
      }

      const executionTime = Date.now() - startTime

      return {
        data,
        totalCount,
        executionTime,
        metadata: {
          columns: this.inferColumnMetadata(data),
          filters,
          generatedAt: new Date()
        }
      }
    } catch (error) {
      console.error('Report execution error:', error)
      throw new Error('Failed to execute report')
    }
  }

  /**
   * Query users table with filters and aggregation
   */
  private static async queryUsers(
    query: ReportQuery,
    filters: FilterValue[],
    pagination?: { page: number; limit: number }
  ) {
    const where: Record<string, unknown> = {}
    
    // Apply filters
    filters.forEach(filter => {
      switch (filter.operator) {
        case 'eq':
          where[filter.field] = filter.value
          break
        case 'contains':
          where[filter.field] = { contains: filter.value, mode: 'insensitive' }
          break
        case 'gte':
          where[filter.field] = { gte: filter.value }
          break
        case 'lte':
          where[filter.field] = { lte: filter.value }
          break
      }
    })

    // Apply query conditions
    query.conditions?.forEach(condition => {
      switch (condition.operator) {
        case 'eq':
          where[condition.field] = condition.value
          break
        case 'in':
          where[condition.field] = { in: condition.value }
          break
      }
    })

    const [data, totalCount] = await Promise.all([
      db.user.findMany({
        where,
        select: query.fields.reduce((acc, field) => ({ ...acc, [field]: true }), {}),
        orderBy: query.orderBy?.map(order => ({ [order.field]: order.direction })),
        skip: pagination ? (pagination.page - 1) * pagination.limit : undefined,
        take: pagination?.limit || query.limit
      }),
      db.user.count({ where })
    ])

    return { data, totalCount }
  }

  /**
   * Query audit logs with filters and aggregation
   */
  private static async queryAuditLogs(
    query: ReportQuery,
    filters: FilterValue[],
    pagination?: { page: number; limit: number }
  ) {
    const where: Record<string, unknown> = {}
    
    // Apply filters
    filters.forEach(filter => {
      switch (filter.operator) {
        case 'eq':
          where[filter.field] = filter.value
          break
        case 'gte':
          where[filter.field] = { gte: filter.value }
          break
        case 'lte':
          where[filter.field] = { lte: filter.value }
          break
      }
    })

    const [data, totalCount] = await Promise.all([
      db.auditLog.findMany({
        where,
        select: query.fields.reduce((acc, field) => ({ ...acc, [field]: true }), {}),
        orderBy: query.orderBy?.map(order => ({ [order.field]: order.direction })),
        skip: pagination ? (pagination.page - 1) * pagination.limit : undefined,
        take: pagination?.limit || query.limit || 1000
      }),
      db.auditLog.count({ where })
    ])

    return { data, totalCount }
  }

  /**
   * Query sessions with filters and aggregation
   */
  private static async querySessions(
    query: ReportQuery,
    filters: FilterValue[],
    pagination?: { page: number; limit: number }
  ) {
    const where: Record<string, unknown> = {}
    
    // Apply filters
    filters.forEach(filter => {
      switch (filter.operator) {
        case 'eq':
          where[filter.field] = filter.value
          break
        case 'gte':
          where[filter.field] = { gte: filter.value }
          break
        case 'lte':
          where[filter.field] = { lte: filter.value }
          break
      }
    })

    const [data, totalCount] = await Promise.all([
      db.session.findMany({
        where,
        select: query.fields.reduce((acc, field) => ({ ...acc, [field]: true }), {}),
        orderBy: query.orderBy?.map(order => ({ [order.field]: order.direction })),
        skip: pagination ? (pagination.page - 1) * pagination.limit : undefined,
        take: pagination?.limit || query.limit || 1000
      }),
      db.session.count({ where })
    ])

    return { data, totalCount }
  }

  /**
   * Infer column metadata from data
   */
  private static inferColumnMetadata(data: Record<string, unknown>[]): ColumnMetadata[] {
    if (data.length === 0) return []

    const sample = data[0]
    return Object.keys(sample).map(key => ({
      name: key,
      type: this.inferDataType(sample[key]),
      label: this.formatColumnLabel(key)
    }))
  }

  /**
   * Infer data type from value
   */
  private static inferDataType(value: unknown): 'string' | 'number' | 'date' | 'boolean' {
    if (typeof value === 'boolean') return 'boolean'
    if (typeof value === 'number') return 'number'
    if (value instanceof Date) return 'date'
    if (typeof value === 'string' && !isNaN(Date.parse(value))) return 'date'
    return 'string'
  }

  /**
   * Format column name as human-readable label
   */
  private static formatColumnLabel(key: string): string {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim()
  }

  /**
   * Get available report templates
   */
  static getReportTemplates() {
    return Object.entries(REPORT_TEMPLATES).map(([key, template]) => ({
      id: key,
      ...template
    }))
  }

  /**
   * Create report from template
   */
  static createReportFromTemplate(
    templateId: string,
    name: string,
    userId: string,
    customizations?: Partial<ReportConfig>
  ): ReportConfig {
    const template = REPORT_TEMPLATES[templateId as keyof typeof REPORT_TEMPLATES]
    if (!template) {
      throw new Error(`Template not found: ${templateId}`)
    }

    return {
      id: crypto.randomUUID(),
      name,
      description: template.description,
      dataSource: template.dataSource,
      query: { 
        ...template.query, 
        fields: [...template.query.fields],
        conditions: template.query.conditions ? [...template.query.conditions] : undefined,
        groupBy: template.query.groupBy ? [...template.query.groupBy] : undefined,
        orderBy: template.query.orderBy ? [...template.query.orderBy] : undefined
      },
      visualizations: [...template.visualizations],
      permissions: {
        viewRoles: ['USER', 'ADMIN', 'SUPER_ADMIN'],
        editRoles: ['ADMIN', 'SUPER_ADMIN'],
        executeRoles: ['USER', 'ADMIN', 'SUPER_ADMIN']
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: userId,
      ...customizations
    }
  }
}