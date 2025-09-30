'use client'

import { NotificationTemplateManager } from '@/components/notifications/notification-template-manager'

export default function NotificationTemplatesPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Notification Templates</h1>
        <p className="text-muted-foreground">
          Configure email, SMS, and in-app notification templates
        </p>
      </div>
      
      <NotificationTemplateManager />
    </div>
  )
}
