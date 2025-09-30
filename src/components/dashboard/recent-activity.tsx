'use client'

import { useQuery } from '@tanstack/react-query'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'

interface AuditLog {
  id: string
  action: string
  userId?: string
  user?: {
    name?: string
    email?: string
    avatar?: string
  }
  resource: string
  success: boolean
  createdAt: string
}

const formatActionText = (action: string): string => {
  return action.toLowerCase().replace(/_/g, ' ')
}

export function RecentActivity() {
  const { data: auditLogs, isLoading } = useQuery<AuditLog[]>({
    queryKey: ['recent-activity'],
    queryFn: async () => {
      const response = await fetch('/api/audit?limit=5')
      if (!response.ok) {
        throw new Error('Failed to fetch recent activity')
      }
      const result = await response.json()
      return result.logs || []
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Actividad Reciente</CardTitle>
        <CardDescription>
          Últimas actividades de usuarios en el sistema
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
          {isLoading ? (
            <>
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="flex items-center">
                  <Skeleton className="h-9 w-9 rounded-full" />
                  <div className="ml-4 space-y-2">
                    <Skeleton className="h-4 w-[200px]" />
                    <Skeleton className="h-3 w-[150px]" />
                  </div>
                </div>
              ))}
            </>
          ) : auditLogs && auditLogs.length > 0 ? (
            auditLogs.map((log) => {
              const userName = log.user?.name || log.user?.email || 'Usuario desconocido'
              const initials = userName
                .split(' ')
                .map(n => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2)
              const timeAgo = formatDistanceToNow(new Date(log.createdAt), {
                addSuffix: true,
                locale: es,
              })

              return (
                <div key={log.id} className="flex items-center">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={log.user?.avatar} alt={userName} />
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                  <div className="ml-4 space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {userName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatActionText(log.action)} • {timeAgo}
                    </p>
                  </div>
                </div>
              )
            })
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              No hay actividad reciente
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}