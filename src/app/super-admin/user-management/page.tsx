'use client'

import { AdvancedUserManagement } from '@/components/super-admin/advanced-user-management'

export default function SuperAdminUserManagementPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Advanced User Management</h1>
        <p className="text-muted-foreground">
          Comprehensive user management for super administrators
        </p>
      </div>
      
      <AdvancedUserManagement />
    </div>
  )
}
