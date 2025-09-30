'use client'

import { SystemConfigurationManager } from '@/components/super-admin/system-configuration-manager'

export default function SystemConfigurationPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">System Configuration</h1>
        <p className="text-muted-foreground">
          Configure system-wide settings and preferences
        </p>
      </div>
      
      <SystemConfigurationManager />
    </div>
  )
}
