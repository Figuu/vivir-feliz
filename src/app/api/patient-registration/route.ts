import { NextRequest, NextResponse } from 'next/server'

// TODO: This route needs to be refactored to use Profile model instead of User model
// Also needs to fix Gender enum values (use uppercase) and emergency contact structure
// Temporarily disabled until properly refactored

export async function POST(request: NextRequest) {
  return NextResponse.json(
    { error: 'PatientRegistration feature needs refactoring to use Profile model and fix data structures' },
    { status: 501 }
  )
}

export async function GET(request: NextRequest) {
  return NextResponse.json(
    { error: 'PatientRegistration feature needs refactoring to use Profile model and fix data structures' },
    { status: 501 }
  )
}

export async function PUT(request: NextRequest) {
  return NextResponse.json(
    { error: 'PatientRegistration feature needs refactoring to use Profile model and fix data structures' },
    { status: 501 }
  )
}
