'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { TrendingUp, Calendar } from 'lucide-react'

export function ParentProgressView({ patientId }: { patientId: string }) {
  const [progress, setProgress] = useState<any[]>([])

  useEffect(() => {
    fetch(`/api/patient-progress?patientId=${patientId}`)
      .then(res => res.json())
      .then(data => setProgress(data.data?.progressEntries || []))
  }, [patientId])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <TrendingUp className="h-5 w-5 mr-2" />
          Patient Progress
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {progress.slice(0, 5).map((entry) => (
            <div key={entry.id} className="border rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold">{entry.title}</h4>
                <Badge>{entry.entryType}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">{entry.description}</p>
              <div className="flex items-center space-x-2">
                <Progress value={entry.overallProgress} className="flex-1" />
                <span className="text-sm font-medium">{entry.overallProgress}%</span>
              </div>
              <div className="text-xs text-muted-foreground">
                {new Date(entry.entryDate).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
