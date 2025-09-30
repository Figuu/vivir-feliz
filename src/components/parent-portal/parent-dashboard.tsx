'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ParentProgressView } from './parent-progress-view'
import { ParentSessionView } from './parent-session-view'
import { ParentPaymentView } from './parent-payment-view'

export function ParentDashboard({ parentId, patientId }: { parentId: string, patientId?: string }) {
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    fetch(`/api/parent-portal?action=dashboard&parentId=${parentId}${patientId ? `&patientId=${patientId}` : ''}`)
      .then(res => res.json())
      .then(result => setData(result.data))
  }, [parentId, patientId])

  if (!data) return <div>Loading...</div>

  const currentPatient = patientId ? data.patients.find((p: any) => p.id === patientId) : data.patients[0]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Upcoming Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.statistics.upcomingSessionsCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Recent Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.statistics.recentProgressCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Pending Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.statistics.pendingPaymentsCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total Patients</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.statistics.totalPatients}</div>
          </CardContent>
        </Card>
      </div>

      {currentPatient && (
        <Tabs defaultValue="progress">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="progress">Progress</TabsTrigger>
            <TabsTrigger value="sessions">Sessions</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
          </TabsList>
          <TabsContent value="progress">
            <ParentProgressView patientId={currentPatient.id} />
          </TabsContent>
          <TabsContent value="sessions">
            <ParentSessionView patientId={currentPatient.id} />
          </TabsContent>
          <TabsContent value="payments">
            <ParentPaymentView patientId={currentPatient.id} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
