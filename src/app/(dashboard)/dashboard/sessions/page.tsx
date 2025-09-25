import { SessionManagement } from '@/components/dashboard/session-management'

export default function SessionsPage() {
  return (
    <div className="flex-1 space-y-4 p-4 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Session Management</h2>
      </div>
      <SessionManagement />
    </div>
  )
}