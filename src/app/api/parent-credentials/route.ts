import { NextRequest, NextResponse } from 'next/server'

// TODO: This route requires ParentCredential model to be added to the Prisma schema
// Also needs to be refactored to use Profile model instead of User model
// Temporarily disabled until the models are created/updated

export async function GET(request: NextRequest) {
  return NextResponse.json(
    { error: 'ParentCredential feature not yet implemented - requires Prisma model and Profile refactoring' },
    { status: 501 }
  )
}

export async function POST(request: NextRequest) {
  return NextResponse.json(
    { error: 'ParentCredential feature not yet implemented - requires Prisma model and Profile refactoring' },
    { status: 501 }
  )
}

export async function PUT(request: NextRequest) {
  return NextResponse.json(
    { error: 'ParentCredential feature not yet implemented - requires Prisma model and Profile refactoring' },
    { status: 501 }
  )
}
