'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  FileText, 
  Download, 
  Eye, 
  Calendar,
  User,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from '@/hooks/use-toast'

interface ParentReportViewerProps {
  patientId: string
  parentEmail: string
}

interface Report {
  id: string
  reportType: string
  title: string
  description: string
  content: any
  createdAt: string
  therapist?: {
    firstName: string
    lastName: string
  }
  status: string
}

export function ParentReportViewer({ patientId, parentEmail }: ParentReportViewerProps) {
  const [loading, setLoading] = useState(false)
  const [reports, setReports] = useState<Report[]>([])
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('approved')

  useEffect(() => {
    loadReports()
  }, [patientId])

  const loadReports = async () => {
    try {
      setLoading(true)
      
      // Fetch approved reports from different sources
      const [therapeuticPlans, progressReports, finalReports, distributions] = await Promise.all([
        fetch(`/api/therapeutic-plans?patientId=${patientId}`).then(r => r.json()),
        fetch(`/api/progress-reports?patientId=${patientId}`).then(r => r.json()),
        fetch(`/api/final-reports?patientId=${patientId}`).then(r => r.json()),
        fetch(`/api/parent-report-distribution?parentEmail=${parentEmail}&patientId=${patientId}`).then(r => r.json())
      ])

      const allReports: Report[] = []

      // Add therapeutic plans
      if (therapeuticPlans.data) {
        allReports.push(...therapeuticPlans.data.map((r: any) => ({
          id: r.id,
          reportType: 'Therapeutic Plan',
          title: r.title || 'Therapeutic Plan',
          description: r.treatmentApproach?.approach || 'Treatment plan for patient',
          content: r,
          createdAt: r.createdAt,
          therapist: r.therapist,
          status: 'approved'
        })))
      }

      // Add progress reports
      if (progressReports.data) {
        allReports.push(...progressReports.data.map((r: any) => ({
          id: r.id,
          reportType: 'Progress Report',
          title: r.reportTitle || 'Progress Report',
          description: r.clinicalAssessment?.overallAssessment || 'Progress report',
          content: r,
          createdAt: r.createdAt,
          therapist: r.therapist,
          status: 'approved'
        })))
      }

      // Add final reports
      if (finalReports.data) {
        allReports.push(...finalReports.data.map((r: any) => ({
          id: r.id,
          reportType: 'Final Report',
          title: r.reportTitle || 'Final Report',
          description: r.dischargePlanning?.dischargeSummary || 'Final report',
          content: r,
          createdAt: r.createdAt,
          therapist: r.therapist,
          status: 'approved'
        })))
      }

      // Sort by date
      allReports.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

      setReports(allReports)
    } catch (err) {
      console.error('Error loading reports:', err)
      toast({
        variant: "destructive",
        title: "Error",
        description: 'Failed to load reports'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleViewReport = (report: Report) => {
    setSelectedReport(report)
    setViewDialogOpen(true)
  }

  const handleDownloadReport = async (report: Report) => {
    try {
      toast({
        title: "Info",
        description: 'Generating PDF...'
      })
      
      // Call PDF generation API
      const response = await fetch('/api/progress-reports/pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reportType: 'detailed',
          patientId: patientId,
          startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          endDate: new Date().toISOString().split('T')[0],
          options: {
            includeCharts: true,
            includeProgressData: true,
            includeRiskAssessment: true,
            includeGoals: true,
            includeRecommendations: true
          },
          customization: {
            title: report.title
          },
          generatedBy: 'parent-1'
        })
      })

      if (!response.ok) {
        throw new Error('Failed to generate PDF')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${report.title.replace(/\s+/g, '_')}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      toast({
        title: "Success",
        description: 'Report downloaded successfully'
      })
    } catch (err) {
      console.error('Error downloading report:', err)
      toast({
        variant: "destructive",
        title: "Error",
        description: 'Failed to download report'
      })
    }
  }

  const getReportTypeColor = (type: string) => {
    switch (type) {
      case 'Therapeutic Plan': return 'bg-blue-100 text-blue-800'
      case 'Progress Report': return 'bg-green-100 text-green-800'
      case 'Final Report': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Approved Reports
            </CardTitle>
            <Button variant="outline" size="sm" onClick={loadReports}>
              Refresh
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Reports List */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-1">
          <TabsTrigger value="approved">Approved Reports ({reports.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="approved" className="space-y-4">
          {loading ? (
            <Card>
              <CardContent className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-muted-foreground mt-2">Loading reports...</p>
              </CardContent>
            </Card>
          ) : reports.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Reports Available</h3>
                <p className="text-muted-foreground">
                  No approved reports are available for viewing yet.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {reports.map((report, index) => (
                <motion.div
                  key={report.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card>
                    <CardContent className="pt-6">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h3 className="font-semibold text-lg">{report.title}</h3>
                              <Badge className={getReportTypeColor(report.reportType)}>
                                {report.reportType}
                              </Badge>
                              <Badge variant="outline" className="bg-green-50">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Approved
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-3">
                              {report.description}
                            </p>
                            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                              {report.therapist && (
                                <div className="flex items-center space-x-1">
                                  <User className="h-4 w-4" />
                                  <span>{report.therapist.firstName} {report.therapist.lastName}</span>
                                </div>
                              )}
                              <div className="flex items-center space-x-1">
                                <Calendar className="h-4 w-4" />
                                <span>{new Date(report.createdAt).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2 ml-4">
                            <Button size="sm" variant="outline" onClick={() => handleViewReport(report)}>
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                            <Button size="sm" onClick={() => handleDownloadReport(report)}>
                              <Download className="h-4 w-4 mr-1" />
                              Download PDF
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* View Report Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedReport?.title}</DialogTitle>
            <DialogDescription>
              {selectedReport?.reportType} - {selectedReport && new Date(selectedReport.createdAt).toLocaleDateString()}
            </DialogDescription>
          </DialogHeader>
          
          {selectedReport && (
            <div className="space-y-6 py-4">
              {/* Therapeutic Plan Content */}
              {selectedReport.reportType === 'Therapeutic Plan' && (
                <div className="space-y-4">
                  {selectedReport.content.treatmentApproach && (
                    <div>
                      <h4 className="font-semibold mb-2">Treatment Approach</h4>
                      <p className="text-sm text-muted-foreground">{selectedReport.content.treatmentApproach.approach}</p>
                    </div>
                  )}
                  
                  {selectedReport.content.objectives && selectedReport.content.objectives.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2">Objectives</h4>
                      <div className="space-y-2">
                        {selectedReport.content.objectives.map((obj: any, index: number) => (
                          <div key={index} className="border-l-4 border-blue-500 pl-3 py-2">
                            <div className="font-medium">{obj.objective}</div>
                            <div className="text-sm text-muted-foreground">Category: {obj.category}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Progress Report Content */}
              {selectedReport.reportType === 'Progress Report' && (
                <div className="space-y-4">
                  {selectedReport.content.achievements && selectedReport.content.achievements.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2">Achievements</h4>
                      <div className="space-y-2">
                        {selectedReport.content.achievements.map((ach: any, index: number) => (
                          <div key={index} className="border rounded-lg p-3">
                            <div className="font-medium">{ach.objectiveTitle}</div>
                            <div className="text-sm">Progress: {ach.progressPercentage}%</div>
                            <div className="text-sm text-muted-foreground">{ach.description}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {selectedReport.content.clinicalAssessment && (
                    <div>
                      <h4 className="font-semibold mb-2">Clinical Assessment</h4>
                      <p className="text-sm text-muted-foreground">{selectedReport.content.clinicalAssessment.overallAssessment}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Final Report Content */}
              {selectedReport.reportType === 'Final Report' && (
                <div className="space-y-4">
                  {selectedReport.content.outcomesMeasurements && selectedReport.content.outcomesMeasurements.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2">Outcomes</h4>
                      <div className="space-y-2">
                        {selectedReport.content.outcomesMeasurements.map((outcome: any, index: number) => (
                          <div key={index} className="grid grid-cols-3 gap-4 border rounded-lg p-3">
                            <div>
                              <div className="text-xs text-muted-foreground">Metric</div>
                              <div className="font-medium">{outcome.metricName}</div>
                            </div>
                            <div>
                              <div className="text-xs text-muted-foreground">Initial</div>
                              <div>{outcome.initialValue}</div>
                            </div>
                            <div>
                              <div className="text-xs text-muted-foreground">Final</div>
                              <div>{outcome.finalValue}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {selectedReport.content.dischargePlanning && (
                    <div>
                      <h4 className="font-semibold mb-2">Discharge Summary</h4>
                      <p className="text-sm text-muted-foreground">{selectedReport.content.dischargePlanning.dischargeSummary}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Common Information */}
              <div className="border-t pt-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Report Type</div>
                    <div className="font-medium">{selectedReport.reportType}</div>
                  </div>
                  {selectedReport.therapist && (
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Therapist</div>
                      <div className="font-medium">
                        {selectedReport.therapist.firstName} {selectedReport.therapist.lastName}
                      </div>
                    </div>
                  )}
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Date</div>
                    <div className="font-medium">{new Date(selectedReport.createdAt).toLocaleDateString()}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Status</div>
                    <Badge variant="outline" className="bg-green-50">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      {selectedReport.status}
                    </Badge>
                  </div>
                </div>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  This is an approved report. You can download a PDF copy using the Download button above.
                </AlertDescription>
              </Alert>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
