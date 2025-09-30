'use client'

import { ReschedulingApprovalInterface } from '@/components/rescheduling/rescheduling-approval-interface'

export default function ReschedulingApprovalPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Rescheduling Approval</h1>
        <p className="text-muted-foreground">
          Review and approve parent rescheduling requests
        </p>
      </div>
      
      <ReschedulingApprovalInterface coordinatorId="coordinator-1" />
    </div>
  )
}
