'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { 
  Eye,
  Brain,
  Heart,
  User,
  AlertCircle,
  CheckCircle,
  Save,
  Loader2
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface ClinicalObservationsSectionProps {
  data?: any
  onUpdate: (data: any) => void
  onSave?: (data: any) => void
  loading?: boolean
  errors?: Record<string, string[]>
  warnings?: Record<string, string[]>
  readOnly?: boolean
}

export function ClinicalObservationsSection({
  data = {},
  onUpdate,
  onSave,
  loading = false,
  errors = {},
  warnings = {},
  readOnly = false
}: ClinicalObservationsSectionProps) {
  const [formData, setFormData] = useState({
    physicalAppearance: {
      generalAppearance: data.physicalAppearance?.generalAppearance || 'WELL_APPEARING',
      hygiene: data.physicalAppearance?.hygiene || 'GOOD',
      grooming: data.physicalAppearance?.grooming || 'GOOD',
      clothing: data.physicalAppearance?.clothing || 'APPROPRIATE',
      notes: data.physicalAppearance?.notes || ''
    },
    behaviorObservations: {
      eyeContact: data.behaviorObservations?.eyeContact || 'GOOD',
      socialInteraction: data.behaviorObservations?.socialInteraction || 'APPROPRIATE',
      activityLevel: data.behaviorObservations?.activityLevel || 'NORMAL',
      mood: data.behaviorObservations?.mood || 'NORMAL',
      affect: data.behaviorObservations?.affect || 'CONGRUENT',
      speech: data.behaviorObservations?.speech || 'NORMAL',
      thoughtProcess: data.behaviorObservations?.thoughtProcess || 'LOGICAL',
      notes: data.behaviorObservations?.notes || ''
    },
    cognitiveAssessment: {
      orientation: {
        person: data.cognitiveAssessment?.orientation?.person ?? true,
        place: data.cognitiveAssessment?.orientation?.place ?? true,
        time: data.cognitiveAssessment?.orientation?.time ?? true,
        situation: data.cognitiveAssessment?.orientation?.situation ?? true
      },
      attention: data.cognitiveAssessment?.attention || 'GOOD',
      concentration: data.cognitiveAssessment?.concentration || 'GOOD',
      memory: {
        immediate: data.cognitiveAssessment?.memory?.immediate || 'GOOD',
        shortTerm: data.cognitiveAssessment?.memory?.shortTerm || 'GOOD',
        longTerm: data.cognitiveAssessment?.memory?.longTerm || 'GOOD'
      },
      insight: data.cognitiveAssessment?.insight || 'GOOD',
      judgment: data.cognitiveAssessment?.judgment || 'GOOD',
      notes: data.cognitiveAssessment?.notes || ''
    }
  })

  const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({})
  const [isValid, setIsValid] = useState(false)

  // Validate form data
  useEffect(() => {
    const validateForm = () => {
      const errors: Record<string, string[]> = {}
      
      // Basic validation - all required fields should have values
      if (!formData.physicalAppearance.generalAppearance) {
        errors['physicalAppearance.generalAppearance'] = ['General appearance is required']
      }
      
      if (!formData.behaviorObservations.eyeContact) {
        errors['behaviorObservations.eyeContact'] = ['Eye contact assessment is required']
      }
      
      if (!formData.cognitiveAssessment.attention) {
        errors['cognitiveAssessment.attention'] = ['Attention assessment is required']
      }
      
      setValidationErrors(errors)
      setIsValid(Object.keys(errors).length === 0)
    }

    validateForm()
  }, [formData])

  const handleInputChange = (section: string, field: string, value: any) => {
    setFormData(prev => {
      const newData = { ...prev }
      if (field.includes('.')) {
        const [parent, child] = field.split('.')
        newData[section] = {
          ...newData[section],
          [parent]: {
            ...newData[section][parent],
            [child]: value
          }
        }
      } else {
        newData[section] = {
          ...newData[section],
          [field]: value
        }
      }
      return newData
    })
  }

  const handleSave = () => {
    if (onSave && isValid) {
      onSave(formData)
    }
  }

  const getFieldError = (field: string) => {
    return validationErrors[field] || errors[field] || []
  }

  const getFieldWarning = (field: string) => {
    return warnings[field] || []
  }

  const hasError = (field: string) => {
    return getFieldError(field).length > 0
  }

  const hasWarning = (field: string) => {
    return getFieldWarning(field).length > 0
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Physical Appearance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Physical Appearance
          </CardTitle>
          <CardDescription>
            Observe and document the patient's physical presentation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="generalAppearance">General Appearance *</Label>
              <Select
                value={formData.physicalAppearance.generalAppearance}
                onValueChange={(value) => handleInputChange('physicalAppearance', 'generalAppearance', value)}
                disabled={readOnly}
              >
                <SelectTrigger className={hasError('physicalAppearance.generalAppearance') ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select general appearance" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="WELL_APPEARING">Well Appearing</SelectItem>
                  <SelectItem value="MILDLY_ILL">Mildly Ill</SelectItem>
                  <SelectItem value="MODERATELY_ILL">Moderately Ill</SelectItem>
                  <SelectItem value="SEVERELY_ILL">Severely Ill</SelectItem>
                </SelectContent>
              </Select>
              <AnimatePresence>
                {hasError('physicalAppearance.generalAppearance') && (
                  <motion.div
                    initial={{ opacity: 0, blockSize: 0 }}
                    animate={{ opacity: 1, blockSize: 'auto' }}
                    exit={{ opacity: 0, blockSize: 0 }}
                    className="flex items-center gap-1 text-red-600 text-sm"
                  >
                    <AlertCircle className="h-4 w-4" />
                    {getFieldError('physicalAppearance.generalAppearance')[0]}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="space-y-2">
              <Label htmlFor="hygiene">Hygiene</Label>
              <Select
                value={formData.physicalAppearance.hygiene}
                onValueChange={(value) => handleInputChange('physicalAppearance', 'hygiene', value)}
                disabled={readOnly}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select hygiene level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EXCELLENT">Excellent</SelectItem>
                  <SelectItem value="GOOD">Good</SelectItem>
                  <SelectItem value="FAIR">Fair</SelectItem>
                  <SelectItem value="POOR">Poor</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="grooming">Grooming</Label>
              <Select
                value={formData.physicalAppearance.grooming}
                onValueChange={(value) => handleInputChange('physicalAppearance', 'grooming', value)}
                disabled={readOnly}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select grooming level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EXCELLENT">Excellent</SelectItem>
                  <SelectItem value="GOOD">Good</SelectItem>
                  <SelectItem value="FAIR">Fair</SelectItem>
                  <SelectItem value="POOR">Poor</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="clothing">Clothing</Label>
              <Select
                value={formData.physicalAppearance.clothing}
                onValueChange={(value) => handleInputChange('physicalAppearance', 'clothing', value)}
                disabled={readOnly}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select clothing appropriateness" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="APPROPRIATE">Appropriate</SelectItem>
                  <SelectItem value="SOMEWHAT_INAPPROPRIATE">Somewhat Inappropriate</SelectItem>
                  <SelectItem value="INAPPROPRIATE">Inappropriate</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="physicalNotes">Additional Notes</Label>
            <Textarea
              id="physicalNotes"
              value={formData.physicalAppearance.notes}
              onChange={(e) => handleInputChange('physicalAppearance', 'notes', e.target.value)}
              placeholder="Additional observations about physical appearance..."
              className="min-h-[100px]"
              disabled={readOnly}
            />
          </div>
        </CardContent>
      </Card>

      {/* Behavioral Observations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Behavioral Observations
          </CardTitle>
          <CardDescription>
            Document behavioral and social observations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="eyeContact">Eye Contact *</Label>
              <Select
                value={formData.behaviorObservations.eyeContact}
                onValueChange={(value) => handleInputChange('behaviorObservations', 'eyeContact', value)}
                disabled={readOnly}
              >
                <SelectTrigger className={hasError('behaviorObservations.eyeContact') ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select eye contact level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EXCELLENT">Excellent</SelectItem>
                  <SelectItem value="GOOD">Good</SelectItem>
                  <SelectItem value="FAIR">Fair</SelectItem>
                  <SelectItem value="POOR">Poor</SelectItem>
                  <SelectItem value="AVOIDANT">Avoidant</SelectItem>
                </SelectContent>
              </Select>
              <AnimatePresence>
                {hasError('behaviorObservations.eyeContact') && (
                  <motion.div
                    initial={{ opacity: 0, blockSize: 0 }}
                    animate={{ opacity: 1, blockSize: 'auto' }}
                    exit={{ opacity: 0, blockSize: 0 }}
                    className="flex items-center gap-1 text-red-600 text-sm"
                  >
                    <AlertCircle className="h-4 w-4" />
                    {getFieldError('behaviorObservations.eyeContact')[0]}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="space-y-2">
              <Label htmlFor="socialInteraction">Social Interaction</Label>
              <Select
                value={formData.behaviorObservations.socialInteraction}
                onValueChange={(value) => handleInputChange('behaviorObservations', 'socialInteraction', value)}
                disabled={readOnly}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select social interaction level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="APPROPRIATE">Appropriate</SelectItem>
                  <SelectItem value="SOMEWHAT_INAPPROPRIATE">Somewhat Inappropriate</SelectItem>
                  <SelectItem value="INAPPROPRIATE">Inappropriate</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="activityLevel">Activity Level</Label>
              <Select
                value={formData.behaviorObservations.activityLevel}
                onValueChange={(value) => handleInputChange('behaviorObservations', 'activityLevel', value)}
                disabled={readOnly}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select activity level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="HYPERACTIVE">Hyperactive</SelectItem>
                  <SelectItem value="NORMAL">Normal</SelectItem>
                  <SelectItem value="SLOW">Slow</SelectItem>
                  <SelectItem value="LETHARGIC">Lethargic</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="mood">Mood</Label>
              <Select
                value={formData.behaviorObservations.mood}
                onValueChange={(value) => handleInputChange('behaviorObservations', 'mood', value)}
                disabled={readOnly}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select mood" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EUPHORIC">Euphoric</SelectItem>
                  <SelectItem value="ELEVATED">Elevated</SelectItem>
                  <SelectItem value="NORMAL">Normal</SelectItem>
                  <SelectItem value="DEPRESSED">Depressed</SelectItem>
                  <SelectItem value="IRRITABLE">Irritable</SelectItem>
                  <SelectItem value="ANXIOUS">Anxious</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="affect">Affect</Label>
              <Select
                value={formData.behaviorObservations.affect}
                onValueChange={(value) => handleInputChange('behaviorObservations', 'affect', value)}
                disabled={readOnly}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select affect" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CONGRUENT">Congruent</SelectItem>
                  <SelectItem value="INCONGRUENT">Incongruent</SelectItem>
                  <SelectItem value="FLAT">Flat</SelectItem>
                  <SelectItem value="BLUNTED">Blunted</SelectItem>
                  <SelectItem value="LABILE">Labile</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="speech">Speech</Label>
              <Select
                value={formData.behaviorObservations.speech}
                onValueChange={(value) => handleInputChange('behaviorObservations', 'speech', value)}
                disabled={readOnly}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select speech pattern" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NORMAL">Normal</SelectItem>
                  <SelectItem value="RAPID">Rapid</SelectItem>
                  <SelectItem value="SLOW">Slow</SelectItem>
                  <SelectItem value="PRESSURED">Pressured</SelectItem>
                  <SelectItem value="MUTED">Muted</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="thoughtProcess">Thought Process</Label>
              <Select
                value={formData.behaviorObservations.thoughtProcess}
                onValueChange={(value) => handleInputChange('behaviorObservations', 'thoughtProcess', value)}
                disabled={readOnly}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select thought process" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOGICAL">Logical</SelectItem>
                  <SelectItem value="TANGENTIAL">Tangential</SelectItem>
                  <SelectItem value="CIRCUMSTANTIAL">Circumstantial</SelectItem>
                  <SelectItem value="FLIGHT_OF_IDEAS">Flight of Ideas</SelectItem>
                  <SelectItem value="LOOSE_ASSOCIATIONS">Loose Associations</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="behaviorNotes">Additional Notes</Label>
            <Textarea
              id="behaviorNotes"
              value={formData.behaviorObservations.notes}
              onChange={(e) => handleInputChange('behaviorObservations', 'notes', e.target.value)}
              placeholder="Additional behavioral observations..."
              className="min-h-[100px]"
              disabled={readOnly}
            />
          </div>
        </CardContent>
      </Card>

      {/* Cognitive Assessment */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Cognitive Assessment
          </CardTitle>
          <CardDescription>
            Assess cognitive functioning and orientation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div>
              <Label className="text-base font-medium">Orientation *</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="orientation-person"
                    checked={formData.cognitiveAssessment.orientation.person}
                    onCheckedChange={(checked) => handleInputChange('cognitiveAssessment', 'orientation.person', checked)}
                    disabled={readOnly}
                  />
                  <Label htmlFor="orientation-person">Person</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="orientation-place"
                    checked={formData.cognitiveAssessment.orientation.place}
                    onCheckedChange={(checked) => handleInputChange('cognitiveAssessment', 'orientation.place', checked)}
                    disabled={readOnly}
                  />
                  <Label htmlFor="orientation-place">Place</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="orientation-time"
                    checked={formData.cognitiveAssessment.orientation.time}
                    onCheckedChange={(checked) => handleInputChange('cognitiveAssessment', 'orientation.time', checked)}
                    disabled={readOnly}
                  />
                  <Label htmlFor="orientation-time">Time</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="orientation-situation"
                    checked={formData.cognitiveAssessment.orientation.situation}
                    onCheckedChange={(checked) => handleInputChange('cognitiveAssessment', 'orientation.situation', checked)}
                    disabled={readOnly}
                  />
                  <Label htmlFor="orientation-situation">Situation</Label>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="attention">Attention *</Label>
                <Select
                  value={formData.cognitiveAssessment.attention}
                  onValueChange={(value) => handleInputChange('cognitiveAssessment', 'attention', value)}
                  disabled={readOnly}
                >
                  <SelectTrigger className={hasError('cognitiveAssessment.attention') ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select attention level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EXCELLENT">Excellent</SelectItem>
                    <SelectItem value="GOOD">Good</SelectItem>
                    <SelectItem value="FAIR">Fair</SelectItem>
                    <SelectItem value="POOR">Poor</SelectItem>
                    <SelectItem value="SEVERELY_IMPAIRED">Severely Impaired</SelectItem>
                  </SelectContent>
                </Select>
                <AnimatePresence>
                  {hasError('cognitiveAssessment.attention') && (
                    <motion.div
                      initial={{ opacity: 0, blockSize: 0 }}
                      animate={{ opacity: 1, blockSize: 'auto' }}
                      exit={{ opacity: 0, blockSize: 0 }}
                      className="flex items-center gap-1 text-red-600 text-sm"
                    >
                      <AlertCircle className="h-4 w-4" />
                      {getFieldError('cognitiveAssessment.attention')[0]}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="space-y-2">
                <Label htmlFor="concentration">Concentration</Label>
                <Select
                  value={formData.cognitiveAssessment.concentration}
                  onValueChange={(value) => handleInputChange('cognitiveAssessment', 'concentration', value)}
                  disabled={readOnly}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select concentration level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EXCELLENT">Excellent</SelectItem>
                    <SelectItem value="GOOD">Good</SelectItem>
                    <SelectItem value="FAIR">Fair</SelectItem>
                    <SelectItem value="POOR">Poor</SelectItem>
                    <SelectItem value="SEVERELY_IMPAIRED">Severely Impaired</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-base font-medium">Memory Assessment</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                  <div className="space-y-2">
                    <Label htmlFor="immediateMemory">Immediate</Label>
                    <Select
                      value={formData.cognitiveAssessment.memory.immediate}
                      onValueChange={(value) => handleInputChange('cognitiveAssessment', 'memory.immediate', value)}
                      disabled={readOnly}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select immediate memory" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="EXCELLENT">Excellent</SelectItem>
                        <SelectItem value="GOOD">Good</SelectItem>
                        <SelectItem value="FAIR">Fair</SelectItem>
                        <SelectItem value="POOR">Poor</SelectItem>
                        <SelectItem value="SEVERELY_IMPAIRED">Severely Impaired</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="shortTermMemory">Short Term</Label>
                    <Select
                      value={formData.cognitiveAssessment.memory.shortTerm}
                      onValueChange={(value) => handleInputChange('cognitiveAssessment', 'memory.shortTerm', value)}
                      disabled={readOnly}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select short term memory" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="EXCELLENT">Excellent</SelectItem>
                        <SelectItem value="GOOD">Good</SelectItem>
                        <SelectItem value="FAIR">Fair</SelectItem>
                        <SelectItem value="POOR">Poor</SelectItem>
                        <SelectItem value="SEVERELY_IMPAIRED">Severely Impaired</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="longTermMemory">Long Term</Label>
                    <Select
                      value={formData.cognitiveAssessment.memory.longTerm}
                      onValueChange={(value) => handleInputChange('cognitiveAssessment', 'memory.longTerm', value)}
                      disabled={readOnly}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select long term memory" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="EXCELLENT">Excellent</SelectItem>
                        <SelectItem value="GOOD">Good</SelectItem>
                        <SelectItem value="FAIR">Fair</SelectItem>
                        <SelectItem value="POOR">Poor</SelectItem>
                        <SelectItem value="SEVERELY_IMPAIRED">Severely Impaired</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="insight">Insight</Label>
                <Select
                  value={formData.cognitiveAssessment.insight}
                  onValueChange={(value) => handleInputChange('cognitiveAssessment', 'insight', value)}
                  disabled={readOnly}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select insight level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EXCELLENT">Excellent</SelectItem>
                    <SelectItem value="GOOD">Good</SelectItem>
                    <SelectItem value="FAIR">Fair</SelectItem>
                    <SelectItem value="POOR">Poor</SelectItem>
                    <SelectItem value="ABSENT">Absent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="judgment">Judgment</Label>
                <Select
                  value={formData.cognitiveAssessment.judgment}
                  onValueChange={(value) => handleInputChange('cognitiveAssessment', 'judgment', value)}
                  disabled={readOnly}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select judgment level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EXCELLENT">Excellent</SelectItem>
                    <SelectItem value="GOOD">Good</SelectItem>
                    <SelectItem value="FAIR">Fair</SelectItem>
                    <SelectItem value="POOR">Poor</SelectItem>
                    <SelectItem value="SEVERELY_IMPAIRED">Severely Impaired</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cognitiveNotes">Additional Notes</Label>
              <Textarea
                id="cognitiveNotes"
                value={formData.cognitiveAssessment.notes}
                onChange={(e) => handleInputChange('cognitiveAssessment', 'notes', e.target.value)}
                placeholder="Additional cognitive assessment observations..."
                className="min-h-[100px]"
                disabled={readOnly}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      {!readOnly && (
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            {isValid && (
              <Badge variant="outline" className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                Valid
              </Badge>
            )}
            {!isValid && (
              <Badge variant="destructive" className="flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Incomplete
              </Badge>
            )}
          </div>

          <div className="flex gap-2">
            {onSave && (
              <Button
                variant="outline"
                onClick={handleSave}
                disabled={!isValid || loading}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save Section
              </Button>
            )}
            
            <Button
              onClick={() => onUpdate(formData)}
              disabled={!isValid || loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              Update Assessment
            </Button>
          </div>
        </div>
      )}
    </motion.div>
  )
}


