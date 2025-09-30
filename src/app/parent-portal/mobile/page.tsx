'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MobileParentDashboard } from '@/components/parent-portal/mobile-parent-dashboard'
import { MobileSessionViewer } from '@/components/parent-portal/mobile-session-viewer'
import { MobilePaymentManager } from '@/components/parent-portal/mobile-payment-manager'
import { 
  Smartphone, 
  Home, 
  Calendar,
  DollarSign,
  CheckCircle,
  Zap,
  TouchpadIcon
} from 'lucide-react'

export default function ParentMobilePage() {
  const [activeDemo, setActiveDemo] = useState<'dashboard' | 'sessions' | 'payments'>('dashboard')

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Parent Portal Mobile Interfaces</h1>
        <p className="text-muted-foreground">
          Mobile-optimized interfaces for parents to manage their child's therapy
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
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <Home className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Mobile Dashboard</h3>
                <p className="text-sm text-muted-foreground">
                  Touch-optimized dashboard with quick stats and actions
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <Calendar className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Session Management</h3>
                <p className="text-sm text-muted-foreground">
                  View and manage therapy sessions on mobile
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                <DollarSign className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Payment Manager</h3>
                <p className="text-sm text-muted-foreground">
                  Mobile-friendly payment viewing and processing
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                <TouchpadIcon className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Touch-Friendly</h3>
                <p className="text-sm text-muted-foreground">
                  Large tap targets and swipe gestures
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
                  Adapts to all screen sizes seamlessly
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
            <Home className="h-4 w-4 mr-2" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="sessions">
            <Calendar className="h-4 w-4 mr-2" />
            Sessions
          </TabsTrigger>
          <TabsTrigger value="payments">
            <DollarSign className="h-4 w-4 mr-2" />
            Payments
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Mobile Dashboard Demo</span>
                <Badge variant="outline" className="bg-blue-50">
                  <Smartphone className="h-3 w-3 mr-1" />
                  Mobile View
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-w-md mx-auto border-4 border-gray-800 rounded-3xl overflow-hidden shadow-2xl">
                <MobileParentDashboard patientId="patient-1" parentId="parent-1" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sessions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Mobile Session Viewer Demo</span>
                <Badge variant="outline" className="bg-green-50">
                  <Smartphone className="h-3 w-3 mr-1" />
                  Mobile View
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-w-md mx-auto border-4 border-gray-800 rounded-3xl overflow-hidden shadow-2xl">
                <MobileSessionViewer patientId="patient-1" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Mobile Payment Manager Demo</span>
                <Badge variant="outline" className="bg-purple-50">
                  <Smartphone className="h-3 w-3 mr-1" />
                  Mobile View
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-w-md mx-auto border-4 border-gray-800 rounded-3xl overflow-hidden shadow-2xl">
                <MobilePaymentManager patientId="patient-1" parentId="parent-1" />
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
                <span><strong>Responsive Layouts:</strong> Fluid grids that adapt to any screen size</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-4 w-4 mr-2 mt-0.5 text-green-600 flex-shrink-0" />
                <span><strong>Touch Interactions:</strong> Large tap targets (minimum 44x44px) for easy interaction</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-4 w-4 mr-2 mt-0.5 text-green-600 flex-shrink-0" />
                <span><strong>Bottom Navigation:</strong> Fixed bottom bar for easy thumb navigation</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-4 w-4 mr-2 mt-0.5 text-green-600 flex-shrink-0" />
                <span><strong>Sticky Headers:</strong> Context-aware headers that stay in view while scrolling</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-4 w-4 mr-2 mt-0.5 text-green-600 flex-shrink-0" />
                <span><strong>Modal Dialogs:</strong> Full-screen or bottom-sheet modals for better mobile UX</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-4 w-4 mr-2 mt-0.5 text-green-600 flex-shrink-0" />
                <span><strong>Pull-to-Refresh:</strong> Natural gesture-based data refresh</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-4 w-4 mr-2 mt-0.5 text-green-600 flex-shrink-0" />
                <span><strong>Animations:</strong> Smooth transitions using Framer Motion</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-4 w-4 mr-2 mt-0.5 text-green-600 flex-shrink-0" />
                <span><strong>Loading States:</strong> Clear feedback during data fetching</span>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Performance Optimizations</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start">
                <Zap className="h-4 w-4 mr-2 mt-0.5 text-yellow-600 flex-shrink-0" />
                <span><strong>Lazy Loading:</strong> Components load only when needed</span>
              </li>
              <li className="flex items-start">
                <Zap className="h-4 w-4 mr-2 mt-0.5 text-yellow-600 flex-shrink-0" />
                <span><strong>Image Optimization:</strong> Next.js Image component with automatic optimization</span>
              </li>
              <li className="flex items-start">
                <Zap className="h-4 w-4 mr-2 mt-0.5 text-yellow-600 flex-shrink-0" />
                <span><strong>Code Splitting:</strong> Automatic route-based code splitting</span>
              </li>
              <li className="flex items-start">
                <Zap className="h-4 w-4 mr-2 mt-0.5 text-yellow-600 flex-shrink-0" />
                <span><strong>Caching:</strong> React Query for efficient data caching</span>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Accessibility</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start">
                <CheckCircle className="h-4 w-4 mr-2 mt-0.5 text-blue-600 flex-shrink-0" />
                <span><strong>Screen Reader Support:</strong> Proper ARIA labels and semantic HTML</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-4 w-4 mr-2 mt-0.5 text-blue-600 flex-shrink-0" />
                <span><strong>Keyboard Navigation:</strong> Full keyboard accessibility</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-4 w-4 mr-2 mt-0.5 text-blue-600 flex-shrink-0" />
                <span><strong>Color Contrast:</strong> WCAG AA compliant color contrast ratios</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-4 w-4 mr-2 mt-0.5 text-blue-600 flex-shrink-0" />
                <span><strong>Focus Indicators:</strong> Clear focus states for all interactive elements</span>
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
