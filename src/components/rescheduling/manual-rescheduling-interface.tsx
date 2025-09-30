'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Calendar, Clock } from 'lucide-react'
import { toast } from 'sonner'

export function ManualReschedulingInterface() {
  const [loading, setLoading] = useState(false)
  const [sessions, setSessions] = useState<any[]>([])
  const [therapists, setTherapists] = useState<any[]>([])
  const [formData, setFormData] = useState({
    sessionId: '',
    newDate: '',
    newTime: '',
    reason: '',
    newTherapistId: '',
    notifyPatient: true,
    notifyTherapist: true,
    rescheduledBy: 'user-1'
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [sessionsRes, therapistsRes] = await Promise.all([
        fetch('/api/sessions?status=scheduled'),
        fetch('/api/therapist?limit=100')
      ])

      const [sessionsData, therapistsData] = await Promise.all([
        sessionsRes.json(),
        therapistsRes.json()
      ])

      if (sessionsRes.ok) setSessions(sessionsData.data?.sessions || [])
      if (therapistsRes.ok) setTherapists(therapistsData.data?.therapists || [])
    } catch (err) {
      console.error('Error loading data:', err)
    }
  }

  const handleReschedule = async () => {
    if (!formData.sessionId || !formData.newDate || !formData.newTime || !formData.reason) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      setLoading(true)
      const response = await fetch('/api/manual-rescheduling', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to reschedule session')
      }

      toast.success('Session rescheduled successfully')
      setFormData({
        sessionId: '',
        newDate: '',
        newTime: '',
        reason: '',
        newTherapistId: '',
        notifyPatient: true,
        notifyTherapist: true,
        rescheduledBy: 'user-1'
      })
      loadData()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reschedule'
      toast.error(errorMessage)
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manual Session Rescheduling</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Select Session *</Label>
          <Select value={formData.sessionId} onValueChange={(value) => setFormData(prev => ({ ...prev, sessionId: value }))}>
            <SelectTrigger>
              <SelectValue placeholder="Select session to reschedule" />
            </SelectTrigger>
            <SelectContent>
              {sessions.map((session) => (
                <SelectItem key={session.id} value={session.id}>
                  {session.patient?.firstName} {session.patient?.lastName} - {new Date(session.scheduledDate).toLocaleDateString()} {session.scheduledTime}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>New Date *</Label>
            <Input
              type="date"
              value={formData.newDate}
              onChange={(e) => setFormData(prev => ({ ...prev, newDate: e.target.value }))}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>
          <div>
            <Label>New Time *</Label>
            <Input
              type="time"
              value={formData.newTime}
              onChange={(e) => setFormData(prev => ({ ...prev, newTime: e.target.value }))}
            />
          </div>
        </div>

        <div>
          <Label>New Therapist (Optional)</Label>
          <Select value={formData.newTherapistId} onValueChange={(value) => setFormData(prev => ({ ...prev, newTherapistId: value }))}>
            <SelectTrigger>
              <SelectValue placeholder="Keep current therapist" />
            </SelectTrigger>
            <SelectContent>
              {therapists.map((therapist) => (
                <SelectItem key={therapist.id} value={therapist.id}>
                  {therapist.firstName} {therapist.lastName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Reason *</Label>
          <Textarea
            value={formData.reason}
            onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
            placeholder="Enter reason for rescheduling"
            rows={3}
            maxLength={500}
          />
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="notifyPatient"
              checked={formData.notifyPatient}
              onCheckedChange={(checked: boolean) => setFormData(prev => ({ ...prev, notifyPatient: checked }))}
            />
            <Label htmlFor="notifyPatient">Notify Patient</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="notifyTherapist"
              checked={formData.notifyTherapist}
              onCheckedChange={(checked: boolean) => setFormData(prev => ({ ...prev, notifyTherapist: checked }))}
            />
            <Label htmlFor="notifyTherapist">Notify Therapist</Label>
          </div>
        </div>

        <Button onClick={handleReschedule} disabled={loading} className="w-full">
          {loading ? 'Rescheduling...' : 'Reschedule Session'}
        </Button>
      </CardContent>
    </Card>
  )
}
