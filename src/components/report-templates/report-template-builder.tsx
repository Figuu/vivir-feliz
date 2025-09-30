'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  FileText,
  Plus,
  Minus,
  Save,
  X,
  AlertCircle,
  CheckCircle,
  Info,
  Calendar,
  Clock,
  User,
  Users,
  Shield,
  AlertTriangle,
  Edit,
  Trash2,
  Copy,
  Move,
  GripVertical,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  Maximize,
  Minimize,
  ExternalLink,
  Link,
  Share,
  Bookmark,
  Flag,
  Tag,
  Hash,
  AtSign,
  DollarSign,
  Percent,
  Home,
  Settings,
  Bell,
  Menu,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Stop,
  RotateCcw,
  Square,
  CheckSquare,
  Crown,
  Trophy,
  Medal,
  Award,
  Activity,
  TrendingUp,
  TrendingDown,
  BookOpen,
  MessageSquare,
  Phone,
  Mail,
  MapPin,
  Star,
  Heart,
  Flame,
  Sparkles,
  Globe,
  Building,
  Key,
  Lock,
  Unlock,
  Database,
  Server,
  Code,
  Timer,
  RefreshCw,
  Download,
  Upload,
  Eye,
  Search,
  Filter,
  MoreVertical,
  UserCheck,
  UserCog,
  Zap,
  Brain,
  Smile,
  Frown,
  Meh,
  ThumbsUp,
  ThumbsDown,
  CheckCircle2,
  XCircle,
  AlertTriangle as AlertTriangleIcon,
  Info as InfoIcon,
  Lightbulb,
  BookmarkCheck,
  ClipboardCheck,
  FileCheck,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  BarChart,
  PieChart,
  LineChart,
  Activity as ActivityIcon,
  Type,
  Hash as HashIcon,
  Calendar as CalendarIcon,
  Clock as ClockIcon,
  CheckSquare as CheckSquareIcon,
  Circle,
  Upload as UploadIcon,
  PenTool
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from '@/hooks/use-toast'

interface ReportTemplateBuilderProps {
  templateId?: string
  onTemplateSaved?: (template: any) => void
  onCancel?: () => void
}

interface TemplateField {
  id?: string
  name: string
  label: string
  type: 'text' | 'textarea' | 'number' | 'date' | 'time' | 'select' | 'checkbox' | 'radio' | 'file' | 'signature'
  placeholder?: string
  helpText?: string
  isRequired: boolean
  minLength?: number
  maxLength?: number
  minValue?: number
  maxValue?: number
  pattern?: string
  options?: Array<{
    value: string
    label: string
    isDefault: boolean
  }>
  order: number
  isVisible: boolean
  isEditable: boolean
  showConditions?: Array<{
    field: string
    operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'is_empty' | 'is_not_empty'
    value: string
  }>
  allowedFileTypes?: string[]
  maxFileSize?: number
  signatureRequired: boolean
  defaultValue?: string | number | boolean
}

