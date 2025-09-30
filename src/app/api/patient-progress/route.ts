import { NextRequest, NextResponse } from 'next/server'

// TODO: This route requires a PatientProgress model to be added to the Prisma schema
// Also needs Profile model refactoring (not User model)
// Temporarily disabled until the model is created and Profile refactoring is done

export async function GET(request: NextRequest) {
  return NextResponse.json(
    { error: 'PatientProgress feature not yet implemented - requires Prisma model and Profile refactoring' },
    { status: 501 }
  )
}

export async function POST(request: NextRequest) {
  return NextResponse.json(
    { error: 'PatientProgress feature not yet implemented - requires Prisma model and Profile refactoring' },
    { status: 501 }
  )
}

export async function PUT(request: NextRequest) {
  return NextResponse.json(
    { error: 'PatientProgress feature not yet implemented - requires Prisma model and Profile refactoring' },
    { status: 501 }
  )
}

export async function DELETE(request: NextRequest) {
  return NextResponse.json(
    { error: 'PatientProgress feature not yet implemented - requires Prisma model and Profile refactoring' },
    { status: 501 }
  )
}
