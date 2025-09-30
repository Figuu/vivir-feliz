'use client'

import { ReschedulingHistoryViewer } from '@/components/rescheduling/rescheduling-history-viewer'

export default function ReschedulingHistoryPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Rescheduling History</h1>
        <p className="text-muted-foreground">
          View complete history of all rescheduling requests and their outcomes
        </p>
      </div>
      
      <ReschedulingHistoryViewer />
    </div>
  )
}
