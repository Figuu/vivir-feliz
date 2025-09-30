'use client'

import { MonitoringDashboard } from '@/components/admin/monitoring-dashboard'

export default function MonitoringPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Monitoring & Logging</h1>
        <p className="text-muted-foreground">
          System monitoring and logging configuration
        </p>
      </div>
      
      <MonitoringDashboard />
    </div>
  )
}
