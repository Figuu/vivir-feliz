'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MobileSuperAdminDashboard } from '@/components/super-admin/mobile-super-admin-dashboard'
import { MobileFinancialOverview } from '@/components/super-admin/mobile-financial-overview'
import { MobileSystemHealth } from '@/components/super-admin/mobile-system-health'
import { 
  Smartphone, 
  Shield,
  DollarSign,
  Activity,
  CheckCircle,
  Zap,
  TouchpadIcon
} from 'lucide-react'

export default function SuperAdminMobilePage() {
  const [activeDemo, setActiveDemo] = useState<'dashboard' | 'financial' | 'health'>('dashboard')

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Super Admin Mobile Interfaces</h1>
        <p className="text-muted-foreground">
          Mobile-optimized interfaces for super administrator functions
        </p>
      </div>

      {/* Features Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Smartphone className="h-5 w-5 mr-2" />
            Mobile Features
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="flex items-start space-x-3">
              <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                <Shield className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Mobile Dashboard</h3>
                <p className="text-sm text-muted-foreground">
                  Touch-optimized admin control panel with quick stats and actions
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Financial Overview</h3>
                <p className="text-sm text-muted-foreground">
                  Mobile financial monitoring with revenue breakdown
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <Activity className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">System Health</h3>
                <p className="text-sm text-muted-foreground">
                  Real-time system status monitoring on mobile
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                <TouchpadIcon className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Touch-Optimized</h3>
                <p className="text-sm text-muted-foreground">
                  Large tap targets and mobile-friendly controls
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="h-10 w-10 rounded-full bg-pink-100 flex items-center justify-center flex-shrink-0">
                <Zap className="h-5 w-5 text-pink-600" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Fast Performance</h3>
                <p className="text-sm text-muted-foreground">
                  Optimized for mobile networks and devices
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                <CheckCircle className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Responsive Design</h3>
                <p className="text-sm text-muted-foreground">
                  Adapts seamlessly to all screen sizes
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mobile Interface Demos */}
      <Tabs value={activeDemo} onValueChange={(v) => setActiveDemo(v as any)} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="dashboard">
            <Shield className="h-4 w-4 mr-2" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="financial">
            <DollarSign className="h-4 w-4 mr-2" />
            Financial
          </TabsTrigger>
          <TabsTrigger value="health">
            <Activity className="h-4 w-4 mr-2" />
            Health
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Mobile Dashboard Demo</span>
                <Badge variant="outline" className="bg-purple-50">
                  <Smartphone className="h-3 w-3 mr-1" />
                  Mobile View
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-w-md mx-auto border-4 border-gray-800 rounded-3xl overflow-hidden shadow-2xl">
                <MobileSuperAdminDashboard />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="financial" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Mobile Financial Overview Demo</span>
                <Badge variant="outline" className="bg-green-50">
                  <Smartphone className="h-3 w-3 mr-1" />
                  Mobile View
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-w-md mx-auto border-4 border-gray-800 rounded-3xl overflow-hidden shadow-2xl">
                <MobileFinancialOverview />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="health" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Mobile System Health Demo</span>
                <Badge variant="outline" className="bg-blue-50">
                  <Smartphone className="h-3 w-3 mr-1" />
                  Mobile View
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-w-md mx-auto border-4 border-gray-800 rounded-3xl overflow-hidden shadow-2xl">
                <MobileSystemHealth />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Technical Features */}
      <Card>
        <CardHeader>
          <CardTitle>Technical Implementation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Mobile Optimization Features</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start">
                <CheckCircle className="h-4 w-4 mr-2 mt-0.5 text-green-600 flex-shrink-0" />
                <span><strong>Responsive Layouts:</strong> Fluid grids optimized for touch interaction</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-4 w-4 mr-2 mt-0.5 text-green-600 flex-shrink-0" />
                <span><strong>Touch Controls:</strong> Large tap targets (minimum 44x44px)</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-4 w-4 mr-2 mt-0.5 text-green-600 flex-shrink-0" />
                <span><strong>Bottom Navigation:</strong> Fixed navigation bar for easy access</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-4 w-4 mr-2 mt-0.5 text-green-600 flex-shrink-0" />
                <span><strong>Auto-Refresh:</strong> Real-time data updates for monitoring</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-4 w-4 mr-2 mt-0.5 text-green-600 flex-shrink-0" />
                <span><strong>Sticky Headers:</strong> Context remains visible while scrolling</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-4 w-4 mr-2 mt-0.5 text-green-600 flex-shrink-0" />
                <span><strong>Visual Indicators:</strong> Color-coded status and health metrics</span>
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
