'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, CheckCircle, XCircle, FileText, BarChart3, Users, Calendar } from 'lucide-react'

interface ApiResponse {
  success: boolean
  data?: any
  error?: string
  message?: string
}

export default function TestMedicalFormApiPage() {
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<ApiResponse[]>([])
  const [formData, setFormData] = useState({
    consultationRequestId: '',
    parentId: '',
    patientId: '',
    formId: '',
    userId: '',
    operation: 'GET',
    startDate: '',
    endDate: '',
    page: '1',
    limit: '20'
  })

  const addResult = (result: ApiResponse) => {
    setResults(prev => [result, ...prev])
  }

  const makeApiCall = async (endpoint: string, method: string = 'GET', body?: any) => {
    setLoading(true)
    try {
      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
      })
      
      const data = await response.json()
      addResult({
        success: response.ok,
        data: data,
        error: response.ok ? undefined : data.error || 'Unknown error',
        message: data.message
      })
    } catch (error) {
      addResult({
        success: false,
        error: error instanceof Error ? error.message : 'Network error'
      })
    } finally {
      setLoading(false)
    }
  }

  const testCreateForm = () => {
    if (!formData.consultationRequestId) {
      addResult({ success: false, error: 'Consultation Request ID is required' })
      return
    }
    
    makeApiCall('/api/medical-forms', 'POST', {
      consultationRequestId: formData.consultationRequestId,
      parentId: formData.parentId || undefined,
      patientId: formData.patientId || undefined
    })
  }

  const testGetForm = () => {
    if (!formData.formId) {
      addResult({ success: false, error: 'Form ID is required' })
      return
    }
    
    makeApiCall(`/api/medical-forms/${formData.formId}`)
  }

  const testListForms = () => {
    const params = new URLSearchParams()
    if (formData.consultationRequestId) params.append('consultationRequestId', formData.consultationRequestId)
    if (formData.parentId) params.append('parentId', formData.parentId)
    if (formData.patientId) params.append('patientId', formData.patientId)
    if (formData.startDate) params.append('startDate', formData.startDate)
    if (formData.endDate) params.append('endDate', formData.endDate)
    params.append('page', formData.page)
    params.append('limit', formData.limit)
    
    makeApiCall(`/api/medical-forms?${params.toString()}`)
  }

  const testGetByConsultation = () => {
    if (!formData.consultationRequestId) {
      addResult({ success: false, error: 'Consultation Request ID is required' })
      return
    }
    
    makeApiCall(`/api/medical-forms/by-consultation?consultationRequestId=${formData.consultationRequestId}`)
  }

  const testValidateForm = () => {
    if (!formData.formId) {
      addResult({ success: false, error: 'Form ID is required' })
      return
    }
    
    makeApiCall(`/api/medical-forms/${formData.formId}/validate`)
  }

  const testGetProgress = () => {
    if (!formData.formId) {
      addResult({ success: false, error: 'Form ID is required' })
      return
    }
    
    makeApiCall(`/api/medical-forms/${formData.formId}/progress`)
  }

  const testSubmitForm = () => {
    if (!formData.formId || !formData.userId) {
      addResult({ success: false, error: 'Form ID and User ID are required' })
      return
    }
    
    makeApiCall(`/api/medical-forms/${formData.formId}/submit`, 'POST', {
      submittedBy: formData.userId,
      submissionNotes: 'Test submission'
    })
  }

  const testApproveForm = () => {
    if (!formData.formId || !formData.userId) {
      addResult({ success: false, error: 'Form ID and User ID are required' })
      return
    }
    
    makeApiCall(`/api/medical-forms/${formData.formId}/approve`, 'POST', {
      approvedBy: formData.userId,
      approvalNotes: 'Test approval'
    })
  }

  const testGetStatistics = () => {
    const params = new URLSearchParams()
    if (formData.startDate) params.append('startDate', formData.startDate)
    if (formData.endDate) params.append('endDate', formData.endDate)
    
    makeApiCall(`/api/medical-forms/statistics?${params.toString()}`)
  }

  const testGetAnalytics = () => {
    const params = new URLSearchParams()
    if (formData.startDate) params.append('startDate', formData.startDate)
    if (formData.endDate) params.append('endDate', formData.endDate)
    params.append('groupBy', 'month')
    params.append('includeDetails', 'true')
    
    makeApiCall(`/api/medical-forms/analytics?${params.toString()}`)
  }

  const testBulkOperation = () => {
    if (!formData.formId || !formData.userId) {
      addResult({ success: false, error: 'Form ID and User ID are required' })
      return
    }
    
    makeApiCall('/api/medical-forms/bulk', 'POST', {
      operation: formData.operation,
      formIds: [formData.formId],
      userId: formData.userId,
      notes: 'Test bulk operation'
    })
  }

  const testDeleteForm = () => {
    if (!formData.formId) {
      addResult({ success: false, error: 'Form ID is required' })
      return
    }
    
    makeApiCall(`/api/medical-forms/${formData.formId}`, 'DELETE')
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center space-x-2">
        <FileText className="h-8 w-8 text-blue-600" />
        <h1 className="text-3xl font-bold">Medical Form API Testing</h1>
      </div>
      
      <p className="text-muted-foreground">
        Test all medical form API endpoints with comprehensive validation and error handling.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Form */}
        <Card>
          <CardHeader>
            <CardTitle>Test Parameters</CardTitle>
            <CardDescription>
              Enter the required parameters for testing the API endpoints
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="consultationRequestId">Consultation Request ID</Label>
                <Input
                  id="consultationRequestId"
                  value={formData.consultationRequestId}
                  onChange={(e) => setFormData(prev => ({ ...prev, consultationRequestId: e.target.value }))}
                  placeholder="UUID format"
                />
              </div>
              <div>
                <Label htmlFor="formId">Form ID</Label>
                <Input
                  id="formId"
                  value={formData.formId}
                  onChange={(e) => setFormData(prev => ({ ...prev, formId: e.target.value }))}
                  placeholder="UUID format"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="parentId">Parent ID</Label>
                <Input
                  id="parentId"
                  value={formData.parentId}
                  onChange={(e) => setFormData(prev => ({ ...prev, parentId: e.target.value }))}
                  placeholder="Optional"
                />
              </div>
              <div>
                <Label htmlFor="patientId">Patient ID</Label>
                <Input
                  id="patientId"
                  value={formData.patientId}
                  onChange={(e) => setFormData(prev => ({ ...prev, patientId: e.target.value }))}
                  placeholder="Optional"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="userId">User ID</Label>
              <Input
                id="userId"
                value={formData.userId}
                onChange={(e) => setFormData(prev => ({ ...prev, userId: e.target.value }))}
                placeholder="UUID format"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="datetime-local"
                  value={formData.startDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="datetime-local"
                  value={formData.endDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="page">Page</Label>
                <Input
                  id="page"
                  type="number"
                  value={formData.page}
                  onChange={(e) => setFormData(prev => ({ ...prev, page: e.target.value }))}
                  min="1"
                />
              </div>
              <div>
                <Label htmlFor="limit">Limit</Label>
                <Input
                  id="limit"
                  type="number"
                  value={formData.limit}
                  onChange={(e) => setFormData(prev => ({ ...prev, limit: e.target.value }))}
                  min="1"
                  max="100"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="operation">Bulk Operation</Label>
              <Select value={formData.operation} onValueChange={(value) => setFormData(prev => ({ ...prev, operation: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DELETE">DELETE</SelectItem>
                  <SelectItem value="APPROVE">APPROVE</SelectItem>
                  <SelectItem value="SUBMIT">SUBMIT</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* API Test Buttons */}
        <Card>
          <CardHeader>
            <CardTitle>API Endpoints</CardTitle>
            <CardDescription>
              Test different medical form API endpoints
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <Button onClick={testCreateForm} disabled={loading} size="sm">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                Create Form
              </Button>
              <Button onClick={testGetForm} disabled={loading} size="sm">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                Get Form
              </Button>
              <Button onClick={testListForms} disabled={loading} size="sm">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Users className="h-4 w-4" />}
                List Forms
              </Button>
              <Button onClick={testGetByConsultation} disabled={loading} size="sm">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Calendar className="h-4 w-4" />}
                By Consultation
              </Button>
              <Button onClick={testValidateForm} disabled={loading} size="sm">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                Validate Form
              </Button>
              <Button onClick={testGetProgress} disabled={loading} size="sm">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <BarChart3 className="h-4 w-4" />}
                Get Progress
              </Button>
              <Button onClick={testSubmitForm} disabled={loading} size="sm">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                Submit Form
              </Button>
              <Button onClick={testApproveForm} disabled={loading} size="sm">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                Approve Form
              </Button>
              <Button onClick={testGetStatistics} disabled={loading} size="sm">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <BarChart3 className="h-4 w-4" />}
                Statistics
              </Button>
              <Button onClick={testGetAnalytics} disabled={loading} size="sm">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <BarChart3 className="h-4 w-4" />}
                Analytics
              </Button>
              <Button onClick={testBulkOperation} disabled={loading} size="sm">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Users className="h-4 w-4" />}
                Bulk Operation
              </Button>
              <Button onClick={testDeleteForm} disabled={loading} size="sm" variant="destructive">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                Delete Form
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Results */}
      <Card>
        <CardHeader>
          <CardTitle>API Results</CardTitle>
          <CardDescription>
            Results from API calls will appear here
          </CardDescription>
        </CardHeader>
        <CardContent>
          {results.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No API calls made yet. Use the buttons above to test the endpoints.
            </p>
          ) : (
            <div className="space-y-4">
              {results.map((result, index) => (
                <Alert key={index} className={result.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
                  <div className="flex items-center space-x-2">
                    {result.success ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                    <Badge variant={result.success ? 'default' : 'destructive'}>
                      {result.success ? 'Success' : 'Error'}
                    </Badge>
                    {result.message && (
                      <span className="text-sm text-muted-foreground">{result.message}</span>
                    )}
                  </div>
                  {result.error && (
                    <AlertDescription className="mt-2 text-red-600">
                      {result.error}
                    </AlertDescription>
                  )}
                  {result.data && (
                    <div className="mt-2">
                      <Separator className="my-2" />
                      <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-40">
                        {JSON.stringify(result.data, null, 2)}
                      </pre>
                    </div>
                  )}
                </Alert>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
