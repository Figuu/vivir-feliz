import { NextRequest, NextResponse } from 'next/server'

// TODO: This route needs to be refactored to use the ScheduleRequest model properly
// The current implementation expects different fields than what ScheduleRequest provides
// Temporarily disabled until properly implemented with the correct schema

export async function POST(request: NextRequest) {
  return NextResponse.json(
    { error: 'Rescheduling request feature needs refactoring to match ScheduleRequest schema' },
    { status: 501 }
  )
}

export async function GET(request: NextRequest) {
  return NextResponse.json(
    { error: 'Rescheduling request feature needs refactoring to match ScheduleRequest schema' },
    { status: 501 }
  )
}

export async function PUT(request: NextRequest) {
  return NextResponse.json(
    { error: 'Rescheduling request feature needs refactoring to match ScheduleRequest schema' },
    { status: 501 }
  )
}
