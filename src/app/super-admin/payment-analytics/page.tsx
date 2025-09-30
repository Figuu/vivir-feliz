'use client'

import { PaymentAnalyticsTracker } from '@/components/super-admin/payment-analytics-tracker'

export default function PaymentAnalyticsPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Payment Analytics</h1>
        <p className="text-muted-foreground">
          Advanced payment analytics and tracking for super administrators
        </p>
      </div>
      
      <PaymentAnalyticsTracker />
    </div>
  )
}
