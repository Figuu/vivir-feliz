'use client'

import { APIDocumentationViewer } from '@/components/admin/api-documentation-viewer'

export default function APIDocsPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">API Documentation</h1>
        <p className="text-muted-foreground">
          Interactive API reference and testing tools
        </p>
      </div>
      
      <APIDocumentationViewer />
    </div>
  )
}
