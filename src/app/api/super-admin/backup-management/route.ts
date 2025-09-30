import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'

const backupRequestSchema = z.object({
  backupType: z.enum(['full', 'incremental', 'database', 'files', 'custom']),
  includeTables: z.array(z.string()).optional(),
  excludeTables: z.array(z.string()).optional(),
  description: z.string().max(500).optional(),
  triggeredBy: z.string().uuid()
})

const restoreRequestSchema = z.object({
  backupId: z.string().uuid(),
  restoreType: z.enum(['full', 'selective']),
  tablesToRestore: z.array(z.string()).optional(),
  createBackupBeforeRestore: z.boolean().default(true),
  restoredBy: z.string().uuid()
})

const deleteBackupSchema = z.object({
  backupId: z.string().uuid(),
  deletedBy: z.string().uuid()
})

// GET - List backups
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const backupType = searchParams.get('backupType')
    const limit = parseInt(searchParams.get('limit') || '50')

    const whereClause: any = {}
    if (backupType) {
      whereClause.backupType = backupType
    }

    const [backups, totalCount, totalSize] = await Promise.all([
      db.systemBackup.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        take: limit
      }),
      db.systemBackup.count({ where: whereClause }),
      db.systemBackup.aggregate({
        where: whereClause,
        _sum: { fileSize: true }
      })
    ])

    // Calculate statistics
    const successfulBackups = backups.filter(b => b.status === 'completed').length
    const failedBackups = backups.filter(b => b.status === 'failed').length
    const lastBackup = backups.length > 0 ? backups[0] : null

    return NextResponse.json({
      success: true,
      data: {
        backups,
        statistics: {
          totalCount,
          totalSize: totalSize._sum.fileSize || 0,
          successfulBackups,
          failedBackups,
          lastBackup: lastBackup ? {
            id: lastBackup.id,
            type: lastBackup.backupType,
            status: lastBackup.status,
            createdAt: lastBackup.createdAt
          } : null
        }
      }
    })

  } catch (error) {
    console.error('Error fetching backups:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create backup
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const validation = backupRequestSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.errors },
        { status: 400 }
      )
    }

    const data = validation.data

    // Create backup record
    const backup = await db.systemBackup.create({
      data: {
        backupType: data.backupType,
        description: data.description,
        status: 'in_progress',
        triggeredBy: data.triggeredBy,
        metadata: {
          includeTables: data.includeTables || [],
          excludeTables: data.excludeTables || []
        }
      }
    })

    // In a real application, this would trigger an actual backup process
    // For now, we'll simulate a successful backup
    setTimeout(async () => {
      try {
        await db.systemBackup.update({
          where: { id: backup.id },
          data: {
            status: 'completed',
            fileSize: Math.floor(Math.random() * 1000000000) + 100000000, // Simulated size
            filePath: `/backups/${backup.id}.backup`,
            completedAt: new Date()
          }
        })
      } catch (err) {
        console.error('Error updating backup status:', err)
      }
    }, 1000)

    return NextResponse.json({
      success: true,
      message: 'Backup process initiated',
      data: backup
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating backup:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT - Restore backup
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    
    const validation = restoreRequestSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.errors },
        { status: 400 }
      )
    }

    const data = validation.data

    // Get backup
    const backup = await db.systemBackup.findUnique({
      where: { id: data.backupId }
    })

    if (!backup) {
      return NextResponse.json(
        { error: 'Backup not found' },
        { status: 404 }
      )
    }

    if (backup.status !== 'completed') {
      return NextResponse.json(
        { error: 'Cannot restore from incomplete backup' },
        { status: 400 }
      )
    }

    // Create pre-restore backup if requested
    if (data.createBackupBeforeRestore) {
      await db.systemBackup.create({
        data: {
          backupType: 'full',
          description: `Pre-restore backup before restoring ${backup.id}`,
          status: 'completed',
          triggeredBy: data.restoredBy,
          fileSize: 0,
          filePath: `/backups/pre-restore-${Date.now()}.backup`,
          completedAt: new Date()
        }
      })
    }

    // Create restore record
    const restoreRecord = await db.dataRestore.create({
      data: {
        backupId: data.backupId,
        restoreType: data.restoreType,
        status: 'in_progress',
        restoredBy: data.restoredBy,
        metadata: {
          tablesToRestore: data.tablesToRestore || []
        }
      }
    })

    // Simulate restore process
    setTimeout(async () => {
      try {
        await db.dataRestore.update({
          where: { id: restoreRecord.id },
          data: {
            status: 'completed',
            completedAt: new Date()
          }
        })
      } catch (err) {
        console.error('Error updating restore status:', err)
      }
    }, 2000)

    return NextResponse.json({
      success: true,
      message: 'Restore process initiated',
      data: restoreRecord
    })

  } catch (error) {
    console.error('Error restoring backup:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Delete backup
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const backupId = searchParams.get('backupId')
    const deletedBy = searchParams.get('deletedBy')

    if (!backupId || !deletedBy) {
      return NextResponse.json(
        { error: 'Backup ID and deleted by are required' },
        { status: 400 }
      )
    }

    const validation = deleteBackupSchema.safeParse({ backupId, deletedBy })
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid parameters', details: validation.error.errors },
        { status: 400 }
      )
    }

    // Check if backup exists
    const backup = await db.systemBackup.findUnique({
      where: { id: backupId }
    })

    if (!backup) {
      return NextResponse.json(
        { error: 'Backup not found' },
        { status: 404 }
      )
    }

    // Soft delete
    await db.systemBackup.update({
      where: { id: backupId },
      data: {
        deletedAt: new Date(),
        deletedBy: deletedBy
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Backup deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting backup:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
