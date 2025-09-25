"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DataTable } from '@/components/ui/data-table'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { useToast } from '@/hooks/use-toast'
import { 
  Download, 
  Play, 
  FileText, 
  Filter,
  Eye
} from 'lucide-react'
import { format as formatDate } from 'date-fns'
import { cn } from '@/lib/utils'

interface ReportTemplate {
  id: string
  name: string
  description: string
  dataSource: string
  query: Record<string, unknown>
  visualizations: Record<string, unknown>[]
}

interface ReportResult {
  data: Record<string, unknown>[]
  totalCount: number
  executionTime: number
  metadata: {
    columns: ColumnMetadata[]
    filters: FilterValue[]
    generatedAt: Date
  }
}

interface ColumnMetadata {
  name: string
  type: 'string' | 'number' | 'date' | 'boolean'
  label: string
  format?: string
}

interface FilterValue {
  field: string
  value: unknown
  operator: string
}

export function ReportBuilder() {
  const [templates, setTemplates] = useState<ReportTemplate[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null)
  const [reportResult, setReportResult] = useState<ReportResult | null>(null)
  const [filters, setFilters] = useState<FilterValue[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [currentPage] = useState(1)
  const [pageSize] = useState(100)
  const { toast } = useToast()

  // Load available report templates
  useEffect(() => {
    loadTemplates()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const loadTemplates = async () => {
    try {
      const response = await fetch('/api/reports?action=templates')
      const data = await response.json()
      
      if (data.templates) {
        setTemplates(data.templates)
      }
    } catch (error) {
      console.error('Failed to load templates:', error)
      toast({
        title: 'Error',
        description: 'Failed to load report templates',
        variant: 'destructive'
      })
    }
  }

  const executeReport = async (templateId?: string) => {
    if (!templateId && !selectedTemplate) {
      toast({
        title: 'Error',
        description: 'Please select a report template',
        variant: 'destructive'
      })
      return
    }

    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        action: 'execute',
        templateId: templateId || selectedTemplate!.id,
        page: currentPage.toString(),
        limit: pageSize.toString()
      })

      if (filters.length > 0) {
        params.set('filters', JSON.stringify(filters))
      }

      const response = await fetch(`/api/reports?${params}`)
      const data = await response.json()

      if (data.success) {
        setReportResult(data.result)
        toast({
          title: 'Success',
          description: `Report executed in ${data.result.executionTime}ms`,
        })
      } else {
        throw new Error(data.error || 'Failed to execute report')
      }
    } catch (error) {
      console.error('Failed to execute report:', error)
      toast({
        title: 'Error',
        description: 'Failed to execute report',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const exportReport = async (format: 'csv' | 'json' | 'pdf') => {
    if (!selectedTemplate) {
      toast({
        title: 'Error',
        description: 'Please select a report template',
        variant: 'destructive'
      })
      return
    }

    setIsExporting(true)
    try {
      const response = await fetch('/api/reports/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          templateId: selectedTemplate.id,
          format,
          filters,
          filename: `${selectedTemplate.name}_${format}_${formatDate(new Date(), 'yyyy-MM-dd')}.${format}`
        })
      })

      if (response.ok) {
        // Download the file
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = response.headers.get('Content-Disposition')?.split('filename=')[1]?.replace(/"/g, '') || `export.${format}`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)

        toast({
          title: 'Success',
          description: `Report exported as ${format.toUpperCase()}`,
        })
      } else {
        throw new Error('Export failed')
      }
    } catch (error) {
      console.error('Failed to export report:', error)
      toast({
        title: 'Error',
        description: 'Failed to export report',
        variant: 'destructive'
      })
    } finally {
      setIsExporting(false)
    }
  }

  const addFilter = (field: string, operator: string, value: unknown) => {
    const newFilter: FilterValue = { field, operator, value }
    setFilters([...filters, newFilter])
  }

  const removeFilter = (index: number) => {
    setFilters(filters.filter((_, i) => i !== index))
  }

  const clearFilters = () => {
    setFilters([])
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Report Builder</h1>
        <p className="text-muted-foreground">
          Create, execute, and export comprehensive reports from your data
        </p>
      </div>

      <Tabs defaultValue="templates" className="space-y-4">
        <TabsList>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="filters">Filters</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
          <TabsTrigger value="export">Export</TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Report Templates
              </CardTitle>
              <CardDescription>
                Select a pre-built report template to get started
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {templates.map((template) => (
                  <Card 
                    key={template.id}
                    className={cn(
                      "cursor-pointer transition-colors hover:bg-muted/50",
                      selectedTemplate?.id === template.id && "ring-2 ring-primary"
                    )}
                    onClick={() => setSelectedTemplate(template)}
                  >
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">{template.name}</CardTitle>
                      <CardDescription className="text-sm">
                        {template.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary" className="text-xs">
                          {template.dataSource}
                        </Badge>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedTemplate(template)
                            executeReport(template.id)
                          }}
                          disabled={isLoading}
                        >
                          <Play className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {selectedTemplate && (
                <div className="mt-6 p-4 bg-muted rounded-lg">
                  <h4 className="font-semibold mb-2">Selected: {selectedTemplate.name}</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    {selectedTemplate.description}
                  </p>
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => executeReport()}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <LoadingSpinner className="mr-2 h-4 w-4" />
                          Executing...
                        </>
                      ) : (
                        <>
                          <Play className="mr-2 h-4 w-4" />
                          Execute Report
                        </>
                      )}
                    </Button>
                    <Button variant="outline" onClick={() => setSelectedTemplate(null)}>
                      Clear Selection
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="filters" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Report Filters
              </CardTitle>
              <CardDescription>
                Add filters to customize your report data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Filter creation form */}
              <div className="grid gap-4 md:grid-cols-4">
                <div>
                  <Label htmlFor="filter-field">Field</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select field" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="role">Role</SelectItem>
                      <SelectItem value="createdAt">Created Date</SelectItem>
                      <SelectItem value="action">Action</SelectItem>
                      <SelectItem value="severity">Severity</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="filter-operator">Operator</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select operator" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="eq">Equals</SelectItem>
                      <SelectItem value="contains">Contains</SelectItem>
                      <SelectItem value="gte">Greater than</SelectItem>
                      <SelectItem value="lte">Less than</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="filter-value">Value</Label>
                  <Input placeholder="Enter value" />
                </div>
                <div className="flex items-end">
                  <Button 
                    onClick={() => addFilter('email', 'eq', 'test@example.com')}
                    className="w-full"
                  >
                    Add Filter
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Active filters */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Active Filters ({filters.length})</Label>
                  {filters.length > 0 && (
                    <Button variant="ghost" size="sm" onClick={clearFilters}>
                      Clear All
                    </Button>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {filters.map((filter, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      {filter.field} {filter.operator} {String(filter.value)}
                      <button
                        onClick={() => removeFilter(index)}
                        className="ml-1 hover:text-destructive"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Report Results
              </CardTitle>
              <CardDescription>
                View and analyze your report data
              </CardDescription>
            </CardHeader>
            <CardContent>
              {reportResult ? (
                <div className="space-y-4">
                  {/* Report metadata */}
                  <div className="grid gap-4 md:grid-cols-4">
                    <div className="bg-muted p-3 rounded-lg text-center">
                      <div className="text-2xl font-bold">{reportResult.totalCount}</div>
                      <div className="text-sm text-muted-foreground">Total Records</div>
                    </div>
                    <div className="bg-muted p-3 rounded-lg text-center">
                      <div className="text-2xl font-bold">{reportResult.data.length}</div>
                      <div className="text-sm text-muted-foreground">Displayed</div>
                    </div>
                    <div className="bg-muted p-3 rounded-lg text-center">
                      <div className="text-2xl font-bold">{reportResult.executionTime}ms</div>
                      <div className="text-sm text-muted-foreground">Execution Time</div>
                    </div>
                    <div className="bg-muted p-3 rounded-lg text-center">
                      <div className="text-2xl font-bold">{reportResult.metadata.columns.length}</div>
                      <div className="text-sm text-muted-foreground">Columns</div>
                    </div>
                  </div>

                  {/* Data table */}
                  <DataTable
                    data={reportResult.data}
                    columns={reportResult.metadata.columns.map(col => ({
                      accessorKey: col.name,
                      header: col.label,
                      cell: ({ getValue }: { getValue: () => unknown }) => {
                        const value = getValue()
                        if (col.type === 'date' && value) {
                          return formatDate(new Date(value as string | number | Date), 'PPp')
                        }
                        return value || '-'
                      }
                    })) as any}
                  />
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No report data available. Execute a report to see results.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="export" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Export Report
              </CardTitle>
              <CardDescription>
                Export your report data in various formats
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <Button
                  variant="outline"
                  onClick={() => exportReport('csv')}
                  disabled={!selectedTemplate || isExporting}
                  className="h-24 flex-col"
                >
                  <FileText className="h-8 w-8 mb-2" />
                  Export as CSV
                </Button>
                <Button
                  variant="outline"
                  onClick={() => exportReport('json')}
                  disabled={!selectedTemplate || isExporting}
                  className="h-24 flex-col"
                >
                  <FileText className="h-8 w-8 mb-2" />
                  Export as JSON
                </Button>
                <Button
                  variant="outline"
                  onClick={() => exportReport('pdf')}
                  disabled={!selectedTemplate || isExporting}
                  className="h-24 flex-col"
                >
                  <FileText className="h-8 w-8 mb-2" />
                  Export as PDF
                </Button>
              </div>

              {isExporting && (
                <div className="text-center py-4">
                  <LoadingSpinner className="mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Preparing export...</p>
                </div>
              )}

              {!selectedTemplate && (
                <div className="text-center py-4 text-muted-foreground">
                  Please select a report template to enable export options.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}