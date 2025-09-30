'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  FileText,
  CheckCircle,
  RefreshCw,
  Settings,
  Info
} from 'lucide-react'
import { ReportCompilationInterface } from '@/components/final-report-compilation/report-compilation-interface'
import { useState } from 'react'

export default function FinalReportCompilationPage() {
  const [activeTab, setActiveTab] = useState('compilation')

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Final Report Compilation</h1>
          <p className="text-muted-foreground">
            Compile approved reports into comprehensive final reports
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
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="compilation">Compilation</TabsTrigger>
          <TabsTrigger value="guidelines">Guidelines</TabsTrigger>
        </TabsList>

        <TabsContent value="compilation" className="space-y-4">
          <ReportCompilationInterface />
        </TabsContent>

        <TabsContent value="guidelines" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Info className="h-5 w-5 mr-2" />
                Compilation Guidelines
              </CardTitle>
              <CardDescription>
                Best practices for creating comprehensive final report compilations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold mb-3">Purpose of Final Compilation</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    The final report compilation provides a comprehensive overview of the patient's treatment journey by synthesizing multiple approved reports into a single, cohesive document. This compilation serves as the definitive record of treatment outcomes and recommendations.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Compilation Best Practices</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span><strong>Executive Summary:</strong> Provide a concise overview highlighting key outcomes and recommendations</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span><strong>Overall Assessment:</strong> Synthesize findings from all included reports into a coherent narrative</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span><strong>Key Findings:</strong> Extract and consolidate the most important findings from all reports</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span><strong>Recommendations:</strong> Provide clear, actionable recommendations with timelines and responsible parties</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span><strong>Treatment Outcomes:</strong> Compare initial and current status, documenting progress and improvements</span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Report Selection</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span>Include all approved reports relevant to the treatment period</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span>Order reports chronologically or by importance</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span>Ensure all report types are represented (plans, progress, assessments)</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span>Verify that included reports provide a complete treatment picture</span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Quality Standards</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                      <span>Maintain professional language and formatting throughout</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                      <span>Ensure consistency in terminology and assessments</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                      <span>Verify accuracy of all data and information</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                      <span>Review for completeness and clarity before finalizing</span>
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
