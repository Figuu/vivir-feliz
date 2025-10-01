'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  FileText,
  Target,
  BarChart3,
  CheckCircle,
  Info,
  Settings,
  RefreshCw,
  Download,
  Eye,
  Plus,
  Shield
} from 'lucide-react'
import { FinalReportCreationForm } from '@/components/final-reports/final-report-creation-form'

export default function CreateFinalReportPage() {
  const [activeTab, setActiveTab] = useState('form')
  const [createdReport, setCreatedReport] = useState<any>(null)

  const handleReportCreated = (report: any) => {
    setCreatedReport(report)
    setActiveTab('success')
  }

  const handleCancel = () => {
    // Navigate back or reset form
    console.log('Form cancelled')
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Create Final Report</h1>
          <p className="text-muted-foreground">
            Create a comprehensive final report after treatment completion
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="form">Create Report</TabsTrigger>
          <TabsTrigger value="success">Success</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
        </TabsList>

        <TabsContent value="form" className="space-y-4">
          <FinalReportCreationForm
            patientId="patient-1"
            therapistId="therapist-1"
            sessionId="session-final"
            therapeuticPlanId="plan-1"
            onReportCreated={handleReportCreated}
            onCancel={handleCancel}
          />
        </TabsContent>

        <TabsContent value="success" className="space-y-4">
          {createdReport ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
                  Report Created Successfully
                </CardTitle>
                <CardDescription>
                  Your final report has been created and is ready for review
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold mb-2">Report Details</h3>
                    <div className="space-y-2 text-sm">
                      <div><span className="font-medium">Title:</span> {createdReport.title}</div>
                      <div><span className="font-medium">Patient:</span> {createdReport.patient?.firstName} {createdReport.patient?.lastName}</div>
                      <div><span className="font-medium">Therapist:</span> {createdReport.therapist?.firstName} {createdReport.therapist?.lastName}</div>
                      <div><span className="font-medium">Total Sessions:</span> {createdReport.totalSessions}</div>
                      <div><span className="font-medium">Effectiveness:</span> {createdReport.overallEffectiveness}</div>
                      <div><span className="font-medium">Discharge Status:</span> {createdReport.dischargeStatus}</div>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Treatment Summary</h3>
                    <div className="space-y-2 text-sm">
                      <div><span className="font-medium">Start Date:</span> {createdReport.treatmentStartDate ? new Date(createdReport.treatmentStartDate).toLocaleDateString() : 'Not set'}</div>
                      <div><span className="font-medium">End Date:</span> {createdReport.treatmentEndDate ? new Date(createdReport.treatmentEndDate).toLocaleDateString() : 'Not set'}</div>
                      <div><span className="font-medium">Effectiveness Rating:</span> {createdReport.effectivenessRating}/10</div>
                      <div><span className="font-medium">Patient Satisfaction:</span> {createdReport.patientSatisfaction}/10</div>
                      <div><span className="font-medium">Therapist Satisfaction:</span> {createdReport.therapistSatisfaction}/10</div>
                      <div><span className="font-medium">Status:</span> {createdReport.status}</div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 pt-4">
                  <Button onClick={() => setActiveTab('form')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Another Report
                  </Button>
                  <Button variant="outline">
                    <Eye className="h-4 w-4 mr-2" />
                    View Report
                  </Button>
                  <Button variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Export Report
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Report Created</h3>
                <p className="text-muted-foreground">
                  Create a final report to see the success details here.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="features" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Target className="h-5 w-5 mr-2" />
                  Outcome Measurements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Initial vs final value comparison</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Improvement percentage calculation</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Metric type validation</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Outcome notes documentation</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Measurement date tracking</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Clinical Assessment
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Comprehensive effectiveness evaluation</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Patient and therapist satisfaction</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Functional improvements tracking</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Behavioral and emotional changes</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Social functioning assessment</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="h-5 w-5 mr-2" />
                  Recommendation Formatting
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Structured recommendation types</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Priority-based organization</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Timeframe and responsibility tracking</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Implementation status monitoring</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Follow-up and maintenance planning</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Feature Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Info className="h-5 w-5 mr-2" />
                Final Report Creation Overview
              </CardTitle>
              <CardDescription>
                Comprehensive final reporting with outcome measurements and recommendation formatting
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3">Report Features</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Multi-step form with validation</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Outcome measurements with validation</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Recommendation formatting with validation</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Treatment completion assessment</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Discharge planning and documentation</span>
                    </li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-3">Validation Features</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Real-time form validation</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Date logic validation</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Text length limits and enforcement</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Numeric range validation</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Required field validation</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
