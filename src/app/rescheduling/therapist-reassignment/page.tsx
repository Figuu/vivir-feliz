'use client'

import { TherapistReassignmentInterface } from '@/components/rescheduling/therapist-reassignment-interface'

export default function TherapistReassignmentPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Therapist Reassignment</h1>
        <p className="text-muted-foreground">
          Change therapist assignments for scheduled sessions
        </p>
      </div>
      
      <TherapistReassignmentInterface />
    </div>
  )
}
