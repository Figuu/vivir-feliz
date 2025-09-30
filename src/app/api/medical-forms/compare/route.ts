import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const v1Id = searchParams.get('v1')
    const v2Id = searchParams.get('v2')

    if (!v1Id || !v2Id) {
      return NextResponse.json(
        { error: 'Both version IDs are required' },
        { status: 400 }
      )
    }

    // Fetch both versions from database
    const [version1, version2] = await Promise.all([
      db.medicalForm.findUnique({ where: { id: v1Id } }),
      db.medicalForm.findUnique({ where: { id: v2Id } })
    ])

    if (!version1 || !version2) {
      return NextResponse.json({ error: 'Version not found' }, { status: 404 })
    }

    // Compare the two versions
    const comparison = compareMedicalForms(version1, version2)

    return NextResponse.json(comparison)
  } catch (error) {
    console.error('Error comparing medical forms:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function to compare two medical forms
function compareMedicalForms(v1: any, v2: any) {
  const added: Array<{ field: string; value: string }> = []
  const modified: Array<{ field: string; oldValue: string; newValue: string }> = []
  const deleted: Array<{ field: string }> = []

  const fields = [
    'birthComplications',
    'medicalConditions',
    'allergies',
    'currentMedications',
    'previousSurgeries',
    'familyMedicalHistory',
    'behavioralConcerns',
    'socialSkills',
    'communicationSkills',
    'learningDifficulties',
    'academicPerformance',
    'sleepPatterns',
    'eatingHabits',
    'dailyRoutines',
    'stressFactors'
  ]

  fields.forEach(field => {
    const val1 = v1[field]
    const val2 = v2[field]

    // Field was added in v2
    if (!val1 && val2) {
      added.push({
        field: formatFieldName(field),
        value: String(val2)
      })
    }
    // Field was removed in v2
    else if (val1 && !val2) {
      deleted.push({
        field: formatFieldName(field)
      })
    }
    // Field was modified
    else if (val1 !== val2 && val1 && val2) {
      modified.push({
        field: formatFieldName(field),
        oldValue: String(val1),
        newValue: String(val2)
      })
    }
  })

  return {
    added,
    modified,
    deleted,
    summary: {
      totalChanges: added.length + modified.length + deleted.length,
      fieldsAdded: added.length,
      fieldsModified: modified.length,
      fieldsDeleted: deleted.length
    }
  }
}

// Helper to format field names for display
function formatFieldName(field: string): string {
  return field
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim()
}
