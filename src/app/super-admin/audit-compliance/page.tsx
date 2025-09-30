'use client'

import { AuditComplianceReporting } from '@/components/super-admin/audit-compliance-reporting'

export default function AuditCompliancePage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Audit & Compliance</h1>
        <p className="text-muted-foreground">
          System audit logs and compliance reporting
        </p>
      </div>
      
      <AuditComplianceReporting />
    </div>
  )
}
