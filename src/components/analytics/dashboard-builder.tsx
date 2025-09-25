"use client"

import React, { useState, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { 
  WidgetFactory, 
  WidgetConfig, 
  WidgetType, 
  WidgetSize, 
  DEFAULT_WIDGETS 
} from './widget-library'
import { 
  Plus, 
  Settings, 
  Trash2, 
  Save, 
  RotateCcw,
  Grip,
  Eye,
  Edit3
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

// Dashboard configuration interface
export interface DashboardConfig {
  id: string
  name: string
  description?: string
  widgets: WidgetConfig[]
  layout: 'grid' | 'masonry'
  columns: number
  createdAt: Date
  updatedAt: Date
}

// Widget template for easy selection
interface WidgetTemplate {
  id: string
  name: string
  description: string
  type: WidgetType
  size: WidgetSize
  dataSource: string
  category: string
}

const WIDGET_TEMPLATES: WidgetTemplate[] = [
  {
    id: 'users-metric',
    name: 'Active Users',
    description: 'Display current active user count',
    type: 'metric',
    size: 'small',
    dataSource: 'activeUsers',
    category: 'Metrics'
  },
  {
    id: 'sessions-metric',
    name: 'Total Sessions',
    description: 'Show total sessions for today',
    type: 'metric',
    size: 'small',
    dataSource: 'totalSessions',
    category: 'Metrics'
  },
  {
    id: 'signups-metric',
    name: 'New Signups',
    description: 'Track new user registrations',
    type: 'metric',
    size: 'small',
    dataSource: 'newSignups',
    category: 'Metrics'
  },
  {
    id: 'security-metric',
    name: 'Security Events',
    description: 'Monitor security events',
    type: 'metric',
    size: 'small',
    dataSource: 'securityEvents',
    category: 'Security'
  },
  {
    id: 'users-chart',
    name: 'User Growth Chart',
    description: 'Line chart showing user growth over time',
    type: 'line-chart',
    size: 'medium',
    dataSource: 'users',
    category: 'Charts'
  },
  {
    id: 'sessions-chart',
    name: 'Session Activity Chart',
    description: 'Area chart of session activity',
    type: 'area-chart',
    size: 'medium',
    dataSource: 'sessions',
    category: 'Charts'
  },
  {
    id: 'actions-bar-chart',
    name: 'Actions Bar Chart',
    description: 'Bar chart of user actions',
    type: 'bar-chart',
    size: 'medium',
    dataSource: 'actions',
    category: 'Charts'
  },
  {
    id: 'activity-feed',
    name: 'Live Activity Feed',
    description: 'Real-time activity stream',
    type: 'activity-feed',
    size: 'large',
    dataSource: 'activity',
    category: 'Activity'
  },
  {
    id: 'performance-gauge',
    name: 'Performance Dashboard',
    description: 'System performance metrics',
    type: 'performance-gauge',
    size: 'medium',
    dataSource: 'performance',
    category: 'System'
  }
]

export function DashboardBuilder() {
  const [dashboard, setDashboard] = useState<DashboardConfig>({
    id: crypto.randomUUID(),
    name: 'My Dashboard',
    description: 'Custom analytics dashboard',
    widgets: [...DEFAULT_WIDGETS],
    layout: 'grid',
    columns: 4,
    createdAt: new Date(),
    updatedAt: new Date()
  })
  
  const [isPreviewMode, setIsPreviewMode] = useState(false)
  const [selectedWidget, setSelectedWidget] = useState<WidgetConfig | null>(null)
  const [isWidgetDialogOpen, setIsWidgetDialogOpen] = useState(false)
  const { toast } = useToast()

  const addWidget = useCallback((template: WidgetTemplate) => {
    const newWidget: WidgetConfig = {
      id: crypto.randomUUID(),
      type: template.type,
      title: template.name,
      description: template.description,
      size: template.size,
      dataSource: template.dataSource,
      refreshInterval: 30000
    }

    setDashboard(prev => ({
      ...prev,
      widgets: [...prev.widgets, newWidget],
      updatedAt: new Date()
    }))

    setIsWidgetDialogOpen(false)
    toast({
      title: 'Widget Added',
      description: `${template.name} has been added to your dashboard`,
    })
  }, [toast])

  const removeWidget = useCallback((widgetId: string) => {
    setDashboard(prev => ({
      ...prev,
      widgets: prev.widgets.filter(w => w.id !== widgetId),
      updatedAt: new Date()
    }))

    toast({
      title: 'Widget Removed',
      description: 'Widget has been removed from your dashboard',
    })
  }, [toast])

  const updateWidget = useCallback((widgetId: string, updates: Partial<WidgetConfig>) => {
    setDashboard(prev => ({
      ...prev,
      widgets: prev.widgets.map(w => 
        w.id === widgetId ? { ...w, ...updates } : w
      ),
      updatedAt: new Date()
    }))
  }, [])

  const resetDashboard = useCallback(() => {
    setDashboard(prev => ({
      ...prev,
      widgets: [...DEFAULT_WIDGETS],
      updatedAt: new Date()
    }))

    toast({
      title: 'Dashboard Reset',
      description: 'Dashboard has been reset to default configuration',
    })
  }, [toast])

  const saveDashboard = useCallback(async () => {
    try {
      // In a real implementation, this would save to a backend
      localStorage.setItem('custom-dashboard', JSON.stringify(dashboard))
      
      toast({
        title: 'Dashboard Saved',
        description: 'Your dashboard configuration has been saved',
      })
    } catch {
      toast({
        title: 'Save Failed',
        description: 'Failed to save dashboard configuration',
        variant: 'destructive'
      })
    }
  }, [dashboard, toast])

  const loadDashboard = useCallback(() => {
    try {
      const saved = localStorage.getItem('custom-dashboard')
      if (saved) {
        const savedDashboard = JSON.parse(saved)
        setDashboard({
          ...savedDashboard,
          createdAt: new Date(savedDashboard.createdAt),
          updatedAt: new Date(savedDashboard.updatedAt)
        })
        
        toast({
          title: 'Dashboard Loaded',
          description: 'Your saved dashboard has been loaded',
        })
      }
    } catch {
      toast({
        title: 'Load Failed',
        description: 'Failed to load saved dashboard',
        variant: 'destructive'
      })
    }
  }, [toast])

  // Load saved dashboard on component mount
  React.useEffect(() => {
    loadDashboard()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const groupedTemplates = WIDGET_TEMPLATES.reduce((acc, template) => {
    if (!acc[template.category]) {
      acc[template.category] = []
    }
    acc[template.category].push(template)
    return acc
  }, {} as Record<string, WidgetTemplate[]>)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard Builder</h1>
          <p className="text-muted-foreground">
            Create and customize your analytics dashboard
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={resetDashboard}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset
          </Button>
          <Button variant="outline" onClick={saveDashboard}>
            <Save className="mr-2 h-4 w-4" />
            Save
          </Button>
          <Button 
            variant={isPreviewMode ? "default" : "outline"}
            onClick={() => setIsPreviewMode(!isPreviewMode)}
          >
            {isPreviewMode ? (
              <>
                <Edit3 className="mr-2 h-4 w-4" />
                Edit Mode
              </>
            ) : (
              <>
                <Eye className="mr-2 h-4 w-4" />
                Preview
              </>
            )}
          </Button>
        </div>
      </div>

      {!isPreviewMode && (
        <Tabs defaultValue="builder" className="space-y-4">
          <TabsList>
            <TabsTrigger value="builder">Builder</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="builder" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Dashboard Configuration</CardTitle>
                    <CardDescription>
                      Add, remove, and configure widgets for your dashboard
                    </CardDescription>
                  </div>
                  <Dialog open={isWidgetDialogOpen} onOpenChange={setIsWidgetDialogOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Widget
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Add New Widget</DialogTitle>
                        <DialogDescription>
                          Choose from available widget templates
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-6">
                        {Object.entries(groupedTemplates).map(([category, templates]) => (
                          <div key={category}>
                            <h3 className="font-semibold mb-3">{category}</h3>
                            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                              {templates.map((template) => (
                                <Card 
                                  key={template.id} 
                                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                                  onClick={() => addWidget(template)}
                                >
                                  <CardHeader className="pb-3">
                                    <div className="flex items-center justify-between">
                                      <CardTitle className="text-sm">{template.name}</CardTitle>
                                      <Badge variant="secondary" className="text-xs">
                                        {template.size}
                                      </Badge>
                                    </div>
                                    <CardDescription className="text-xs">
                                      {template.description}
                                    </CardDescription>
                                  </CardHeader>
                                </Card>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label htmlFor="dashboard-name">Dashboard Name</Label>
                      <Input
                        id="dashboard-name"
                        value={dashboard.name}
                        onChange={(e) => setDashboard(prev => ({
                          ...prev,
                          name: e.target.value,
                          updatedAt: new Date()
                        }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="dashboard-columns">Grid Columns</Label>
                      <Select
                        value={dashboard.columns.toString()}
                        onValueChange={(value) => setDashboard(prev => ({
                          ...prev,
                          columns: parseInt(value),
                          updatedAt: new Date()
                        }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="2">2 Columns</SelectItem>
                          <SelectItem value="3">3 Columns</SelectItem>
                          <SelectItem value="4">4 Columns</SelectItem>
                          <SelectItem value="6">6 Columns</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="dashboard-description">Description</Label>
                    <Input
                      id="dashboard-description"
                      value={dashboard.description || ''}
                      onChange={(e) => setDashboard(prev => ({
                        ...prev,
                        description: e.target.value,
                        updatedAt: new Date()
                      }))}
                      placeholder="Optional dashboard description"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Widget Management */}
            <Card>
              <CardHeader>
                <CardTitle>Current Widgets ({dashboard.widgets.length})</CardTitle>
                <CardDescription>
                  Manage your dashboard widgets
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {dashboard.widgets.map((widget) => (
                    <div key={widget.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Grip className="h-4 w-4 text-muted-foreground cursor-move" />
                        <div>
                          <div className="font-medium">{widget.title}</div>
                          <div className="text-sm text-muted-foreground">
                            {widget.type} • {widget.size} • {widget.dataSource}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedWidget(widget)}
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeWidget(widget.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {dashboard.widgets.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No widgets added yet. Click &quot;Add Widget&quot; to get started.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Dashboard Settings</CardTitle>
                <CardDescription>
                  Configure dashboard-wide settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label>Created</Label>
                    <div className="text-sm text-muted-foreground">
                      {dashboard.createdAt.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <Label>Last Updated</Label>
                    <div className="text-sm text-muted-foreground">
                      {dashboard.updatedAt.toLocaleString()}
                    </div>
                  </div>
                </div>
                <div>
                  <Label>Widget Count</Label>
                  <div className="text-sm text-muted-foreground">
                    {dashboard.widgets.length} widgets configured
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* Dashboard Preview */}
      <Card>
        <CardHeader>
          <CardTitle>
            {isPreviewMode ? 'Dashboard Preview' : 'Dashboard Layout'}
          </CardTitle>
          <CardDescription>
            {isPreviewMode 
              ? 'Live preview of your dashboard with real data'
              : 'Visual layout of your configured widgets'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div 
            className={`grid gap-4 auto-rows-min`}
            style={{ 
              gridTemplateColumns: `repeat(${dashboard.columns}, minmax(0, 1fr))` 
            }}
          >
            {dashboard.widgets.map((widget) => (
              <WidgetFactory key={widget.id} config={widget} />
            ))}
            {dashboard.widgets.length === 0 && (
              <div className="col-span-full text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
                <div className="space-y-2">
                  <h3 className="font-medium">No widgets configured</h3>
                  <p className="text-sm">Add widgets to see your dashboard come to life</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Widget Configuration Dialog */}
      {selectedWidget && (
        <Dialog open={!!selectedWidget} onOpenChange={() => setSelectedWidget(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Configure Widget</DialogTitle>
              <DialogDescription>
                Customize the selected widget settings
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="widget-title">Title</Label>
                <Input
                  id="widget-title"
                  value={selectedWidget.title}
                  onChange={(e) => setSelectedWidget(prev => 
                    prev ? { ...prev, title: e.target.value } : null
                  )}
                />
              </div>
              <div>
                <Label htmlFor="widget-description">Description</Label>
                <Input
                  id="widget-description"
                  value={selectedWidget.description || ''}
                  onChange={(e) => setSelectedWidget(prev => 
                    prev ? { ...prev, description: e.target.value } : null
                  )}
                />
              </div>
              <div>
                <Label htmlFor="widget-size">Size</Label>
                <Select
                  value={selectedWidget.size}
                  onValueChange={(value: WidgetSize) => setSelectedWidget(prev => 
                    prev ? { ...prev, size: value } : null
                  )}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">Small</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="large">Large</SelectItem>
                    <SelectItem value="extra-large">Extra Large</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="widget-refresh">Refresh Interval (seconds)</Label>
                <Input
                  id="widget-refresh"
                  type="number"
                  value={(selectedWidget.refreshInterval || 30000) / 1000}
                  onChange={(e) => setSelectedWidget(prev => 
                    prev ? { ...prev, refreshInterval: parseInt(e.target.value) * 1000 } : null
                  )}
                  min="5"
                  max="300"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setSelectedWidget(null)}>
                  Cancel
                </Button>
                <Button onClick={() => {
                  if (selectedWidget) {
                    updateWidget(selectedWidget.id, selectedWidget)
                    setSelectedWidget(null)
                    toast({
                      title: 'Widget Updated',
                      description: 'Widget configuration has been saved',
                    })
                  }
                }}>
                  Save Changes
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}