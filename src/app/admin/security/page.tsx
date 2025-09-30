'use client'

import { SecurityConfiguration } from '@/components/admin/security-configuration'

export default function SecurityPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Security Configuration</h1>
        <p className="text-muted-foreground">
          View current security settings and measures
        </p>
      </div>
      
      <SecurityConfiguration />
    </div>
  )
}
