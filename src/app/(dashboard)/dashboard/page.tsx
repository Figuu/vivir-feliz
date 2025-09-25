import { AnalyticsDashboard } from '@/components/dashboard/analytics-widgets'
import { AdminSetup } from '@/components/dashboard/admin-setup'
import { WelcomeMessage } from '@/components/dashboard/welcome-message'
import { Suspense } from 'react'

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome to your dashboard. Here&apos;s an overview of your application.
        </p>
      </div>

      <Suspense fallback={null}>
        <WelcomeMessage />
      </Suspense>
      
      <AdminSetup />
      <AnalyticsDashboard />
    </div>
  )
}