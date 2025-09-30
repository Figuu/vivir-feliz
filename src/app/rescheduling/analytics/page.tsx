'use client'

import { ReschedulingAnalyticsDashboard } from '@/components/rescheduling/rescheduling-analytics-dashboard'

export default function ReschedulingAnalyticsPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Rescheduling Analytics</h1>
        <p className="text-muted-foreground">
          Comprehensive analytics and insights on rescheduling patterns
        </p>
      </div>
      
      <ReschedulingAnalyticsDashboard />
    </div>
  )
}
