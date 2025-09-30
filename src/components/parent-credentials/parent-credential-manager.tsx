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
  Key,
  UserPlus,
  RefreshCw,
  Send,
  Copy,
  CheckCircle,
  AlertTriangle,
  Mail,
  Phone,
  Calendar,
  Eye,
  EyeOff,
  RotateCcw,
  Clock
} from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from '@/hooks/use-toast'

interface ParentCredentialManagerProps {
  onCredentialGenerated?: (credential: any) => void
}

export function ParentCredentialManager({ onCredentialGenerated }: ParentCredentialManagerProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('generate')
  
  // Data state
  const [credentials, setCredentials] = useState<any[]>([])
  const [patients, setPatients] = useState<any[]>([])
  
  // Form state
  const [formData, setFormData] = useState({
    patientId: '',
    parentEmail: '',
    sendWelcomeEmail: true,
    sendSMS: false,
    customMessage: '',
    temporaryPassword: '',
    requirePasswordChange: true,
    expiresInDays: 30,
    generatedBy: 'admin-1'
  })

  const [generatedInfo, setGeneratedInfo] = useState<any>(null)
  const [showPassword, setShowPassword] = useState(false)

  // Load data
  useEffect(() => {
    loadPatients()
    loadCredentials()
  }, [])

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

  const loadCredentials = async () => {
    try {
      const response = await fetch('/api/parent-credentials')
      const result = await response.json()
      if (response.ok) {
        setCredentials(result.data.credentials || [])
      }
    } catch (err) {
      console.error('Error loading credentials:', err)
    }
  }

  const handleGenerate = async () => {
    if (!formData.patientId || !formData.parentEmail) {
      toast({
        variant: "destructive",
        title: "Error",
        description: 'Please select a patient and enter parent email'
      })
      return
    }

    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/parent-credentials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to generate credentials')
      }

      toast({
        title: "Success",
        description: 'Parent credentials generated successfully'
      })
      setGeneratedInfo(result.data)
      loadCredentials()

      if (onCredentialGenerated) {
        onCredentialGenerated(result.data)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate credentials'
      setError(errorMessage)
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage
      })
      console.error('Error generating credentials:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async (credentialId: string, action: string, newPassword?: string, expiresInDays?: number) => {
    try {
      setLoading(true)
      const response = await fetch('/api/parent-credentials', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          credentialId,
          action,
          newPassword,
          expiresInDays,
          updatedBy: 'admin-1'
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || `Failed to ${action}`)
      }

      toast({
        title: "Success",
        description: result.message
      })
      loadCredentials()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : `Failed to ${action}`
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage
      })
      console.error(`Error with ${action}:`, err)
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast({
        title: "Success",
        description: `${label} copied to clipboard`
      })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'inactive': return 'bg-gray-100 text-gray-800'
      case 'expired': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Generate Credentials */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Key className="h-5 w-5 mr-2" />
            Generate Parent Credentials
          </CardTitle>
          <CardDescription>
            Create secure login credentials for parents to access patient reports
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Patient *</Label>
              <Select value={formData.patientId} onValueChange={(value) => setFormData(prev => ({ ...prev, patientId: value }))}>
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
              <Label>Parent Email *</Label>
              <Input
                type="email"
                value={formData.parentEmail}
                onChange={(e) => setFormData(prev => ({ ...prev, parentEmail: e.target.value }))}
                placeholder="parent@example.com"
              />
            </div>
          </div>
          
          <div>
            <Label>Custom Message</Label>
            <Textarea
              value={formData.customMessage}
              onChange={(e) => setFormData(prev => ({ ...prev, customMessage: e.target.value }))}
              placeholder="Enter a custom welcome message"
              rows={3}
              maxLength={500}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Temporary Password (Optional)</Label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.temporaryPassword}
                  onChange={(e) => setFormData(prev => ({ ...prev, temporaryPassword: e.target.value }))}
                  placeholder="Auto-generated if empty"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="absolute right-0 top-0"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Leave empty to auto-generate secure password
              </p>
            </div>
            
            <div>
              <Label>Expires In (Days)</Label>
              <Input
                type="number"
                min="1"
                max="365"
                value={formData.expiresInDays}
                onChange={(e) => setFormData(prev => ({ ...prev, expiresInDays: parseInt(e.target.value) || 30 }))}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="sendWelcomeEmail"
                checked={formData.sendWelcomeEmail}
                onCheckedChange={(checked: boolean) => setFormData(prev => ({ ...prev, sendWelcomeEmail: checked }))}
              />
              <Label htmlFor="sendWelcomeEmail">Send Welcome Email</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="requirePasswordChange"
                checked={formData.requirePasswordChange}
                onCheckedChange={(checked: boolean) => setFormData(prev => ({ ...prev, requirePasswordChange: checked }))}
              />
              <Label htmlFor="requirePasswordChange">Require Password Change on First Login</Label>
            </div>
          </div>
          
          <Button onClick={handleGenerate} disabled={loading} className="w-full">
            <UserPlus className="h-4 w-4 mr-2" />
            {loading ? 'Generating...' : 'Generate Credentials'}
          </Button>
        </CardContent>
      </Card>

      {/* Generated Info */}
      {generatedInfo && (
        <Card className="border-green-500">
          <CardHeader>
            <CardTitle className="flex items-center text-green-600">
              <CheckCircle className="h-5 w-5 mr-2" />
              Credentials Generated Successfully
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label>Setup Link</Label>
              <div className="flex items-center space-x-2">
                <Input value={generatedInfo.setupLink} readOnly className="font-mono text-sm" />
                <Button size="sm" variant="outline" onClick={() => copyToClipboard(generatedInfo.setupLink, 'Setup link')}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div>
              <Label>Temporary Password</Label>
              <div className="flex items-center space-x-2">
                <Input value={generatedInfo.temporaryPassword} readOnly className="font-mono text-sm" />
                <Button size="sm" variant="outline" onClick={() => copyToClipboard(generatedInfo.temporaryPassword, 'Password')}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <Alert>
              <Mail className="h-4 w-4" />
              <AlertDescription>
                {formData.sendWelcomeEmail ? 
                  'Welcome email sent to the parent with setup instructions and credentials.' : 
                  'Please share the setup link and temporary password with the parent securely.'
                }
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}

      {/* Credentials List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Generated Credentials ({credentials.length})</CardTitle>
            <Button size="sm" variant="outline" onClick={loadCredentials}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {credentials.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No credentials generated yet
            </p>
          ) : (
            <div className="space-y-3">
              {credentials.map((cred) => (
                <motion.div
                  key={cred.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="border rounded-lg p-4 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold">{cred.parentEmail}</h4>
                      <p className="text-sm text-muted-foreground">
                        Patient: {cred.patient.firstName} {cred.patient.lastName}
                      </p>
                    </div>
                    <Badge className={getStatusColor(cred.status)}>{cred.status}</Badge>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <Label className="text-xs">Generated</Label>
                      <div>{new Date(cred.createdAt).toLocaleDateString()}</div>
                    </div>
                    <div>
                      <Label className="text-xs">Expires</Label>
                      <div>{cred.expiresAt ? new Date(cred.expiresAt).toLocaleDateString() : 'Never'}</div>
                    </div>
                    <div>
                      <Label className="text-xs">Last Access</Label>
                      <div>{cred.lastAccessedAt ? new Date(cred.lastAccessedAt).toLocaleDateString() : 'Never'}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 pt-2">
                    {cred.status === 'pending' && (
                      <Button size="sm" variant="outline" onClick={() => handleAction(cred.id, 'activate')}>
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Activate
                      </Button>
                    )}
                    {cred.status === 'active' && (
                      <Button size="sm" variant="outline" onClick={() => handleAction(cred.id, 'deactivate')}>
                        Deactivate
                      </Button>
                    )}
                    <Button size="sm" variant="outline" onClick={() => handleAction(cred.id, 'reset_password')}>
                      <RotateCcw className="h-4 w-4 mr-1" />
                      Reset Password
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleAction(cred.id, 'extend_expiry', undefined, 30)}>
                      <Clock className="h-4 w-4 mr-1" />
                      Extend
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleAction(cred.id, 'resend_email')}>
                      <Send className="h-4 w-4 mr-1" />
                      Resend
                    </Button>
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
