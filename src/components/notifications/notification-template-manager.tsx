'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Bell, 
  Mail,
  MessageSquare,
  Smartphone,
  Plus,
  Edit,
  Trash2,
  Eye,
  Search,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  X
} from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from '@/hooks/use-toast'

interface NotificationTemplate {
  id: string
  name: string
  description: string | null
  type: 'email' | 'sms' | 'in_app'
  category: string
  subject: string | null
  body: string
  variables: string[]
  isActive: boolean
  createdAt: string
}

export function NotificationTemplateManager() {
  const [loading, setLoading] = useState(false)
  const [templates, setTemplates] = useState<NotificationTemplate[]>([])
  const [statistics, setStatistics] = useState<any>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<NotificationTemplate | null>(null)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [activeTab, setActiveTab] = useState('all')
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'email' as 'email' | 'sms' | 'in_app',
    category: 'general',
    subject: '',
    body: '',
    variables: [] as string[],
    isActive: true
  })

  useEffect(() => {
    loadTemplates()
  }, [typeFilter, categoryFilter])

  const loadTemplates = async () => {
    try {
      setLoading(true)
      
      const params = new URLSearchParams()
      if (typeFilter) params.append('type', typeFilter)
      if (categoryFilter) params.append('category', categoryFilter)
      if (searchTerm) params.append('search', searchTerm)

      const response = await fetch(`/api/notification-templates?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error('Failed to load templates')
      }

      const result = await response.json()
      setTemplates(result.data.templates)
      setStatistics(result.data.statistics)
    } catch (err) {
      console.error('Error loading templates:', err)
      toast({
        variant: "destructive",
        title: "Error",
        description: 'Failed to load notification templates'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTemplate = async () => {
    if (!formData.name || !formData.body) {
      toast({
        variant: "destructive",
        title: "Error",
        description: 'Name and body are required'
      })
      return
    }

    try {
      setLoading(true)

      const response = await fetch('/api/notification-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          createdBy: 'admin-1' // Should come from auth context
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create template')
      }

      toast({
        title: "Success",
        description: 'Template created successfully'
      })
      setCreateDialogOpen(false)
      resetForm()
      loadTemplates()
    } catch (err: any) {
      console.error('Error creating template:', err)
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || 'Failed to create template'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateTemplate = async () => {
    if (!selectedTemplate) return

    try {
      setLoading(true)

      const response = await fetch('/api/notification-templates', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: selectedTemplate.id,
          ...formData,
          updatedBy: 'admin-1'
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update template')
      }

      toast({
        title: "Success",
        description: 'Template updated successfully'
      })
      setEditDialogOpen(false)
      loadTemplates()
    } catch (err: any) {
      console.error('Error updating template:', err)
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || 'Failed to update template'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return

    try {
      setLoading(true)

      const response = await fetch(`/api/notification-templates?templateId=${templateId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete template')
      }

      toast({
        title: "Success",
        description: 'Template deleted successfully'
      })
      loadTemplates()
    } catch (err) {
      console.error('Error deleting template:', err)
      toast({
        variant: "destructive",
        title: "Error",
        description: 'Failed to delete template'
      })
    } finally {
      setLoading(false)
    }
  }

  const openEditDialog = (template: NotificationTemplate) => {
    setSelectedTemplate(template)
    setFormData({
      name: template.name,
      description: template.description || '',
      type: template.type,
      category: template.category,
      subject: template.subject || '',
      body: template.body,
      variables: template.variables,
      isActive: template.isActive
    })
    setEditDialogOpen(true)
  }

  const openPreviewDialog = (template: NotificationTemplate) => {
    setSelectedTemplate(template)
    setPreviewDialogOpen(true)
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      type: 'email',
      category: 'general',
      subject: '',
      body: '',
      variables: [],
      isActive: true
    })
  }

  const addVariable = (variable: string) => {
    if (!variable.trim()) return
    if (formData.variables.includes(variable)) return
    
    setFormData({
      ...formData,
      variables: [...formData.variables, variable]
    })
  }

  const removeVariable = (variable: string) => {
    setFormData({
      ...formData,
      variables: formData.variables.filter(v => v !== variable)
    })
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'email': return <Mail className="h-4 w-4" />
      case 'sms': return <MessageSquare className="h-4 w-4" />
      case 'in_app': return <Bell className="h-4 w-4" />
      default: return <Bell className="h-4 w-4" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'email': return 'bg-blue-100 text-blue-800'
      case 'sms': return 'bg-green-100 text-green-800'
      case 'in_app': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredTemplates = templates.filter(t => 
    activeTab === 'all' || t.type === activeTab
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <Bell className="h-5 w-5 mr-2" />
              Notification Template Manager
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={loadTemplates}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button size="sm" onClick={() => setCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Template
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Statistics */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground mb-1">Total Templates</p>
              <p className="text-3xl font-bold">{statistics.totalCount}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground mb-1">Active</p>
              <p className="text-3xl font-bold text-green-600">{statistics.activeCount}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground mb-2">By Type</p>
              <div className="space-y-1">
                {statistics.byType.map((t: any) => (
                  <div key={t.type} className="flex justify-between text-sm">
                    <span className="capitalize">{t.type}</span>
                    <span className="font-medium">{t.count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground mb-2">By Category</p>
              <div className="space-y-1 max-h-20 overflow-y-auto">
                {statistics.byCategory.slice(0, 3).map((c: any) => (
                  <div key={c.category} className="flex justify-between text-sm">
                    <span className="capitalize">{c.category}</span>
                    <span className="font-medium">{c.count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search templates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadTemplates()}
                className="pl-10"
              />
            </div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="border rounded-md px-3 py-2"
            >
              <option value="">All Types</option>
              <option value="email">Email</option>
              <option value="sms">SMS</option>
              <option value="in_app">In-App</option>
            </select>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="border rounded-md px-3 py-2"
            >
              <option value="">All Categories</option>
              <option value="appointment">Appointment</option>
              <option value="payment">Payment</option>
              <option value="report">Report</option>
              <option value="system">System</option>
              <option value="user">User</option>
              <option value="general">General</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Templates List */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All ({templates.length})</TabsTrigger>
          <TabsTrigger value="email">Email</TabsTrigger>
          <TabsTrigger value="sms">SMS</TabsTrigger>
          <TabsTrigger value="in_app">In-App</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {loading ? (
            <Card>
              <CardContent className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-muted-foreground mt-2">Loading templates...</p>
              </CardContent>
            </Card>
          ) : filteredTemplates.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Bell className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Templates</h3>
                <p className="text-muted-foreground mb-4">No notification templates found</p>
                <Button onClick={() => setCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Template
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredTemplates.map((template, index) => (
                <motion.div
                  key={template.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center space-x-2">
                            <h3 className="font-semibold text-lg">{template.name}</h3>
                            <Badge className={getTypeColor(template.type)}>
                              {getTypeIcon(template.type)}
                              <span className="ml-1">{template.type}</span>
                            </Badge>
                            <Badge variant="outline" className="capitalize">
                              {template.category}
                            </Badge>
                            {template.isActive ? (
                              <Badge className="bg-green-100 text-green-800">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Active
                              </Badge>
                            ) : (
                              <Badge variant="outline">Inactive</Badge>
                            )}
                          </div>
                          
                          {template.description && (
                            <p className="text-sm text-muted-foreground">{template.description}</p>
                          )}

                          {template.subject && (
                            <p className="text-sm"><strong>Subject:</strong> {template.subject}</p>
                          )}

                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {template.body}
                          </p>

                          {template.variables.length > 0 && (
                            <div className="flex items-center space-x-2 flex-wrap gap-1">
                              <span className="text-xs text-muted-foreground">Variables:</span>
                              {template.variables.map(v => (
                                <Badge key={v} variant="outline" className="text-xs">
                                  {v}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center space-x-2 ml-4">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openPreviewDialog(template)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditDialog(template)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteTemplate(template.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Create/Edit Dialog */}
      <Dialog open={createDialogOpen || editDialogOpen} onOpenChange={(open) => {
        setCreateDialogOpen(false)
        setEditDialogOpen(false)
        if (!open) resetForm()
      }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editDialogOpen ? 'Edit' : 'Create'} Notification Template</DialogTitle>
            <DialogDescription>
              Configure notification template for system communications
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Template Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Appointment Reminder"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Type *</Label>
                <select
                  id="type"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                  className="w-full border rounded-md px-3 py-2"
                >
                  <option value="email">Email</option>
                  <option value="sms">SMS</option>
                  <option value="in_app">In-App Notification</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <select
                id="category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full border rounded-md px-3 py-2"
              >
                <option value="appointment">Appointment</option>
                <option value="payment">Payment</option>
                <option value="report">Report</option>
                <option value="system">System</option>
                <option value="user">User</option>
                <option value="general">General</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of this template"
              />
            </div>

            {formData.type === 'email' && (
              <div className="space-y-2">
                <Label htmlFor="subject">Email Subject</Label>
                <Input
                  id="subject"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="e.g., Your appointment reminder"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="body">Template Body *</Label>
              <Textarea
                id="body"
                value={formData.body}
                onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                placeholder="Use {{variableName}} for dynamic content..."
                rows={8}
              />
              <p className="text-xs text-muted-foreground">
                Use double curly braces for variables: {`{{patientName}}`}, {`{{appointmentDate}}`}, etc.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Variables</Label>
              <div className="flex space-x-2">
                <Input
                  placeholder="Add variable name"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      addVariable((e.target as HTMLInputElement).value)
                      ;(e.target as HTMLInputElement).value = ''
                    }
                  }}
                />
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.variables.map(variable => (
                  <Badge key={variable} variant="outline" className="cursor-pointer" onClick={() => removeVariable(variable)}>
                    {variable}
                    <X className="h-3 w-3 ml-1" />
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="isActive" className="cursor-pointer">
                Template is active
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setCreateDialogOpen(false)
              setEditDialogOpen(false)
              resetForm()
            }}>
              Cancel
            </Button>
            <Button onClick={editDialogOpen ? handleUpdateTemplate : handleCreateTemplate} disabled={loading}>
              {editDialogOpen ? 'Update' : 'Create'} Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Template Preview</DialogTitle>
          </DialogHeader>
          
          {selectedTemplate && (
            <div className="space-y-4 py-4">
              <div className="flex items-center space-x-2">
                <Badge className={getTypeColor(selectedTemplate.type)}>
                  {getTypeIcon(selectedTemplate.type)}
                  <span className="ml-1">{selectedTemplate.type}</span>
                </Badge>
                <Badge variant="outline" className="capitalize">{selectedTemplate.category}</Badge>
              </div>

              {selectedTemplate.subject && (
                <div>
                  <Label className="text-sm">Subject</Label>
                  <p className="text-sm font-medium mt-1">{selectedTemplate.subject}</p>
                </div>
              )}

              <div>
                <Label className="text-sm">Body</Label>
                <div className="mt-2 p-4 bg-gray-50 border rounded-lg">
                  <p className="text-sm whitespace-pre-wrap">{selectedTemplate.body}</p>
                </div>
              </div>

              {selectedTemplate.variables.length > 0 && (
                <div>
                  <Label className="text-sm">Available Variables</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedTemplate.variables.map(v => (
                      <Badge key={v} variant="outline">{v}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
