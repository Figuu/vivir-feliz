'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock } from 'lucide-react'

export function ParentSessionView({ patientId }: { patientId: string }) {
  const [sessions, setSessions] = useState<any[]>([])

  useEffect(() => {
    fetch(`/api/sessions?patientId=${patientId}`)
      .then(res => res.json())
      .then(data => setSessions(data.data?.sessions || []))
  }, [patientId])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Calendar className="h-5 w-5 mr-2" />
          Session Schedule
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sessions.map((session) => (
            <div key={session.id} className="border rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <Badge>{session.status}</Badge>
                <span className="text-sm">{session.therapist?.firstName} {session.therapist?.lastName}</span>
              </div>
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center space-x-1">
                  <Calendar className="h-4 w-4" />
                  <span>{new Date(session.scheduledDate).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Clock className="h-4 w-4" />
                  <span>{session.scheduledTime}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
