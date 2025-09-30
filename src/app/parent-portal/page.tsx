'use client'

import { ParentDashboard } from '@/components/parent-portal/parent-dashboard'

export default function ParentPortalPage() {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Parent Portal</h1>
      <ParentDashboard parentId="parent-1" />
    </div>
  )
}