export function ReportTemplateBuilder({
  templateId,
  onTemplateSaved,
  onCancel
}: ReportTemplateBuilderProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('basic')
  
  // Template state
  const [template, setTemplate] = useState({
    name: '',
    description: '',
    category: 'custom' as 'therapeutic_plan' | 'progress_report' | 'final_report' | 'assessment' | 'evaluation' | 'custom',
    type: 'form' as 'form' | 'report' | 'assessment' | 'evaluation' | 'summary',
    isActive: true,
    isPublic: false,
    isDefault: false,
    version: '1.0.0',
    tags: [] as string[],
    settings: {
      allowMultipleSubmissions: false,
      requireApproval: false,
      autoSave: true,
      showProgress: true,
      allowDraft: true,
      maxSubmissions: undefined as number | undefined,
      expirationDate: undefined as string | undefined
    }
  })
  
  const [fields, setFields] = useState<TemplateField[]>([])
  const [newTag, setNewTag] = useState('')
  const [selectedField, setSelectedField] = useState<TemplateField | null>(null)

  // Load template if editing
  useEffect(() => {
    if (templateId) {
      loadTemplate()
    }
  }, [templateId])

  const loadTemplate = async () => {
    try {
      const response = await fetch(`/api/report-templates/${templateId}`)
      const result = await response.json()
      
      if (response.ok) {
        setTemplate({
          name: result.data.name,
          description: result.data.description,
          category: result.data.category,
          type: result.data.type,
          isActive: result.data.isActive,
          isPublic: result.data.isPublic,
          isDefault: result.data.isDefault,
          version: result.data.version,
          tags: result.data.tags || [],
          settings: result.data.settings || {}
        })
        setFields(result.data.fields || [])
      } else {
        setError(result.error || 'Failed to load template')
      }
    } catch (err) {
      setError('Failed to load template')
      console.error('Error loading template:', err)
    }
  }

  const addField = () => {
    const newField: TemplateField = {
      name: '',
      label: '',
      type: 'text',
      isRequired: false,
      order: fields.length,
      isVisible: true,
      isEditable: true,
      signatureRequired: false
    }
    setFields([...fields, newField])
    setSelectedField(newField)
  }

  const updateField = (index: number, field: Partial<TemplateField>) => {
    const updatedFields = [...fields]
    updatedFields[index] = { ...updatedFields[index], ...field }
    setFields(updatedFields)
    
    if (selectedField && selectedField === fields[index]) {
      setSelectedField(updatedFields[index])
    }
  }

  const removeField = (index: number) => {
    const updatedFields = fields.filter((_, i) => i !== index)
    setFields(updatedFields)
    
    if (selectedField === fields[index]) {
      setSelectedField(null)
    }
  }

  const moveField = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= fields.length) return
    
    const updatedFields = [...fields]
    const field = updatedFields[index]
    updatedFields[index] = updatedFields[newIndex]
    updatedFields[newIndex] = field
    
    // Update order
    updatedFields.forEach((f, i) => {
      f.order = i
    })
    
    setFields(updatedFields)
  }

  const addTag = () => {
    if (newTag.trim() && !template.tags.includes(newTag.trim())) {
      setTemplate(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }))
      setNewTag('')
    }
  }

  const removeTag = (index: number) => {
    setTemplate(prev => ({
      ...prev,
      tags: prev.tags.filter((_, i) => i !== index)
    }))
  }

  const validateTemplate = () => {
    if (!template.name.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: 'Please enter a template name'
      })
      return false
    }
    
    if (!template.description.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: 'Please enter a template description'
      })
      return false
    }
    
    if (fields.length === 0) {
      toast({
        variant: "destructive",
        title: "Error",
        description: 'Please add at least one field'
      })
      return false
    }
    
    for (let i = 0; i < fields.length; i++) {
      const field = fields[i]
      
      if (!field.name.trim()) {
        toast({
        variant: "destructive",
        title: "Error",
        description: `Please enter a name for field ${i + 1}`
      })
        return false
      }
      
      if (!field.label.trim()) {
        toast({
        variant: "destructive",
        title: "Error",
        description: `Please enter a label for field ${i + 1}`
      })
        return false
      }
      
      // Check for duplicate field names
      const duplicateNames = fields.filter(f => f.name === field.name)
      if (duplicateNames.length > 1) {
        toast({
        variant: "destructive",
        title: "Error",
        description: `Duplicate field name: ${field.name}`
      })
        return false
      }
      
      // Validate field type specific rules
      if ((field.type === 'select' || field.type === 'radio') && (!field.options || field.options.length === 0)) {
        toast({
        variant: "destructive",
        title: "Error",
        description: `Field "${field.name}" of type ${field.type} requires options`
      })
        return false
      }
      
      if (field.type === 'number' && field.minValue !== undefined && field.maxValue !== undefined) {
        if (field.minValue >= field.maxValue) {
          toast({
        variant: "destructive",
        title: "Error",
        description: `Field "${field.name}": minValue must be less than maxValue`
      })
          return false
        }
      }
      
      if ((field.type === 'text' || field.type === 'textarea') && field.minLength !== undefined && field.maxLength !== undefined) {
        if (field.minLength > field.maxLength) {
          toast({
        variant: "destructive",
        title: "Error",
        description: `Field "${field.name}": minLength must be less than or equal to maxLength`
      })
          return false
        }
      }
    }
    
    return true
  }

  const handleSave = async () => {
    if (!validateTemplate()) return

    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/report-templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...template,
          fields,
          createdBy: 'user-1' // This should come from auth context
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save template')
      }

      toast({
        title: "Success",
        description: 'Template saved successfully'
      })
      if (onTemplateSaved) {
        onTemplateSaved(result.data)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save template'
      setError(errorMessage)
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage
      })
      console.error('Error saving template:', err)
    } finally {
      setLoading(false)
    }
  }

  const getFieldTypeIcon = (type: string) => {
    switch (type) {
      case 'text': return <Type className="h-4 w-4" />
      case 'textarea': return <FileText className="h-4 w-4" />
      case 'number': return <HashIcon className="h-4 w-4" />
      case 'date': return <CalendarIcon className="h-4 w-4" />
      case 'time': return <ClockIcon className="h-4 w-4" />
      case 'select': return <ChevronDown className="h-4 w-4" />
      case 'checkbox': return <CheckSquareIcon className="h-4 w-4" />
      case 'radio': return <Circle className="h-4 w-4" />
      case 'file': return <UploadIcon className="h-4 w-4" />
      case 'signature': return <PenTool className="h-4 w-4" />
      default: return <Type className="h-4 w-4" />
    }
  }

  const getFieldTypeColor = (type: string) => {
    switch (type) {
      case 'text': return 'bg-blue-100 text-blue-800'
      case 'textarea': return 'bg-green-100 text-green-800'
      case 'number': return 'bg-purple-100 text-purple-800'
      case 'date': return 'bg-orange-100 text-orange-800'
      case 'time': return 'bg-pink-100 text-pink-800'
      case 'select': return 'bg-indigo-100 text-indigo-800'
      case 'checkbox': return 'bg-yellow-100 text-yellow-800'
      case 'radio': return 'bg-red-100 text-red-800'
      case 'file': return 'bg-gray-100 text-gray-800'
      case 'signature': return 'bg-teal-100 text-teal-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Report Template Builder
              </CardTitle>
              <CardDescription>
                Create and customize report templates with field validation
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" onClick={onCancel}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={loading}>
                <Save className="h-4 w-4 mr-2" />
                {loading ? 'Saving...' : 'Save Template'}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="fields">Fields</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>

        {/* Basic Information Tab */}
        <TabsContent value="basic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Configure the basic information for your report template
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Template Name *</Label>
                <Input
                  id="name"
                  value={template.name}
                  onChange={(e) => setTemplate(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter template name"
                  maxLength={100}
                />
                <div className="text-sm text-muted-foreground mt-1">
                  {template.name.length}/100 characters
                </div>
              </div>
              
              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={template.description}
                  onChange={(e) => setTemplate(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter template description"
                  rows={3}
                  maxLength={500}
                />
                <div className="text-sm text-muted-foreground mt-1">
                  {template.description.length}/500 characters
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select value={template.category} onValueChange={(value: any) => setTemplate(prev => ({ ...prev, category: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="therapeutic_plan">Therapeutic Plan</SelectItem>
                      <SelectItem value="progress_report">Progress Report</SelectItem>
                      <SelectItem value="final_report">Final Report</SelectItem>
                      <SelectItem value="assessment">Assessment</SelectItem>
                      <SelectItem value="evaluation">Evaluation</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="type">Type</Label>
                  <Select value={template.type} onValueChange={(value: any) => setTemplate(prev => ({ ...prev, type: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="form">Form</SelectItem>
                      <SelectItem value="report">Report</SelectItem>
                      <SelectItem value="assessment">Assessment</SelectItem>
                      <SelectItem value="evaluation">Evaluation</SelectItem>
                      <SelectItem value="summary">Summary</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="version">Version</Label>
                  <Input
                    id="version"
                    value={template.version}
                    onChange={(e) => setTemplate(prev => ({ ...prev, version: e.target.value }))}
                    placeholder="1.0.0"
                    pattern="^\d+\.\d+\.\d+$"
                  />
                </div>
                <div>
                  <Label>Tags</Label>
                  <div className="space-y-2">
                    <div className="flex space-x-2">
                      <Input
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        placeholder="Add tag"
                        maxLength={30}
                        onKeyPress={(e) => e.key === 'Enter' && addTag()}
                      />
                      <Button onClick={addTag} disabled={!newTag.trim()}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {template.tags.map((tag, index) => (
                        <Badge key={index} variant="outline" className="flex items-center space-x-1">
                          <span>{tag}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeTag(index)}
                            className="h-4 w-4 p-0"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={template.isActive}
                    onChange={(e) => setTemplate(prev => ({ ...prev, isActive: e.target.checked }))}
                    className="rounded"
                  />
                  <Label htmlFor="isActive">Active</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isPublic"
                    checked={template.isPublic}
                    onChange={(e) => setTemplate(prev => ({ ...prev, isPublic: e.target.checked }))}
                    className="rounded"
                  />
                  <Label htmlFor="isPublic">Public</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isDefault"
                    checked={template.isDefault}
                    onChange={(e) => setTemplate(prev => ({ ...prev, isDefault: e.target.checked }))}
                    className="rounded"
                  />
                  <Label htmlFor="isDefault">Default</Label>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Fields Tab */}
        <TabsContent value="fields" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Fields List */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Template Fields</CardTitle>
                    <CardDescription>
                      Add and configure fields for your template
                    </CardDescription>
                  </div>
                  <Button onClick={addField}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Field
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {fields.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Fields Added</h3>
                    <p className="text-muted-foreground mb-4">
                      Add fields to create your report template.
                    </p>
                    <Button onClick={addField}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add First Field
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {fields.map((field, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`border rounded-lg p-3 space-y-2 cursor-pointer transition-colors ${
                          selectedField === field ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                        }`}
                        onClick={() => setSelectedField(field)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            {getFieldTypeIcon(field.type)}
                            <span className="font-medium">{field.label || field.name || 'Unnamed Field'}</span>
                            <Badge className={getFieldTypeColor(field.type)}>
                              {field.type}
                            </Badge>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                moveField(index, 'up')
                              }}
                              disabled={index === 0}
                            >
                              <ArrowUp className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                moveField(index, 'down')
                              }}
                              disabled={index === fields.length - 1}
                            >
                              <ArrowDown className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                removeField(index)
                              }}
                              className="text-red-600"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {field.name && `Name: ${field.name}`}
                          {field.isRequired && ' • Required'}
                          {!field.isVisible && ' • Hidden'}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Field Configuration */}
            <Card>
              <CardHeader>
                <CardTitle>Field Configuration</CardTitle>
                <CardDescription>
                  Configure the selected field properties
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedField ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Field Name *</Label>
                        <Input
                          value={selectedField.name}
                          onChange={(e) => {
                            const index = fields.findIndex(f => f === selectedField)
                            updateField(index, { name: e.target.value })
                          }}
                          placeholder="field_name"
                          maxLength={50}
                        />
                      </div>
                      <div>
                        <Label>Field Label *</Label>
                        <Input
                          value={selectedField.label}
                          onChange={(e) => {
                            const index = fields.findIndex(f => f === selectedField)
                            updateField(index, { label: e.target.value })
                          }}
                          placeholder="Field Label"
                          maxLength={100}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label>Field Type</Label>
                      <Select value={selectedField.type} onValueChange={(value: any) => {
                        const index = fields.findIndex(f => f === selectedField)
                        updateField(index, { type: value })
                      }}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="text">Text</SelectItem>
                          <SelectItem value="textarea">Textarea</SelectItem>
                          <SelectItem value="number">Number</SelectItem>
                          <SelectItem value="date">Date</SelectItem>
                          <SelectItem value="time">Time</SelectItem>
                          <SelectItem value="select">Select</SelectItem>
                          <SelectItem value="checkbox">Checkbox</SelectItem>
                          <SelectItem value="radio">Radio</SelectItem>
                          <SelectItem value="file">File</SelectItem>
                          <SelectItem value="signature">Signature</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label>Placeholder</Label>
                      <Input
                        value={selectedField.placeholder || ''}
                        onChange={(e) => {
                          const index = fields.findIndex(f => f === selectedField)
                          updateField(index, { placeholder: e.target.value })
                        }}
                        placeholder="Enter placeholder text"
                        maxLength={200}
                      />
                    </div>
                    
                    <div>
                      <Label>Help Text</Label>
                      <Textarea
                        value={selectedField.helpText || ''}
                        onChange={(e) => {
                          const index = fields.findIndex(f => f === selectedField)
                          updateField(index, { helpText: e.target.value })
                        }}
                        placeholder="Enter help text"
                        rows={2}
                        maxLength={500}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={selectedField.isRequired}
                          onChange={(e) => {
                            const index = fields.findIndex(f => f === selectedField)
                            updateField(index, { isRequired: e.target.checked })
                          }}
                          className="rounded"
                        />
                        <Label>Required</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={selectedField.isVisible}
                          onChange={(e) => {
                            const index = fields.findIndex(f => f === selectedField)
                            updateField(index, { isVisible: e.target.checked })
                          }}
                          className="rounded"
                        />
                        <Label>Visible</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={selectedField.isEditable}
                          onChange={(e) => {
                            const index = fields.findIndex(f => f === selectedField)
                            updateField(index, { isEditable: e.target.checked })
                          }}
                          className="rounded"
                        />
                        <Label>Editable</Label>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Info className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Field Selected</h3>
                    <p className="text-muted-foreground">
                      Select a field from the list to configure its properties.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Template Settings</CardTitle>
              <CardDescription>
                Configure advanced settings for your template
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="allowMultipleSubmissions"
                    checked={template.settings.allowMultipleSubmissions}
                    onChange={(e) => setTemplate(prev => ({
                      ...prev,
                      settings: { ...prev.settings, allowMultipleSubmissions: e.target.checked }
                    }))}
                    className="rounded"
                  />
                  <Label htmlFor="allowMultipleSubmissions">Allow Multiple Submissions</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="requireApproval"
                    checked={template.settings.requireApproval}
                    onChange={(e) => setTemplate(prev => ({
                      ...prev,
                      settings: { ...prev.settings, requireApproval: e.target.checked }
                    }))}
                    className="rounded"
                  />
                  <Label htmlFor="requireApproval">Require Approval</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="autoSave"
                    checked={template.settings.autoSave}
                    onChange={(e) => setTemplate(prev => ({
                      ...prev,
                      settings: { ...prev.settings, autoSave: e.target.checked }
                    }))}
                    className="rounded"
                  />
                  <Label htmlFor="autoSave">Auto Save</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="showProgress"
                    checked={template.settings.showProgress}
                    onChange={(e) => setTemplate(prev => ({
                      ...prev,
                      settings: { ...prev.settings, showProgress: e.target.checked }
                    }))}
                    className="rounded"
                  />
                  <Label htmlFor="showProgress">Show Progress</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="allowDraft"
                    checked={template.settings.allowDraft}
                    onChange={(e) => setTemplate(prev => ({
                      ...prev,
                      settings: { ...prev.settings, allowDraft: e.target.checked }
                    }))}
                    className="rounded"
                  />
                  <Label htmlFor="allowDraft">Allow Draft</Label>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="maxSubmissions">Max Submissions</Label>
                  <Input
                    id="maxSubmissions"
                    type="number"
                    value={template.settings.maxSubmissions || ''}
                    onChange={(e) => setTemplate(prev => ({
                      ...prev,
                      settings: { ...prev.settings, maxSubmissions: parseInt(e.target.value) || undefined }
                    }))}
                    placeholder="Unlimited"
                    min="1"
                  />
                </div>
                <div>
                  <Label htmlFor="expirationDate">Expiration Date</Label>
                  <Input
                    id="expirationDate"
                    type="date"
                    value={template.settings.expirationDate || ''}
                    onChange={(e) => setTemplate(prev => ({
                      ...prev,
                      settings: { ...prev.settings, expirationDate: e.target.value || undefined }
                    }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preview Tab */}
        <TabsContent value="preview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Template Preview</CardTitle>
              <CardDescription>
                Preview how your template will look to users
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border-b pb-4">
                  <h2 className="text-xl font-semibold">{template.name || 'Template Name'}</h2>
                  <p className="text-muted-foreground">{template.description || 'Template description'}</p>
                </div>
                
                {fields.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Fields to Preview</h3>
                    <p className="text-muted-foreground">
                      Add fields to see how your template will look.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {fields.map((field, index) => (
                      <div key={index} className="space-y-2">
                        <Label className="flex items-center space-x-2">
                          {field.label}
                          {field.isRequired && <span className="text-red-500">*</span>}
                        </Label>
                        
                        {field.helpText && (
                          <p className="text-sm text-muted-foreground">{field.helpText}</p>
                        )}
                        
                        {field.type === 'text' && (
                          <Input placeholder={field.placeholder} disabled />
                        )}
                        
                        {field.type === 'textarea' && (
                          <Textarea placeholder={field.placeholder} rows={3} disabled />
                        )}
                        
                        {field.type === 'number' && (
                          <Input type="number" placeholder={field.placeholder} disabled />
                        )}
                        
                        {field.type === 'date' && (
                          <Input type="date" disabled />
                        )}
                        
                        {field.type === 'time' && (
                          <Input type="time" disabled />
                        )}
                        
                        {field.type === 'select' && (
                          <Select disabled>
                            <SelectTrigger>
                              <SelectValue placeholder={field.placeholder || 'Select an option'} />
                            </SelectTrigger>
                            <SelectContent>
                              {field.options?.map((option, optIndex) => (
                                <SelectItem key={optIndex} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                        
                        {field.type === 'checkbox' && (
                          <div className="flex items-center space-x-2">
                            <input type="checkbox" disabled />
                            <Label>{field.label}</Label>
                          </div>
                        )}
                        
                        {field.type === 'radio' && (
                          <div className="space-y-2">
                            {field.options?.map((option, optIndex) => (
                              <div key={optIndex} className="flex items-center space-x-2">
                                <input type="radio" name={field.name} disabled />
                                <Label>{option.label}</Label>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {field.type === 'file' && (
                          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 text-center">
                            <UploadIcon className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">Click to upload file</p>
                          </div>
                        )}
                        
                        {field.type === 'signature' && (
                          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 text-center">
                            <PenTool className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">Click to sign</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
