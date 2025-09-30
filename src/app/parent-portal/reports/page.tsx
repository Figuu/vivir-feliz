'use client'

import { ParentReportViewer } from '@/components/parent-portal/parent-report-viewer'

export default function ParentReportsPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">My Child's Reports</h1>
        <p className="text-muted-foreground">
          View and download approved therapy reports
        </p>
      </div>
      
      <ParentReportViewer 
        patientId="patient-1" 
        parentEmail="parent@example.com"
      />
    </div>
  )
}
