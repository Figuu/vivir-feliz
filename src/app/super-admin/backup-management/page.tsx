'use client'

import { BackupDataManagement } from '@/components/super-admin/backup-data-management'

export default function BackupManagementPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Backup & Data Management</h1>
        <p className="text-muted-foreground">
          Create, restore, and manage system backups
        </p>
      </div>
      
      <BackupDataManagement />
    </div>
  )
}
