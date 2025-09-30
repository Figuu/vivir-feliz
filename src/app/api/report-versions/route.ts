import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'

// Comprehensive validation schemas
const versionCreateSchema = z.object({
  reportId: z.string().uuid('Invalid report ID'),
  reportType: z.enum(['therapeutic_plan', 'progress_report', 'final_report', 'compilation', 'submission']),
  versionNumber: z.number().min(1, 'Version number must be at least 1'),
  changeType: z.enum(['created', 'updated', 'approved', 'rejected', 'revised', 'published', 'distributed']),
  changeDescription: z.string()
    .min(10, 'Change description must be at least 10 characters')
    .max(1000, 'Change description cannot exceed 1000 characters')
    .transform(val => val.trim()),
  changedBy: z.string().uuid('Invalid user ID'),
  changedFields: z.array(z.string().max(100, 'Field name cannot exceed 100 characters')).optional().default([]),
  previousData: z.record(z.any()).optional(),
  currentData: z.record(z.any()),
  metadata: z.object({
    userAgent: z.string().optional(),
    ipAddress: z.string().optional(),
    sessionId: z.string().optional()
  }).optional()
})

const versionQuerySchema = z.object({
  page: z.string().transform(val => parseInt(val) || 1).refine(val => val > 0, 'Page must be greater than 0'),
  limit: z.string().transform(val => parseInt(val) || 10).refine(val => val > 0 && val <= 100, 'Limit must be between 1 and 100'),
  reportId: z.string().uuid('Invalid report ID').optional(),
  reportType: z.enum(['therapeutic_plan', 'progress_report', 'final_report', 'compilation', 'submission']).optional(),
  changeType: z.enum(['created', 'updated', 'approved', 'rejected', 'revised', 'published', 'distributed']).optional(),
  changedBy: z.string().uuid('Invalid user ID').optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format').optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be in YYYY-MM-DD format').optional(),
  sortBy: z.enum(['createdAt', 'versionNumber', 'changeType']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc')
})

const compareVersionsSchema = z.object({
  reportId: z.string().uuid('Invalid report ID'),
  reportType: z.enum(['therapeutic_plan', 'progress_report', 'final_report', 'compilation', 'submission']),
  version1: z.number().min(1, 'Version 1 must be at least 1'),
  version2: z.number().min(1, 'Version 2 must be at least 1')
})

const restoreVersionSchema = z.object({
  versionId: z.string().uuid('Invalid version ID'),
  reportId: z.string().uuid('Invalid report ID'),
  reportType: z.enum(['therapeutic_plan', 'progress_report', 'final_report', 'compilation', 'submission']),
  restoredBy: z.string().uuid('Invalid user ID'),
  restoreNotes: z.string().max(1000, 'Restore notes cannot exceed 1000 characters').optional()
})

