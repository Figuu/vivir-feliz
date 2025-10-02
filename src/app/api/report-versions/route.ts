import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'

// Simplified validation schemas
const versionCreateSchema = z.object({
  reportId: z.string().uuid('Invalid report ID'),
  reportType: z.enum(['progress_report', 'final_report']),
  versionNumber: z.number().min(1, 'Version number must be at least 1'),
  changeType: z.enum(['created', 'updated', 'approved', 'rejected']),
  changeDescription: z.string().min(10, 'Change description must be at least 10 characters').max(1000, 'Change description cannot exceed 1000 characters'),
  changedBy: z.string().uuid('Invalid user ID'),
  changedFields: z.array(z.string().max(100, 'Field name cannot exceed 100 characters')).optional().default([]),
  previousData: z.record(z.string(), z.any()).optional(),
  currentData: z.record(z.string(), z.any())
})

const versionQuerySchema = z.object({
  page: z.string().transform(val => parseInt(val) || 1).refine(val => val > 0, 'Page must be greater than 0'),
  limit: z.string().transform(val => parseInt(val) || 10).refine(val => val > 0 && val <= 100, 'Limit must be between 1 and 100'),
  reportId: z.string().uuid('Invalid report ID').optional(),
  reportType: z.enum(['progress_report', 'final_report']).optional(),
  changeType: z.enum(['created', 'updated', 'approved', 'rejected']).optional(),
  changedBy: z.string().uuid('Invalid user ID').optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format').optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be in YYYY-MM-DD format').optional(),
  sortBy: z.enum(['createdAt', 'versionNumber', 'changeType']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc')
})

// Mock version data since we don't have a versions table in the schema
const mockVersions: any[] = []

// GET /api/report-versions - Get version history
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    
    if (action === 'compare') {
      // Compare two versions
      const reportId = searchParams.get('reportId')
      const reportType = searchParams.get('reportType')
      const version1 = searchParams.get('version1')
      const version2 = searchParams.get('version2')

      if (!reportId || !reportType || !version1 || !version2) {
        return NextResponse.json(
          { error: 'Missing required parameters for comparison' },
          { status: 400 }
        )
      }

      // Find versions to compare
      const versions = mockVersions.filter(v => 
        v.reportId === reportId && 
        v.reportType === reportType && 
        (v.versionNumber === parseInt(version1) || v.versionNumber === parseInt(version2))
      )

      if (versions.length !== 2) {
        return NextResponse.json(
          { error: 'One or both versions not found' },
          { status: 404 }
        )
      }

      const [version1Data, version2Data] = versions.sort((a, b) => a.versionNumber - b.versionNumber)

      // Simple comparison logic
      const differences: any[] = []
      const fields = new Set([...Object.keys(version1Data.currentData || {}), ...Object.keys(version2Data.currentData || {})])

      fields.forEach(field => {
        const value1 = version1Data.currentData?.[field]
        const value2 = version2Data.currentData?.[field]
        
        if (value1 !== value2) {
          differences.push({
            field,
            oldValue: value1,
            newValue: value2,
            changeType: 'modified'
          })
        }
      })

      return NextResponse.json({
        success: true,
        data: {
          comparison: {
            reportId,
            reportType,
            version1: version1Data,
            version2: version2Data,
            differences,
            summary: {
              totalChanges: differences.length,
              addedFields: differences.filter(d => d.oldValue === undefined).length,
              removedFields: differences.filter(d => d.newValue === undefined).length,
              modifiedFields: differences.filter(d => d.oldValue !== undefined && d.newValue !== undefined).length
            }
          }
        }
      })
    }
    
    // Default action: get version history
    const validation = versionQuerySchema.safeParse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      reportId: searchParams.get('reportId'),
      reportType: searchParams.get('reportType'),
      changeType: searchParams.get('changeType'),
      changedBy: searchParams.get('changedBy'),
      startDate: searchParams.get('startDate'),
      endDate: searchParams.get('endDate'),
      sortBy: searchParams.get('sortBy'),
      sortOrder: searchParams.get('sortOrder')
    })

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: validation.error.issues },
        { status: 400 }
      )
    }

    const { page, limit, reportId, reportType, changeType, changedBy, startDate, endDate, sortBy, sortOrder } = validation.data

    // Filter versions
    let filteredVersions = mockVersions.filter(version => {
      if (reportId && version.reportId !== reportId) return false
      if (reportType && version.reportType !== reportType) return false
      if (changeType && version.changeType !== changeType) return false
      if (changedBy && version.changedBy !== changedBy) return false
      if (startDate && new Date(version.createdAt) < new Date(startDate)) return false
      if (endDate && new Date(version.createdAt) > new Date(endDate)) return false
      return true
    })

    // Sort versions
    filteredVersions.sort((a, b) => {
      let aValue: any = a[sortBy as keyof typeof a]
      let bValue: any = b[sortBy as keyof typeof b]
      
      if (sortBy === 'createdAt') {
        aValue = new Date(aValue).getTime()
        bValue = new Date(bValue).getTime()
      }
      
      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
      }
    })

    // Calculate pagination
    const totalCount = filteredVersions.length
    const skip = (page - 1) * limit
    const paginatedVersions = filteredVersions.slice(skip, skip + limit)

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit)
    const hasNextPage = page < totalPages
    const hasPrevPage = page > 1

    return NextResponse.json({
      success: true,
      data: {
        versions: paginatedVersions,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages,
          hasNextPage,
          hasPrevPage
        },
        filters: {
          reportId,
          reportType,
          changeType,
          changedBy,
          startDate,
          endDate,
          sortBy,
          sortOrder
        }
      }
    })

  } catch (error) {
    console.error('Error fetching report versions:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/report-versions - Create version record
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate request body
    const validation = versionCreateSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.issues },
        { status: 400 }
      )
    }

    const { reportId, reportType, versionNumber, changeType, changeDescription, changedBy, changedFields, previousData, currentData } = validation.data

    // Create new version record
    const newVersion = {
      id: `version-${Date.now()}`,
      reportId,
      reportType,
      versionNumber,
      changeType,
      changeDescription,
      changedBy,
      changedFields,
      previousData,
      currentData,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    // Add to mock versions (in real implementation, save to database)
    mockVersions.push(newVersion)

    return NextResponse.json({
      success: true,
      message: 'Version record created successfully',
      data: {
        version: newVersion
      }
    })

  } catch (error) {
    console.error('Error creating version record:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}