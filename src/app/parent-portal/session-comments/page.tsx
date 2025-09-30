'use client'

import { SessionCommentsViewer } from '@/components/parent-portal/session-comments-viewer'

export default function SessionCommentsPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Session Comments & Notes</h1>
        <p className="text-muted-foreground">
          View therapist notes and interact with session comments
        </p>
      </div>
      
      <SessionCommentsViewer 
        patientId="patient-1" 
        parentId="parent-1"
      />
    </div>
  )
}
