'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  User, 
  Calendar, 
  Clock, 
  Search,
  Loader2,
  Brain,
  TrendingUp,
  Users,
  Award
} from 'lucide-react'
import { motion } from 'framer-motion'
import { TherapistAssignmentResult } from '@/components/consultation/therapist-assignment-result'
import { useTherapistAssignment, AssignmentResult, TherapistScore } from '@/hooks/use-therapist-assignment'

export default function TestTherapistAssignmentPage() {
  const [assignmentCriteria, setAssignmentCriteria] = useState({
    specialtyId: '',
    date: '',
    time: '',
    duration: 60,
    patientAge: undefined as number | undefined,
    patientGender: '',
    urgency: 'MEDIUM' as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT',
    preferredTherapistId: '',
    excludeTherapistIds: '',
    maxWorkload: 8
  })

  const [assignmentResult, setAssignmentResult] = useState<AssignmentResult | null>(null)
  const [selectedTherapistId, setSelectedTherapistId] = useState<string>('')
  const [selectedTherapistName, setSelectedTherapistName] = useState<string>('')

  const { assignTherapist, loading, error } = useTherapistAssignment()

  const handleAssignTherapist = async () => {
    if (!assignmentCriteria.specialtyId || !assignmentCriteria.date || !assignmentCriteria.time) {
      alert('Please fill in all required fields (Specialty, Date, Time)')
      return
    }

    try {
      const criteria = {
        ...assignmentCriteria,
        patientAge: assignmentCriteria.patientAge || undefined,
        patientGender: assignmentCriteria.patientGender || undefined,
        preferredTherapistId: assignmentCriteria.preferredTherapistId || undefined,
        excludeTherapistIds: assignmentCriteria.excludeTherapistIds 
          ? assignmentCriteria.excludeTherapistIds.split(',').map(id => id.trim())
          : undefined
      }

      const result = await assignTherapist(criteria)
      setAssignmentResult(result)
    } catch (err) {
      console.error('Error assigning therapist:', err)
    }
  }

  const handleTherapistSelect = (therapistId: string, therapistName: string) => {
    setSelectedTherapistId(therapistId)
    setSelectedTherapistName(therapistName)
    console.log('Selected therapist:', therapistId, therapistName)
  }

  const handleAlternativeSelect = (therapist: TherapistScore) => {
    setSelectedTherapistId(therapist.therapistId)
    setSelectedTherapistName(therapist.therapistName)
    console.log('Selected alternative therapist:', therapist)
  }

  const getTodayDate = () => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  }

  const getMinDate = () => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  }

  const getMaxDate = () => {
    const maxDate = new Date()
    maxDate.setMonth(maxDate.getMonth() + 3) // 3 months in advance
    return maxDate.toISOString().split('T')[0]
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Therapist Assignment Test</h1>
          <p className="text-muted-foreground">
            Test the automatic therapist assignment system based on specialty and criteria
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column - Assignment Criteria */}
          <div className="space-y-6">
            {/* Assignment Criteria Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Assignment Criteria
                </CardTitle>
                <CardDescription>
                  Set the criteria for automatic therapist assignment
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Required Fields */}
                <div className="space-y-4">
                  <h4 className="font-medium text-sm text-muted-foreground">Required Fields</h4>
                  
                  <div>
                    <Label htmlFor="specialty">Specialty *</Label>
                    <Select 
                      value={assignmentCriteria.specialtyId} 
                      onValueChange={(value) => setAssignmentCriteria(prev => ({ ...prev, specialtyId: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select specialty" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Psicología Clínica</SelectItem>
                        <SelectItem value="2">Fonoaudiología</SelectItem>
                        <SelectItem value="3">Terapia Ocupacional</SelectItem>
                        <SelectItem value="4">Fisioterapia</SelectItem>
                        <SelectItem value="5">Psicopedagogía</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="date">Date *</Label>
                      <Input
                        id="date"
                        type="date"
                        value={assignmentCriteria.date}
                        onChange={(e) => setAssignmentCriteria(prev => ({ ...prev, date: e.target.value }))}
                        min={getMinDate()}
                        max={getMaxDate()}
                      />
                    </div>
                    <div>
                      <Label htmlFor="time">Time *</Label>
                      <Input
                        id="time"
                        type="time"
                        value={assignmentCriteria.time}
                        onChange={(e) => setAssignmentCriteria(prev => ({ ...prev, time: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="duration">Duration (minutes)</Label>
                      <Select 
                        value={assignmentCriteria.duration.toString()} 
                        onValueChange={(value) => setAssignmentCriteria(prev => ({ ...prev, duration: parseInt(value) }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="30">30 minutes</SelectItem>
                          <SelectItem value="45">45 minutes</SelectItem>
                          <SelectItem value="60">60 minutes</SelectItem>
                          <SelectItem value="90">90 minutes</SelectItem>
                          <SelectItem value="120">120 minutes</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="urgency">Urgency</Label>
                      <Select 
                        value={assignmentCriteria.urgency} 
                        onValueChange={(value: any) => setAssignmentCriteria(prev => ({ ...prev, urgency: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="LOW">Low</SelectItem>
                          <SelectItem value="MEDIUM">Medium</SelectItem>
                          <SelectItem value="HIGH">High</SelectItem>
                          <SelectItem value="URGENT">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Optional Fields */}
                <div className="space-y-4">
                  <h4 className="font-medium text-sm text-muted-foreground">Optional Fields</h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="patientAge">Patient Age</Label>
                      <Input
                        id="patientAge"
                        type="number"
                        min="0"
                        max="120"
                        value={assignmentCriteria.patientAge || ''}
                        onChange={(e) => setAssignmentCriteria(prev => ({ 
                          ...prev, 
                          patientAge: e.target.value ? parseInt(e.target.value) : undefined 
                        }))}
                        placeholder="Age in years"
                      />
                    </div>
                    <div>
                      <Label htmlFor="patientGender">Patient Gender</Label>
                      <Select 
                        value={assignmentCriteria.patientGender} 
                        onValueChange={(value) => setAssignmentCriteria(prev => ({ ...prev, patientGender: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Any</SelectItem>
                          <SelectItem value="MALE">Male</SelectItem>
                          <SelectItem value="FEMALE">Female</SelectItem>
                          <SelectItem value="OTHER">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="preferredTherapist">Preferred Therapist ID</Label>
                    <Input
                      id="preferredTherapist"
                      value={assignmentCriteria.preferredTherapistId}
                      onChange={(e) => setAssignmentCriteria(prev => ({ ...prev, preferredTherapistId: e.target.value }))}
                      placeholder="Therapist ID (optional)"
                    />
                  </div>

                  <div>
                    <Label htmlFor="excludeTherapists">Exclude Therapist IDs</Label>
                    <Input
                      id="excludeTherapists"
                      value={assignmentCriteria.excludeTherapistIds}
                      onChange={(e) => setAssignmentCriteria(prev => ({ ...prev, excludeTherapistIds: e.target.value }))}
                      placeholder="Comma-separated therapist IDs"
                    />
                  </div>

                  <div>
                    <Label htmlFor="maxWorkload">Max Daily Workload</Label>
                    <Input
                      id="maxWorkload"
                      type="number"
                      min="1"
                      max="20"
                      value={assignmentCriteria.maxWorkload}
                      onChange={(e) => setAssignmentCriteria(prev => ({ ...prev, maxWorkload: parseInt(e.target.value) }))}
                    />
                  </div>
                </div>

                <Button 
                  onClick={handleAssignTherapist}
                  disabled={loading || !assignmentCriteria.specialtyId || !assignmentCriteria.date || !assignmentCriteria.time}
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Assigning Therapist...
                    </>
                  ) : (
                    <>
                      <User className="mr-2 h-4 w-4" />
                      Assign Therapist
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Error Display */}
            {error && (
              <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 text-red-500">⚠</div>
                    <span className="text-sm text-red-700 dark:text-red-300">
                      {error}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Selected Therapist Summary */}
            {selectedTherapistId && (
              <Card className="border-primary bg-primary/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-primary" />
                    Selected Therapist
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{selectedTherapistName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">ID: {selectedTherapistId}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Assignment Results */}
          <div>
            {assignmentResult ? (
              <TherapistAssignmentResult
                result={assignmentResult}
                onTherapistSelect={handleTherapistSelect}
                onAlternativeSelect={handleAlternativeSelect}
                selectedTherapistId={selectedTherapistId}
              />
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Assignment Yet</h3>
                  <p className="text-muted-foreground">
                    Fill in the criteria and click "Assign Therapist" to see the results
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Debug Information */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Debug Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="font-medium">Specialty ID:</span>
                  <br />
                  {assignmentCriteria.specialtyId || 'None'}
                </div>
                <div>
                  <span className="font-medium">Date:</span>
                  <br />
                  {assignmentCriteria.date || 'None'}
                </div>
                <div>
                  <span className="font-medium">Time:</span>
                  <br />
                  {assignmentCriteria.time || 'None'}
                </div>
                <div>
                  <span className="font-medium">Duration:</span>
                  <br />
                  {assignmentCriteria.duration} minutes
                </div>
                <div>
                  <span className="font-medium">Urgency:</span>
                  <br />
                  {assignmentCriteria.urgency}
                </div>
                <div>
                  <span className="font-medium">Patient Age:</span>
                  <br />
                  {assignmentCriteria.patientAge || 'Any'}
                </div>
                <div>
                  <span className="font-medium">Max Workload:</span>
                  <br />
                  {assignmentCriteria.maxWorkload} per day
                </div>
                <div>
                  <span className="font-medium">Loading:</span>
                  <br />
                  {loading ? 'Yes' : 'No'}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
