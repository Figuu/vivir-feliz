'use client'

import { ComprehensiveFinancialReports } from '@/components/super-admin/comprehensive-financial-reports'

export default function FinancialReportsPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Financial Reports</h1>
        <p className="text-muted-foreground">
          Comprehensive financial reporting and analysis
        </p>
      </div>
      
      <ComprehensiveFinancialReports />
    </div>
  )
}
