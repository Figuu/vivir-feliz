'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  CheckCircle,
  Clock,
  Mail,
  MessageSquare,
  Send,
  RefreshCw,
  AlertTriangle,
  Calendar,
  User,
  Phone,
  Edit,
  X,
  Eye,
  Filter,
  Search,
  Download,
  Bell,
  BellOff,
  Settings,
  BarChart3,
  Users,
  Timer,
  CheckSquare,
  Square,
  AlertCircle,
  Info,
  TrendingUp,
  Activity,
  Target
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { SessionConfirmationManager } from '@/components/sessions/session-confirmation-manager'
import { SessionConfirmationDialog } from '@/components/sessions/session-confirmation-dialog'

export default function SessionConfirmationPage() {
  const [activeTab, setActiveTab] = useState('manager')
  const [showConfirmationDialog, setShowConfirmationDialog] = useState(false)
  const [confirmationToken, setConfirmationToken] = useState<string | null>(null)

  const handleConfirmationSent = (result: any) => {
    console.log('Confirmation sent:', result)
    // You could show a success notification here
  }

  const handleSessionConfirmed = (result: any) => {
    console.log('Session confirmed:', result)
    // You could show a success notification here
  }

  const handleRescheduleRequest = (result: any) => {
    console.log('Reschedule request:', result)
    // You could show a success notification here
  }

  const handleConfirmationDialogComplete = (result: any) => {
    setShowConfirmationDialog(false)
    setConfirmationToken(null)
    setActiveTab('manager')
    // You could show a success notification here
  }

  const handleConfirmationDialogCancel = () => {
    setShowConfirmationDialog(false)
    setConfirmationToken(null)
    setActiveTab('manager')
  }

  const openConfirmationDialog = (token: string) => {
    setConfirmationToken(token)
    setShowConfirmationDialog(true)
    setActiveTab('dialog')
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Session Confirmation System</h1>
          <p className="text-muted-foreground">
            Manage session confirmations and track confirmation status
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <BarChart3 className="h-4 w-4 mr-2" />
            Analytics
          </Button>
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              All scheduled sessions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Confirmation</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">0</div>
            <p className="text-xs text-muted-foreground">
              Awaiting confirmation
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Confirmed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">0</div>
            <p className="text-xs text-muted-foreground">
              Confirmed sessions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Confirmation Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0%</div>
            <p className="text-xs text-muted-foreground">
              Success rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="manager">Confirmation Manager</TabsTrigger>
          <TabsTrigger value="dialog" disabled={!showConfirmationDialog}>Confirmation Dialog</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="manager" className="space-y-4">
          <AnimatePresence mode="wait">
            {!showConfirmationDialog ? (
              <motion.div
                key="manager"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <SessionConfirmationManager
                  onConfirmationSent={handleConfirmationSent}
                  onSessionConfirmed={handleSessionConfirmed}
                />
              </motion.div>
            ) : (
              <motion.div
                key="dialog"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                {confirmationToken && (
                  <SessionConfirmationDialog
                    confirmationToken={confirmationToken}
                    onConfirmationComplete={handleConfirmationDialogComplete}
                    onRescheduleRequest={handleRescheduleRequest}
                    onCancel={handleConfirmationDialogCancel}
                  />
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </TabsContent>

        <TabsContent value="dialog" className="space-y-4">
          {confirmationToken ? (
            <SessionConfirmationDialog
              confirmationToken={confirmationToken}
              onConfirmationComplete={handleConfirmationDialogComplete}
              onRescheduleRequest={handleRescheduleRequest}
              onCancel={handleConfirmationDialogCancel}
            />
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <CheckCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Confirmation Token</h3>
                <p className="text-muted-foreground">
                  Please provide a valid confirmation token to access the confirmation dialog.
                </p>
                <Button 
                  className="mt-4"
                  onClick={() => openConfirmationDialog('demo-token-123')}
                >
                  Demo Confirmation Dialog
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                Confirmation Analytics
              </CardTitle>
              <CardDescription>
                Analyze confirmation patterns and success rates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <BarChart3 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Analytics Dashboard</h3>
                <p className="text-muted-foreground">
                  This view will show confirmation analytics, success rates, and optimization recommendations.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Features Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Send className="h-5 w-5 mr-2" />
              Confirmation Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Send email and SMS confirmations</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Bulk confirmation sending</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Automated reminder scheduling</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Confirmation status tracking</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CheckCircle className="h-5 w-5 mr-2" />
              Patient Confirmation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Easy session confirmation</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Reschedule request submission</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Session cancellation</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Alternative time suggestions</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              Analytics & Reporting
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span>Confirmation success rates</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span>Response time analytics</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span>No-show tracking</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span>Optimization recommendations</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="h-5 w-5 mr-2" />
            Quick Actions
          </CardTitle>
          <CardDescription>
            Common confirmation management tasks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Button
              variant="outline"
              className="h-20 flex flex-col items-center justify-center space-y-2"
              onClick={() => openConfirmationDialog('demo-token-123')}
            >
              <CheckCircle className="h-6 w-6" />
              <span>Demo Confirmation</span>
            </Button>
            
            <Button
              variant="outline"
              className="h-20 flex flex-col items-center justify-center space-y-2"
            >
              <Send className="h-6 w-6" />
              <span>Send Bulk Confirmations</span>
            </Button>
            
            <Button
              variant="outline"
              className="h-20 flex flex-col items-center justify-center space-y-2"
            >
              <BarChart3 className="h-6 w-6" />
              <span>View Analytics</span>
            </Button>
            
            <Button
              variant="outline"
              className="h-20 flex flex-col items-center justify-center space-y-2"
            >
              <Settings className="h-6 w-6" />
              <span>Configure Settings</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
