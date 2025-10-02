export interface ReportConfig {
  id: string
  name: string
  description?: string
  templateId: string
  createdBy: string
  createdAt: Date
  updatedAt: Date
  columns: ReportColumn[]
  filters: ReportFilter[]
  sorting: ReportSorting[]
  pagination: ReportPagination
  dataSource?: string
}

export interface ReportColumn {
  name: string
  label: string
  type: 'string' | 'number' | 'date' | 'boolean'
  visible: boolean
  sortable: boolean
  filterable: boolean
}

export interface ReportFilter {
  column: string
  operator: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'greaterThan' | 'lessThan' | 'between'
  value: any
  value2?: any
}

export interface ReportSorting {
  column: string
  direction: 'asc' | 'desc'
}

export interface ReportPagination {
  page: number
  limit: number
}

export interface ReportResult {
  data: Record<string, unknown>[]
  totalCount: number
  executionTime: number
  metadata: {
    generatedAt: Date
    columns: ReportColumn[]
    filters: ReportFilter[]
    sorting: ReportSorting[]
  }
}

export type FilterValue = ReportFilter

export class ReportingEngine {
  static createReportFromTemplate(
    templateId: string,
    name: string,
    createdBy: string,
    customizations?: any
  ): ReportConfig {
    // Mock implementation - replace with actual template logic
    return {
      id: `report_${Date.now()}`,
      name,
      templateId,
      createdBy,
      createdAt: new Date(),
      updatedAt: new Date(),
      dataSource: 'database',
      columns: [
        { name: 'id', label: 'ID', type: 'string', visible: true, sortable: true, filterable: true },
        { name: 'name', label: 'Name', type: 'string', visible: true, sortable: true, filterable: true },
        { name: 'createdAt', label: 'Created At', type: 'date', visible: true, sortable: true, filterable: true }
      ],
      filters: [],
      sorting: [],
      pagination: { page: 1, limit: 100 }
    }
  }

  static async executeReport(
    config: ReportConfig,
    filters: ReportFilter[] = [],
    pagination?: { page: number; limit: number }
  ): Promise<ReportResult> {
    const startTime = Date.now()
    
    // Mock implementation - replace with actual database queries
    const mockData = [
      { id: '1', name: 'Sample Report 1', createdAt: new Date() },
      { id: '2', name: 'Sample Report 2', createdAt: new Date() },
      { id: '3', name: 'Sample Report 3', createdAt: new Date() }
    ]
    
    const executionTime = Date.now() - startTime
    
    return {
      data: mockData,
      totalCount: mockData.length,
      executionTime,
      metadata: {
        generatedAt: new Date(),
        columns: config.columns,
        filters: filters,
        sorting: config.sorting
      }
    }
  }

  static getReportTemplates(): any[] {
    // Mock implementation - replace with actual template logic
    return [
      { id: 'template1', name: 'Patient Report', description: 'Basic patient information report' },
      { id: 'template2', name: 'Session Report', description: 'Session details and progress' },
      { id: 'template3', name: 'Payment Report', description: 'Payment history and status' }
    ]
  }
}