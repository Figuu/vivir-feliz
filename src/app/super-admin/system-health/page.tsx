'use client'

import { SystemHealthMonitor } from '@/components/super-admin/system-health-monitor'

export default function SystemHealthPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">System Health Monitoring</h1>
        <p className="text-muted-foreground">
          Real-time system health and performance monitoring
        </p>
      </div>
      
      <SystemHealthMonitor />
    </div>
  )
}
