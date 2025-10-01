'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Activity, 
  AlertTriangle,
  CheckCircle,
  Database,
  FileText,
  Shield,
  Clock,
  Zap,
  XCircle
} from 'lucide-react'
import { 
  LOGGING_CONFIG, 
  MONITORING_CONFIG, 
  AUDIT_LOGGING_CONFIG,
  SYSTEM_METRICS,
  LogLevel
} from '@/lib/monitoring-config'

export function MonitoringDashboard() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="h-5 w-5 mr-2" />
            Monitoring & Logging Configuration
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            Current monitoring and logging settings
          </p>
        </CardHeader>
      </Card>

      {/* Status */}
      <Alert>
        <CheckCircle className="h-4 w-4" />
        <AlertDescription>
          <p className="font-semibold mb-2">All Systems Operational</p>
          <p className="text-sm">
            Monitoring and logging are properly configured and active.
          </p>
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="logging" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="logging">Logging</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
        </TabsList>

        {/* Logging Tab */}
        <TabsContent value="logging" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-base">
                  <FileText className="h-5 w-5 mr-2" />
                  General Logging
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Status</span>
                    <Badge className="bg-green-100 text-green-800">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      {LOGGING_CONFIG.enabled ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Log Level</span>
                    <Badge variant="outline" className="capitalize">{LOGGING_CONFIG.level}</Badge>
                  </div>
                  <div className="pt-3 border-t">
                    <p className="text-sm font-medium mb-2">Destinations</p>
                    <ul className="space-y-1 text-sm">
                      <li className="flex items-center">
                        {LOGGING_CONFIG.destinations.console ? (
                          <CheckCircle className="h-3 w-3 mr-2 text-green-500" />
                        ) : (
                          <XCircle className="h-3 w-3 mr-2 text-gray-400" />
                        )}
                        Console
                      </li>
                      <li className="flex items-center">
                        {LOGGING_CONFIG.destinations.database ? (
                          <CheckCircle className="h-3 w-3 mr-2 text-green-500" />
                        ) : (
                          <XCircle className="h-3 w-3 mr-2 text-gray-400" />
                        )}
                        Database
                      </li>
                      <li className="flex items-center">
                        {LOGGING_CONFIG.destinations.file ? (
                          <CheckCircle className="h-3 w-3 mr-2 text-green-500" />
                        ) : (
                          <XCircle className="h-3 w-3 mr-2 text-gray-400" />
                        )}
                        File
                      </li>
                      <li className="flex items-center">
                        {LOGGING_CONFIG.destinations.external ? (
                          <CheckCircle className="h-3 w-3 mr-2 text-green-500" />
                        ) : (
                          <XCircle className="h-3 w-3 mr-2 text-gray-400" />
                        )}
                        External Services
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-base">
                  <Shield className="h-5 w-5 mr-2" />
                  Audit Logging
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Status</span>
                    <Badge className="bg-green-100 text-green-800">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      {AUDIT_LOGGING_CONFIG.enabled ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Tracked Actions</span>
                    <span className="font-medium">{AUDIT_LOGGING_CONFIG.auditActions.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Mask Sensitive Data</span>
                    <Badge variant="outline">{AUDIT_LOGGING_CONFIG.maskSensitiveData ? 'Yes' : 'No'}</Badge>
                  </div>
                  <div className="pt-3 border-t">
                    <p className="text-sm font-medium mb-2">Retention Policy</p>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li className="flex justify-between">
                        <span>Critical</span>
                        <span>{AUDIT_LOGGING_CONFIG.retention.critical} days</span>
                      </li>
                      <li className="flex justify-between">
                        <span>Warning</span>
                        <span>{AUDIT_LOGGING_CONFIG.retention.warning} days</span>
                      </li>
                      <li className="flex justify-between">
                        <span>Info</span>
                        <span>{AUDIT_LOGGING_CONFIG.retention.info} days</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Logging Features</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 mr-2 mt-0.5 text-green-500 flex-shrink-0" />
                    <span>Request Logging: {LOGGING_CONFIG.logRequests ? 'Enabled' : 'Disabled'}</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 mr-2 mt-0.5 text-green-500 flex-shrink-0" />
                    <span>Error Logging: {LOGGING_CONFIG.logErrors ? 'Enabled' : 'Disabled'}</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 mr-2 mt-0.5 text-green-500 flex-shrink-0" />
                    <span>Performance Logging: {LOGGING_CONFIG.logPerformance ? 'Enabled' : 'Disabled'}</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 mr-2 mt-0.5 text-green-500 flex-shrink-0" />
                    <span>Security Logging: {LOGGING_CONFIG.logSecurity ? 'Enabled' : 'Disabled'}</span>
                  </li>
                </ul>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 mr-2 mt-0.5 text-green-500 flex-shrink-0" />
                    <span>Include Headers: {LOGGING_CONFIG.requestLogging.includeHeaders ? 'Yes' : 'No'}</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 mr-2 mt-0.5 text-green-500 flex-shrink-0" />
                    <span>Include Query: {LOGGING_CONFIG.requestLogging.includeQuery ? 'Yes' : 'No'}</span>
                  </li>
                  <li className="flex items-start">
                    <AlertTriangle className="h-4 w-4 mr-2 mt-0.5 text-yellow-500 flex-shrink-0" />
                    <span>Include Body: {LOGGING_CONFIG.requestLogging.includeBody ? 'Yes' : 'No (Secure)'}</span>
                  </li>
                  <li className="flex items-start">
                    <AlertTriangle className="h-4 w-4 mr-2 mt-0.5 text-yellow-500 flex-shrink-0" />
                    <span>Include Cookies: {LOGGING_CONFIG.requestLogging.includeCookies ? 'Yes' : 'No (Secure)'}</span>
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Monitoring Tab */}
        <TabsContent value="monitoring" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-base">
                  <Database className="h-5 w-5 mr-2" />
                  Health Checks
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Status</span>
                    <Badge className="bg-green-100 text-green-800">
                      {MONITORING_CONFIG.healthCheck.enabled ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Interval</span>
                    <span className="text-sm font-medium">{MONITORING_CONFIG.healthCheck.interval / 1000}s</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Timeout</span>
                    <span className="text-sm font-medium">{MONITORING_CONFIG.healthCheck.timeout / 1000}s</span>
                  </div>
                  <div className="pt-3 border-t">
                    <p className="text-sm font-medium mb-2">Monitored Endpoints</p>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      {MONITORING_CONFIG.healthCheck.endpoints.map(endpoint => (
                        <li key={endpoint.name} className="flex items-center">
                          <CheckCircle className="h-3 w-3 mr-2 text-green-500" />
                          {endpoint.name}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-base">
                  <Zap className="h-5 w-5 mr-2" />
                  Performance Monitoring
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Status</span>
                    <Badge className="bg-green-100 text-green-800">
                      {MONITORING_CONFIG.performance.enabled ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Sample Rate</span>
                    <span className="text-sm font-medium">{(MONITORING_CONFIG.performance.sampleRate * 100).toFixed(0)}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Slow Threshold</span>
                    <span className="text-sm font-medium">{MONITORING_CONFIG.performance.slowRequestThreshold}ms</span>
                  </div>
                  <div className="pt-3 border-t">
                    <p className="text-sm font-medium mb-2">Tracked Metrics ({MONITORING_CONFIG.performance.trackMetrics.length})</p>
                    <div className="flex flex-wrap gap-1">
                      {MONITORING_CONFIG.performance.trackMetrics.slice(0, 3).map(metric => (
                        <Badge key={metric} variant="outline" className="text-xs">
                          {metric.replace(/_/g, ' ')}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-base">
                  <AlertTriangle className="h-5 w-5 mr-2" />
                  Error Tracking
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Status</span>
                    <Badge className="bg-green-100 text-green-800">
                      {MONITORING_CONFIG.errorTracking.enabled ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Capture Rate</span>
                    <span className="text-sm font-medium">{(MONITORING_CONFIG.errorTracking.captureRate * 100).toFixed(0)}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Max Sample Size</span>
                    <span className="text-sm font-medium">{MONITORING_CONFIG.errorTracking.maxSampleSize}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Ignored Errors</span>
                    <span className="text-sm font-medium">{MONITORING_CONFIG.errorTracking.ignoreErrors.length}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-base">
                  <Clock className="h-5 w-5 mr-2" />
                  Alerting
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Status</span>
                    <Badge className="bg-green-100 text-green-800">
                      {MONITORING_CONFIG.alerting.enabled ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Channels</span>
                    <span className="text-sm font-medium">{MONITORING_CONFIG.alerting.channels.join(', ')}</span>
                  </div>
                  <div className="pt-3 border-t">
                    <p className="text-sm font-medium mb-2">Alert Rules ({MONITORING_CONFIG.alerting.rules.length})</p>
                    <ul className="space-y-2 text-sm">
                      {MONITORING_CONFIG.alerting.rules.map(rule => (
                        <li key={rule.name} className="flex items-start">
                          <Badge 
                            variant="outline" 
                            className={
                              rule.severity === 'critical' ? 'bg-red-50 text-red-700' :
                              rule.severity === 'warning' ? 'bg-yellow-50 text-yellow-700' :
                              'bg-blue-50 text-blue-700'
                            }
                          >
                            {rule.name}
                          </Badge>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Monitoring Tab */}
        <TabsContent value="monitoring" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Monitoring Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3 flex items-center text-sm">
                    <Zap className="h-4 w-4 mr-2" />
                    Performance Monitoring
                  </h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 mr-2 mt-0.5 text-green-500 flex-shrink-0" />
                      <span>Sample Rate: {(MONITORING_CONFIG.performance.sampleRate * 100).toFixed(0)}%</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 mr-2 mt-0.5 text-green-500 flex-shrink-0" />
                      <span>Slow Request Threshold: {MONITORING_CONFIG.performance.slowRequestThreshold}ms</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 mr-2 mt-0.5 text-green-500 flex-shrink-0" />
                      <span>Track Database Queries: {LOGGING_CONFIG.performanceLogging.trackDatabaseQueries ? 'Yes' : 'No'}</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 mr-2 mt-0.5 text-green-500 flex-shrink-0" />
                      <span>Track External APIs: {LOGGING_CONFIG.performanceLogging.trackExternalAPIs ? 'Yes' : 'No'}</span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-3 flex items-center text-sm">
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Error Tracking
                  </h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 mr-2 mt-0.5 text-green-500 flex-shrink-0" />
                      <span>Capture Stack Traces: {LOGGING_CONFIG.errorLogging.captureStackTrace ? 'Yes' : 'No'}</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 mr-2 mt-0.5 text-green-500 flex-shrink-0" />
                      <span>Include Context: {LOGGING_CONFIG.errorLogging.includeContext ? 'Yes' : 'No'}</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 mr-2 mt-0.5 text-green-500 flex-shrink-0" />
                      <span>Max Stack Depth: {LOGGING_CONFIG.errorLogging.maxStackTraceDepth}</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 mr-2 mt-0.5 text-green-500 flex-shrink-0" />
                      <span>Group Similar Errors: {LOGGING_CONFIG.errorLogging.groupSimilarErrors ? 'Yes' : 'No'}</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Metrics Tab */}
        <TabsContent value="metrics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(SYSTEM_METRICS).map(([category, metrics]) => (
              <Card key={category}>
                <CardHeader>
                  <CardTitle className="text-base capitalize">{category} Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1 text-sm">
                    {(metrics as string[]).map(metric => (
                      <li key={metric} className="flex items-center">
                        <CheckCircle className="h-3 w-3 mr-2 text-green-500" />
                        {metric.replace(/_/g, ' ')}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Metrics Collection</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <Badge className="bg-green-100 text-green-800">
                    {MONITORING_CONFIG.metrics.enabled ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Collection Interval</span>
                  <span className="font-medium">{MONITORING_CONFIG.metrics.interval / 1000}s</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Retention</span>
                  <span className="font-medium">{MONITORING_CONFIG.metrics.retention / (24 * 60 * 60 * 1000)} days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Aggregations</span>
                  <span className="font-medium">{MONITORING_CONFIG.metrics.aggregations.length} types</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
