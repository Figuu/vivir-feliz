'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Shield, 
  Lock,
  Clock,
  FileText,
  AlertTriangle,
  CheckCircle,
  Activity,
  Key
} from 'lucide-react'
import { 
  RATE_LIMIT_CONFIG, 
  PASSWORD_REQUIREMENTS, 
  SESSION_CONFIG, 
  LOGIN_SECURITY,
  FILE_UPLOAD_SECURITY,
  API_SECURITY,
  AUDIT_CONFIG
} from '@/lib/security-config'

export function SecurityConfiguration() {
  const formatMs = (ms: number) => {
    const minutes = Math.floor(ms / 60000)
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60)
      return `${hours} hour${hours > 1 ? 's' : ''}`
    }
    return `${minutes} minute${minutes > 1 ? 's' : ''}`
  }

  const formatBytes = (bytes: number) => {
    const mb = bytes / (1024 * 1024)
    return `${mb.toFixed(2)} MB`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="h-5 w-5 mr-2" />
            Security Configuration
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            Current security settings and measures
          </p>
        </CardHeader>
      </Card>

      {/* Security Status */}
      <Alert>
        <CheckCircle className="h-4 w-4" />
        <AlertDescription>
          <p className="font-semibold mb-2">Security Status: Active</p>
          <p className="text-sm">
            All security measures are properly configured and active.
          </p>
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="rate-limiting" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="rate-limiting">Rate Limiting</TabsTrigger>
          <TabsTrigger value="authentication">Authentication</TabsTrigger>
          <TabsTrigger value="api-security">API Security</TabsTrigger>
        </TabsList>

        {/* Rate Limiting Tab */}
        <TabsContent value="rate-limiting" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(RATE_LIMIT_CONFIG).map(([key, config]) => (
              <Card key={key}>
                <CardHeader>
                  <CardTitle className="flex items-center text-base capitalize">
                    <Activity className="h-5 w-5 mr-2" />
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Window</span>
                      <span className="font-medium">{formatMs(config.windowMs)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Max Requests</span>
                      <span className="font-medium">{config.maxRequests}</span>
                    </div>
                    <div className="pt-2 border-t">
                      <p className="text-xs text-muted-foreground">{config.message}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Authentication Tab */}
        <TabsContent value="authentication" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-base">
                  <Key className="h-5 w-5 mr-2" />
                  Password Requirements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Min Length</span>
                    <span className="font-medium">{PASSWORD_REQUIREMENTS.minLength} characters</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Max Length</span>
                    <span className="font-medium">{PASSWORD_REQUIREMENTS.maxLength} characters</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Uppercase</span>
                    <span className="font-medium">{PASSWORD_REQUIREMENTS.requireUppercase ? 'Required' : 'Optional'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Numbers</span>
                    <span className="font-medium">{PASSWORD_REQUIREMENTS.requireNumbers ? 'Required' : 'Optional'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Special Chars</span>
                    <span className="font-medium">{PASSWORD_REQUIREMENTS.requireSpecialChars ? 'Required' : 'Optional'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Prevent Reuse</span>
                    <span className="font-medium">Last {PASSWORD_REQUIREMENTS.preventReuse} passwords</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-base">
                  <Clock className="h-5 w-5 mr-2" />
                  Session Configuration
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Timeout</span>
                    <span className="font-medium">{formatMs(SESSION_CONFIG.timeout)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Refresh Threshold</span>
                    <span className="font-medium">{formatMs(SESSION_CONFIG.refreshThreshold)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Max Concurrent</span>
                    <span className="font-medium">{SESSION_CONFIG.maxConcurrentSessions}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Cookie Max Age</span>
                    <span className="font-medium">{SESSION_CONFIG.cookieOptions.maxAge / 86400} days</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-base">
                  <Lock className="h-5 w-5 mr-2" />
                  Login Security
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Max Attempts</span>
                    <span className="font-medium">{LOGIN_SECURITY.maxAttempts}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Lockout Duration</span>
                    <span className="font-medium">{formatMs(LOGIN_SECURITY.lockoutDuration)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Two-Factor Auth</span>
                    <span className="font-medium">{LOGIN_SECURITY.enableTwoFactor ? 'Enabled' : 'Disabled'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">CAPTCHA</span>
                    <span className="font-medium">{LOGIN_SECURITY.requireCaptcha ? 'Enabled' : 'Disabled'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-base">
                  <FileText className="h-5 w-5 mr-2" />
                  Audit Logging
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status</span>
                    <Badge className="bg-green-100 text-green-800">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      {AUDIT_CONFIG.enabled ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Log Level</span>
                    <span className="font-medium">{AUDIT_CONFIG.logLevel}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Retention</span>
                    <span className="font-medium">{AUDIT_CONFIG.retentionDays} days</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Mask Sensitive</span>
                    <span className="font-medium">{AUDIT_CONFIG.maskSensitiveData ? 'Yes' : 'No'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* API Security Tab */}
        <TabsContent value="api-security" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-base">
                  <Shield className="h-5 w-5 mr-2" />
                  API Request Limits
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Max Body Size</span>
                    <span className="font-medium">{formatBytes(API_SECURITY.maxRequestBodySize)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Max Query Length</span>
                    <span className="font-medium">{API_SECURITY.maxQueryParamsLength} chars</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Max Header Size</span>
                    <span className="font-medium">{(API_SECURITY.maxHeaderSize / 1024).toFixed(0)} KB</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-base">
                  <FileText className="h-5 w-5 mr-2" />
                  File Upload Security
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Avatar Max</span>
                    <span className="font-medium">{formatBytes(FILE_UPLOAD_SECURITY.maxFileSize.avatar)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Document Max</span>
                    <span className="font-medium">{formatBytes(FILE_UPLOAD_SECURITY.maxFileSize.document)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Report Max</span>
                    <span className="font-medium">{formatBytes(FILE_UPLOAD_SECURITY.maxFileSize.report)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Allowed Types</span>
                    <span className="font-medium">{FILE_UPLOAD_SECURITY.allowedMimeTypes.all.length} types</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Security Features</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">Input Validation</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 mr-2 mt-0.5 text-green-500 flex-shrink-0" />
                      <span>Sanitize Input: {API_SECURITY.sanitizeInput ? 'Enabled' : 'Disabled'}</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 mr-2 mt-0.5 text-green-500 flex-shrink-0" />
                      <span>Strip HTML Tags: {API_SECURITY.stripHtmlTags ? 'Enabled' : 'Disabled'}</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 mr-2 mt-0.5 text-green-500 flex-shrink-0" />
                      <span>SQL Injection Prevention: {API_SECURITY.preventSqlInjection ? 'Enabled' : 'Disabled'}</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 mr-2 mt-0.5 text-green-500 flex-shrink-0" />
                      <span>XSS Prevention: {API_SECURITY.preventXss ? 'Enabled' : 'Disabled'}</span>
                    </li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">Response Security</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 mr-2 mt-0.5 text-green-500 flex-shrink-0" />
                      <span>Hide Stack Trace: {API_SECURITY.hideStackTrace ? 'Enabled' : 'Disabled'}</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 mr-2 mt-0.5 text-green-500 flex-shrink-0" />
                      <span>Hide Internal Errors: {API_SECURITY.hideInternalErrors ? 'Enabled' : 'Disabled'}</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 mr-2 mt-0.5 text-green-500 flex-shrink-0" />
                      <span>Sanitize Error Messages: {API_SECURITY.sanitizeErrorMessages ? 'Enabled' : 'Disabled'}</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Authentication Tab */}
        <TabsContent value="authentication" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Password Policy</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 mr-2 mt-0.5 text-green-500 flex-shrink-0" />
                    <span>Minimum {PASSWORD_REQUIREMENTS.minLength} characters</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 mr-2 mt-0.5 text-green-500 flex-shrink-0" />
                    <span>Maximum {PASSWORD_REQUIREMENTS.maxLength} characters</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 mr-2 mt-0.5 text-green-500 flex-shrink-0" />
                    <span>Prevent common passwords</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 mr-2 mt-0.5 text-green-500 flex-shrink-0" />
                    <span>Prevent reuse of last {PASSWORD_REQUIREMENTS.preventReuse} passwords</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 mr-2 mt-0.5 text-green-500 flex-shrink-0" />
                    <span>bcrypt hashing (10 rounds)</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Login Protection</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 mr-2 mt-0.5 text-green-500 flex-shrink-0" />
                    <span>Max {LOGIN_SECURITY.maxAttempts} login attempts</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 mr-2 mt-0.5 text-green-500 flex-shrink-0" />
                    <span>Lockout for {formatMs(LOGIN_SECURITY.lockoutDuration)}</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 mr-2 mt-0.5 text-green-500 flex-shrink-0" />
                    <span>Reset after {formatMs(LOGIN_SECURITY.resetAttemptsAfter)}</span>
                  </li>
                  <li className="flex items-start">
                    {LOGIN_SECURITY.enableTwoFactor ? (
                      <CheckCircle className="h-4 w-4 mr-2 mt-0.5 text-green-500 flex-shrink-0" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 mr-2 mt-0.5 text-yellow-500 flex-shrink-0" />
                    )}
                    <span>Two-Factor Authentication: {LOGIN_SECURITY.enableTwoFactor ? 'Enabled' : 'Disabled'}</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* API Security Tab */}
        <TabsContent value="api-security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Active Security Measures</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 mr-2 mt-0.5 text-green-500 flex-shrink-0" />
                    <span><strong>Rate Limiting:</strong> 6 endpoint configurations</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 mr-2 mt-0.5 text-green-500 flex-shrink-0" />
                    <span><strong>Authentication:</strong> Supabase Auth + JWT</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 mr-2 mt-0.5 text-green-500 flex-shrink-0" />
                    <span><strong>Authorization:</strong> RBAC with 6 roles</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 mr-2 mt-0.5 text-green-500 flex-shrink-0" />
                    <span><strong>Permissions:</strong> 34 granular permissions</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 mr-2 mt-0.5 text-green-500 flex-shrink-0" />
                    <span><strong>CSRF Protection:</strong> Built-in with Supabase</span>
                  </li>
                </ul>

                <ul className="space-y-2 text-sm">
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 mr-2 mt-0.5 text-green-500 flex-shrink-0" />
                    <span><strong>Security Headers:</strong> CSP, HSTS, X-Frame-Options</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 mr-2 mt-0.5 text-green-500 flex-shrink-0" />
                    <span><strong>Input Sanitization:</strong> XSS and SQL injection prevention</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 mr-2 mt-0.5 text-green-500 flex-shrink-0" />
                    <span><strong>Audit Logging:</strong> Complete activity tracking</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 mr-2 mt-0.5 text-green-500 flex-shrink-0" />
                    <span><strong>File Validation:</strong> Type and size checking</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 mr-2 mt-0.5 text-green-500 flex-shrink-0" />
                    <span><strong>Data Masking:</strong> Sensitive data redaction</span>
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
