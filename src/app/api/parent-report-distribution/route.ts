import { NextRequest, NextResponse } from 'next/server'

// TODO: This route requires ParentReportDistribution and FinalReportCompilation models
// to be added to the Prisma schema. Also needs Profile model refactoring (not User).
// Temporarily disabled until the models are created/updated

export async function GET(request: NextRequest) {
  return NextResponse.json(
    { error: 'ParentReportDistribution feature not yet implemented - requires Prisma models and Profile refactoring' },
    { status: 501 }
  )
}

export async function POST(request: NextRequest) {
  return NextResponse.json(
    { error: 'ParentReportDistribution feature not yet implemented - requires Prisma models and Profile refactoring' },
    { status: 501 }
  )
}

export async function PUT(request: NextRequest) {
  return NextResponse.json(
    { error: 'ParentReportDistribution feature not yet implemented - requires Prisma models and Profile refactoring' },
    { status: 501 }
  )
}
