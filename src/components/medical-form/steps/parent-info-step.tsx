'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { 
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Users,
  Briefcase,
  Globe,
  AlertCircle,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Save,
  Loader2
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { parentInfoSchema, type ParentInfo } from '@/lib/validations/medical-form'

interface ParentInfoStepProps {
  data?: Partial<ParentInfo>
  onNext: (data: ParentInfo) => void
  onPrevious?: () => void
  onSave?: (data: Partial<ParentInfo>) => void
  loading?: boolean
  errors?: Record<string, string[]>
  warnings?: Record<string, string[]>
}

export function ParentInfoStep({
  data = {},
  onNext,
  onPrevious,
  onSave,
  loading = false,
  errors = {},
  warnings = {}
}: ParentInfoStepProps) {
  const [formData, setFormData] = useState<Partial<ParentInfo>>({
    // Personal Information
    firstName: data.firstName || '',
    lastName: data.lastName || '',
    email: data.email || '',
    phone: data.phone || '',
    alternatePhone: data.alternatePhone || '',
    dateOfBirth: data.dateOfBirth || '',
    gender: data.gender || '',
    maritalStatus: data.maritalStatus || '',
    
    // Address Information
    address: {
      street: data.address?.street || '',
      city: data.address?.city || '',
      state: data.address?.state || '',
      zipCode: data.address?.zipCode || '',
      country: data.address?.country || 'United States'
    },
    
    // Emergency Contact
    emergencyContact: {
      name: data.emergencyContact?.name || '',
      relationship: data.emergencyContact?.relationship || '',
      phone: data.emergencyContact?.phone || '',
      email: data.emergencyContact?.email || ''
    },
    
    // Additional Information
    occupation: data.occupation || '',
    employer: data.employer || '',
    preferredLanguage: data.preferredLanguage || 'English',
    howDidYouHearAboutUs: data.howDidYouHearAboutUs || ''
  })

  const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({})
  const [isValid, setIsValid] = useState(false)

  // Validate form data
  useEffect(() => {
    const validateForm = () => {
      try {
        const result = parentInfoSchema.safeParse(formData)
        if (result.success) {
          setValidationErrors({})
          setIsValid(true)
        } else {
          const errors: Record<string, string[]> = {}
          result.error.issues.forEach(error => {
            const path = error.path.join('.')
            errors[path] = errors[path] || []
            errors[path].push(error.message)
          })
          setValidationErrors(errors)
          setIsValid(false)
        }
      } catch (error) {
        setValidationErrors({ general: ['Validation error occurred'] })
        setIsValid(false)
      }
    }

    validateForm()
  }, [formData])

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => {
      if (field.includes('.')) {
        const [parent, child] = field.split('.')
        return {
          ...prev,
          [parent]: {
            ...(prev as any)[parent],
            [child]: value
          }
        }
      }
      return {
        ...prev,
        [field]: value
      }
    })
  }

  const handleSave = () => {
    if (onSave) {
      onSave(formData)
    }
  }

  const handleNext = () => {
    if (isValid) {
      onNext(formData as ParentInfo)
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
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Parent/Guardian Information
          </CardTitle>
          <CardDescription>
            Please provide your personal information and contact details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Personal Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold">Personal Information</h3>
              <Badge variant="outline">Required</Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  className={hasError('firstName') ? 'border-red-500' : ''}
                  placeholder="Enter your first name"
                />
                <AnimatePresence>
                  {hasError('firstName') && (
                    <motion.div
                      initial={{ opacity: 0, blockSize: 0 }}
                      animate={{ opacity: 1, blockSize: 'auto' }}
                      exit={{ opacity: 0, blockSize: 0 }}
                      className="flex items-center gap-1 text-red-600 text-sm"
                    >
                      <AlertCircle className="h-4 w-4" />
                      {getFieldError('firstName')[0]}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  className={hasError('lastName') ? 'border-red-500' : ''}
                  placeholder="Enter your last name"
                />
                <AnimatePresence>
                  {hasError('lastName') && (
                    <motion.div
                      initial={{ opacity: 0, blockSize: 0 }}
                      animate={{ opacity: 1, blockSize: 'auto' }}
                      exit={{ opacity: 0, blockSize: 0 }}
                      className="flex items-center gap-1 text-red-600 text-sm"
                    >
                      <AlertCircle className="h-4 w-4" />
                      {getFieldError('lastName')[0]}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className={`pl-10 ${hasError('email') ? 'border-red-500' : ''}`}
                    placeholder="Enter your email address"
                  />
                </div>
                <AnimatePresence>
                  {hasError('email') && (
                    <motion.div
                      initial={{ opacity: 0, blockSize: 0 }}
                      animate={{ opacity: 1, blockSize: 'auto' }}
                      exit={{ opacity: 0, blockSize: 0 }}
                      className="flex items-center gap-1 text-red-600 text-sm"
                    >
                      <AlertCircle className="h-4 w-4" />
                      {getFieldError('email')[0]}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className={`pl-10 ${hasError('phone') ? 'border-red-500' : ''}`}
                    placeholder="Enter your phone number"
                  />
                </div>
                <AnimatePresence>
                  {hasError('phone') && (
                    <motion.div
                      initial={{ opacity: 0, blockSize: 0 }}
                      animate={{ opacity: 1, blockSize: 'auto' }}
                      exit={{ opacity: 0, blockSize: 0 }}
                      className="flex items-center gap-1 text-red-600 text-sm"
                    >
                      <AlertCircle className="h-4 w-4" />
                      {getFieldError('phone')[0]}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="alternatePhone">Alternate Phone</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="alternatePhone"
                    type="tel"
                    value={formData.alternatePhone}
                    onChange={(e) => handleInputChange('alternatePhone', e.target.value)}
                    className={`pl-10 ${hasError('alternatePhone') ? 'border-red-500' : ''}`}
                    placeholder="Enter alternate phone number"
                  />
                </div>
                <AnimatePresence>
                  {hasError('alternatePhone') && (
                    <motion.div
                      initial={{ opacity: 0, blockSize: 0 }}
                      animate={{ opacity: 1, blockSize: 'auto' }}
                      exit={{ opacity: 0, blockSize: 0 }}
                      className="flex items-center gap-1 text-red-600 text-sm"
                    >
                      <AlertCircle className="h-4 w-4" />
                      {getFieldError('alternatePhone')[0]}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                    className={`pl-10 ${hasError('dateOfBirth') ? 'border-red-500' : ''}`}
                  />
                </div>
                <AnimatePresence>
                  {hasError('dateOfBirth') && (
                    <motion.div
                      initial={{ opacity: 0, blockSize: 0 }}
                      animate={{ opacity: 1, blockSize: 'auto' }}
                      exit={{ opacity: 0, blockSize: 0 }}
                      className="flex items-center gap-1 text-red-600 text-sm"
                    >
                      <AlertCircle className="h-4 w-4" />
                      {getFieldError('dateOfBirth')[0]}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="gender">Gender *</Label>
                <Select
                  value={formData.gender}
                  onValueChange={(value) => handleInputChange('gender', value)}
                >
                  <SelectTrigger className={hasError('gender') ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MALE">Male</SelectItem>
                    <SelectItem value="FEMALE">Female</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                    <SelectItem value="PREFER_NOT_TO_SAY">Prefer not to say</SelectItem>
                  </SelectContent>
                </Select>
                <AnimatePresence>
                  {hasError('gender') && (
                    <motion.div
                      initial={{ opacity: 0, blockSize: 0 }}
                      animate={{ opacity: 1, blockSize: 'auto' }}
                      exit={{ opacity: 0, blockSize: 0 }}
                      className="flex items-center gap-1 text-red-600 text-sm"
                    >
                      <AlertCircle className="h-4 w-4" />
                      {getFieldError('gender')[0]}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="space-y-2">
                <Label htmlFor="maritalStatus">Marital Status *</Label>
                <Select
                  value={formData.maritalStatus}
                  onValueChange={(value) => handleInputChange('maritalStatus', value)}
                >
                  <SelectTrigger className={hasError('maritalStatus') ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select marital status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SINGLE">Single</SelectItem>
                    <SelectItem value="MARRIED">Married</SelectItem>
                    <SelectItem value="DIVORCED">Divorced</SelectItem>
                    <SelectItem value="WIDOWED">Widowed</SelectItem>
                    <SelectItem value="SEPARATED">Separated</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
                <AnimatePresence>
                  {hasError('maritalStatus') && (
                    <motion.div
                      initial={{ opacity: 0, blockSize: 0 }}
                      animate={{ opacity: 1, blockSize: 'auto' }}
                      exit={{ opacity: 0, blockSize: 0 }}
                      className="flex items-center gap-1 text-red-600 text-sm"
                    >
                      <AlertCircle className="h-4 w-4" />
                      {getFieldError('maritalStatus')[0]}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          <Separator />

          {/* Address Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold">Address Information</h3>
              <Badge variant="outline">Required</Badge>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="street">Street Address *</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="street"
                  value={formData.address?.street}
                  onChange={(e) => handleInputChange('address.street', e.target.value)}
                  className={`pl-10 ${hasError('address.street') ? 'border-red-500' : ''}`}
                  placeholder="Enter your street address"
                />
              </div>
              <AnimatePresence>
                {hasError('address.street') && (
                    <motion.div
                      initial={{ opacity: 0, blockSize: 0 }}
                      animate={{ opacity: 1, blockSize: 'auto' }}
                      exit={{ opacity: 0, blockSize: 0 }}
                    className="flex items-center gap-1 text-red-600 text-sm"
                  >
                    <AlertCircle className="h-4 w-4" />
                    {getFieldError('address.street')[0]}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  value={formData.address?.city}
                  onChange={(e) => handleInputChange('address.city', e.target.value)}
                  className={hasError('address.city') ? 'border-red-500' : ''}
                  placeholder="Enter city"
                />
                <AnimatePresence>
                  {hasError('address.city') && (
                    <motion.div
                      initial={{ opacity: 0, blockSize: 0 }}
                      animate={{ opacity: 1, blockSize: 'auto' }}
                      exit={{ opacity: 0, blockSize: 0 }}
                      className="flex items-center gap-1 text-red-600 text-sm"
                    >
                      <AlertCircle className="h-4 w-4" />
                      {getFieldError('address.city')[0]}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="space-y-2">
                <Label htmlFor="state">State *</Label>
                <Input
                  id="state"
                  value={formData.address?.state}
                  onChange={(e) => handleInputChange('address.state', e.target.value)}
                  className={hasError('address.state') ? 'border-red-500' : ''}
                  placeholder="Enter state"
                />
                <AnimatePresence>
                  {hasError('address.state') && (
                    <motion.div
                      initial={{ opacity: 0, blockSize: 0 }}
                      animate={{ opacity: 1, blockSize: 'auto' }}
                      exit={{ opacity: 0, blockSize: 0 }}
                      className="flex items-center gap-1 text-red-600 text-sm"
                    >
                      <AlertCircle className="h-4 w-4" />
                      {getFieldError('address.state')[0]}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="space-y-2">
                <Label htmlFor="zipCode">ZIP Code *</Label>
                <Input
                  id="zipCode"
                  value={formData.address?.zipCode}
                  onChange={(e) => handleInputChange('address.zipCode', e.target.value)}
                  className={hasError('address.zipCode') ? 'border-red-500' : ''}
                  placeholder="Enter ZIP code"
                />
                <AnimatePresence>
                  {hasError('address.zipCode') && (
                    <motion.div
                      initial={{ opacity: 0, blockSize: 0 }}
                      animate={{ opacity: 1, blockSize: 'auto' }}
                      exit={{ opacity: 0, blockSize: 0 }}
                      className="flex items-center gap-1 text-red-600 text-sm"
                    >
                      <AlertCircle className="h-4 w-4" />
                      {getFieldError('address.zipCode')[0]}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">Country *</Label>
              <Input
                id="country"
                value={formData.address?.country}
                onChange={(e) => handleInputChange('address.country', e.target.value)}
                className={hasError('address.country') ? 'border-red-500' : ''}
                placeholder="Enter country"
              />
              <AnimatePresence>
                {hasError('address.country') && (
                    <motion.div
                      initial={{ opacity: 0, blockSize: 0 }}
                      animate={{ opacity: 1, blockSize: 'auto' }}
                      exit={{ opacity: 0, blockSize: 0 }}
                    className="flex items-center gap-1 text-red-600 text-sm"
                  >
                    <AlertCircle className="h-4 w-4" />
                    {getFieldError('address.country')[0]}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <Separator />

          {/* Emergency Contact */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold">Emergency Contact</h3>
              <Badge variant="outline">Required</Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="emergencyName">Emergency Contact Name *</Label>
                <Input
                  id="emergencyName"
                  value={formData.emergencyContact?.name}
                  onChange={(e) => handleInputChange('emergencyContact.name', e.target.value)}
                  className={hasError('emergencyContact.name') ? 'border-red-500' : ''}
                  placeholder="Enter emergency contact name"
                />
                <AnimatePresence>
                  {hasError('emergencyContact.name') && (
                    <motion.div
                      initial={{ opacity: 0, blockSize: 0 }}
                      animate={{ opacity: 1, blockSize: 'auto' }}
                      exit={{ opacity: 0, blockSize: 0 }}
                      className="flex items-center gap-1 text-red-600 text-sm"
                    >
                      <AlertCircle className="h-4 w-4" />
                      {getFieldError('emergencyContact.name')[0]}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="space-y-2">
                <Label htmlFor="emergencyRelationship">Relationship *</Label>
                <Input
                  id="emergencyRelationship"
                  value={formData.emergencyContact?.relationship}
                  onChange={(e) => handleInputChange('emergencyContact.relationship', e.target.value)}
                  className={hasError('emergencyContact.relationship') ? 'border-red-500' : ''}
                  placeholder="e.g., Spouse, Parent, Sibling"
                />
                <AnimatePresence>
                  {hasError('emergencyContact.relationship') && (
                    <motion.div
                      initial={{ opacity: 0, blockSize: 0 }}
                      animate={{ opacity: 1, blockSize: 'auto' }}
                      exit={{ opacity: 0, blockSize: 0 }}
                      className="flex items-center gap-1 text-red-600 text-sm"
                    >
                      <AlertCircle className="h-4 w-4" />
                      {getFieldError('emergencyContact.relationship')[0]}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="emergencyPhone">Emergency Contact Phone *</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="emergencyPhone"
                    type="tel"
                    value={formData.emergencyContact?.phone}
                    onChange={(e) => handleInputChange('emergencyContact.phone', e.target.value)}
                    className={`pl-10 ${hasError('emergencyContact.phone') ? 'border-red-500' : ''}`}
                    placeholder="Enter emergency contact phone"
                  />
                </div>
                <AnimatePresence>
                  {hasError('emergencyContact.phone') && (
                    <motion.div
                      initial={{ opacity: 0, blockSize: 0 }}
                      animate={{ opacity: 1, blockSize: 'auto' }}
                      exit={{ opacity: 0, blockSize: 0 }}
                      className="flex items-center gap-1 text-red-600 text-sm"
                    >
                      <AlertCircle className="h-4 w-4" />
                      {getFieldError('emergencyContact.phone')[0]}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="space-y-2">
                <Label htmlFor="emergencyEmail">Emergency Contact Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="emergencyEmail"
                    type="email"
                    value={formData.emergencyContact?.email}
                    onChange={(e) => handleInputChange('emergencyContact.email', e.target.value)}
                    className={`pl-10 ${hasError('emergencyContact.email') ? 'border-red-500' : ''}`}
                    placeholder="Enter emergency contact email"
                  />
                </div>
                <AnimatePresence>
                  {hasError('emergencyContact.email') && (
                    <motion.div
                      initial={{ opacity: 0, blockSize: 0 }}
                      animate={{ opacity: 1, blockSize: 'auto' }}
                      exit={{ opacity: 0, blockSize: 0 }}
                      className="flex items-center gap-1 text-red-600 text-sm"
                    >
                      <AlertCircle className="h-4 w-4" />
                      {getFieldError('emergencyContact.email')[0]}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          <Separator />

          {/* Additional Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold">Additional Information</h3>
              <Badge variant="secondary">Optional</Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="occupation">Occupation</Label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="occupation"
                    value={formData.occupation}
                    onChange={(e) => handleInputChange('occupation', e.target.value)}
                    className={`pl-10 ${hasError('occupation') ? 'border-red-500' : ''}`}
                    placeholder="Enter your occupation"
                  />
                </div>
                <AnimatePresence>
                  {hasError('occupation') && (
                    <motion.div
                      initial={{ opacity: 0, blockSize: 0 }}
                      animate={{ opacity: 1, blockSize: 'auto' }}
                      exit={{ opacity: 0, blockSize: 0 }}
                      className="flex items-center gap-1 text-red-600 text-sm"
                    >
                      <AlertCircle className="h-4 w-4" />
                      {getFieldError('occupation')[0]}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="space-y-2">
                <Label htmlFor="employer">Employer</Label>
                <Input
                  id="employer"
                  value={formData.employer}
                  onChange={(e) => handleInputChange('employer', e.target.value)}
                  className={hasError('employer') ? 'border-red-500' : ''}
                  placeholder="Enter your employer"
                />
                <AnimatePresence>
                  {hasError('employer') && (
                    <motion.div
                      initial={{ opacity: 0, blockSize: 0 }}
                      animate={{ opacity: 1, blockSize: 'auto' }}
                      exit={{ opacity: 0, blockSize: 0 }}
                      className="flex items-center gap-1 text-red-600 text-sm"
                    >
                      <AlertCircle className="h-4 w-4" />
                      {getFieldError('employer')[0]}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="preferredLanguage">Preferred Language *</Label>
                <div className="relative">
                  <Globe className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="preferredLanguage"
                    value={formData.preferredLanguage}
                    onChange={(e) => handleInputChange('preferredLanguage', e.target.value)}
                    className={`pl-10 ${hasError('preferredLanguage') ? 'border-red-500' : ''}`}
                    placeholder="Enter preferred language"
                  />
                </div>
                <AnimatePresence>
                  {hasError('preferredLanguage') && (
                    <motion.div
                      initial={{ opacity: 0, blockSize: 0 }}
                      animate={{ opacity: 1, blockSize: 'auto' }}
                      exit={{ opacity: 0, blockSize: 0 }}
                      className="flex items-center gap-1 text-red-600 text-sm"
                    >
                      <AlertCircle className="h-4 w-4" />
                      {getFieldError('preferredLanguage')[0]}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="space-y-2">
                <Label htmlFor="howDidYouHearAboutUs">How did you hear about us?</Label>
                <Input
                  id="howDidYouHearAboutUs"
                  value={formData.howDidYouHearAboutUs}
                  onChange={(e) => handleInputChange('howDidYouHearAboutUs', e.target.value)}
                  className={hasError('howDidYouHearAboutUs') ? 'border-red-500' : ''}
                  placeholder="e.g., Google, Referral, Social Media"
                />
                <AnimatePresence>
                  {hasError('howDidYouHearAboutUs') && (
                    <motion.div
                      initial={{ opacity: 0, blockSize: 0 }}
                      animate={{ opacity: 1, blockSize: 'auto' }}
                      exit={{ opacity: 0, blockSize: 0 }}
                      className="flex items-center gap-1 text-red-600 text-sm"
                    >
                      <AlertCircle className="h-4 w-4" />
                      {getFieldError('howDidYouHearAboutUs')[0]}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          {onPrevious && (
            <Button
              variant="outline"
              onClick={onPrevious}
              disabled={loading}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>
          )}
          
          {onSave && (
            <Button
              variant="outline"
              onClick={handleSave}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Draft
            </Button>
          )}
        </div>

        <Button
          onClick={handleNext}
          disabled={!isValid || loading}
          className="min-w-[120px]"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <>
              Next
              <ArrowRight className="h-4 w-4 ml-2" />
            </>
          )}
        </Button>
      </div>

      {/* Validation Status */}
      <AnimatePresence>
        {isValid && (
                    <motion.div
                      initial={{ opacity: 0, blockSize: 0 }}
                      animate={{ opacity: 1, blockSize: 'auto' }}
                      exit={{ opacity: 0, blockSize: 0 }}
            className="flex items-center gap-2 text-green-600 text-sm"
          >
            <CheckCircle className="h-4 w-4" />
            All required fields are completed
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
