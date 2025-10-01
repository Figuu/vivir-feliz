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
import { TherapeuticPlanCreationForm } from '@/components/therapeutic-plans/therapeutic-plan-creation-form'

export default function CreateTherapeuticPlanPage() {
  const [activeTab, setActiveTab] = useState('form')
  const [createdPlan, setCreatedPlan] = useState<any>(null)

  const handlePlanCreated = (plan: any) => {
    setCreatedPlan(plan)
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
          <h1 className="text-3xl font-bold">Create Therapeutic Plan</h1>
          <p className="text-muted-foreground">
            Create a comprehensive therapeutic plan after the first session
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
          <TabsTrigger value="form">Create Plan</TabsTrigger>
          <TabsTrigger value="success">Success</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
        </TabsList>

        <TabsContent value="form" className="space-y-4">
          <TherapeuticPlanCreationForm
            patientId="patient-1"
            therapistId="therapist-1"
            sessionId="session-1"
            onPlanCreated={handlePlanCreated}
            onCancel={handleCancel}
          />
        </TabsContent>

        <TabsContent value="success" className="space-y-4">
          {createdPlan ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
                  Plan Created Successfully
                </CardTitle>
                <CardDescription>
                  Your therapeutic plan has been created and is ready for use
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold mb-2">Plan Details</h3>
                    <div className="space-y-2 text-sm">
                      <div><span className="font-medium">Title:</span> {createdPlan.title}</div>
                      <div><span className="font-medium">Patient:</span> {createdPlan.patient?.firstName} {createdPlan.patient?.lastName}</div>
                      <div><span className="font-medium">Therapist:</span> {createdPlan.therapist?.firstName} {createdPlan.therapist?.lastName}</div>
                      <div><span className="font-medium">Duration:</span> {createdPlan.estimatedDuration} weeks</div>
                      <div><span className="font-medium">Frequency:</span> {createdPlan.frequency}</div>
                      <div><span className="font-medium">Status:</span> {createdPlan.status}</div>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Objectives & Metrics</h3>
                    <div className="space-y-2 text-sm">
                      <div><span className="font-medium">Total Objectives:</span> {createdPlan.objectives?.length || 0}</div>
                      <div><span className="font-medium">Total Metrics:</span> {createdPlan.objectives?.reduce((sum: number, obj: any) => sum + (obj.metrics?.length || 0), 0) || 0}</div>
                      <div><span className="font-medium">Next Review:</span> {createdPlan.nextReviewDate ? new Date(createdPlan.nextReviewDate).toLocaleDateString() : 'Not set'}</div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 pt-4">
                  <Button onClick={() => setActiveTab('form')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Another Plan
                  </Button>
                  <Button variant="outline">
                    <Eye className="h-4 w-4 mr-2" />
                    View Plan
                  </Button>
                  <Button variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Export Plan
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Plan Created</h3>
                <p className="text-muted-foreground">
                  Create a therapeutic plan to see the success details here.
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
                  Objective Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Multi-category objectives</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Priority-based organization</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Target date tracking</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Progress measurement</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Validation and formatting</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Metrics & Measurement
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Multiple metric types</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Numeric range validation</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Scale-based measurements</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Text length limits</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Frequency tracking</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="h-5 w-5 mr-2" />
                  Validation & Security
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Comprehensive input validation</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Text length enforcement</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Numeric range validation</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Date validation</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Required field enforcement</span>
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
                Therapeutic Plan Creation Overview
              </CardTitle>
              <CardDescription>
                Comprehensive therapeutic plan creation with validation and measurement
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3">Form Features</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Multi-step form with validation</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Objective formatting and categorization</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Metric range validation</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Text length limits and enforcement</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Risk assessment and safety planning</span>
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
                      <span>Numeric range and scale validation</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Date and time validation</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Required field validation</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Character limit enforcement</span>
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
