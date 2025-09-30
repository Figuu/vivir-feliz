'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { 
  Clock,
  GitBranch,
  RotateCcw,
  Eye,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  User,
  Calendar,
  FileText,
  Plus,
  Minus,
  ArrowRight,
  Info
} from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from '@/hooks/use-toast'

interface VersionControlInterfaceProps {
  reportId: string
  reportType: 'therapeutic_plan' | 'progress_report' | 'final_report' | 'compilation' | 'submission'
  onVersionRestored?: (version: any) => void
}

interface ReportVersion {
  id: string
  versionNumber: number
  changeType: string
  changeDescription: string
  changedBy: string
  changedFields: string[]
  previousData?: any
  currentData: any
  metadata?: any
  changedByUser: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
  createdAt: string
}

export function VersionControlInterface({
  reportId,
  reportType,
  onVersionRestored
}: VersionControlInterfaceProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('history')
  
  // Data state
  const [versions, setVersions] = useState<ReportVersion[]>([])
  const [selectedVersion, setSelectedVersion] = useState<ReportVersion | null>(null)
  const [compareVersion1, setCompareVersion1] = useState<number>(0)
  const [compareVersion2, setCompareVersion2] = useState<number>(0)
  const [comparisonData, setComparisonData] = useState<any>(null)

  // Dialog state
  const [detailDialog, setDetailDialog] = useState(false)
  const [restoreDialog, setRestoreDialog] = useState(false)

  // Load versions
  useEffect(() => {
    loadVersions()
  }, [reportId, reportType])

  const loadVersions = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      params.append('reportId', reportId)
      params.append('reportType', reportType)

      const response = await fetch(`/api/report-versions?${params}`)
      const result = await response.json()

      if (response.ok) {
        setVersions(result.data.versions || [])
        
        // Auto-select last two versions for comparison
        if (result.data.versions.length >= 2) {
          setCompareVersion1(result.data.versions[0].versionNumber)
          setCompareVersion2(result.data.versions[1].versionNumber)
        }
      } else {
        setError(result.error || 'Failed to load versions')
      }
    } catch (err) {
      setError('Failed to load versions')
      console.error('Error loading versions:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadComparison = async () => {
    if (!compareVersion1 || !compareVersion2) {
      toast({
        variant: "destructive",
        title: "Error",
        description: 'Please select two versions to compare'
      })
      return
    }

    try {
      setLoading(true)
      const params = new URLSearchParams()
      params.append('action', 'compare')
      params.append('reportId', reportId)
      params.append('reportType', reportType)
      params.append('version1', compareVersion1.toString())
      params.append('version2', compareVersion2.toString())

      const response = await fetch(`/api/report-versions?${params}`)
      const result = await response.json()

      if (response.ok) {
        setComparisonData(result.data)
      } else {
        toast({
        variant: "destructive",
        title: "Error",
        description: result.error || 'Failed to compare versions'
      })
      }
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: 'Failed to compare versions'
      })
      console.error('Error comparing versions:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleRestore = async () => {
    if (!selectedVersion) return

    try {
      setLoading(true)
      const response = await fetch('/api/report-versions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'restore',
          versionId: selectedVersion.id,
          reportId,
          reportType,
          restoredBy: 'user-1', // Should come from auth
          restoreNotes: `Restored to version ${selectedVersion.versionNumber}`
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to restore version')
      }

      toast({
        title: "Success",
        description: `Version ${selectedVersion.versionNumber} restored successfully`
      })
      setRestoreDialog(false)
      setSelectedVersion(null)
      loadVersions()

      if (onVersionRestored) {
        onVersionRestored(result.data)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to restore version'
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage
      })
      console.error('Error restoring version:', err)
    } finally {
      setLoading(false)
    }
  }

  const openDetailDialog = (version: ReportVersion) => {
    setSelectedVersion(version)
    setDetailDialog(true)
  }

  const openRestoreDialog = (version: ReportVersion) => {
    setSelectedVersion(version)
    setRestoreDialog(true)
  }

  const getChangeTypeColor = (changeType: string) => {
    switch (changeType) {
      case 'created': return 'bg-blue-100 text-blue-800'
      case 'updated': return 'bg-yellow-100 text-yellow-800'
      case 'approved': return 'bg-green-100 text-green-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      case 'revised': return 'bg-orange-100 text-orange-800'
      case 'published': return 'bg-purple-100 text-purple-800'
      case 'distributed': return 'bg-indigo-100 text-indigo-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center">
                <GitBranch className="h-5 w-5 mr-2" />
                Report Version Control
              </CardTitle>
              <CardDescription>
                Track changes and manage version history
              </CardDescription>
            </div>
            <Button variant="outline" onClick={loadVersions}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="history">Version History</TabsTrigger>
          <TabsTrigger value="compare">Compare Versions</TabsTrigger>
        </TabsList>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Version History ({versions.length})</CardTitle>
              <CardDescription>
                Complete history of all changes to this report
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="text-muted-foreground mt-2">Loading version history...</p>
                </div>
              ) : versions.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Version History</h3>
                  <p className="text-muted-foreground">
                    No version history found for this report.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {versions.map((version, index) => (
                    <motion.div
                      key={version.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="border-l-4 border-blue-500 pl-4 py-3"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline">v{version.versionNumber}</Badge>
                            <Badge className={getChangeTypeColor(version.changeType)}>
                              {version.changeType}
                            </Badge>
                            {index === 0 && (
                              <Badge variant="secondary">Current</Badge>
                            )}
                          </div>
                          
                          <p className="text-sm font-medium">{version.changeDescription}</p>
                          
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                            <div className="flex items-center space-x-1">
                              <User className="h-3 w-3" />
                              <span>{version.changedByUser.firstName} {version.changedByUser.lastName}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Calendar className="h-3 w-3" />
                              <span>{new Date(version.createdAt).toLocaleString()}</span>
                            </div>
                            {version.changedFields.length > 0 && (
                              <div className="flex items-center space-x-1">
                                <FileText className="h-3 w-3" />
                                <span>{version.changedFields.length} field(s) changed</span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2 ml-4">
                          <Button size="sm" variant="outline" onClick={() => openDetailDialog(version)}>
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          {index !== 0 && (
                            <Button size="sm" variant="outline" onClick={() => openRestoreDialog(version)}>
                              <RotateCcw className="h-4 w-4 mr-1" />
                              Restore
                            </Button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Compare Tab */}
        <TabsContent value="compare" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Compare Versions</CardTitle>
              <CardDescription>
                Compare two versions to see what changed
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Version 1</Label>
                  <Select value={compareVersion1.toString()} onValueChange={(value) => setCompareVersion1(parseInt(value))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select version" />
                    </SelectTrigger>
                    <SelectContent>
                      {versions.map((version) => (
                        <SelectItem key={version.id} value={version.versionNumber.toString()}>
                          v{version.versionNumber} - {version.changeType}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Version 2</Label>
                  <Select value={compareVersion2.toString()} onValueChange={(value) => setCompareVersion2(parseInt(value))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select version" />
                    </SelectTrigger>
                    <SelectContent>
                      {versions.map((version) => (
                        <SelectItem key={version.id} value={version.versionNumber.toString()}>
                          v{version.versionNumber} - {version.changeType}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <Button onClick={loadComparison} disabled={loading || !compareVersion1 || !compareVersion2}>
                <ArrowRight className="h-4 w-4 mr-2" />
                {loading ? 'Comparing...' : 'Compare Versions'}
              </Button>
              
              {comparisonData && (
                <div className="space-y-4 mt-6">
                  {comparisonData.comparison.addedFields.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-green-600 mb-2">Added Fields ({comparisonData.comparison.addedFields.length})</h4>
                      <div className="space-y-2">
                        {comparisonData.comparison.addedFields.map((field: any, index: number) => (
                          <div key={index} className="bg-green-50 border border-green-200 rounded p-2 text-sm">
                            <span className="font-medium">{field.field}:</span> {JSON.stringify(field.value)}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {comparisonData.comparison.removedFields.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-red-600 mb-2">Removed Fields ({comparisonData.comparison.removedFields.length})</h4>
                      <div className="space-y-2">
                        {comparisonData.comparison.removedFields.map((field: any, index: number) => (
                          <div key={index} className="bg-red-50 border border-red-200 rounded p-2 text-sm">
                            <span className="font-medium">{field.field}:</span> {JSON.stringify(field.value)}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {comparisonData.comparison.modifiedFields.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-yellow-600 mb-2">Modified Fields ({comparisonData.comparison.modifiedFields.length})</h4>
                      <div className="space-y-2">
                        {comparisonData.comparison.modifiedFields.map((field: any, index: number) => (
                          <div key={index} className="bg-yellow-50 border border-yellow-200 rounded p-3 text-sm space-y-1">
                            <div className="font-medium">{field.field}</div>
                            <div className="text-red-600">- {JSON.stringify(field.oldValue)}</div>
                            <div className="text-green-600">+ {JSON.stringify(field.newValue)}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {comparisonData.comparison.addedFields.length === 0 && 
                   comparisonData.comparison.removedFields.length === 0 && 
                   comparisonData.comparison.modifiedFields.length === 0 && (
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertDescription>
                        No differences found between these versions.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Detail Dialog */}
      <Dialog open={detailDialog} onOpenChange={setDetailDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Version {selectedVersion?.versionNumber} Details</DialogTitle>
            <DialogDescription>
              {selectedVersion && `${selectedVersion.changeType} - ${new Date(selectedVersion.createdAt).toLocaleString()}`}
            </DialogDescription>
          </DialogHeader>
          
          {selectedVersion && (
            <div className="space-y-4 py-4">
              <div>
                <Label className="text-sm font-medium">Change Description</Label>
                <p className="text-sm text-muted-foreground mt-1">{selectedVersion.changeDescription}</p>
              </div>
              
              <div>
                <Label className="text-sm font-medium">Changed By</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  {selectedVersion.changedByUser.firstName} {selectedVersion.changedByUser.lastName} ({selectedVersion.changedByUser.email})
                </p>
              </div>
              
              {selectedVersion.changedFields.length > 0 && (
                <div>
                  <Label className="text-sm font-medium">Changed Fields</Label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {selectedVersion.changedFields.map((field, index) => (
                      <Badge key={index} variant="secondary">{field}</Badge>
                    ))}
                  </div>
                </div>
              )}
              
              <div>
                <Label className="text-sm font-medium">Version Data</Label>
                <pre className="text-xs bg-gray-50 p-3 rounded mt-1 overflow-x-auto max-h-96">
                  {JSON.stringify(selectedVersion.currentData, null, 2)}
                </pre>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Restore Dialog */}
      <Dialog open={restoreDialog} onOpenChange={setRestoreDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Restore Version {selectedVersion?.versionNumber}?</DialogTitle>
            <DialogDescription>
              This will create a new version with the data from version {selectedVersion?.versionNumber}.
            </DialogDescription>
          </DialogHeader>
          
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Restoring a previous version will create a new version (v{versions.length + 1}) with the restored data. 
              The current version will be preserved in the history.
            </AlertDescription>
          </Alert>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setRestoreDialog(false)}>Cancel</Button>
            <Button onClick={handleRestore} disabled={loading}>
              {loading ? 'Restoring...' : 'Restore Version'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
