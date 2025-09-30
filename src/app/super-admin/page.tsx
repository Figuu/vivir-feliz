'use client'

import { SuperAdminDashboard } from '@/components/super-admin/super-admin-dashboard'

export default function SuperAdminPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Super Administrator</h1>
        <p className="text-muted-foreground">
          Centralized control panel for system oversight
        </p>
      </div>
      
      <SuperAdminDashboard />
    </div>
  )
}
