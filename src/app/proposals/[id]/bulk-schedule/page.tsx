'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  ArrowLeft,
  Calendar,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Users,
  Package,
  DollarSign,
  Clock,
  BarChart3
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { BulkSessionScheduler } from '@/components/sessions/bulk-session-scheduler'
import { useProposals } from '@/hooks/use-proposals'

export default function BulkSchedulePage() {
  const params = useParams()
  const router = useRouter()
  const proposalId = params.id as string
  
  const [proposal, setProposal] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [schedulingResult, setSchedulingResult] = useState<any>(null)
  const [showScheduler, setShowScheduler] = useState(true)

  const { getProposal } = useProposals()

  // Load proposal data
  useEffect(() => {
    if (proposalId) {
      loadProposal()
    }
  }, [proposalId])

  const loadProposal = async () => {
    try {
      setLoading(true)
      setError(null)

      const proposalData = await getProposal(proposalId)
      setProposal(proposalData)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load proposal'
      setError(errorMessage)
      console.error('Error loading proposal:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSchedulingSuccess = (result: any) => {
    setSchedulingResult(result)
    setShowScheduler(false)
  }

  const handleBackToScheduler = () => {
    setSchedulingResult(null)
    setShowScheduler(true)
  }

  const handleGoToSessions = () => {
    router.push('/sessions')
  }

  const handleGoToProposal = () => {
    router.push(`/proposals/${proposalId}`)
  }

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin mr-2" />
            <span>Loading proposal...</span>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error && !proposal) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="py-8">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {error}
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={loadProposal}
                  className="ml-4"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry
                </Button>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!proposal) return null

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Bulk Session Scheduling</h1>
            <p className="text-muted-foreground">
              Schedule multiple sessions for approved proposal
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={handleGoToProposal}>
            View Proposal
          </Button>
          <Button variant="outline" onClick={handleGoToSessions}>
            View Sessions
          </Button>
        </div>
      </div>

      {/* Proposal Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Package className="h-5 w-5 mr-2" />
            Proposal Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label className="text-sm font-medium">Patient</Label>
              <p className="text-sm">
                {proposal.patient.firstName} {proposal.patient.lastName}
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium">Therapist</Label>
              <p className="text-sm">
                {proposal.therapist.firstName} {proposal.therapist.lastName}
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium">Status</Label>
              <Badge variant="outline">
                {proposal.status}
              </Badge>
            </div>
            <div>
              <Label className="text-sm font-medium">Selected Proposal</Label>
              <Badge variant="outline">
                Proposal {proposal.selectedProposal}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <AnimatePresence mode="wait">
        {showScheduler ? (
          <motion.div
            key="scheduler"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <BulkSessionScheduler
              proposalId={proposalId}
              onSuccess={handleSchedulingSuccess}
              onCancel={() => router.back()}
            />
          </motion.div>
        ) : (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {/* Scheduling Results */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
                  Scheduling Complete
                </CardTitle>
                <CardDescription>
                  Bulk session scheduling has been completed successfully
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Summary Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {schedulingResult.summary.totalSessionsCreated}
                      </div>
                      <div className="text-sm text-muted-foreground">Sessions Created</div>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {schedulingResult.summary.servicesProcessed}
                      </div>
                      <div className="text-sm text-muted-foreground">Services Processed</div>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">
                        {schedulingResult.summary.autoResolvedConflicts}
                      </div>
                      <div className="text-sm text-muted-foreground">Conflicts Resolved</div>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-red-600">
                        {schedulingResult.summary.totalErrors}
                      </div>
                      <div className="text-sm text-muted-foreground">Errors</div>
                    </div>
                  </div>

                  {/* Service Assignments */}
                  {schedulingResult.serviceAssignments.length > 0 && (
                    <div>
                      <h3 className="font-medium mb-3">Service Assignments Created</h3>
                      <div className="space-y-2">
                        {schedulingResult.serviceAssignments.map((assignment: any, index: number) => (
                          <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                            <div>
                              <p className="font-medium">{assignment.service.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {assignment.totalSessions} sessions • ${assignment.costPerSession} per session
                              </p>
                            </div>
                            <Badge variant="outline">{assignment.status}</Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Errors */}
                  {schedulingResult.errors.length > 0 && (
                    <div>
                      <h3 className="font-medium mb-3 text-red-600">Scheduling Errors</h3>
                      <div className="space-y-2">
                        {schedulingResult.errors.slice(0, 5).map((error: any, index: number) => (
                          <Alert key={index} variant="destructive">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>
                              <div className="font-medium">{error.serviceName}</div>
                              <div className="text-sm">
                                {new Date(error.date).toLocaleDateString()} at {error.time}
                              </div>
                              <div className="text-sm">{error.error}</div>
                            </AlertDescription>
                          </Alert>
                        ))}
                        {schedulingResult.errors.length > 5 && (
                          <p className="text-sm text-muted-foreground">
                            ... and {schedulingResult.errors.length - 5} more errors
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between pt-4">
                    <Button variant="outline" onClick={handleBackToScheduler}>
                      <Calendar className="h-4 w-4 mr-2" />
                      Schedule More Sessions
                    </Button>
                    <div className="flex space-x-2">
                      <Button variant="outline" onClick={handleGoToProposal}>
                        View Proposal
                      </Button>
                      <Button onClick={handleGoToSessions}>
                        <BarChart3 className="h-4 w-4 mr-2" />
                        View All Sessions
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
