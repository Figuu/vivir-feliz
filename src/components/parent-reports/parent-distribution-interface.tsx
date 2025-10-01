'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { 
  Send,
  Copy,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  User,
  Mail,
  Phone,
  Calendar,
  Eye,
  Download,
  Share,
  Lock,
  Unlock,
  AlertCircle
} from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from '@/hooks/use-toast'

interface ParentDistributionInterfaceProps {
  onDistributionComplete?: (distribution: any) => void
}

export function ParentDistributionInterface({ onDistributionComplete }: ParentDistributionInterfaceProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Data state
  const [patients, setPatients] = useState<any[]>([])
  const [reports, setReports] = useState<any[]>([])
  const [distributions, setDistributions] = useState<any[]>([])
  
  // Form state
  const [formData, setFormData] = useState({
    reportId: '',
    reportType: 'progress_report' as 'therapeutic_plan' | 'progress_report' | 'final_report' | 'compilation',
    patientId: '',
    parentEmail: '',
    accessLevel: 'download' as 'view_only' | 'download' | 'full_access',
    expiresAt: '',
    sendEmail: true,
    sendSMS: false,
    customMessage: '',
    parentInfo: {
      firstName: '',
      lastName: '',
      phone: '',
      relationshipToPatient: 'parent' as 'parent' | 'guardian' | 'caregiver' | 'other',
      preferredLanguage: 'en' as 'en' | 'es' | 'fr' | 'other'
    },
    requiresPassword: false,
    password: '',
    allowPrinting: true,
    allowSharing: false,
    distributedBy: 'user-1', // Should come from auth
    notes: ''
  })

  const [generatedLink, setGeneratedLink] = useState<string | null>(null)

  // Load data
  useEffect(() => {
    loadPatients()
    loadDistributions()
  }, [])

  useEffect(() => {
    if (formData.patientId && formData.reportType) {
      loadReports()
    }
  }, [formData.patientId, formData.reportType])

  const loadPatients = async () => {
    try {
      const response = await fetch('/api/patients?limit=100')
      const result = await response.json()
      if (response.ok) {
        setPatients(result.data.patients || [])
      }
    } catch (err) {
      console.error('Error loading patients:', err)
    }
  }

  const loadReports = async () => {
    try {
      let endpoint = ''
      switch (formData.reportType) {
        case 'therapeutic_plan':
          endpoint = `/api/therapeutic-plans?patientId=${formData.patientId}`
          break
        case 'progress_report':
          endpoint = `/api/progress-reports?patientId=${formData.patientId}`
          break
        case 'final_report':
          endpoint = `/api/final-reports?patientId=${formData.patientId}`
          break
        case 'compilation':
          endpoint = `/api/final-report-compilation?patientId=${formData.patientId}`
          break
      }

      const response = await fetch(endpoint)
      const result = await response.json()
      if (response.ok) {
        setReports(result.data || [])
      }
    } catch (err) {
      console.error('Error loading reports:', err)
    }
  }

  const loadDistributions = async () => {
    try {
      const response = await fetch('/api/parent-report-distribution')
      const result = await response.json()
      if (response.ok) {
        setDistributions(result.data.distributions || [])
      }
    } catch (err) {
      console.error('Error loading distributions:', err)
    }
  }

  const handleDistribute = async () => {
    if (!formData.reportId || !formData.patientId || !formData.parentEmail || !formData.parentInfo.firstName || !formData.parentInfo.lastName) {
      toast({
        variant: "destructive",
        title: "Error",
        description: 'Please fill in all required fields'
      })
      return
    }

    if (formData.requiresPassword && !formData.password) {
      toast({
        variant: "destructive",
        title: "Error",
        description: 'Please provide a password'
      })
      return
    }

    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/parent-report-distribution', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to distribute report')
      }

      toast({
        title: "Success",
        description: 'Report distributed to parent successfully'
      })
      setGeneratedLink(result.data.accessLink)
      loadDistributions()

      if (onDistributionComplete) {
        onDistributionComplete(result.data)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to distribute report'
      setError(errorMessage)
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage
      })
      console.error('Error distributing report:', err)
    } finally {
      setLoading(false)
    }
  }

  const copyLink = () => {
    if (generatedLink) {
      navigator.clipboard.writeText(generatedLink)
      toast({
        title: "Success",
        description: 'Access link copied to clipboard'
      })
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Distribution Form */}
      <Card>
        <CardHeader>
          <CardTitle>Distribute Report to Parent</CardTitle>
          <CardDescription>
            Share reports with parents securely via email
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Patient *</Label>
              <Select value={formData.patientId} onValueChange={(value) => setFormData(prev => ({ ...prev, patientId: value, reportId: '' }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select patient" />
                </SelectTrigger>
                <SelectContent>
                  {patients.map((patient) => (
                    <SelectItem key={patient.id} value={patient.id}>
                      {patient.firstName} {patient.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Report Type *</Label>
              <Select value={formData.reportType} onValueChange={(value: any) => setFormData(prev => ({ ...prev, reportType: value, reportId: '' }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="therapeutic_plan">Therapeutic Plan</SelectItem>
                  <SelectItem value="progress_report">Progress Report</SelectItem>
                  <SelectItem value="final_report">Final Report</SelectItem>
                  <SelectItem value="compilation">Compilation</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div>
            <Label>Select Report *</Label>
            <Select value={formData.reportId} onValueChange={(value) => setFormData(prev => ({ ...prev, reportId: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select report" />
              </SelectTrigger>
              <SelectContent>
                {reports.map((report) => (
                  <SelectItem key={report.id} value={report.id}>
                    {report.title || report.reportTitle || `Report ${report.id.slice(0, 8)}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Parent First Name *</Label>
              <Input
                value={formData.parentInfo.firstName}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  parentInfo: { ...prev.parentInfo, firstName: e.target.value }
                }))}
                placeholder="Enter first name"
                maxLength={100}
              />
            </div>
            
            <div>
              <Label>Parent Last Name *</Label>
              <Input
                value={formData.parentInfo.lastName}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  parentInfo: { ...prev.parentInfo, lastName: e.target.value }
                }))}
                placeholder="Enter last name"
                maxLength={100}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Parent Email *</Label>
              <Input
                type="email"
                value={formData.parentEmail}
                onChange={(e) => setFormData(prev => ({ ...prev, parentEmail: e.target.value }))}
                placeholder="parent@example.com"
              />
            </div>
            
            <div>
              <Label>Parent Phone</Label>
              <Input
                type="tel"
                value={formData.parentInfo.phone}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  parentInfo: { ...prev.parentInfo, phone: e.target.value }
                }))}
                placeholder="+1234567890"
                maxLength={20}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Relationship to Patient</Label>
              <Select 
                value={formData.parentInfo.relationshipToPatient} 
                onValueChange={(value: any) => setFormData(prev => ({
                  ...prev,
                  parentInfo: { ...prev.parentInfo, relationshipToPatient: value }
                }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="parent">Parent</SelectItem>
                  <SelectItem value="guardian">Guardian</SelectItem>
                  <SelectItem value="caregiver">Caregiver</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Access Level</Label>
              <Select value={formData.accessLevel} onValueChange={(value: any) => setFormData(prev => ({ ...prev, accessLevel: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="view_only">View Only</SelectItem>
                  <SelectItem value="download">Download</SelectItem>
                  <SelectItem value="full_access">Full Access</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div>
            <Label>Custom Message</Label>
            <Textarea
              value={formData.customMessage}
              onChange={(e) => setFormData(prev => ({ ...prev, customMessage: e.target.value }))}
              placeholder="Enter a custom message for the parent"
              rows={3}
              maxLength={1000}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="sendEmail"
                  checked={formData.sendEmail}
                  onCheckedChange={(checked: boolean) => setFormData(prev => ({ ...prev, sendEmail: checked }))}
                />
                <Label htmlFor="sendEmail">Send Email Notification</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="sendSMS"
                  checked={formData.sendSMS}
                  onCheckedChange={(checked: boolean) => setFormData(prev => ({ ...prev, sendSMS: checked }))}
                />
                <Label htmlFor="sendSMS">Send SMS Notification</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="requiresPassword"
                  checked={formData.requiresPassword}
                  onCheckedChange={(checked: boolean) => setFormData(prev => ({ ...prev, requiresPassword: checked }))}
                />
                <Label htmlFor="requiresPassword">Require Password</Label>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="allowPrinting"
                  checked={formData.allowPrinting}
                  onCheckedChange={(checked: boolean) => setFormData(prev => ({ ...prev, allowPrinting: checked }))}
                />
                <Label htmlFor="allowPrinting">Allow Printing</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="allowSharing"
                  checked={formData.allowSharing}
                  onCheckedChange={(checked: boolean) => setFormData(prev => ({ ...prev, allowSharing: checked }))}
                />
                <Label htmlFor="allowSharing">Allow Sharing</Label>
              </div>
            </div>
          </div>
          
          {formData.requiresPassword && (
            <div>
              <Label>Password *</Label>
              <Input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                placeholder="Enter password"
                minLength={8}
              />
            </div>
          )}
          
          <Button onClick={handleDistribute} disabled={loading} className="w-full">
            <Send className="h-4 w-4 mr-2" />
            {loading ? 'Distributing...' : 'Distribute to Parent'}
          </Button>
        </CardContent>
      </Card>

      {/* Generated Link */}
      {generatedLink && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
              Distribution Successful
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label>Access Link</Label>
              <div className="flex items-center space-x-2">
                <Input value={generatedLink} readOnly className="font-mono text-sm" />
                <Button size="sm" variant="outline" onClick={copyLink}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                This link has been sent to the parent's email. They can use it to securely access the report.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}

      {/* Distributions List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Distributions</CardTitle>
            <Button size="sm" variant="outline" onClick={loadDistributions}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {distributions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No distributions yet
            </p>
          ) : (
            <div className="space-y-3">
              {distributions.slice(0, 10).map((dist) => (
                <motion.div
                  key={dist.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="border rounded-lg p-3 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-sm">
                        {dist.parentInfo.firstName} {dist.parentInfo.lastName}
                      </h4>
                      <p className="text-xs text-muted-foreground">{dist.parentEmail}</p>
                    </div>
                    <Badge variant="outline">{dist.reportType.replace('_', ' ')}</Badge>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 text-xs">
                    <div>
                      <Label className="text-xs">Access Level</Label>
                      <div className="font-medium">{dist.accessLevel.replace('_', ' ')}</div>
                    </div>
                    <div>
                      <Label className="text-xs">Distributed</Label>
                      <div className="font-medium">{new Date(dist.distributedAt).toLocaleDateString()}</div>
                    </div>
                    <div>
                      <Label className="text-xs">Accessed</Label>
                      <div className="font-medium">{dist.accessCount || 0} times</div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
