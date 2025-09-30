import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'

const configUpdateSchema = z.object({
  category: z.enum(['general', 'scheduling', 'payment', 'notification', 'security', 'appearance']),
  settings: z.record(z.any()),
  updatedBy: z.string().uuid('Invalid user ID')
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')

    const whereClause = category ? { category } : {}

    const settings = await db.systemConfiguration.findMany({
      where: whereClause,
      orderBy: { category: 'asc' }
    })

    return NextResponse.json({
      success: true,
      data: settings
    })

  } catch (error) {
    console.error('Error fetching system configuration:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    
    const validation = configUpdateSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.issues },
        { status: 400 }
      )
    }

    const { category, settings, updatedBy } = validation.data

    const config = await db.systemConfiguration.upsert({
      where: { category },
      update: { settings, updatedBy, updatedAt: new Date() },
      create: { category, settings, updatedBy }
    })

    return NextResponse.json({
      success: true,
      message: 'Configuration updated successfully',
      data: config
    })

  } catch (error) {
    console.error('Error updating configuration:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
