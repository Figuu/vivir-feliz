'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { 
  CheckCircle,
  AlertCircle,
  Info,
  Lightbulb,
  FileText,
  Shield,
  Database,
  TestTube,
  Eye,
  Save,
  RefreshCw,
  Download,
  Upload,
  BarChart3,
  Clock,
  User,
  Baby,
  Heart,
  Home,
  Target
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  enhancedMedicalFormSchema,
  enhancedStepSchemas,
  type EnhancedMedicalForm,
  type EnhancedParentInfo,
  type EnhancedChildInfo,
  type EnhancedMedicalHistory,
  type EnhancedCurrentConcerns,
  type EnhancedFamilyInfo,
  type EnhancedGoalsExpectations
} from '@/lib/validations/medical-form-enhanced'
import { MedicalFormDataStructureManager } from '@/lib/medical-form-data-structure'
import { MedicalFormValidationUtils, type ValidationResult, type FieldValidationResult } from '@/lib/medical-form-validation-utils'

export default function TestMedicalFormValidationPage() {
  const [activeTab, setActiveTab] = useState('validation')
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<EnhancedMedicalForm | null>(null)
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null)
  const [fieldValidationResult, setFieldValidationResult] = useState<FieldValidationResult | null>(null)
  const [dataStructureManager, setDataStructureManager] = useState<MedicalFormDataStructureManager | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Initialize data structure manager
  useEffect(() => {
    const manager = new MedicalFormDataStructureManager(
      '550e8400-e29b-41d4-a716-446655440001',
      '550e8400-e29b-41d4-a716-446655440002',
      '550e8400-e29b-41d4-a716-446655440003',
      '550e8400-e29b-41d4-a716-446655440004'
    )
    setDataStructureManager(manager)
    setFormData(manager.getFormDataStructure().formData)
  }, [])

  const handleValidateField = (fieldPath: string, value: any) => {
    if (!formData || !dataStructureManager) return

    try {
      const context = {
        formData,
        stepNumber: currentStep,
        fieldPath,
        currentValue: value
      }

      const result = MedicalFormValidationUtils.validateField(fieldPath, value, context)
      setFieldValidationResult(result)
    } catch (err) {
      console.error('Error validating field:', err)
      setError('Failed to validate field')
    }
  }

  const handleValidateStep = (stepNumber: number) => {
    if (!formData || !dataStructureManager) return

    try {
      setLoading(true)
      const stepData = dataStructureManager.getStepData(stepNumber)
      if (!stepData) {
        setError('Invalid step data')
        return
      }

      const result = MedicalFormValidationUtils.validateStep(stepNumber, stepData.data, formData)
      setValidationResult(result)
    } catch (err) {
      console.error('Error validating step:', err)
      setError('Failed to validate step')
    } finally {
      setLoading(false)
    }
  }

  const handleValidateForm = () => {
    if (!formData) return

    try {
      setLoading(true)
      const result = MedicalFormValidationUtils.validateForm(formData)
      setValidationResult(result)
    } catch (err) {
      console.error('Error validating form:', err)
      setError('Failed to validate form')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateStepData = (stepNumber: number, data: any) => {
    if (!dataStructureManager) return

    try {
      const success = dataStructureManager.updateStepData(stepNumber, data)
      if (success) {
        const updatedStructure = dataStructureManager.getFormDataStructure()
        setFormData(updatedStructure.formData)
        setError(null)
      } else {
        setError('Failed to update step data')
      }
    } catch (err) {
      console.error('Error updating step data:', err)
      setError('Failed to update step data')
    }
  }

  const handleResetForm = () => {
    if (!dataStructureManager) return

    try {
      dataStructureManager.resetForm()
      const updatedStructure = dataStructureManager.getFormDataStructure()
      setFormData(updatedStructure.formData)
      setValidationResult(null)
      setFieldValidationResult(null)
      setError(null)
    } catch (err) {
      console.error('Error resetting form:', err)
      setError('Failed to reset form')
    }
  }

  const handleExportForm = () => {
    if (!dataStructureManager) return

    try {
      const exportData = dataStructureManager.exportFormData()
      const blob = new Blob([exportData], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'medical-form-data.json'
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Error exporting form:', err)
      setError('Failed to export form')
    }
  }

  const handleImportForm = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !dataStructureManager) return

    try {
      const reader = new FileReader()
      reader.onload = (e) => {
        const content = e.target?.result as string
        const success = dataStructureManager.importFormData(content)
        if (success) {
          const updatedStructure = dataStructureManager.getFormDataStructure()
          setFormData(updatedStructure.formData)
          setError(null)
        } else {
          setError('Failed to import form data')
        }
      }
      reader.readAsText(file)
    } catch (err) {
      console.error('Error importing form:', err)
      setError('Failed to import form')
    }
  }

  const getStepIcon = (stepNumber: number) => {
    const icons = {
      1: User,
      2: Baby,
      3: Heart,
      4: AlertCircle,
      5: Home,
      6: Target
    }
    return icons[stepNumber as keyof typeof icons] || FileText
  }

  const getStepName = (stepNumber: number) => {
    const names = {
      1: 'Parent Information',
      2: 'Child Information',
      3: 'Medical History',
      4: 'Current Concerns',
      5: 'Family Information',
      6: 'Goals & Expectations'
    }
    return names[stepNumber as keyof typeof names] || `Step ${stepNumber}`
  }

  const getValidationBadge = (isValid: boolean, hasWarnings: boolean = false) => {
    if (isValid && !hasWarnings) {
      return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Valid</Badge>
    } else if (isValid && hasWarnings) {
      return <Badge className="bg-yellow-100 text-yellow-800"><AlertCircle className="h-3 w-3 mr-1" />Valid with Warnings</Badge>
    } else {
      return <Badge className="bg-red-100 text-red-800"><AlertCircle className="h-3 w-3 mr-1" />Invalid</Badge>
    }
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Medical Form Validation System Test</h1>
          <p className="text-muted-foreground">
            Test the comprehensive medical form validation schemas and data structures
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Validation Test */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Validation System Test
                </CardTitle>
                <CardDescription>
                  Test field, step, and form validation with comprehensive rules
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Step Navigation */}
                <div className="space-y-4">
                  <Label className="text-sm font-medium">Select Step to Test</Label>
                  <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                    {Array.from({ length: 6 }, (_, index) => {
                      const stepNumber = index + 1
                      const Icon = getStepIcon(stepNumber)
                      const isActive = currentStep === stepNumber
                      
                      return (
                        <motion.button
                          key={stepNumber}
                          onClick={() => setCurrentStep(stepNumber)}
                          className={`
                            p-3 rounded-lg border-2 transition-all duration-200 text-center
                            ${isActive ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'}
                          `}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <div className="flex items-center justify-center mb-1">
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="text-xs font-medium">Step {stepNumber}</div>
                        </motion.button>
                      )
                    })}
                  </div>
                </div>

                {/* Step Information */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">{getStepName(currentStep)}</h3>
                      <p className="text-sm text-muted-foreground">
                        Test validation for {getStepName(currentStep).toLowerCase()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {validationResult && getValidationBadge(validationResult.isValid, Object.keys(validationResult.warnings).length > 0)}
                    </div>
                  </div>

                  {/* Sample Form Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {currentStep === 1 && (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="firstName">First Name</Label>
                          <Input
                            id="firstName"
                            placeholder="Enter first name"
                            onChange={(e) => handleValidateField('firstName', e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="lastName">Last Name</Label>
                          <Input
                            id="lastName"
                            placeholder="Enter last name"
                            onChange={(e) => handleValidateField('lastName', e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            placeholder="Enter email address"
                            onChange={(e) => handleValidateField('email', e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone">Phone</Label>
                          <Input
                            id="phone"
                            placeholder="Enter phone number"
                            onChange={(e) => handleValidateField('phone', e.target.value)}
                          />
                        </div>
                      </>
                    )}

                    {currentStep === 2 && (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="childFirstName">Child First Name</Label>
                          <Input
                            id="childFirstName"
                            placeholder="Enter child's first name"
                            onChange={(e) => handleValidateField('childInfo.firstName', e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="childLastName">Child Last Name</Label>
                          <Input
                            id="childLastName"
                            placeholder="Enter child's last name"
                            onChange={(e) => handleValidateField('childInfo.lastName', e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="dateOfBirth">Date of Birth</Label>
                          <Input
                            id="dateOfBirth"
                            type="date"
                            onChange={(e) => handleValidateField('childInfo.dateOfBirth', e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="height">Height (cm)</Label>
                          <Input
                            id="height"
                            type="number"
                            step="0.1"
                            placeholder="Enter height in cm"
                            onChange={(e) => handleValidateField('childInfo.physicalInfo.height', parseFloat(e.target.value))}
                          />
                        </div>
                      </>
                    )}

                    {currentStep === 4 && (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="primaryConcern">Primary Concern</Label>
                          <Textarea
                            id="primaryConcern"
                            placeholder="Describe the primary concern"
                            onChange={(e) => handleValidateField('currentConcerns.primaryConcerns', e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="severity">Severity</Label>
                          <Select onValueChange={(value) => handleValidateField('currentConcerns.primaryConcerns.severity', value)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select severity" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="MILD">Mild</SelectItem>
                              <SelectItem value="MODERATE">Moderate</SelectItem>
                              <SelectItem value="SEVERE">Severe</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Validation Actions */}
                <div className="flex items-center gap-4">
                  <Button onClick={() => handleValidateStep(currentStep)} disabled={loading}>
                    {loading ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Validating...
                      </>
                    ) : (
                      <>
                        <Shield className="mr-2 h-4 w-4" />
                        Validate Step
                      </>
                    )}
                  </Button>
                  
                  <Button onClick={handleValidateForm} disabled={loading} variant="outline">
                    {loading ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Validating...
                      </>
                    ) : (
                      <>
                        <FileText className="mr-2 h-4 w-4" />
                        Validate Form
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Validation Results */}
            {(validationResult || fieldValidationResult) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    Validation Results
                  </CardTitle>
                  <CardDescription>
                    Detailed validation results and feedback
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Field Validation Results */}
                  {fieldValidationResult && (
                    <div className="space-y-3">
                      <h4 className="font-medium">Field Validation: {fieldValidationResult.fieldPath}</h4>
                      <div className="space-y-2">
                        {fieldValidationResult.errors.length > 0 && (
                          <div className="space-y-1">
                            <Label className="text-sm font-medium text-red-600">Errors</Label>
                            {fieldValidationResult.errors.map((error, index) => (
                              <div key={index} className="flex items-center gap-2 text-sm text-red-600">
                                <AlertCircle className="h-4 w-4" />
                                {error}
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {fieldValidationResult.warnings.length > 0 && (
                          <div className="space-y-1">
                            <Label className="text-sm font-medium text-yellow-600">Warnings</Label>
                            {fieldValidationResult.warnings.map((warning, index) => (
                              <div key={index} className="flex items-center gap-2 text-sm text-yellow-600">
                                <AlertCircle className="h-4 w-4" />
                                {warning}
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {fieldValidationResult.suggestions.length > 0 && (
                          <div className="space-y-1">
                            <Label className="text-sm font-medium text-blue-600">Suggestions</Label>
                            {fieldValidationResult.suggestions.map((suggestion, index) => (
                              <div key={index} className="flex items-center gap-2 text-sm text-blue-600">
                                <Lightbulb className="h-4 w-4" />
                                {suggestion}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Step/Form Validation Results */}
                  {validationResult && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Validation Summary</h4>
                        <div className="flex items-center gap-2">
                          {getValidationBadge(validationResult.isValid, Object.keys(validationResult.warnings).length > 0)}
                          <span className="text-sm text-muted-foreground">
                            {validationResult.validationTime}ms
                          </span>
                        </div>
                      </div>

                      {/* Errors */}
                      {Object.keys(validationResult.errors).length > 0 && (
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-red-600">Errors</Label>
                          {Object.entries(validationResult.errors).map(([field, errors]) => (
                            <div key={field} className="space-y-1">
                              <div className="text-sm font-medium text-red-600">{field}</div>
                              {errors.map((error, index) => (
                                <div key={index} className="flex items-center gap-2 text-sm text-red-600 ml-4">
                                  <AlertCircle className="h-3 w-3" />
                                  {error}
                                </div>
                              ))}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Warnings */}
                      {Object.keys(validationResult.warnings).length > 0 && (
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-yellow-600">Warnings</Label>
                          {Object.entries(validationResult.warnings).map(([field, warnings]) => (
                            <div key={field} className="space-y-1">
                              <div className="text-sm font-medium text-yellow-600">{field}</div>
                              {warnings.map((warning, index) => (
                                <div key={index} className="flex items-center gap-2 text-sm text-yellow-600 ml-4">
                                  <AlertCircle className="h-3 w-3" />
                                  {warning}
                                </div>
                              ))}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Suggestions */}
                      {Object.keys(validationResult.suggestions).length > 0 && (
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-blue-600">Suggestions</Label>
                          {Object.entries(validationResult.suggestions).map(([field, suggestions]) => (
                            <div key={field} className="space-y-1">
                              <div className="text-sm font-medium text-blue-600">{field}</div>
                              {suggestions.map((suggestion, index) => (
                                <div key={index} className="flex items-center gap-2 text-sm text-blue-600 ml-4">
                                  <Lightbulb className="h-3 w-3" />
                                  {suggestion}
                                </div>
                              ))}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Data Structure Manager */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Data Structure Manager
                </CardTitle>
                <CardDescription>
                  Manage form data structure and operations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button onClick={handleResetForm} variant="outline" className="w-full">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Reset Form
                </Button>
                
                <Button onClick={handleExportForm} variant="outline" className="w-full">
                  <Download className="mr-2 h-4 w-4" />
                  Export Form
                </Button>
                
                <div className="space-y-2">
                  <Label htmlFor="importFile">Import Form Data</Label>
                  <Input
                    id="importFile"
                    type="file"
                    accept=".json"
                    onChange={handleImportForm}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Validation Rules */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Validation Rules
                </CardTitle>
                <CardDescription>
                  Available validation rules and schemas
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Total Rules</span>
                    <Badge variant="outline">
                      {MedicalFormValidationUtils.getAllValidationRules().length}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Step Schemas</span>
                    <Badge variant="outline">6</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Form Schema</span>
                    <Badge variant="outline">Complete</Badge>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Validation Types</Label>
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-3 w-3 text-green-500" />
                      <span>Field Validation</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-3 w-3 text-green-500" />
                      <span>Step Validation</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-3 w-3 text-green-500" />
                      <span>Form Validation</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-3 w-3 text-green-500" />
                      <span>Cross-step Validation</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Form Progress */}
            {formData && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Form Progress
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Status</span>
                      <Badge variant="outline">{formData.status}</Badge>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Current Step</span>
                      <span className="text-sm">{formData.currentStep}/6</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Completed Steps</span>
                      <span className="text-sm">{formData.completedSteps.length}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Form ID</span>
                      <span className="text-xs text-muted-foreground">
                        {formData.formId?.slice(0, 8)}...
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* API Endpoints */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TestTube className="h-5 w-5" />
                  API Endpoints
                </CardTitle>
                <CardDescription>
                  Available validation API endpoints
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">POST</Badge>
                    <code className="text-xs">/api/medical-forms</code>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">GET</Badge>
                    <code className="text-xs">/api/medical-forms/[id]</code>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">PUT</Badge>
                    <code className="text-xs">/api/medical-forms/[id]</code>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">POST</Badge>
                    <code className="text-xs">/api/medical-forms/[id]/validate</code>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">GET</Badge>
                    <code className="text-xs">/api/medical-forms/[id]/progress</code>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <span className="text-sm text-red-700 dark:text-red-300">
                  {error}
                </span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

