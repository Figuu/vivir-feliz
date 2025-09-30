'use client'

import { FileStorageManager } from '@/components/admin/file-storage-manager'

export default function FileStoragePage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">File Storage & Document Management</h1>
        <p className="text-muted-foreground">
          Manage file storage buckets and document uploads
        </p>
      </div>
      
      <FileStorageManager />
    </div>
  )
}
