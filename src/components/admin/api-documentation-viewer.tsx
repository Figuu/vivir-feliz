'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  BookOpen,
  Code,
  Shield,
  Zap,
  CheckCircle,
  Copy,
  ExternalLink
} from 'lucide-react'

interface APIEndpoint {
  method: string
  path: string
  description: string
  auth: boolean
  parameters?: Array<{
    name: string
    type: string
    required: boolean
    description: string
  }>
  example?: string
}

export function APIDocumentationViewer() {
  const [selectedCategory, setSelectedCategory] = useState('users')

  const endpoints: Record<string, APIEndpoint[]> = {
    users: [
      {
        method: 'GET',
        path: '/api/user',
        description: 'Get current user profile',
        auth: true,
        example: `curl -X GET http://localhost:3000/api/user \\
  -H "Cookie: sb-access-token=<token>"`
      },
      {
        method: 'PATCH',
        path: '/api/user',
        description: 'Update current user profile',
        auth: true,
        parameters: [
          { name: 'name', type: 'string', required: false, description: 'User name' },
          { name: 'avatar', type: 'string', required: false, description: 'Avatar URL' },
          { name: 'profile', type: 'object', required: false, description: 'Profile data' }
        ],
        example: `curl -X PATCH http://localhost:3000/api/user \\
  -H "Cookie: sb-access-token=<token>" \\
  -H "Content-Type: application/json" \\
  -d '{"name":"John Doe"}'`
      }
    ],
    patients: [
      {
        method: 'GET',
        path: '/api/patients',
        description: 'List all patients with pagination',
        auth: true,
        parameters: [
          { name: 'page', type: 'number', required: false, description: 'Page number' },
          { name: 'limit', type: 'number', required: false, description: 'Items per page' },
          { name: 'search', type: 'string', required: false, description: 'Search term' }
        ]
      },
      {
        method: 'POST',
        path: '/api/patients',
        description: 'Create a new patient',
        auth: true,
        parameters: [
          { name: 'name', type: 'string', required: true, description: 'Patient name' },
          { name: 'dateOfBirth', type: 'date', required: true, description: 'Date of birth' },
          { name: 'gender', type: 'string', required: true, description: 'Gender' }
        ]
      }
    ],
    sessions: [
      {
        method: 'GET',
        path: '/api/sessions',
        description: 'List therapy sessions',
        auth: true,
        parameters: [
          { name: 'therapistId', type: 'uuid', required: false, description: 'Filter by therapist' },
          { name: 'patientId', type: 'uuid', required: false, description: 'Filter by patient' },
          { name: 'status', type: 'string', required: false, description: 'Filter by status' }
        ]
      },
      {
        method: 'POST',
        path: '/api/sessions',
        description: 'Schedule a new session',
        auth: true,
        parameters: [
          { name: 'patientId', type: 'uuid', required: true, description: 'Patient ID' },
          { name: 'therapistId', type: 'uuid', required: true, description: 'Therapist ID' },
          { name: 'scheduledDate', type: 'datetime', required: true, description: 'Session date/time' },
          { name: 'duration', type: 'number', required: true, description: 'Duration in minutes' }
        ]
      }
    ],
    reports: [
      {
        method: 'GET',
        path: '/api/reports?action=templates',
        description: 'Get available report templates',
        auth: true
      },
      {
        method: 'GET',
        path: '/api/reports?action=execute',
        description: 'Execute a report',
        auth: true,
        parameters: [
          { name: 'templateId', type: 'string', required: true, description: 'Report template ID' },
          { name: 'startDate', type: 'date', required: false, description: 'Filter start date' },
          { name: 'endDate', type: 'date', required: false, description: 'Filter end date' }
        ]
      }
    ],
    analytics: [
      {
        method: 'GET',
        path: '/api/analytics/real-time',
        description: 'Get real-time metrics',
        auth: true,
        parameters: [
          { name: 'type', type: 'string', required: true, description: 'Metric type (metrics, chart, activity)' },
          { name: 'period', type: 'string', required: false, description: 'Time period (1h, 24h, 7d, 30d)' }
        ]
      }
    ],
    audit: [
      {
        method: 'GET',
        path: '/api/audit',
        description: 'Get audit log entries',
        auth: true,
        parameters: [
          { name: 'page', type: 'number', required: false, description: 'Page number' },
          { name: 'limit', type: 'number', required: false, description: 'Items per page' },
          { name: 'action', type: 'string', required: false, description: 'Filter by action' },
          { name: 'severity', type: 'string', required: false, description: 'Filter by severity' }
        ]
      },
      {
        method: 'GET',
        path: '/api/audit/stats',
        description: 'Get audit statistics',
        auth: true
      }
    ]
  }

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET': return 'bg-blue-100 text-blue-800'
      case 'POST': return 'bg-green-100 text-green-800'
      case 'PATCH': return 'bg-yellow-100 text-yellow-800'
      case 'PUT': return 'bg-orange-100 text-orange-800'
      case 'DELETE': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <BookOpen className="h-5 w-5 mr-2" />
              API Documentation
            </div>
            <Button variant="outline" size="sm" asChild>
              <a href="/docs/API_DOCUMENTATION.md" target="_blank">
                <ExternalLink className="h-4 w-4 mr-2" />
                Full Documentation
              </a>
            </Button>
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            Interactive API reference and testing tools
          </p>
        </CardHeader>
      </Card>

      {/* Quick Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Base URL
            </CardTitle>
          </CardHeader>
          <CardContent>
            <code className="text-sm bg-gray-100 px-2 py-1 rounded">
              /api
            </code>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Authentication
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-green-500" />
              <span className="text-sm">JWT Bearer Token</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Response Format
            </CardTitle>
          </CardHeader>
          <CardContent>
            <code className="text-sm bg-gray-100 px-2 py-1 rounded">
              application/json
            </code>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="endpoints" className="space-y-4">
        <TabsList>
          <TabsTrigger value="endpoints">Endpoints</TabsTrigger>
          <TabsTrigger value="errors">Error Codes</TabsTrigger>
          <TabsTrigger value="testing">Testing</TabsTrigger>
        </TabsList>

        {/* Endpoints Tab */}
        <TabsContent value="endpoints" className="space-y-4">
          {/* Category Selector */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-wrap gap-2">
                {Object.keys(endpoints).map(category => (
                  <Button
                    key={category}
                    variant={selectedCategory === category ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedCategory(category)}
                    className="capitalize"
                  >
                    {category}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Endpoints List */}
          <div className="space-y-4">
            {endpoints[selectedCategory]?.map((endpoint, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge className={getMethodColor(endpoint.method)}>
                          {endpoint.method}
                        </Badge>
                        <code className="text-sm">{endpoint.path}</code>
                        {endpoint.auth && (
                          <Shield className="h-4 w-4 text-yellow-500" title="Requires authentication" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {endpoint.description}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Parameters */}
                  {endpoint.parameters && endpoint.parameters.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold mb-2">Parameters</h4>
                      <div className="border rounded-lg overflow-hidden">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-2 text-left">Name</th>
                              <th className="px-4 py-2 text-left">Type</th>
                              <th className="px-4 py-2 text-left">Required</th>
                              <th className="px-4 py-2 text-left">Description</th>
                            </tr>
                          </thead>
                          <tbody>
                            {endpoint.parameters.map((param, i) => (
                              <tr key={i} className="border-t">
                                <td className="px-4 py-2">
                                  <code className="text-xs bg-gray-100 px-1 rounded">
                                    {param.name}
                                  </code>
                                </td>
                                <td className="px-4 py-2">
                                  <Badge variant="outline" className="text-xs">
                                    {param.type}
                                  </Badge>
                                </td>
                                <td className="px-4 py-2">
                                  {param.required ? (
                                    <Badge className="bg-red-100 text-red-800 text-xs">
                                      Required
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className="text-xs">
                                      Optional
                                    </Badge>
                                  )}
                                </td>
                                <td className="px-4 py-2 text-muted-foreground">
                                  {param.description}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Example */}
                  {endpoint.example && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-semibold">Example Request</h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(endpoint.example!)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                      <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-xs overflow-x-auto">
                        {endpoint.example}
                      </pre>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Error Codes Tab */}
        <TabsContent value="errors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">HTTP Status Codes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { code: 200, name: 'OK', description: 'Request successful' },
                  { code: 201, name: 'Created', description: 'Resource created successfully' },
                  { code: 400, name: 'Bad Request', description: 'Invalid request data' },
                  { code: 401, name: 'Unauthorized', description: 'Authentication required' },
                  { code: 403, name: 'Forbidden', description: 'Insufficient permissions' },
                  { code: 404, name: 'Not Found', description: 'Resource not found' },
                  { code: 409, name: 'Conflict', description: 'Data conflict' },
                  { code: 429, name: 'Too Many Requests', description: 'Rate limit exceeded' },
                  { code: 500, name: 'Internal Server Error', description: 'Server error' }
                ].map(status => (
                  <div key={status.code} className="flex items-start gap-4 border-b pb-3 last:border-0">
                    <Badge className={
                      status.code < 300 ? 'bg-green-100 text-green-800' :
                      status.code < 400 ? 'bg-blue-100 text-blue-800' :
                      status.code < 500 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }>
                      {status.code}
                    </Badge>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{status.name}</p>
                      <p className="text-sm text-muted-foreground">{status.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Error Response Format</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-xs overflow-x-auto">
{`{
  "error": {
    "type": "VALIDATION_ERROR",
    "message": "User-friendly error message",
    "statusCode": 400,
    "details": {
      "field": "email",
      "issue": "Invalid format"
    }
  }
}`}
              </pre>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Testing Tab */}
        <TabsContent value="testing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center">
                <Code className="h-4 w-4 mr-2" />
                Testing Utilities
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 mr-2 mt-0.5 text-green-500 flex-shrink-0" />
                  <span><code className="text-xs bg-gray-100 px-1 rounded">TestRequestBuilder</code> - Build test requests</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 mr-2 mt-0.5 text-green-500 flex-shrink-0" />
                  <span><code className="text-xs bg-gray-100 px-1 rounded">TestResponseValidator</code> - Validate responses</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 mr-2 mt-0.5 text-green-500 flex-shrink-0" />
                  <span><code className="text-xs bg-gray-100 px-1 rounded">mockData</code> - Generate mock data</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 mr-2 mt-0.5 text-green-500 flex-shrink-0" />
                  <span><code className="text-xs bg-gray-100 px-1 rounded">PerformanceTester</code> - Performance testing</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 mr-2 mt-0.5 text-green-500 flex-shrink-0" />
                  <span><code className="text-xs bg-gray-100 px-1 rounded">validationHelpers</code> - Data validation</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Example Test</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-xs overflow-x-auto">
{`import { TestRequestBuilder, apiTestHelpers } from '@/lib/api-test-utils'

// Create test request
const request = new TestRequestBuilder('/api/user')
  .setMethod('GET')
  .setAuth('test-token')
  .build()

// Call API handler
const response = await GET(request)

// Validate response
await apiTestHelpers.validateResponse(response)
  .expectOk()
  .expectJson()
  .expectBodyContains('user')`}
              </pre>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center">
                <Zap className="h-4 w-4 mr-2" />
                Performance Testing
              </CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-xs overflow-x-auto">
{`import { PerformanceTester } from '@/lib/api-test-utils'

const tester = new PerformanceTester()

// Measure 100 API calls
await tester.measureMultiple(async () => {
  const request = new TestRequestBuilder('/api/user')
    .setAuth('test-token')
    .build()
  await GET(request)
}, 100)

const stats = tester.getStats()
console.log('Performance:', stats)
// { min, max, avg, median, p95, p99 }`}
              </pre>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