// GET /api/report-versions - Get version history
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    
    if (action === 'compare') {
      // Compare two versions
      const validation = compareVersionsSchema.safeParse({
        reportId: searchParams.get('reportId'),
        reportType: searchParams.get('reportType'),
        version1: searchParams.get('version1'),
        version2: searchParams.get('version2')
      })

      if (!validation.success) {
        return NextResponse.json(
          { error: 'Invalid comparison parameters', details: validation.error.issues },
          { status: 400 }
        )
      }

      const { reportId, reportType, version1, version2 } = validation.data

      // Get both versions
      const versions = await db.reportVersion.findMany({
        where: {
          reportId,
          reportType,
          versionNumber: { in: [version1, version2] }
        },
        include: {
          changedByUser: {
            select: {
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      })

      if (versions.length !== 2) {
        return NextResponse.json(
          { error: 'One or both versions not found' },
          { status: 404 }
        )
      }

      // Compare versions
      const comparison = compareVersionData(versions[0], versions[1])

      return NextResponse.json({
        success: true,
        data: {
          version1: versions.find(v => v.versionNumber === version1),
          version2: versions.find(v => v.versionNumber === version2),
          comparison
        }
      })
    }
    
    if (action === 'latest') {
      // Get latest version for a report
      const reportId = searchParams.get('reportId')
      const reportType = searchParams.get('reportType')

      if (!reportId || !reportType) {
        return NextResponse.json(
          { error: 'Report ID and type are required' },
          { status: 400 }
        )
      }

      const latestVersion = await db.reportVersion.findFirst({
        where: {
          reportId,
          reportType: reportType as any
        },
        include: {
          changedByUser: {
            select: {
              firstName: true,
              lastName: true,
              email: true
            }
          }
        },
        orderBy: { versionNumber: 'desc' }
      })

      return NextResponse.json({
        success: true,
        data: latestVersion
      })
    }
    
    // Regular query
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

    // Build where clause
    const whereClause: any = {}
    
    if (reportId) {
      whereClause.reportId = reportId
    }
    
    if (reportType) {
      whereClause.reportType = reportType
    }
    
    if (changeType) {
      whereClause.changeType = changeType
    }
    
    if (changedBy) {
      whereClause.changedBy = changedBy
    }
    
    if (startDate) {
      whereClause.createdAt = { gte: new Date(startDate) }
    }
    
    if (endDate) {
      whereClause.createdAt = { 
        ...whereClause.createdAt,
        lte: new Date(endDate) 
      }
    }

    // Calculate pagination
    const skip = (page - 1) * limit

    // Get versions with related data
    const [versions, totalCount] = await Promise.all([
      db.reportVersion.findMany({
        where: whereClause,
        include: {
          changedByUser: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      db.reportVersion.count({ where: whereClause })
    ])

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit)
    const hasNextPage = page < totalPages
    const hasPrevPage = page > 1

    return NextResponse.json({
      success: true,
      data: {
        versions,
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
    console.error('Error fetching report versions:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/report-versions - Create a new version or restore a previous version
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const action = body.action
    
    if (action === 'restore') {
      // Restore a previous version
      const validation = restoreVersionSchema.safeParse(body)
      if (!validation.success) {
        return NextResponse.json(
          { error: 'Invalid request data', details: validation.error.issues },
          { status: 400 }
        )
      }

      const validatedData = validation.data

      // Get the version to restore
      const versionToRestore = await db.reportVersion.findUnique({
        where: { id: validatedData.versionId }
      })

      if (!versionToRestore) {
        return NextResponse.json(
          { error: 'Version not found' },
          { status: 404 }
        )
      }

      // Get current latest version number
      const latestVersion = await db.reportVersion.findFirst({
        where: {
          reportId: validatedData.reportId,
          reportType: validatedData.reportType
        },
        orderBy: { versionNumber: 'desc' }
      })

      const newVersionNumber = (latestVersion?.versionNumber || 0) + 1

      // Create new version with restored data
      const restoredVersion = await db.reportVersion.create({
        data: {
          reportId: validatedData.reportId,
          reportType: validatedData.reportType,
          versionNumber: newVersionNumber,
          changeType: 'updated',
          changeDescription: `Restored from version ${versionToRestore.versionNumber}. ${validatedData.restoreNotes || ''}`,
          changedBy: validatedData.restoredBy,
          changedFields: ['restored'],
          previousData: latestVersion?.currentData || {},
          currentData: versionToRestore.currentData,
          metadata: {
            restoredFromVersion: versionToRestore.versionNumber,
            restoredFromId: versionToRestore.id
          }
        },
        include: {
          changedByUser: {
            select: {
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      })

      // Update the actual report with restored data
      // This would depend on the report type
      // For now, we'll just create the version record

      return NextResponse.json({
        success: true,
        message: 'Version restored successfully',
        data: restoredVersion
      })
    } else {
      // Create a new version
      const validation = versionCreateSchema.safeParse(body)
      if (!validation.success) {
        return NextResponse.json(
          { error: 'Invalid request data', details: validation.error.issues },
          { status: 400 }
        )
      }

      const validatedData = validation.data

      // Check if user exists
      const user = await db.user.findUnique({
        where: { id: validatedData.changedBy }
      })

      if (!user) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        )
      }

      // Create version
      const version = await db.reportVersion.create({
        data: {
          reportId: validatedData.reportId,
          reportType: validatedData.reportType,
          versionNumber: validatedData.versionNumber,
          changeType: validatedData.changeType,
          changeDescription: validatedData.changeDescription,
          changedBy: validatedData.changedBy,
          changedFields: validatedData.changedFields,
          previousData: validatedData.previousData,
          currentData: validatedData.currentData,
          metadata: validatedData.metadata
        },
        include: {
          changedByUser: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      })

      return NextResponse.json({
        success: true,
        message: 'Version created successfully',
        data: version
      }, { status: 201 })
    }

  } catch (error) {
    console.error('Error processing version:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function to compare version data
function compareVersionData(version1: any, version2: any) {
  const changes: any = {
    addedFields: [],
    removedFields: [],
    modifiedFields: [],
    unchangedFields: []
  }

  const data1 = version1.currentData
  const data2 = version2.currentData

  // Find all unique keys
  const allKeys = new Set([...Object.keys(data1), ...Object.keys(data2)])

  allKeys.forEach(key => {
    const value1 = data1[key]
    const value2 = data2[key]

    if (value1 === undefined && value2 !== undefined) {
      changes.addedFields.push({
        field: key,
        value: value2
      })
    } else if (value1 !== undefined && value2 === undefined) {
      changes.removedFields.push({
        field: key,
        value: value1
      })
    } else if (JSON.stringify(value1) !== JSON.stringify(value2)) {
      changes.modifiedFields.push({
        field: key,
        oldValue: value1,
        newValue: value2
      })
    } else {
      changes.unchangedFields.push(key)
    }
  })

  return changes
}
