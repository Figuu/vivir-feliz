'use client'

import { ParentRescheduleRequest } from '@/components/parent-portal/parent-reschedule-request'

export default function ParentReschedulePage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Reschedule Requests</h1>
        <p className="text-muted-foreground">
          Request to reschedule upcoming therapy sessions
        </p>
      </div>
      
      <ParentRescheduleRequest 
        patientId="patient-1" 
        parentId="parent-1"
      />
    </div>
  )
}
