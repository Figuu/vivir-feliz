'use client'

import { ErrorReportingDashboard } from '@/components/admin/error-reporting-dashboard'

export default function ErrorReportingPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Error Reporting</h1>
        <p className="text-muted-foreground">
          Monitor and manage system errors
        </p>
      </div>
      
      <ErrorReportingDashboard />
    </div>
  )
}
