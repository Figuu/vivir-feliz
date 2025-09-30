'use client'

import { ManualReschedulingInterface } from '@/components/rescheduling/manual-rescheduling-interface'

export default function ManualReschedulingPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Manual Session Rescheduling</h1>
        <p className="text-muted-foreground">
          Reschedule therapy sessions with date/time validation and conflict detection
        </p>
      </div>
      <ManualReschedulingInterface />
    </div>
  )
}
