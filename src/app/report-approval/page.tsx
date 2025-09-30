'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CheckCircle, RefreshCw, Settings, Info, Shield } from 'lucide-react'
import { useState } from 'react'

export default function ReportApprovalPage() {
  const [activeTab, setActiveTab] = useState('features')

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Report Approval API</h1>
          <p className="text-muted-foreground">
            Comprehensive approval workflow API for all report types
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

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-1">
          <TabsTrigger value="features">API Features & Documentation</TabsTrigger>
        </TabsList>

        <TabsContent value="features" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="h-5 w-5 mr-2" />
                  Approval Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Approve reports</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Reject reports</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Request revisions</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Delegate approvals</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Escalate issues</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Info className="h-5 w-5 mr-2" />
                  Advanced Features
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Bulk approvals</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Approval conditions</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Quality scoring</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Compliance checks</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Review time tracking</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Analytics & Stats
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Approval statistics</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Approval/rejection rates</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Average review time</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Pending approvals count</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Performance metrics</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Info className="h-5 w-5 mr-2" />
                Report Approval API Overview
              </CardTitle>
              <CardDescription>
                Comprehensive approval workflow API for all report types with role-based access control
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold mb-3">API Endpoints</h4>
                  <div className="space-y-3">
                    <div className="border-l-4 border-blue-500 pl-4 py-2">
                      <h5 className="font-medium mb-1">GET /api/report-approval</h5>
                      <p className="text-sm text-muted-foreground">
                        Get approval history with filtering by report, approver, action, date range. Supports pagination and sorting.
                      </p>
                    </div>
                    
                    <div className="border-l-4 border-green-500 pl-4 py-2">
                      <h5 className="font-medium mb-1">GET /api/report-approval?action=statistics</h5>
                      <p className="text-sm text-muted-foreground">
                        Get comprehensive approval statistics including total approvals, approval rates, average review time, and pending approvals.
                      </p>
                    </div>
                    
                    <div className="border-l-4 border-purple-500 pl-4 py-2">
                      <h5 className="font-medium mb-1">GET /api/report-approval?action=pending</h5>
                      <p className="text-sm text-muted-foreground">
                        Get pending approvals for a specific approver role (coordinator or administrator) with full report details.
                      </p>
                    </div>
                    
                    <div className="border-l-4 border-yellow-500 pl-4 py-2">
                      <h5 className="font-medium mb-1">POST /api/report-approval</h5>
                      <p className="text-sm text-muted-foreground">
                        Create approval actions (approve, reject, request revision, delegate, escalate) with comprehensive validation and metadata tracking.
                      </p>
                    </div>
                    
                    <div className="border-l-4 border-orange-500 pl-4 py-2">
                      <h5 className="font-medium mb-1">POST /api/report-approval (bulk)</h5>
                      <p className="text-sm text-muted-foreground">
                        Process bulk approvals for multiple reports at once. Supports up to 50 reports per request with detailed success/failure tracking.
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Supported Features</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span><strong>Role-Based Approval:</strong> Separate workflows for therapists, coordinators, and administrators</span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span><strong>Conditional Approval:</strong> Define and track approval conditions and requirements</span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span><strong>Quality Scoring:</strong> Track quality and completeness scores for each approval</span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span><strong>Compliance Checks:</strong> Automated compliance validation before approval</span>
                      </li>
                    </ul>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span><strong>Delegation Support:</strong> Delegate approval authority to other users</span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span><strong>Escalation Workflow:</strong> Escalate complex cases to higher authority</span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span><strong>Version Integration:</strong> Automatic version creation for all approval actions</span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span><strong>Comprehensive Audit Trail:</strong> Full history of all approval actions and decisions</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
